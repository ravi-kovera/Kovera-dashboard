/**
 * Maps API chain participant IDs (e.g. user-54416778, seeded-114) to graph node ids.
 * Ported from kovera-map/frontend/src/utils/chainPaths.ts
 */

function uidFromGraphNode(n) {
    const u = n.uid ?? n.userId;
    if (u !== undefined && u !== null) return String(u);
    const id = String(n.id || '');
    const mNum = id.match(/^user[_-]?(\d+)$/i);
    if (mNum) return mNum[1];
    const mAny = id.match(/^user[_-]?(.+)$/i);
    return mAny ? mAny[1] : undefined;
}

export function buildGraphNodeResolver(nodes) {
    const map = new Map();

    for (const n of nodes) {
        const gid = n?.id;
        if (!gid) continue;

        map.set(String(gid), gid);
        map.set(String(gid).toLowerCase(), gid);

        const uid = uidFromGraphNode(n);
        if (uid) {
            map.set(`user-${uid}`, gid);
            map.set(`user_${uid}`, gid);
            map.set(uid, gid);
        }

        const tid = String(gid);
        const digits = tid.match(/(\d+)/g);
        if (digits) {
            for (const d of digits) {
                if (d.length >= 2) {
                    map.set(`seeded-${d}`, gid);
                    map.set(`seeded_${d}`, gid);
                }
            }
        }
    }

    return function resolve(apiId) {
        if (!apiId) return null;
        if (map.has(apiId)) return map.get(apiId);
        const lower = apiId.toLowerCase();
        if (map.has(lower)) return map.get(lower);

        const userM = apiId.match(/^user[_-]?(\d+)$/i);
        if (userM) {
            const num = userM[1];
            const candidates = [`user-${num}`, `user_${num}`];
            for (const c of candidates) {
                if (map.has(c)) return map.get(c);
            }
            for (const n of nodes) {
                if (String(uidFromGraphNode(n)) === num) return String(n.id);
            }
        }

        const userLoose = apiId.match(/^user[_-]?(.+)$/i);
        if (userLoose) {
            const tail = userLoose[1];
            if (!/^\d+$/.test(tail)) {
                const tryKeys = [apiId, `user-${tail}`, `user_${tail}`, tail];
                for (const k of tryKeys) {
                    if (map.has(k)) return map.get(k);
                    const kl = String(k).toLowerCase();
                    if (map.has(kl)) return map.get(kl);
                }
                for (const n of nodes) {
                    const gid = String(n.id || '');
                    if (!gid) continue;
                    if (gid === apiId || gid === tail || gid === `user-${tail}` || gid === `user_${tail}`) return gid;
                    const u = uidFromGraphNode(n);
                    if (u && (u === tail || `user-${u}` === apiId)) return gid;
                }
            }
        }

        const seedM = apiId.match(/^seeded[_-]?(\d+)$/i);
        if (seedM) {
            const num = seedM[1];
            for (const k of [`seeded-${num}`, `seeded_${num}`]) {
                if (map.has(k)) return map.get(k);
            }
            for (const n of nodes) {
                const nt = String(n.type || '').toLowerCase();
                if (!['seeded_listing', 'public_listing', 'pocket_listing'].includes(nt)) continue;
                if (String(n.id).includes(num)) return String(n.id);
            }
        }

        return null;
    };
}

export function asStringArray(v) {
    if (v == null) return [];
    if (Array.isArray(v)) return v.map(String).filter(Boolean);
    if (typeof v === 'string') {
        const s = v.trim();
        return s ? [s] : [];
    }
    return [];
}

export function buildUserAgentMap(raw, nodes) {
    const out = new Map();
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    if (!Array.isArray(raw) || !safeNodes.length) return out;

    const resolve = buildGraphNodeResolver(safeNodes);

    for (const chain of raw) {
        const participants = Array.isArray(chain?.participants) ? chain.participants : [];
        for (const p of participants) {
            const apiId = String(p?.userId ?? '');
            if (!apiId) continue;
            const gid = resolve(apiId);
            if (!gid) continue;

            const prev = out.get(gid);
            const next = {
                hasAgent: Boolean(prev?.hasAgent || p?.hasAgent === true),
                agentName: prev?.agentName || (typeof p?.agentName === 'string' ? p.agentName : undefined),
                agentEmail: prev?.agentEmail || (typeof p?.agentEmail === 'string' ? p.agentEmail : undefined),
                optedIn: prev?.optedIn ?? (typeof p?.optedIn === 'boolean' ? p.optedIn : undefined),
            };
            out.set(gid, next);
        }
    }

    return out;
}

export function normalizeChainsFromApi(raw, nodes) {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    if (!Array.isArray(raw) || !safeNodes.length) return [];

    const resolve = buildGraphNodeResolver(safeNodes);

    return raw
        .filter((c) => c != null && typeof c === 'object')
        .map((c, idx) => {
            const orderedPath = asStringArray(c.orderedPath ?? c.path);
            const path = orderedPath.map((pid) => resolve(pid)).filter(Boolean);
            const readinessScore = typeof c.readinessScore === 'number' ? c.readinessScore : undefined;
            const isReady =
                c.isReady === true ||
                (readinessScore !== undefined && readinessScore >= 0.65);

            return {
                id: String(c.chainId || c.id || `chain-${idx}`),
                chainType: c.chainType,
                length: c.length ?? orderedPath.length,
                readinessScore,
                orderedPath,
                path,
                participants: Array.isArray(c.participants) ? c.participants : [],
                isReady,
            };
        });
}
