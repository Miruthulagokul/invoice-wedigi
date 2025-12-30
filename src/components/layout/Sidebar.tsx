'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
    LayoutDashboard,
    FileText,
    CreditCard,
    LogOut,
    Plus,
    Menu,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Invoices', href: '/invoices', icon: FileText },
    { name: 'Payments', href: '/payments', icon: CreditCard },
];

export function Sidebar() {
    const router = useRouter();
    const pathname = usePathname();
    const [mobileOpen, setMobileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="flex items-center gap-2 px-4 py-6 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
                        <span className="text-primary-foreground font-bold text-lg">W</span>
                    </div>
                    <div>
                        <h1 className="font-bold text-lg text-foreground">WeDigi</h1>
                        <p className="text-xs text-muted-foreground">Invoice Manager</p>
                    </div>
                </div>
            </div>

            {/* New Invoice Button */}
            <div className="p-4">
                <Button
                    onClick={() => {
                        router.push('/invoices/new');
                        setMobileOpen(false);
                    }}
                    className="w-full"
                >
                    <Plus className="w-4 h-4" />
                    New Invoice
                </Button>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-1">
                {navigation.map((item) => {
                    const isActive = pathname === item.href ||
                        (item.href !== '/dashboard' && pathname.startsWith(item.href));

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                                isActive
                                    ? 'bg-accent text-accent-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                            )}
                        >
                            <item.icon className="w-5 h-5" />
                            {item.name}
                        </Link>
                    );
                })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-border">
                <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-muted-foreground hover:text-foreground"
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                </Button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile menu button */}
            <div className="lg:hidden fixed top-4 left-4 z-50">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="bg-card"
                >
                    {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
            </div>

            {/* Mobile sidebar overlay */}
            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-foreground/20 z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Mobile sidebar */}
            <aside className={cn(
                "lg:hidden fixed inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transform transition-transform duration-200 ease-in-out",
                mobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </aside>

            {/* Desktop sidebar */}
            <aside className="hidden lg:flex lg:fixed lg:inset-y-0 lg:left-0 lg:w-64 bg-card border-r border-border flex-col">
                <SidebarContent />
            </aside>
        </>
    );
}
