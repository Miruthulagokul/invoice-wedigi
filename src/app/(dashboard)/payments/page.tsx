'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Invoice, Payment, PaymentMode } from '@/types/invoice';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Plus, CreditCard, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [invoiceMap, setInvoiceMap] = useState<Map<string, Invoice>>(new Map());
    const [searchQuery, setSearchQuery] = useState('');
    const [dialogOpen, setDialogOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        invoiceId: '',
        paymentDate: new Date().toISOString().split('T')[0],
        amountPaid: '',
        mode: 'UPI' as PaymentMode,
        referenceId: '',
    });
    const { toast } = useToast();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [paymentsRes, invoicesRes] = await Promise.all([
                fetch('/api/payments'),
                fetch('/api/invoices')
            ]);

            if (paymentsRes.ok) {
                const paymentsData = await paymentsRes.json();
                setPayments(paymentsData);
            }

            if (invoicesRes.ok) {
                const invoicesData = await invoicesRes.json();
                const unpaidInvoices = invoicesData.filter((inv: Invoice) => inv.status !== 'paid');
                setInvoices(unpaidInvoices);

                // Create a map for quick lookup
                const map = new Map<string, Invoice>();
                invoicesData.forEach((inv: Invoice) => map.set(inv._id!, inv));
                setInvoiceMap(map);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredPayments = payments.filter(payment => {
        const invoice = invoiceMap.get(payment.invoiceId);
        if (!invoice) return false;

        const query = searchQuery.toLowerCase();
        return (
            invoice.invoiceNumber.toLowerCase().includes(query) ||
            invoice.clientName.toLowerCase().includes(query) ||
            payment.referenceId?.toLowerCase().includes(query)
        );
    });

    const getInvoiceBalance = async (invoiceId: string): Promise<number> => {
        const invoice = invoiceMap.get(invoiceId);
        if (!invoice) return 0;

        try {
            const res = await fetch(`/api/payments/invoice/${invoiceId}`);
            if (res.ok) {
                const data = await res.json();
                return invoice.totalAmount - data.totalPaid;
            }
        } catch (error) {
            console.error('Error getting balance:', error);
        }
        return invoice.totalAmount;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.invoiceId) {
            toast({ title: 'Error', description: 'Please select an invoice', variant: 'destructive' });
            return;
        }

        const amount = parseFloat(formData.amountPaid);
        if (isNaN(amount) || amount <= 0) {
            toast({ title: 'Error', description: 'Please enter a valid amount', variant: 'destructive' });
            return;
        }

        const balance = await getInvoiceBalance(formData.invoiceId);
        if (amount > balance) {
            toast({
                title: 'Error',
                description: `Amount exceeds balance due (${formatCurrency(balance)})`,
                variant: 'destructive'
            });
            return;
        }

        try {
            const res = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    invoiceId: formData.invoiceId,
                    paymentDate: formData.paymentDate,
                    amountPaid: amount,
                    mode: formData.mode,
                    referenceId: formData.referenceId || undefined,
                }),
            });

            if (res.ok) {
                toast({
                    title: 'Payment recorded',
                    description: `Payment of ${formatCurrency(amount)} has been recorded.`,
                });

                setFormData({
                    invoiceId: '',
                    paymentDate: new Date().toISOString().split('T')[0],
                    amountPaid: '',
                    mode: 'UPI',
                    referenceId: '',
                });
                setDialogOpen(false);
                loadData();
            } else {
                throw new Error('Failed to create payment');
            }
        } catch (error) {
            console.error('Error creating payment:', error);
            toast({
                title: 'Error',
                description: 'Failed to record payment. Please try again.',
                variant: 'destructive',
            });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading payments...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Payments</h1>
                    <p className="text-muted-foreground mt-1">Track and record invoice payments</p>
                </div>
                <Button onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4" />
                    Record Payment
                </Button>
            </div>

            {/* Search */}
            <Card className="border-border">
                <CardContent className="p-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by invoice number, client, or reference..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Payments List */}
            <Card className="border-border">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Payment History</CardTitle>
                    <CardDescription>
                        {filteredPayments.length} payment{filteredPayments.length !== 1 ? 's' : ''} recorded
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredPayments.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                            <p className="text-lg font-medium">No payments found</p>
                            <p className="text-sm mt-1">Record your first payment to get started</p>
                            <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                                <Plus className="w-4 h-4" />
                                Record Payment
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
                                        <th className="table-header text-left py-3 px-4 hidden lg:table-cell">Mode</th>
                                        <th className="table-header text-left py-3 px-4 hidden lg:table-cell">Reference</th>
                                        <th className="table-header text-right py-3 px-4">Amount</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((payment) => {
                                        const invoice = invoiceMap.get(payment.invoiceId);
                                        if (!invoice) return null;

                                        return (
                                            <tr
                                                key={payment._id}
                                                className="border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
                                            >
                                                <td className="py-4 px-4">
                                                    <span className="font-medium text-primary">{invoice.invoiceNumber}</span>
                                                </td>
                                                <td className="py-4 px-4 text-foreground">{invoice.clientName}</td>
                                                <td className="py-4 px-4 hidden md:table-cell text-muted-foreground">
                                                    {format(new Date(payment.paymentDate), 'dd MMM yyyy')}
                                                </td>
                                                <td className="py-4 px-4 hidden lg:table-cell">
                                                    <span className="status-badge bg-muted text-muted-foreground">
                                                        {payment.mode}
                                                    </span>
                                                </td>
                                                <td className="py-4 px-4 hidden lg:table-cell text-muted-foreground">
                                                    {payment.referenceId || '-'}
                                                </td>
                                                <td className="py-4 px-4 text-right font-medium text-green-600">
                                                    +{formatCurrency(payment.amountPaid)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Record Payment Dialog */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Record Payment</DialogTitle>
                        <DialogDescription>
                            Record a payment against an existing invoice
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceId">Invoice *</Label>
                            <Select
                                value={formData.invoiceId}
                                onValueChange={(v) => setFormData(prev => ({ ...prev, invoiceId: v }))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select invoice" />
                                </SelectTrigger>
                                <SelectContent>
                                    {invoices.map((invoice) => (
                                        <SelectItem key={invoice._id} value={invoice._id!}>
                                            {invoice.invoiceNumber} - {invoice.clientName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="amountPaid">Amount (₹) *</Label>
                                <Input
                                    id="amountPaid"
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.amountPaid}
                                    onChange={(e) => setFormData(prev => ({ ...prev, amountPaid: e.target.value }))}
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="paymentDate">Date *</Label>
                                <Input
                                    id="paymentDate"
                                    type="date"
                                    value={formData.paymentDate}
                                    onChange={(e) => setFormData(prev => ({ ...prev, paymentDate: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="mode">Payment Mode</Label>
                                <Select
                                    value={formData.mode}
                                    onValueChange={(v: PaymentMode) => setFormData(prev => ({ ...prev, mode: v }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Bank">Bank Transfer</SelectItem>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="referenceId">Reference ID</Label>
                                <Input
                                    id="referenceId"
                                    value={formData.referenceId}
                                    onChange={(e) => setFormData(prev => ({ ...prev, referenceId: e.target.value }))}
                                    placeholder="Transaction ID"
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                                Cancel
                            </Button>
                            <Button type="submit">Record Payment</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
