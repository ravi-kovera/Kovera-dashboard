import { useState } from 'react';
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter,
    Input,
    Textarea,
    Select,
    Badge,
    Toggle,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
    Spinner,
    PageLoader,
    Skeleton,
    SkeletonText,
    SkeletonCard,
    SkeletonTable,
    SkeletonAvatar,
    SearchBar,
    Modal,
} from '@/components/ui';
import { StatCard, DataTable } from '@/components/common';
import {
    Users,
    UserCog,
    Building2,
    ArrowLeftRight,
    Heart,
    UserCheck,
    Mail,
    Shield,
    Zap,
    Eye,
    Star,
    Bell,
} from 'lucide-react';

/* ── Demo table data ── */
const demoColumns = [
    {
        key: 'name',
        label: 'User',
        sortable: true,
        render: (val, row) => (
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center text-primary text-sm font-semibold">
                    {val.charAt(0)}
                </div>
                <div>
                    <p className="font-medium">{val}</p>
                    <p className="text-xs text-muted">{row.email}</p>
                </div>
            </div>
        ),
    },
    { key: 'role', label: 'Role' },
    {
        key: 'status',
        label: 'Status',
        sortable: true,
        render: (val) => (
            <Badge
                variant={
                    val === 'Active'
                        ? 'success'
                        : val === 'Pending'
                          ? 'warning'
                          : 'danger'
                }
                dot
            >
                {val}
            </Badge>
        ),
    },
    { key: 'lastLogin', label: 'Last Login' },
];

const demoTableData = [
    {
        id: 1,
        name: 'John Carter',
        email: 'john@email.com',
        role: 'Admin',
        status: 'Active',
        lastLogin: '2h ago',
    },
    {
        id: 2,
        name: 'Sarah Wilson',
        email: 'sarah@email.com',
        role: 'Editor',
        status: 'Active',
        lastLogin: '5h ago',
    },
    {
        id: 3,
        name: 'Mike Johnson',
        email: 'mike@email.com',
        role: 'Viewer',
        status: 'Pending',
        lastLogin: '3d ago',
    },
    {
        id: 4,
        name: 'Emily Davis',
        email: 'emily@email.com',
        role: 'Editor',
        status: 'Active',
        lastLogin: '1h ago',
    },
    {
        id: 5,
        name: 'Alex Chen',
        email: 'alex@email.com',
        role: 'Admin',
        status: 'Blocked',
        lastLogin: '1w ago',
    },
];

/* ── Section component ── */
function Section({ title, description, children }) {
    return (
        <div className="space-y-3">
            <div>
                <h2 className="text-lg font-semibold text-white">{title}</h2>
                {description && (
                    <p className="text-sm text-muted mt-0.5">{description}</p>
                )}
            </div>
            {children}
        </div>
    );
}

