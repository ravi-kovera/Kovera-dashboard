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
    const color  = isGreyed ? '#4D5A7C' : nodeColor(node);
    const active = isActive && !isGreyed; // greyed nodes are always hollow
    const sz     = isSelected ? SEL_SIZE : DOT_SIZE;
    const isMonetizable = isUserLikeNode(node) && node.hasAgent === false;

    if (isDreamAnchor(node)) {
        const d = sz;
        const inner = isMonetizable
            ? `<span style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-45deg);color:#000;font-size:${Math.round(d * 0.45)}px;font-weight:900;line-height:1;">+</span>`
            : '';
        return L.divIcon({
            className: '',
            html: active
                ? `<div style="width:${d}px;height:${d}px;background:${color};transform:rotate(45deg);position:relative;box-sizing:border-box;">${inner}</div>`
                : `<div style="width:${d}px;height:${d}px;border:${BORDER}px solid ${color};transform:rotate(45deg);background:transparent;box-sizing:border-box;"></div>`,
            iconSize: [d, d],
            iconAnchor: [d / 2, d / 2],
        });
    }

    // Circle node
    if (!active) {
        return L.divIcon({
            className: '',
            html: `<div style="width:${sz}px;height:${sz}px;border:${BORDER}px solid ${color};border-radius:9999px;background:transparent;box-sizing:border-box;"></div>`,
            iconSize: [sz, sz],
            iconAnchor: [sz / 2, sz / 2],
        });
    }
    if (isMonetizable) {
        return L.divIcon({
            className: '',
            html: `<div style="width:${sz}px;height:${sz}px;background:${color};border-radius:9999px;display:flex;align-items:center;justify-content:center;box-sizing:border-box;"><span style="color:#000;font-size:${Math.round(sz * 0.55)}px;font-weight:900;line-height:1;">+</span></div>`,
            iconSize: [sz, sz],
            iconAnchor: [sz / 2, sz / 2],
        });
    }
    return L.divIcon({
        className: '',
        html: `<div style="width:${sz}px;height:${sz}px;background:${color};border-radius:9999px;box-sizing:border-box;"></div>`,
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

// ── Coordinate spread ────────────────────────────────────────────────
// Nodes sharing a sharedAddressGroup have the same real-world address —
// use the first node's position as canonical so they cluster together.
function spreadNodesByCoord(nodes) {
    const grouped = new Map();
    nodes.forEach((node) => {
        const key = node.sharedAddressGroup
            ? `addr:${node.sharedAddressGroup}`
            : `ll:${Number(node.lat).toFixed(5)}:${Number(node.lng).toFixed(5)}`;
        const list = grouped.get(key) || [];
        list.push(node);
        grouped.set(key, list);
    });
    const spread = [];
    grouped.forEach((list) => {
        if (list.length === 1) { spread.push(list[0]); return; }
        // Use first node's coordinates as the canonical position for the group
        const baseLat = Number(list[0].lat);
        const baseLng = Number(list[0].lng);
        list.forEach((node, i) => {
            const angle  = (Math.PI * 2 * i) / list.length;
            const radius = 0.00022 + Math.floor(i / 12) * 0.0001;
            spread.push({
                ...node,
                renderLat: baseLat + Math.sin(angle) * radius,
                renderLng: baseLng + Math.cos(angle) * radius,
            });
        });
    });
    return spread;
}

const percentile = (arr, p) => {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)))];
};

