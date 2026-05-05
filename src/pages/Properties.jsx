import { useState, useCallback } from "react";
import {
  Button, Badge, Card, CardContent, Select,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from "@/components/ui";
import {
  Plus, Search, X, Building2, Heart, MapPin, Bed, Bath, Maximize2,
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ArrowUpDown, ArrowUp, ArrowDown, LayoutGrid, List, Eye,
  DollarSign, ArrowLeftRight, User, Calendar, ImageIcon,
} from "lucide-react";
import { useProperties, useProperty, useUpdatePropertyStatus } from "@/services/hooks/useProperties";

/* ── Status badge map ── */
const STATUS_VARIANT = { Active: "success", Pending: "warning", Sold: "info" };

/* ── Sort icon ── */
function SortIcon({ field, current, order }) {
  if (current !== field) return <ArrowUpDown className="w-3.5 h-3.5 text-muted-foreground" />;
  return order === "asc" ? <ArrowUp className="w-3.5 h-3.5 text-primary" /> : <ArrowDown className="w-3.5 h-3.5 text-primary" />;
}

/* ── Table skeleton ── */
function TableSkeleton({ rows = 6 }) {
  return (<>{Array.from({ length: rows }).map((_, i) => (
    <tr key={i} className="border-b border-border/50">
      <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-9 h-9 rounded-lg skeleton" /><div className="space-y-1.5"><div className="h-4 w-36 skeleton rounded" /><div className="h-3 w-24 skeleton rounded" /></div></div></td>
      <td className="px-5 py-3.5"><div className="h-4 w-20 skeleton rounded" /></td>
      <td className="px-5 py-3.5"><div className="h-4 w-12 skeleton rounded" /></td>
      <td className="px-5 py-3.5"><div className="h-4 w-16 skeleton rounded" /></td>
      <td className="px-5 py-3.5"><div className="h-5 w-14 skeleton rounded-full" /></td>
      <td className="px-5 py-3.5"><div className="h-4 w-10 skeleton rounded" /></td>
    </tr>
  ))}</>);
}

/* ── Grid skeleton ── */
function GridSkeleton({ count = 6 }) {
  return (<>{Array.from({ length: count }).map((_, i) => (
    <div key={i} className="rounded-2xl bg-surface border border-border overflow-hidden">
      <div className="h-40 skeleton" />
      <div className="p-4 space-y-3">
        <div className="h-4 w-3/4 skeleton rounded" />
        <div className="h-3 w-1/2 skeleton rounded" />
        <div className="flex justify-between"><div className="h-5 w-20 skeleton rounded" /><div className="h-5 w-14 skeleton rounded-full" /></div>
      </div>
    </div>
  ))}</>);
}

/* ══════════════════════════════════════════════════════
   PROPERTY DETAIL MODAL
   ══════════════════════════════════════════════════════ */
function PropertyDetailModal({ propertyId, onClose }) {
  const { data: prop, isLoading } = useProperty(propertyId);
  const updateStatus = useUpdatePropertyStatus();
  const [tab, setTab] = useState("info");
  const [imgIdx, setImgIdx] = useState(0);

  if (!propertyId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-navy-900 border border-border shadow-elevated animate-scale-in">
        {isLoading ? (
          <div className="p-16 flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
        ) : prop ? (
          <>
            {/* ── Image Gallery ── */}
            <div className="relative h-56 sm:h-64 bg-navy-950 overflow-hidden">
              <img
                src={prop.images?.[imgIdx] || `https://picsum.photos/seed/${prop.id}/600/400`}
                alt={prop.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-navy-900 via-transparent to-transparent" />
              {/* Image nav dots */}
              {prop.images?.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                  {prop.images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setImgIdx(idx)}
                      className={`w-2 h-2 rounded-full transition-all cursor-pointer ${idx === imgIdx ? "bg-white w-5" : "bg-white/40 hover:bg-white/60"}`}
                    />
                  ))}
                </div>
              )}
              {/* Price tag */}
              <div className="absolute top-4 left-4 px-3 py-1.5 rounded-xl bg-navy-950/80 backdrop-blur-md border border-white/10">
                <p className="text-lg font-bold text-white">{prop.priceFormatted}</p>
              </div>
              {/* Status + Type */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Badge variant={STATUS_VARIANT[prop.status]}>{prop.status}</Badge>
                <Badge variant="outline">{prop.type}</Badge>
              </div>
              {/* Close */}
              <button onClick={onClose} className="absolute top-4 right-4 mt-8 p-2 rounded-xl bg-navy-950/60 text-white hover:bg-navy-950/80 transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* ── Title ── */}
            <div className="px-5 pt-4 pb-2">
              <h2 className="text-xl font-bold text-white">{prop.title}</h2>
              <div className="flex items-center gap-1.5 mt-1 text-sm text-muted">
                <MapPin className="w-3.5 h-3.5" /> {prop.location}
              </div>
            </div>

            {/* ── Quick Stats ── */}
            <div className="grid grid-cols-4 gap-3 px-5 py-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950 border border-border">
                <Bed className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-white">{prop.beds} Beds</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950 border border-border">
                <Bath className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-white">{prop.baths} Baths</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950 border border-border">
                <Maximize2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-white">{prop.sqft} sqft</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-navy-950 border border-border">
                <Heart className="w-4 h-4 text-red-400" />
                <span className="text-sm font-medium text-white">{prop.likes}</span>
              </div>
            </div>

            {/* ── Tabs ── */}
            <div className="px-5 pb-5">
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="info"><Building2 className="w-4 h-4" /> Details</TabsTrigger>
                  <TabsTrigger value="agent"><User className="w-4 h-4" /> Agent</TabsTrigger>
                  <TabsTrigger value="likes"><Heart className="w-4 h-4" /> Likes ({prop.likedBy?.length || 0})</TabsTrigger>
                  <TabsTrigger value="trades"><ArrowLeftRight className="w-4 h-4" /> Trades</TabsTrigger>
                </TabsList>

                {/* Details */}
                <TabsContent value="info">
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl bg-navy-950 border border-border">
                      <p className="text-xs text-muted mb-1">Description</p>
                      <p className="text-sm text-white leading-relaxed">{prop.description}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-navy-950 border border-border">
                        <p className="text-xs text-muted mb-1">Property Type</p>
                        <p className="text-sm font-medium text-white">{prop.propertyType}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-navy-950 border border-border">
                        <p className="text-xs text-muted mb-1">Year Built</p>
                        <p className="text-sm font-medium text-white">{prop.yearBuilt}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Agent */}
                <TabsContent value="agent">
                  {prop.agent ? (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-navy-950 border border-border">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 text-lg font-bold">
                        {prop.agent.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{prop.agent.name}</p>
                        <p className="text-xs text-muted">{prop.agent.agency}</p>
                      </div>
                      <Button size="sm" className="ml-auto">Contact</Button>
                    </div>
                  ) : (
                    <p className="text-sm text-muted text-center py-8">No agent assigned</p>
                  )}
                </TabsContent>

                {/* Likes */}
                <TabsContent value="likes">
                  {prop.likedBy?.length > 0 ? (
                    <div className="space-y-2">
                      {prop.likedBy.map((u) => (
                        <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-navy-950 border border-border">
                          <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-400 text-sm font-semibold">
                            {u.avatar}
                          </div>
                          <p className="text-sm text-white">{u.name}</p>
                          <Heart className="w-3.5 h-3.5 text-red-400 fill-red-400 ml-auto" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted text-center py-8">No likes yet</p>
                  )}
                </TabsContent>

                {/* Trades */}
                <TabsContent value="trades">
                  {prop.trades?.length > 0 ? (
                    <div className="space-y-2">
                      {prop.trades.map((t) => (
                        <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-navy-950 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center">
                              <ArrowLeftRight className="w-4 h-4 text-amber-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{t.buyer}</p>
                              <p className="text-xs text-muted">{t.date} · {t.amount}</p>
                            </div>
                          </div>
                          <Badge variant={t.status === "Completed" ? "success" : "info"}>{t.status}</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted text-center py-8">No trade history</p>
                  )}
                </TabsContent>
              </Tabs>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-border">
              <div className="flex items-center gap-2">
                <Select
                  value={prop.status}
                  onChange={(e) => updateStatus.mutate({ id: propertyId, status: e.target.value })}
                  disabled={updateStatus.isLoading}
                  className="w-32 bg-navy-900"
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Sold">Sold</option>
                  <option value="Hidden">Hidden</option>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
                <Button size="sm"><Eye className="w-4 h-4" /> View Full Listing</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="p-16 text-center text-muted">Property not found</div>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PROPERTY GRID CARD
   ══════════════════════════════════════════════════════ */
function PropertyGridCard({ property, onClick }) {
  return (
    <div
      onClick={onClick}
      className="rounded-2xl bg-surface border border-border overflow-hidden hover:border-border-light hover:shadow-card-hover transition-all duration-200 cursor-pointer group"
    >
      {/* Image */}
      <div className="relative h-40 bg-navy-950 overflow-hidden">
        <img
          src={property.images?.[0] || `https://picsum.photos/seed/${property.id}/400/300`}
          alt={property.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-navy-900/80 via-transparent to-transparent" />
        <div className="absolute top-3 left-3">
          <Badge variant={STATUS_VARIANT[property.status]}>{property.status}</Badge>
        </div>
        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-1 rounded-lg bg-navy-950/70 backdrop-blur-sm text-xs text-red-400">
          <Heart className="w-3 h-3 fill-red-400" /> {property.likes}
        </div>
        <div className="absolute bottom-3 left-3">
          <p className="text-lg font-bold text-white drop-shadow-md">{property.priceFormatted}</p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-white truncate group-hover:text-primary-light transition-colors">
          {property.title}
        </h3>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted">
          <MapPin className="w-3 h-3" /> {property.location}
        </div>

        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border text-xs text-muted">
          <span className="flex items-center gap-1"><Bed className="w-3 h-3" /> {property.beds}</span>
          <span className="flex items-center gap-1"><Bath className="w-3 h-3" /> {property.baths}</span>
          <span className="flex items-center gap-1"><Maximize2 className="w-3 h-3" /> {property.sqft}</span>
          <Badge variant="outline" className="ml-auto text-[10px] px-1.5">{property.type}</Badge>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════
   PROPERTIES PAGE (Main)
   ══════════════════════════════════════════════════════ */
export default function PropertiesPage() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [sortBy, setSortBy] = useState("title");
  const [sortOrder, setSortOrder] = useState("asc");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "table"
  const [selectedPropertyId, setSelectedPropertyId] = useState(null);
  const [showPriceFilter, setShowPriceFilter] = useState(false);
  const limit = viewMode === "grid" ? 12 : 20;

  const { data, isLoading } = useProperties({
    page, limit, search,
    type: typeFilter,
    location: locationFilter,
    priceMin: priceMin || undefined,
    priceMax: priceMax || undefined,
    sortBy, sortOrder,
  });

  const properties = data?.properties || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) { setSortOrder((o) => (o === "asc" ? "desc" : "asc")); return field; }
      setSortOrder("asc"); return field;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setSearch(""); setTypeFilter("all"); setLocationFilter("all"); setPriceMin(""); setPriceMax(""); setPage(1);
  }, []);

  const hasActiveFilters = typeFilter !== "all" || locationFilter !== "all" || priceMin || priceMax;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Properties</h1>
          <p className="text-muted mt-1 text-sm">
            Manage real estate listings · <span className="text-white font-medium">{total}</span> total
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-xl border border-border bg-navy-900 p-0.5">
            <button
              onClick={() => { setViewMode("grid"); setPage(1); }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === "grid" ? "bg-surface-active text-primary" : "text-muted hover:text-white"}`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setViewMode("table"); setPage(1); }}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${viewMode === "table" ? "bg-surface-active text-primary" : "text-muted hover:text-white"}`}
              title="Table view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button><Plus className="w-4 h-4" /> Add Property</Button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search properties..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full h-10 pl-10 pr-4 rounded-xl border border-border bg-navy-900 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:input-ring hover:border-border-light transition-all"
          />
          {search && (<button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white cursor-pointer"><X className="w-3.5 h-3.5" /></button>)}
        </div>

        <div className="relative">
          <Select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "Sale / Rent" },
              { value: "sale", label: "For Sale" },
              { value: "rent", label: "For Rent" },
            ]}
            size="sm"
          />
        </div>

        <div className="relative">
          <Select
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            options={[
              { value: "all", label: "All Locations" },
            ]}
            size="sm"
          />
        </div>

        <Button variant={showPriceFilter ? "secondary" : "outline"} size="sm" onClick={() => setShowPriceFilter(!showPriceFilter)}>
          <DollarSign className="w-4 h-4" /> Price
        </Button>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-3.5 h-3.5" /> Clear</Button>
        )}
      </div>

      {/* ── Price Range ── */}
      {showPriceFilter && (
        <Card className="p-4 animate-slide-down">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Min Price ($)</label>
              <input type="number" placeholder="0" value={priceMin}
                onChange={(e) => { setPriceMin(e.target.value); setPage(1); }}
                className="h-9 w-36 px-3 rounded-lg border border-border bg-navy-900 text-sm text-white focus:outline-none focus:input-ring transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted mb-1.5">Max Price ($)</label>
              <input type="number" placeholder="10000000" value={priceMax}
                onChange={(e) => { setPriceMax(e.target.value); setPage(1); }}
                className="h-9 w-36 px-3 rounded-lg border border-border bg-navy-900 text-sm text-white focus:outline-none focus:input-ring transition-all"
              />
            </div>
          </div>
        </Card>
      )}

      {/* ── Content ── */}
      {viewMode === "grid" ? (
        /* ── Grid View ── */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            <GridSkeleton count={6} />
          ) : properties.length === 0 ? (
            <div className="col-span-full py-16 text-center">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-white font-medium mb-1">No properties found</p>
              <p className="text-sm text-muted">Try adjusting your filters</p>
            </div>
          ) : (
            properties.map((prop, idx) => (
              <div key={prop.id} className="animate-slide-up" style={{ animationDelay: `${idx * 40}ms` }}>
                <PropertyGridCard property={prop} onClick={() => setSelectedPropertyId(prop.id)} />
              </div>
            ))
          )}
        </div>
      ) : (
        /* ── Table View ── */
        <Card className="p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3">
                    <button onClick={() => handleSort("title")} className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                      Property <SortIcon field="title" current={sortBy} order={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Location</th>
                  <th className="text-left px-5 py-3">
                    <button onClick={() => handleSort("price")} className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                      Price <SortIcon field="price" current={sortBy} order={sortOrder} />
                    </button>
                  </th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Type</th>
                  <th className="text-left px-5 py-3 text-xs font-medium text-muted uppercase tracking-wider">Status</th>
                  <th className="text-left px-5 py-3">
                    <button onClick={() => handleSort("likes")} className="flex items-center gap-1.5 text-xs font-medium text-muted uppercase tracking-wider hover:text-white transition-colors cursor-pointer">
                      Likes <SortIcon field="likes" current={sortBy} order={sortOrder} />
                    </button>
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? <TableSkeleton /> : properties.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-16 text-center">
                    <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                    <p className="text-white font-medium mb-1">No properties found</p>
                    <p className="text-sm text-muted">Try adjusting your filters</p>
                  </td></tr>
                ) : properties.map((prop) => (
                  <tr key={prop.id} onClick={() => setSelectedPropertyId(prop.id)}
                    className="border-b border-border/50 last:border-0 hover:bg-surface-hover transition-colors cursor-pointer group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                          <Building2 className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-white group-hover:text-primary-light transition-colors truncate max-w-[200px]">{prop.title}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-muted">{prop.location}</td>
                    <td className="px-5 py-3.5 text-sm font-semibold text-white">{prop.priceFormatted}</td>
                    <td className="px-5 py-3.5"><Badge variant="outline">{prop.type}</Badge></td>
                    <td className="px-5 py-3.5"><Badge variant={STATUS_VARIANT[prop.status]}>{prop.status}</Badge></td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 text-sm text-muted">
                        <Heart className="w-3.5 h-3.5 text-red-400" /> {prop.likes}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted">
            Showing <span className="text-white font-medium">{(page - 1) * limit + 1}</span>–
            <span className="text-white font-medium">{Math.min(page * limit, total)}</span> of{" "}
            <span className="text-white font-medium">{total}</span>
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => setPage(1)}><ChevronsLeft className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}><ChevronLeft className="w-4 h-4" /></Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pn; if (totalPages <= 5) pn = i + 1; else if (page <= 3) pn = i + 1; else if (page >= totalPages - 2) pn = totalPages - 4 + i; else pn = page - 2 + i;
              return <Button key={pn} variant={page === pn ? "secondary" : "ghost"} size="icon-sm" onClick={() => setPage(pn)} className={page === pn ? "border border-primary/30 text-primary" : ""}>{pn}</Button>;
            })}
            <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}><ChevronRight className="w-4 h-4" /></Button>
            <Button variant="ghost" size="icon-sm" disabled={page >= totalPages} onClick={() => setPage(totalPages)}><ChevronsRight className="w-4 h-4" /></Button>
          </div>
        </div>
      )}

      {/* ── Detail Modal ── */}
      {selectedPropertyId && (
        <PropertyDetailModal propertyId={selectedPropertyId} onClose={() => setSelectedPropertyId(null)} />
      )}
    </div>
  );
}