export default function ComponentShowcase() {
    const [toggle1, setToggle1] = useState(true);
    const [toggle2, setToggle2] = useState(false);
    const [tabValue, setTabValue] = useState('buttons');
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [tableSortBy, setTableSortBy] = useState('name');
    const [tableSortOrder, setTableSortOrder] = useState('asc');
    const [tablePage, setTablePage] = useState(1);

    const handleSort = (field) => {
        if (tableSortBy === field) {
            setTableSortOrder((o) => (o === 'asc' ? 'desc' : 'asc'));
        } else {
            setTableSortBy(field);
            setTableSortOrder('asc');
        }
    };

    return (
        <div className="space-y-10 animate-fade-in pb-10">
            {/* ── Page Header ── */}
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Component Library
                </h1>
                <p className="text-muted mt-1 text-sm">
                    Reusable UI components for the Kovera Admin Dashboard
                </p>
            </div>

            {/* ═══════════ NAVIGATION TABS ═══════════ */}
            <Tabs value={tabValue} onValueChange={setTabValue}>
                <TabsList>
                    <TabsTrigger value="buttons">Buttons</TabsTrigger>
                    <TabsTrigger value="badges">Badges</TabsTrigger>
                    <TabsTrigger value="inputs">Inputs</TabsTrigger>
                    <TabsTrigger value="cards">Cards & KPI</TabsTrigger>
                    <TabsTrigger value="table">DataTable</TabsTrigger>
                    <TabsTrigger value="skeletons">Skeletons</TabsTrigger>
                    <TabsTrigger value="modal">Modal</TabsTrigger>
                    <TabsTrigger value="misc">Misc</TabsTrigger>
                </TabsList>

                {/* ═══════════ BUTTONS ═══════════ */}
                <TabsContent value="buttons">
                    <Section
                        title="Button Variants"
                        description="All available button styles"
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <Button>Primary</Button>
                            <Button variant="secondary">Secondary</Button>
                            <Button variant="outline">Outline</Button>
                            <Button variant="ghost">Ghost</Button>
                            <Button variant="danger">Danger</Button>
                            <Button variant="success">Success</Button>
                            <Button variant="link">Link</Button>
                        </div>
                    </Section>
                    <Section title="Button Sizes">
                        <div className="flex flex-wrap items-center gap-3">
                            <Button size="sm">Small</Button>
                            <Button size="default">Default</Button>
                            <Button size="lg">Large</Button>
                            <Button size="xl">Extra Large</Button>
                            <Button size="icon">
                                <Zap className="w-4 h-4" />
                            </Button>
                            <Button size="icon-sm">
                                <Star className="w-4 h-4" />
                            </Button>
                        </div>
                    </Section>
                    <Section title="Button States">
                        <div className="flex flex-wrap items-center gap-3">
                            <Button loading>Loading</Button>
                            <Button disabled>Disabled</Button>
                            <Button>
                                <Mail className="w-4 h-4" /> With Icon
                            </Button>
                        </div>
                    </Section>
                </TabsContent>

                {/* ═══════════ BADGES ═══════════ */}
                <TabsContent value="badges">
                    <Section
                        title="Badge Variants"
                        description="Status and label badges with semantic colors"
                    >
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge>Default</Badge>
                            <Badge variant="success">Active</Badge>
                            <Badge variant="warning">Pending</Badge>
                            <Badge variant="danger">Error</Badge>
                            <Badge variant="info">Info</Badge>
                            <Badge variant="outline">Outline</Badge>
                            <Badge variant="secondary">Secondary</Badge>
                        </div>
                    </Section>
                    <Section title="Badge with Dot Indicator">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge variant="success" dot>
                                Active
                            </Badge>
                            <Badge variant="warning" dot>
                                Pending
                            </Badge>
                            <Badge variant="danger" dot>
                                Blocked
                            </Badge>
                            <Badge variant="info" dot>
                                Processing
                            </Badge>
                        </div>
                    </Section>
                    <Section title="Badge Sizes">
                        <div className="flex flex-wrap items-center gap-3">
                            <Badge size="sm" variant="success">
                                Small
                            </Badge>
                            <Badge size="md" variant="success">
                                Medium
                            </Badge>
                            <Badge size="lg" variant="success">
                                Large
                            </Badge>
                        </div>
                    </Section>
                </TabsContent>

                {/* ═══════════ INPUTS ═══════════ */}
                <TabsContent value="inputs">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Section
                            title="SearchBar"
                            description="Debounced search with clear button"
                        >
                            <SearchBar
                                value={search}
                                onChange={setSearch}
                                onSearch={(val) =>
                                    console.log('Debounced search:', val)
                                }
                                placeholder="Search anything..."
                                debounce={300}
                            />
                            <p className="text-xs text-muted">
                                Current value: "{search}" (300ms debounce)
                            </p>
                        </Section>
                        <Section title="SearchBar Sizes">
                            <div className="space-y-3">
                                <SearchBar placeholder="Small" size="sm" />
                                <SearchBar
                                    placeholder="Medium (default)"
                                    size="md"
                                />
                                <SearchBar placeholder="Large" size="lg" />
                            </div>
                        </Section>
                        <Section title="Input">
                            <div className="space-y-3">
                                <Input
                                    label="Full Name"
                                    placeholder="Enter name"
                                />
                                <Input
                                    label="Email"
                                    type="email"
                                    placeholder="email@example.com"
                                    icon={Mail}
                                />
                                <Input
                                    label="With Error"
                                    error="This field is required"
                                    placeholder="Required field"
                                />
                            </div>
                        </Section>
                        <Section title="Textarea & Select">
                            <div className="space-y-3">
                                <Textarea
                                    label="Description"
                                    placeholder="Type something..."
                                />
                                <Select label="Role">
                                    <option value="">Select role</option>
                                    <option value="admin">Admin</option>
                                    <option value="editor">Editor</option>
                                </Select>
                            </div>
                        </Section>
                    </div>
                    <Section title="Toggle Switch">
                        <div className="flex flex-wrap items-center gap-6">
                            <Toggle
                                label="Enabled"
                                checked={toggle1}
                                onCheckedChange={setToggle1}
                            />
                            <Toggle
                                label="Disabled"
                                checked={toggle2}
                                onCheckedChange={setToggle2}
                            />
                            <Toggle label="Small" size="sm" checked={true} />
                            <Toggle label="Large" size="lg" checked={true} />
                            <Toggle label="Disabled" disabled checked={false} />
                        </div>
                    </Section>
                </TabsContent>

                {/* ═══════════ CARDS & KPI ═══════════ */}
                <TabsContent value="cards">
                    <Section
                        title="KPI / Stat Cards"
                        description="Dashboard metric cards with trend indicators"
                    >
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <StatCard
                                title="Total Users"
                                value="12,847"
                                change="+5.2%"
                                icon={Users}
                                trend="up"
                                accentColor="blue"
                            />
                            <StatCard
                                title="Total Agents"
                                value="342"
                                change="+8.1%"
                                icon={UserCog}
                                trend="up"
                                accentColor="purple"
                            />
                            <StatCard
                                title="Total Properties"
                                value="6,520"
                                change="+12.4%"
                                icon={Building2}
                                trend="up"
                                accentColor="green"
                            />
                            <StatCard
                                title="Active Trades"
                                value="1,893"
                                change="-2.3%"
                                icon={ArrowLeftRight}
                                trend="down"
                                accentColor="amber"
                            />
                            <StatCard
                                title="Property Likes"
                                value="48.2K"
                                change="+18.7%"
                                icon={Heart}
                                trend="up"
                                accentColor="red"
                            />
                            <StatCard
                                title="Active Users"
                                value="3,421"
                                change="+6.9%"
                                icon={UserCheck}
                                trend="up"
                                accentColor="cyan"
                            />
                        </div>
                    </Section>
                    <Section title="Card Variations">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Default Card</CardTitle>
                                    <CardDescription>
                                        Card with header, content, and footer
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-white">
                                        This is the card body content area.
                                    </p>
                                </CardContent>
                                <CardFooter>
                                    <Button variant="outline" size="sm">
                                        Cancel
                                    </Button>
                                    <Button size="sm">Save</Button>
                                </CardFooter>
                            </Card>
                            <Card glow>
                                <CardHeader>
                                    <CardTitle>Glow Card</CardTitle>
                                    <CardDescription>
                                        With the glow prop enabled
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-white">
                                        This card has a subtle green glow
                                        effect.
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </Section>
                </TabsContent>

                {/* ═══════════ DATATABLE ═══════════ */}
                <TabsContent value="table">
                    <Section
                        title="DataTable"
                        description="Reusable table with sorting, pagination, and custom renderers"
                    >
                        <DataTable
                            columns={demoColumns}
                            data={demoTableData}
                            total={25}
                            page={tablePage}
                            pageSize={5}
                            totalPages={5}
                            onPageChange={setTablePage}
                            sortBy={tableSortBy}
                            sortOrder={tableSortOrder}
                            onSort={handleSort}
                            onRowClick={(row) => alert(`Clicked: ${row.name}`)}
                            emptyIcon={Users}
                        />
                    </Section>
                    <Section title="DataTable — Loading State">
                        <DataTable
                            columns={demoColumns}
                            data={[]}
                            loading
                            total={0}
                        />
                    </Section>
                    <Section title="DataTable — Empty State">
                        <DataTable
                            columns={demoColumns}
                            data={[]}
                            emptyIcon={Users}
                            emptyTitle="No users found"
                            emptyMessage="Try adjusting your search or filters"
                        />
                    </Section>
                </TabsContent>

                {/* ═══════════ SKELETONS ═══════════ */}
                <TabsContent value="skeletons">
                    <Section
                        title="Skeleton Primitives"
                        description="Building blocks for loading states (use instead of spinners)"
                    >
                        <Card>
                            <CardContent className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <SkeletonAvatar size="lg" />
                                    <div className="flex-1 space-y-2">
                                        <Skeleton className="h-4 w-48 rounded" />
                                        <Skeleton className="h-3 w-32 rounded" />
                                    </div>
                                </div>
                                <SkeletonText lines={3} />
                                <div className="flex gap-3">
                                    <Skeleton className="h-9 w-24 rounded-xl" />
                                    <Skeleton className="h-9 w-20 rounded-xl" />
                                </div>
                            </CardContent>
                        </Card>
                    </Section>
                    <Section title="Skeleton Cards (KPI Loading)">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <SkeletonCard />
                            <SkeletonCard />
                            <SkeletonCard />
                        </div>
                    </Section>
                    <Section title="Skeleton Table">
                        <SkeletonTable rows={4} cols={4} />
                    </Section>
                    <Section title="Skeleton Sizes">
                        <div className="flex items-end gap-4">
                            <SkeletonAvatar size="sm" />
                            <SkeletonAvatar size="md" />
                            <SkeletonAvatar size="lg" />
                            <Skeleton className="h-4 w-32 rounded" />
                            <Skeleton className="h-8 w-24 rounded-xl" />
                            <Skeleton className="h-12 w-12 rounded-2xl" />
                        </div>
                    </Section>
                </TabsContent>

                {/* ═══════════ MODAL ═══════════ */}
                <TabsContent value="modal">
                    <Section
                        title="Modal"
                        description="Reusable overlay modal with backdrop blur and ESC to close"
                    >
                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => setModalOpen(true)}>
                                Open Modal
                            </Button>
                        </div>
                        <Modal
                            open={modalOpen}
                            onClose={() => setModalOpen(false)}
                            title="Example Modal"
                            subtitle="This is a reusable modal component"
                            footer={
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => setModalOpen(false)}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => setModalOpen(false)}
                                    >
                                        Confirm
                                    </Button>
                                </>
                            }
                        >
                            <div className="space-y-4">
                                <p className="text-sm text-white">
                                    This modal supports ESC to close, backdrop
                                    click to close, body scroll lock, and 5 size
                                    options (sm, md, lg, xl, full).
                                </p>
                                <Input
                                    label="Example Input"
                                    placeholder="Type here..."
                                />
                                <div className="flex gap-3">
                                    <Badge variant="success" dot>
                                        Active
                                    </Badge>
                                    <Badge variant="warning" dot>
                                        Pending
                                    </Badge>
                                    <Badge variant="danger" dot>
                                        Error
                                    </Badge>
                                </div>
                            </div>
                        </Modal>
                    </Section>
                    <Section title="Modal API">
                        <Card>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-border">
                                                <th className="text-left px-3 py-2 text-xs font-medium text-muted uppercase">
                                                    Prop
                                                </th>
                                                <th className="text-left px-3 py-2 text-xs font-medium text-muted uppercase">
                                                    Type
                                                </th>
                                                <th className="text-left px-3 py-2 text-xs font-medium text-muted uppercase">
                                                    Description
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-muted">
                                            {[
                                                [
                                                    'open',
                                                    'boolean',
                                                    'Controls visibility',
                                                ],
                                                [
                                                    'onClose',
                                                    'function',
                                                    'Called on close',
                                                ],
                                                [
                                                    'size',
                                                    'sm | md | lg | xl | full',
                                                    'Modal width',
                                                ],
                                                [
                                                    'title',
                                                    'string',
                                                    'Header title',
                                                ],
                                                [
                                                    'subtitle',
                                                    'string',
                                                    'Header subtitle',
                                                ],
                                                [
                                                    'footer',
                                                    'ReactNode',
                                                    'Footer content',
                                                ],
                                                [
                                                    'showClose',
                                                    'boolean',
                                                    'Show X button (default true)',
                                                ],
                                            ].map(([prop, type, desc]) => (
                                                <tr
                                                    key={prop}
                                                    className="border-b border-border/50"
                                                >
                                                    <td className="px-3 py-2 font-mono text-primary text-xs">
                                                        {prop}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs">
                                                        {type}
                                                    </td>
                                                    <td className="px-3 py-2 text-xs">
                                                        {desc}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </Section>
                </TabsContent>

                {/* ═══════════ MISC ═══════════ */}
                <TabsContent value="misc">
                    <Section title="Spinner">
                        <div className="flex items-center gap-6">
                            <Spinner size={16} />
                            <Spinner size={24} />
                            <Spinner size={32} />
                            <Spinner size={40} />
                        </div>
                    </Section>
                    <Section title="Tabs">
                        <Tabs defaultValue="tab1">
                            <TabsList>
                                <TabsTrigger value="tab1">
                                    <Zap className="w-4 h-4" /> Tab 1
                                </TabsTrigger>
                                <TabsTrigger value="tab2">
                                    <Shield className="w-4 h-4" /> Tab 2
                                </TabsTrigger>
                                <TabsTrigger value="tab3">
                                    <Bell className="w-4 h-4" /> Tab 3
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="tab1">
                                <p className="text-sm text-muted">
                                    Content for Tab 1
                                </p>
                            </TabsContent>
                            <TabsContent value="tab2">
                                <p className="text-sm text-muted">
                                    Content for Tab 2
                                </p>
                            </TabsContent>
                            <TabsContent value="tab3">
                                <p className="text-sm text-muted">
                                    Content for Tab 3
                                </p>
                            </TabsContent>
                        </Tabs>
                    </Section>
                </TabsContent>
            </Tabs>
        </div>
    );
}
