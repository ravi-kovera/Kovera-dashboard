// Shared node-type predicates and filter matcher used by NetworkCanvas and NetworkSidebar.
//
// Backend type values (from network-queries.ts):
//   "swapper"       — user has currentAddress AND modelHomeAddress (home + dream)
//   "pure_seller"   — user has currentAddress only (home, no dream)
//   "pure_buyer"    — user has modelHomeAddress only (no home)
//   "dream_anchor"  — shared dream-address node
//   "pocket_listing"— agent-submitted off-market property
//   "public_listing"— scraped public/MLS listing
// There is NO "user_home" type in the backend.

export const toNodeType = (node) => String(node?.type || '').toLowerCase();

export const isPureBuyer = (node) => toNodeType(node) === 'pure_buyer';

// Swapper = user who has both a home AND a dream address
export const isSwapperNode = (node) => toNodeType(node) === 'swapper';

// Pure seller = user who has a home but no dream address
export const isPureSellerNode = (node) => toNodeType(node) === 'pure_seller';

// User Home = any user who has a current home address (swapper or pure_seller)
export const isUserHomeNode = (node) => isSwapperNode(node) || isPureSellerNode(node);

export const isPocketListing = (node) => toNodeType(node) === 'pocket_listing';

export const isOffMarketListing = (node) =>
    toNodeType(node) === 'seeded_listing' &&
    String(node.listingCategory || node.source || '').toLowerCase() === 'off_market';

export const isPublicListing = (node) =>
    toNodeType(node) === 'public_listing' ||
    (toNodeType(node) === 'seeded_listing' && !isOffMarketListing(node) && !isPocketListing(node));

export const isDreamAnchor = (node) => ['dream_anchor', 'dream_address'].includes(toNodeType(node));

export const isUserLikeNode = (node) =>
    ['swapper', 'pure_seller', 'pure_buyer'].includes(toNodeType(node));

export const matchesFilter = (node, filter) => {
    if (filter === 'All') return true;
    if (filter === 'User Homes') return isUserHomeNode(node);
    if (filter === 'Swappers') return isSwapperNode(node);
    if (filter === 'Pure Sellers') return isPureSellerNode(node);
    if (filter === 'Public Listings') return isPublicListing(node);
    if (filter === 'Off-Market Properties') return isOffMarketListing(node) || isPocketListing(node);
    if (filter === 'Dream Anchors') return isDreamAnchor(node);
    return false;
};

// 6-color palette — maps visual category → hex. Pure-buyer has no color (not shown).
export const nodeColor = (node) => {
    if (isDreamAnchor(node)) return '#FF2A85';
    if (isPublicListing(node)) return '#39FF14';
    if (isOffMarketListing(node) || isPocketListing(node)) return '#9D4EDD';
    if (isSwapperNode(node)) return '#FFB300';
    if (isPureSellerNode(node)) return '#FF5722';
    return '#00E5FF';
};
