/**
 * OpenStreetMap (Leaflet) renderer for the Kovera Network Map.
 *
 * 3-State node system:
 *   State 1 (inactive): hollow ring — transparent fill, colored border
 *   State 2 (active, has agent or N/A): solid filled circle
 *   State 3 (active, no agent = monetizable): solid filled circle + inner "+" symbol
 *
 * Lines: only visible when a node is selected. Solid = confirmed chain, dotted = unconfirmed.
 * Pure-buyer nodes are excluded from the map (their edge counts still appear in the detail panel).
 */
import { useEffect, useMemo } from 'react';
import 'leaflet/dist/leaflet.css';
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useNetworkContext } from '@/context/NetworkContext';
import {
    isPureBuyer, isUserLikeNode, isDreamAnchor, nodeColor, matchesFilter,
} from './nodeHelpers';

// ── Marker icon factory ──────────────────────────────────────────────
const DOT_SIZE = 14;   // px diameter
const SEL_SIZE = 18;   // selected
const BORDER  = 2.5;   // hollow ring border width

function makeIcon(node, isActive, isSelected, isGreyed) {
    const color   = isGreyed ? '#4D5A7C' : nodeColor(node);
    const active  = isActive && !isGreyed;
    const sz      = isSelected ? SEL_SIZE : DOT_SIZE;
    const opacity = isGreyed ? 'opacity:0.25;' : '';

    // Cluster pin — solid circle with count badge
    if (node._isCluster) {
        const d = isSelected ? SEL_SIZE + 4 : DOT_SIZE + 4;
        return L.divIcon({
            className: '',
            html: `<div style="width:${d}px;height:${d}px;background:${color};border-radius:9999px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;border:2px solid rgba(255,255,255,0.3);${opacity}"><span style="color:${isGreyed ? '#8B96B8' : '#000'};font-size:${Math.round(d * 0.48)}px;font-weight:900;line-height:1;">${node._clusterCount}</span></div>`,
            iconSize: [d, d],
            iconAnchor: [d / 2, d / 2],
        });
    }
    const isMonetizable = isUserLikeNode(node) && node.hasAgent === false;

    if (isDreamAnchor(node)) {
        const d = sz;
        const inner = isMonetizable
            ? `<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);color:#000;font-size:${Math.round(d * 0.45)}px;font-weight:900;line-height:1;">+</span>`
            : '';
        return L.divIcon({
            className: '',
            html: active
                ? `<div style="width:${d}px;height:${d}px;background:${color};transform:rotate(45deg);position:relative;box-sizing:border-box;${opacity}">${inner}</div>`
                : `<div style="width:${d}px;height:${d}px;border:${BORDER}px solid ${color};transform:rotate(45deg);background:transparent;box-sizing:border-box;${opacity}"></div>`,
            iconSize: [d, d],
            iconAnchor: [d / 2, d / 2],
        });
    }

    // Circle node
    if (!active) {
        return L.divIcon({
            className: '',
            html: `<div style="width:${sz}px;height:${sz}px;border:${BORDER}px solid ${color};border-radius:9999px;background:transparent;box-sizing:border-box;${opacity}"></div>`,
            iconSize: [sz, sz],
            iconAnchor: [sz / 2, sz / 2],
        });
    }
    if (isMonetizable) {
        return L.divIcon({
            className: '',
            html: `<div style="width:${sz}px;height:${sz}px;background:${color};border-radius:9999px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;${opacity}"><span style="color:#000;font-size:${Math.round(sz * 0.55)}px;font-weight:900;line-height:1;">+</span></div>`,
            iconSize: [sz, sz],
            iconAnchor: [sz / 2, sz / 2],
        });
    }
    return L.divIcon({
        className: '',
        html: `<div style="width:${sz}px;height:${sz}px;background:${color};border-radius:9999px;box-sizing:border-box;${opacity}"></div>`,
        iconSize: [sz, sz],
        iconAnchor: [sz / 2, sz / 2],
    });
}