// ── Main component ───────────────────────────────────────────────────
export default function NetworkCanvas() {
    const { graphData, filter, selectedNode, setSelectedNode, setActiveChain, privacyMode, activeChain } =
        useNetworkContext();
    const showTiles = privacyMode === 'private';

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

    const adjustedNodes = useMemo(() => spreadNodesByCoord(renderNodes), [renderNodes]);

    // All nodes are always rendered; non-matching ones are greyed out rather than hidden.
    const visibleNodes = adjustedNodes;

    // id → node map (spread positions)
    const nodeMap = useMemo(() => {
        const m = new Map();
        adjustedNodes.forEach((n) => m.set(String(n.id), n));
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

    // Active node IDs — determines State 1 vs State 2/3
    const activeNodeIds = useMemo(() => {
        const ids = new Set();
        if (activeChain) {
            // Chain mode: only chain path nodes are active
            chainNodeIds.forEach((id) => ids.add(id));
            return ids;
        }
        if (selectedNode) {
            // Node selection: selected + directly connected
            ids.add(String(selectedNode.id));
            const edges = Array.isArray(graphData?.edges) ? graphData.edges : [];
            edges.forEach((edge) => {
                const from = String(edge.source ?? edge.from);
                const to   = String(edge.target ?? edge.to);
                if (from === String(selectedNode.id)) ids.add(to);
                if (to === String(selectedNode.id))   ids.add(from);
            });
            return ids;
        }
        // No selection: filter drives active state
        adjustedNodes.forEach((n) => {
            if (matchesFilter(n, filter)) ids.add(String(n.id));
        });
        return ids;
    }, [activeChain, chainNodeIds, selectedNode, graphData, adjustedNodes, filter]);

    // Per-node edges (shown on node click). Hidden while a chain is active.
    const visibleEdges = useMemo(() => {
        if (!selectedNode || activeChain) return [];
        const selId = String(selectedNode.id);
        const edges  = Array.isArray(graphData?.edges) ? graphData.edges : [];
        return edges
            .map((e) => ({
                from: String(e.source ?? e.from),
                to:   String(e.target ?? e.to),
            }))
            .filter((e) => (e.from === selId || e.to === selId) && e.from !== e.to)
            .filter((e) => nodeMap.has(e.from) && nodeMap.has(e.to));
    }, [selectedNode, activeChain, graphData, nodeMap]);

    // Map fit points — zoom to chain nodes when chain active, filter-matching nodes when filtered, else all
    const fitNodes = useMemo(() => {
        if (activeChain && chainNodeIds.size) {
            return adjustedNodes.filter((n) => chainNodeIds.has(String(n.id)));
        }
        if (filter !== 'All' && !selectedNode) {
            const matching = adjustedNodes.filter((n) => matchesFilter(n, filter));
            return matching.length ? matching : adjustedNodes;
        }
        return adjustedNodes;
    }, [activeChain, chainNodeIds, adjustedNodes, filter, selectedNode]);

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
                style={!showTiles ? { background: '#0B0F14' } : undefined}
            >
                <FitBounds points={focusPoints} />
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
                    const id         = String(node.id);
                    const isActive   = activeNodeIds.has(id);
                    const isSelected = selectedNode && String(selectedNode.id) === id;
                    const isGreyed   = (!!activeChain && !chainNodeIds.has(id)) ||
                                       (!activeChain && !activeNodeIds.has(id) && (filter !== 'All' || !!selectedNode));
                    const icon       = makeIcon(node, isActive, isSelected, isGreyed);
                    const name       = node.name || node.displayName || node.address || null;

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
                            <Tooltip direction="top" offset={[0, -6]} opacity={0.95}>
                                <div className="text-xs space-y-0.5">
                                    <div className="font-semibold">{name || 'Unknown'}</div>
                                    {isUserLikeNode(node) && (
                                        <div style={{
                                            color: node.hasAgent === true
                                                ? '#22C98A'
                                                : node.hasAgent === false
                                                  ? '#EF4444'
                                                  : '#9CA3AF',
                                            fontSize: 10,
                                        }}>
                                            {node.hasAgent === true
                                                ? `Agent: ${node.agentName || 'linked'}`
                                                : node.hasAgent === false
                                                  ? 'No agent'
                                                  : ''}
                                        </div>
                                    )}
                                </div>
                            </Tooltip>
                        </Marker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
