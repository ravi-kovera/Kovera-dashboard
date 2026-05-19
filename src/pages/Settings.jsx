import { useState } from 'react';
import {
    Settings as SettingsIcon,
    User,
    Bell,
    Shield,
    Palette,
    Sun,
    Moon,
} from 'lucide-react';
import {
    Button,
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    Input,
    Toggle,
    Tabs,
    TabsList,
    TabsTrigger,
    TabsContent,
} from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsPage() {
    const { user } = useAuth();
    const [emailNotif, setEmailNotif] = useState(true);
    const [pushNotif, setPushNotif] = useState(false);
    const [twoFactor, setTwoFactor] = useState(true);
    const [activeTab, setActiveTab] = useState('profile');
    const { theme, setDark, setLight } = useTheme();

    return (
        <div className="space-y-6 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Settings
                </h1>
                <p className="text-muted mt-1 text-sm">
                    Manage your account and preferences
                </p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                    <TabsTrigger value="profile">
                        <User className="w-4 h-4" /> Profile
                    </TabsTrigger>
                    <TabsTrigger value="notifications">
                        <Bell className="w-4 h-4" /> Notifications
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="w-4 h-4" /> Security
                    </TabsTrigger>
                    <TabsTrigger value="appearance">
                        <Palette className="w-4 h-4" /> Appearance
                    </TabsTrigger>
                </TabsList>

                {/* Profile */}
                <TabsContent value="profile">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>
                                Update your personal details
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-lg">
                            <Input
                                label="Full Name"
                                defaultValue={user?.displayName ?? ''}
                                placeholder="Your name"
                            />
                            <Input
                                label="Email Address"
                                defaultValue={user?.email ?? ''}
                                placeholder="you@example.com"
                                type="email"
                                readOnly
                            />
                            <Button>Save Changes</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Notifications */}
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>
                                Choose what you want to be notified about
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-lg">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-border">
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Email Notifications
                                    </p>
                                    <p className="text-xs text-muted mt-0.5">
                                        Receive alerts via email
                                    </p>
                                </div>
                                <Toggle
                                    checked={emailNotif}
                                    onCheckedChange={setEmailNotif}
                                />
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-border">
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Push Notifications
                                    </p>
                                    <p className="text-xs text-muted mt-0.5">
                                        Receive browser push alerts
                                    </p>
                                </div>
                                <Toggle
                                    checked={pushNotif}
                                    onCheckedChange={setPushNotif}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Security */}
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>
                                Protect your account
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 max-w-lg">
                            <div className="flex items-center justify-between p-3 rounded-xl bg-navy-900 border border-border">
                                <div>
                                    <p className="text-sm font-medium text-white">
                                        Two-Factor Authentication
                                    </p>
                                    <p className="text-xs text-muted mt-0.5">
                                        Add an extra layer of security
                                    </p>
                                </div>
                                <Toggle
                                    checked={twoFactor}
                                    onCheckedChange={setTwoFactor}
                                />
                            </div>
                            <Input
                                label="Current Password"
                                type="password"
                                placeholder="Enter current password"
                            />
                            <Input
                                label="New Password"
                                type="password"
                                placeholder="Enter new password"
                            />
                            <Button>Update Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Appearance */}
                <TabsContent value="appearance">
                    <Card>
                        <CardHeader>
                            <CardTitle>Appearance</CardTitle>
                            <CardDescription>
                                Customize the look and feel
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div>
                                <p className="text-sm font-medium text-white mb-3">
                                    Theme
                                </p>
                                <div className="flex items-center gap-4">
                                    {/* Dark */}
                                    <button
                                        onClick={setDark}
                                        className={`relative w-28 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            theme === 'dark'
                                                ? 'border-primary bg-navy-950 shadow-lg shadow-primary/10'
                                                : 'border-border bg-navy-900 hover:border-border-light opacity-60 hover:opacity-80'
                                        }`}
                                    >
                                        <Moon
                                            className={`w-5 h-5 ${theme === 'dark' ? 'text-primary' : 'text-muted'}`}
                                        />
                                        <span
                                            className={`text-xs font-medium ${theme === 'dark' ? 'text-primary' : 'text-muted'}`}
                                        >
                                            Dark
                                        </span>
                                        {theme === 'dark' && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={3}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M4.5 12.75l6 6 9-13.5"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </button>

                                    {/* Light */}
                                    <button
                                        onClick={setLight}
                                        className={`relative w-28 h-20 rounded-xl border-2 flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                            theme === 'light'
                                                ? 'border-primary bg-white shadow-lg shadow-primary/10'
                                                : 'border-border bg-slate-100 hover:border-border-light opacity-60 hover:opacity-80'
                                        }`}
                                    >
                                        <Sun
                                            className={`w-5 h-5 ${theme === 'light' ? 'text-primary' : 'text-slate-500'}`}
                                        />
                                        <span
                                            className={`text-xs font-medium ${theme === 'light' ? 'text-primary' : 'text-slate-500'}`}
                                        >
                                            Light
                                        </span>
                                        {theme === 'light' && (
                                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                                                <svg
                                                    className="w-3 h-3 text-white"
                                                    fill="none"
                                                    viewBox="0 0 24 24"
                                                    strokeWidth={3}
                                                    stroke="currentColor"
                                                >
                                                    <path
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        d="M4.5 12.75l6 6 9-13.5"
                                                    />
                                                </svg>
                                            </div>
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-navy-900 border border-border">
                                <p className="text-xs text-muted">
                                    Your theme preference is saved automatically
                                    and persists across sessions.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
