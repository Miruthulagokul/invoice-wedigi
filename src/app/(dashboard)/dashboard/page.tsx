'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Invoice, DashboardStats } from '@/types/invoice';
import { formatCurrency } from '@/lib/utils';
import {
    IndianRupee,
    Receipt,
    CreditCard,
    Clock,
    FileText,
    ArrowRight,
    AlertTriangle,
    TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';

const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
        draft: 'status-draft',
        sent: 'status-sent',
        paid: 'status-paid',
        partially_paid: 'status-partial',
        overdue: 'status-overdue',
    };

    const labels: Record<string, string> = {
        draft: 'Draft',
        sent: 'Sent',
        paid: 'Paid',
        partially_paid: 'Partial',
        overdue: 'Overdue',
    };

    return (
        <span className={`status-badge ${variants[status] || 'status-draft'}`}>
            {labels[status] || status}
        </span>
    );
};

export default function DashboardPage() {
    const [stats, setStats] = useState<DashboardStats>({
        totalInvoiced: 0,
        totalGST: 0,
        totalPaid: 0,
        pendingAmount: 0,
        currentMonthInvoices: [],
        overdueInvoices: [],
        totalInvoices: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/dashboard/stats');
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Invoiced',
            value: formatCurrency(stats.totalInvoiced),
            icon: Receipt,
            color: 'text-primary',
            bgColor: 'bg-primary/10',
        },
        {
            title: 'GST Collected',
            value: formatCurrency(stats.totalGST),
            icon: TrendingUp,
            color: 'text-secondary',
            bgColor: 'bg-secondary/10',
        },
        {
            title: 'Total Paid',
            value: formatCurrency(stats.totalPaid),
            icon: CreditCard,
            color: 'text-green-600',
            bgColor: 'bg-green-100',
        },
        {
            title: 'Pending Amount',
            value: formatCurrency(stats.pendingAmount),
            icon: Clock,
            color: 'text-yellow-600',
            bgColor: 'bg-yellow-100',
        },
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading dashboard...</div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome back! Here&apos;s your business overview.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {statCards.map((stat) => (
                    <Card key={stat.title} className="border-border">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
                                </div>
                                <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Overdue Invoices */}
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-destructive" />
                                Overdue Invoices
                            </CardTitle>
                            <CardDescription>Invoices that need immediate attention</CardDescription>
                        </div>
                        <Link href="/invoices">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {stats.overdueInvoices.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No overdue invoices</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.overdueInvoices.slice(0, 5).map((invoice: Invoice) => (
                                    <Link
                                        key={invoice._id}
                                        href={`/invoices/${invoice._id}/preview`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{invoice.invoiceNumber}</p>
                                            <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm text-foreground">{formatCurrency(invoice.totalAmount)}</p>
                                            <p className="text-xs text-destructive">
                                                Due: {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Current Month Invoices */}
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between pb-4">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <IndianRupee className="w-5 h-5 text-primary" />
                                This Month
                            </CardTitle>
                            <CardDescription>Invoices created this month</CardDescription>
                        </div>
                        <Link href="/invoices">
                            <Button variant="ghost" size="sm">
                                View All <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {stats.currentMonthInvoices.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No invoices this month</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {stats.currentMonthInvoices.slice(0, 5).map((invoice: Invoice) => (
                                    <Link
                                        key={invoice._id}
                                        href={`/invoices/${invoice._id}/preview`}
                                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <div>
                                            <p className="font-medium text-sm text-foreground">{invoice.invoiceNumber}</p>
                                            <p className="text-xs text-muted-foreground">{invoice.clientName}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium text-sm text-foreground">{formatCurrency(invoice.totalAmount)}</p>
                                            {getStatusBadge(invoice.status)}
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