// ── Map bounds helper ────────────────────────────────────────────────
function FitBounds({ points, maxZoom }) {
    const map = useMap();
    useEffect(() => {
        if (!points.length) return;
        map.fitBounds(points, { padding: [32, 32], maxZoom: maxZoom ?? 12 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(points.slice(0, 4)), map]);
    return null;
}

// Calls invalidateSize whenever any panel opens/closes so Leaflet recalculates
// the map container size and redraws polylines into the correct space.
function MapResizer({ detailsOpen, netSidebarOpen, chainsPanelOpen }) {
    const map = useMap();
    useEffect(() => {
        // Delay slightly longer than the animation duration (150–300 ms) so the
        // CSS transition has finished before Leaflet measures the container.
        const t = setTimeout(() => map.invalidateSize(), 320);
        return () => clearTimeout(t);
    }, [detailsOpen, netSidebarOpen, chainsPanelOpen, map]);
    return null;
}

// ── Coordinate clustering ─────────────────────────────────────────────
// Only nodes with exactly the same coordinates are merged into one cluster pin.
function coordKey(lat, lng) {
    return `${Number(lat)}:${Number(lng)}`;
}

function clusterNodesByCoord(nodes) {
    const grouped = new Map();
    nodes.forEach((node) => {
        const key = coordKey(node.lat, node.lng);
        const list = grouped.get(key) || [];
        list.push(node);
        grouped.set(key, list);
    });
    const result = [];
    grouped.forEach((list) => {
        if (list.length === 1) { result.push(list[0]); return; }
        const first = list[0];
        result.push({
            ...first,
            id: `cluster__${list.map((n) => n.id).join('__')}`,
            lat: Number(first.lat),
            lng: Number(first.lng),
            _isCluster: true,
            _clusterNodes: list,
            _clusterCount: list.length,
        });
    });
    return result;
}

const percentile = (arr, p) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)))];
};

