'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Invoice } from '@/types/invoice';
import { formatCurrency } from '@/lib/utils';
import {
    Plus,
    Search,
    FileText,
    Edit,
    Trash2,
    Eye,
    MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

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

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { toast } = useToast();

    useEffect(() => {
        loadInvoices();
    }, []);

    useEffect(() => {
        filterInvoices();
    }, [invoices, searchQuery, statusFilter]);

    const loadInvoices = async () => {
        try {
            const res = await fetch('/api/invoices');
            const data = await res.json();
            setInvoices(data);
        } catch (error) {
            console.error('Error loading invoices:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterInvoices = () => {
        let filtered = [...invoices];

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                inv =>
                    inv.invoiceNumber.toLowerCase().includes(query) ||
                    inv.clientName.toLowerCase().includes(query)
            );
        }

        if (statusFilter !== 'all') {
            filtered = filtered.filter(inv => inv.status === statusFilter);
        }

        setFilteredInvoices(filtered);
    };

    const handleDelete = (id: string) => {
        setInvoiceToDelete(id);
        setDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (invoiceToDelete) {
            try {
                await fetch(`/api/invoices/${invoiceToDelete}`, { method: 'DELETE' });
                loadInvoices();
                toast({
                    title: 'Invoice deleted',
                    description: 'The invoice has been permanently deleted.',
                });
            } catch (error) {
                console.error('Error deleting invoice:', error);
                toast({
                    title: 'Error',
                    description: 'Failed to delete invoice.',
                    variant: 'destructive',
                });
            }
        }
        setDeleteDialogOpen(false);
        setInvoiceToDelete(null);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading invoices...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
                    <p className="text-muted-foreground mt-1">Manage your invoices and billing</p>
                </div>
                <Button onClick={() => router.push('/invoices/new')}>
                    <Plus className="w-4 h-4" />
                    New Invoice
                </Button>
            </div>

            {/* Filters */}
            <Card className="border-border">
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by invoice number or client..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="draft">Draft</SelectItem>
                                <SelectItem value="sent">Sent</SelectItem>
                                <SelectItem value="partially_paid">Partial</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Invoice List */}
            <Card className="border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">All Invoices</CardTitle>
                    <CardDescription>
                        {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredInvoices.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No invoices found</p>
                            <p className="text-sm mt-1">Create your first invoice to get started</p>
                            <Button className="mt-4" onClick={() => router.push('/invoices/new')}>
                                <Plus className="w-4 h-4" />
                                Create Invoice
                            </Button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="table-header text-left py-3 px-4">Invoice</th>
                                        <th className="table-header text-left py-3 px-4">Client</th>
                                        <th className="table-header text-left py-3 px-4 hidden md:table-cell">Date</th>
                                        <th className="table-header text-left py-3 px-4 hidden lg:table-cell">Due Date</th>
                                        <th className="table-header text-right py-3 px-4">Amount</th>
                                        <th className="table-header text-center py-3 px-4">Status</th>
                                        <th className="table-header text-right py-3 px-4">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredInvoices.map((invoice) => (
                                        <tr
                                            key={invoice._id}
                                            className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                        >
                                            <td className="py-4 px-4">
                                                <Link
                                                    href={`/invoices/${invoice._id}/preview`}
                                                    className="font-medium text-primary hover:underline"
                                                >
                                                    {invoice.invoiceNumber}
                                                </Link>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div>
                                                    <p className="font-medium text-foreground">{invoice.clientName}</p>
                                                    <p className="text-xs text-muted-foreground">{invoice.clientState}</p>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 hidden md:table-cell text-muted-foreground">
                                                {format(new Date(invoice.invoiceDate), 'dd MMM yyyy')}
                                            </td>
                                            <td className="py-4 px-4 hidden lg:table-cell text-muted-foreground">
                                                {format(new Date(invoice.dueDate), 'dd MMM yyyy')}
                                            </td>
                                            <td className="py-4 px-4 text-right font-medium text-foreground">
                                                {formatCurrency(invoice.totalAmount)}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                {getStatusBadge(invoice.status)}
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice._id}/preview`)}>
                                                            <Eye className="w-4 h-4 mr-2" />
                                                            View
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => router.push(`/invoices/${invoice._id}/edit`)}>
                                                            <Edit className="w-4 h-4 mr-2" />
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            onClick={() => handleDelete(invoice._id!)}
                                                            className="text-destructive focus:text-destructive"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete this invoice? This action cannot be undone and will also delete all related payments.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