// ── Main component ───────────────────────────────────────────────────
export default function NetworkCanvas() {
    const {
        graphData, filter, selectedNode, setSelectedNode, setActiveChain,
        privacyMode, activeChain, detailsOpen, netSidebarOpen, chainsPanelOpen,
    } = useNetworkContext();
    const showTiles = privacyMode === 'private';

    const maskValue = (value) => {
        if (privacyMode === 'public' && value && String(value).length > 3) {
            return String(value).slice(0, 2) + '••••';
        }
        return value;
    };

    // All nodes with valid coordinates, pure-buyers excluded from display
    const renderNodes = useMemo(() => {
        const nodes = Array.isArray(graphData?.nodes) ? graphData.nodes : [];
        return nodes.filter(
            (n) =>
                !isPureBuyer(n) &&
                Number.isFinite(Number(n.lat)) &&
                Number.isFinite(Number(n.lng)) &&
                n.isInternal !== true &&
                n.internal !== true
        );
    }, [graphData]);

    const adjustedNodes = useMemo(() => clusterNodesByCoord(renderNodes), [renderNodes]);

    // All nodes are always rendered; non-matching ones are greyed out rather than hidden.
    const visibleNodes = adjustedNodes;

    // id → node map. For clusters, also map every constituent id so edge
    // lookups resolve to the cluster's map position.
    const nodeMap = useMemo(() => {
        const m = new Map();
        adjustedNodes.forEach((n) => {
            m.set(String(n.id), n);
            if (n._isCluster) n._clusterNodes.forEach((cn) => m.set(String(cn.id), n));
        });
        return m;
    }, [adjustedNodes]);

    // Chain node IDs — populated when a chain is selected
    const chainNodeIds = useMemo(() => {
        if (!activeChain) return new Set();
        const path = Array.isArray(activeChain.path) ? activeChain.path : [];
        return new Set(path.map(String));
    }, [activeChain]);

    // Consecutive polyline segments for the active chain
    const chainEdges = useMemo(() => {
        if (!activeChain) return [];
        const path = Array.isArray(activeChain.path) ? activeChain.path : [];
        const segments = [];
        for (let i = 0; i < path.length - 1; i++) {
            const fromNode = nodeMap.get(String(path[i]));
            const toNode   = nodeMap.get(String(path[i + 1]));
            if (fromNode && toNode) segments.push({ from: fromNode, to: toNode });
        }
        return segments;
    }, [activeChain, nodeMap]);

    // Confirmed edges: edge.type === 'chain_ready' from backend = solid line
    const confirmedEdgeKeys = useMemo(() => {
        const s = new Set();
        const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];
        edges.forEach((e) => {
            if (e.type !== 'chain_ready') return;
            const a = String(e.source ?? e.from);
            const b = String(e.target ?? e.to);
            s.add(`${a}|${b}`);
            s.add(`${b}|${a}`);
        });
        return s;
    }, [graphData]);

    // IDs of the selected node (or all constituent IDs if it's a cluster)
    const selectedIds = useMemo(() => {
        if (!selectedNode) return new Set();
        if (selectedNode._isCluster) return new Set(selectedNode._clusterNodes.map((n) => String(n.id)));
        return new Set([String(selectedNode.id)]);
    }, [selectedNode]);

    // Active node IDs — determines State 1 vs State 2/3
    const activeNodeIds = useMemo(() => {
        const ids = new Set();
        if (activeChain) {
            chainNodeIds.forEach((id) => ids.add(id));
            return ids;
        }
        if (selectedNode) {
            // Mark the cluster/node itself active (both composite and constituent IDs)
            ids.add(String(selectedNode.id));
            if (selectedNode._isCluster) {
                selectedNode._clusterNodes.forEach((cn) => ids.add(String(cn.id)));
            }
            const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];
            edges.forEach((edge) => {
                const from = String(edge.source ?? edge.from);
                const to   = String(edge.target ?? edge.to);
                if (selectedIds.has(from)) { ids.add(to); const cn = nodeMap.get(to); if (cn) ids.add(String(cn.id)); }
                if (selectedIds.has(to))   { ids.add(from); const cn = nodeMap.get(from); if (cn) ids.add(String(cn.id)); }
            });
            return ids;
        }
        // No selection: filter drives active state
        adjustedNodes.forEach((n) => {
            const matches = n._isCluster
                ? n._clusterNodes.some((cn) => matchesFilter(cn, filter))
                : matchesFilter(n, filter);
            if (matches) ids.add(String(n.id));
        });
        return ids;
    }, [activeChain, chainNodeIds, selectedNode, selectedIds, graphData, adjustedNodes, filter, nodeMap]);

    // Per-node edges (shown on node click). Hidden while a chain is active.
    const visibleEdges = useMemo(() => {
        if (!selectedNode || activeChain) return [];
        const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];
        return edges
            .map((e) => ({
                from: String(e.source ?? e.from),
                to:   String(e.target ?? e.to),
            }))
            .filter((e) => (selectedIds.has(e.from) || selectedIds.has(e.to)) && e.from !== e.to)
            .filter((e) => nodeMap.has(e.from) && nodeMap.has(e.to));
    }, [selectedNode, selectedIds, activeChain, graphData, nodeMap]);

    // Map fit points — zoom to chain nodes when chain active, filter-matching nodes when filtered, else all.
    // selectedNode is intentionally excluded: clicking a node must not trigger a re-fit.
    const fitNodes = useMemo(() => {
        if (activeChain && chainNodeIds.size) {
            return adjustedNodes.filter((n) => chainNodeIds.has(String(n.id)));
        }
        if (filter !== 'All') {
            const matching = adjustedNodes.filter((n) => matchesFilter(n, filter));
            return matching.length ? matching : adjustedNodes;
        }
        return adjustedNodes;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeChain, chainNodeIds, adjustedNodes, filter]);

    const allPoints = useMemo(
        () => fitNodes.map((n) => [Number(n.renderLat ?? n.lat), Number(n.renderLng ?? n.lng)]),
        [fitNodes]
    );
    const focusPoints = useMemo(() => {
        if (fitNodes.length <= 50) return allPoints;
        const lats = fitNodes.map((n) => Number(n.renderLat ?? n.lat));
        const lngs = fitNodes.map((n) => Number(n.renderLng ?? n.lng));
        return fitNodes
            .filter((n) => {
                const lat = Number(n.renderLat ?? n.lat);
                const lng = Number(n.renderLng ?? n.lng);
                return (
                    lat >= percentile(lats, 0.05) && lat <= percentile(lats, 0.95) &&
                    lng >= percentile(lngs, 0.05) && lng <= percentile(lngs, 0.95)
                );
            })
            .map((n) => [Number(n.renderLat ?? n.lat), Number(n.renderLng ?? n.lng)]);
    }, [fitNodes, allPoints]);

    const center = useMemo(() => {
        if (!visibleNodes.length) return [0, 0];
        return [
            Number(visibleNodes[0].renderLat ?? visibleNodes[0].lat),
            Number(visibleNodes[0].renderLng ?? visibleNodes[0].lng),
        ];
    }, [visibleNodes]);

    if (!adjustedNodes.length) {
        return (
            <div className="flex-1 flex items-center justify-center text-sm px-6 text-center"
                style={{ background: '#0B1120', color: '#8B96B8' }}>
                No geocoded nodes yet.
            </div>
        );
    }

    return (
        <div className="flex-1 relative overflow-hidden">
            {/* Node count badge */}
            <div
                className="absolute top-3 left-3 z-[1000] px-3 py-1.5 rounded-lg text-xs"
                style={{
                    background: 'rgba(15,23,41,0.9)',
                    color: '#8B96B8',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                {visibleNodes.length} nodes
            </div>

            <MapContainer
                center={center}
                zoom={12}
                className="w-full h-full"
                zoomControl
                style={{ background: '#0B0F14' }}
            >
                <FitBounds points={focusPoints} />
                <MapResizer detailsOpen={detailsOpen} netSidebarOpen={netSidebarOpen} chainsPanelOpen={chainsPanelOpen} />
                {showTiles && (
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    />
                )}

                {/* Chain path lines — shown when a chain is selected */}
                {chainEdges.map((seg, idx) => (
                    <Polyline
                        key={`chain-seg-${idx}`}
                        positions={[
                            [Number(seg.from.renderLat ?? seg.from.lat), Number(seg.from.renderLng ?? seg.from.lng)],
                            [Number(seg.to.renderLat   ?? seg.to.lat),   Number(seg.to.renderLng   ?? seg.to.lng)],
                        ]}
                        pathOptions={{
                            color: activeChain?.isReady ? '#22C98A' : '#7C7C8A',
                            opacity: 0.9,
                            weight: 2.5,
                            dashArray: activeChain?.isReady ? undefined : '6 4',
                        }}
                    />
                ))}

                {/* Per-node connection lines — only visible when a node is selected */}
                {visibleEdges.map((edge, idx) => {
                    const fromNode = nodeMap.get(edge.from);
                    const toNode   = nodeMap.get(edge.to);
                    if (!fromNode || !toNode) return null;
                    const confirmed = confirmedEdgeKeys.has(`${edge.from}|${edge.to}`);
                    return (
                        <Polyline
                            key={`edge-${idx}`}
                            positions={[
                                [Number(fromNode.renderLat ?? fromNode.lat), Number(fromNode.renderLng ?? fromNode.lng)],
                                [Number(toNode.renderLat ?? toNode.lat), Number(toNode.renderLng ?? toNode.lng)],
                            ]}
                            pathOptions={{
                                color: '#7C7C8A',
                                opacity: 0.7,
                                weight: 1.5,
                                dashArray: confirmed ? undefined : '5 5',
                            }}
                        />
                    );
                })}

                {/* Nodes */}
                {visibleNodes.map((node) => {
                    const id             = String(node.id);
                    const constituentIds = node._isCluster
                        ? node._clusterNodes.map((cn) => String(cn.id))
                        : [id];
                    const isActive   = activeNodeIds.has(id) || constituentIds.some((nid) => activeNodeIds.has(nid));
                    const isInChain  = constituentIds.some((nid) => chainNodeIds.has(nid));
                    const isSelected = selectedNode && (
                        String(selectedNode.id) === id ||
                        constituentIds.some((nid) => nid === String(selectedNode.id))
                    );
                    const isGreyed   = (!!activeChain && !isInChain) ||
                                       (!activeChain && !isActive && (filter !== 'All' || !!selectedNode));
                    const icon       = makeIcon(node, isActive, isSelected, isGreyed);

                    return (
                        <Marker
                            key={id}
                            position={{
                                lat: Number(node.renderLat ?? node.lat),
                                lng: Number(node.renderLng ?? node.lng),
                            }}
                            eventHandlers={{
                                click: () => {
                                    setActiveChain(null);
                                    setSelectedNode(isSelected ? null : node);
                                },
                            }}
                            icon={icon}
                        >
                            {(node.address || node._isCluster) && (
                                <Tooltip direction="top" offset={[0, -6]} opacity={0.95} permanent={false}>
                                    <span className="text-xs">
                                        {node._isCluster
                                            ? maskValue(node._clusterNodes[0]?.address) || `${node._clusterCount} nodes`
                                            : maskValue(node.address)}
                                    </span>
                                </Tooltip>
                            )}
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
