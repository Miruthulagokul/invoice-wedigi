'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    InvoiceItem,
    InvoiceStatus,
    GSTType,
    COMPANY_DETAILS,
    INDIAN_STATES
} from '@/types/invoice';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Save, ArrowLeft } from 'lucide-react';
import { generateId } from '@/lib/utils';

const defaultItem = (): InvoiceItem => ({
    id: generateId(),
    description: '',
    quantity: 1,
    rate: 0,
    amount: 0,
});

export default function InvoiceFormPage() {
    const params = useParams();
    const id = params?.id as string | undefined;
    const router = useRouter();
    const { toast } = useToast();
    const isEditing = !!id;

    const [formData, setFormData] = useState({
        clientName: '',
        clientAddress: '',
        clientGST: '',
        clientState: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        poNumber: '',
        sacCode: '998313',
        status: 'draft' as InvoiceStatus,
        notes: '',
    });

    const [items, setItems] = useState<InvoiceItem[]>([defaultItem()]);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);

    useEffect(() => {
        if (isEditing && id) {
            loadInvoice();
        }
    }, [id, isEditing]);

    const loadInvoice = async () => {
        try {
            const res = await fetch(`/api/invoices/${id}`);
            if (res.ok) {
                const invoice = await res.json();
                setFormData({
                    clientName: invoice.clientName,
                    clientAddress: invoice.clientAddress || '',
                    clientGST: invoice.clientGST || '',
                    clientState: invoice.clientState,
                    invoiceNumber: invoice.invoiceNumber,
                    invoiceDate: invoice.invoiceDate,
                    dueDate: invoice.dueDate,
                    poNumber: invoice.poNumber || '',
                    sacCode: invoice.sacCode,
                    status: invoice.status,
                    notes: invoice.notes || '',
                });
                setItems(invoice.items);
            } else {
                toast({
                    title: 'Invoice not found',
                    description: 'The invoice you are trying to edit does not exist.',
                    variant: 'destructive',
                });
                router.push('/invoices');
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (name: string, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleItemChange = (index: number, field: keyof InvoiceItem, value: string | number) => {
        const newItems = [...items];
        newItems[index] = { ...newItems[index], [field]: value };

        // Recalculate amount
        if (field === 'quantity' || field === 'rate') {
            newItems[index].amount = newItems[index].quantity * newItems[index].rate;
        }

        setItems(newItems);
    };

    const addItem = () => {
        setItems([...items, defaultItem()]);
    };

    const removeItem = (index: number) => {
        if (items.length > 1) {
            setItems(items.filter((_, i) => i !== index));
        }
    };

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const isSameState = formData.clientState === COMPANY_DETAILS.state;
    const gstType: GSTType = isSameState ? 'CGST_SGST' : 'IGST';

    const cgstAmount = isSameState ? subtotal * 0.09 : 0;
    const sgstAmount = isSameState ? subtotal * 0.09 : 0;
    const igstAmount = !isSameState ? subtotal * 0.18 : 0;
    const gstAmount = cgstAmount + sgstAmount + igstAmount;
    const totalAmount = subtotal + gstAmount;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Validation
        if (!formData.clientName.trim()) {
            toast({ title: 'Error', description: 'Client name is required', variant: 'destructive' });
            setLoading(false);
            return;
        }

        if (!formData.clientState) {
            toast({ title: 'Error', description: 'Client state is required for GST calculation', variant: 'destructive' });
            setLoading(false);
            return;
        }

        if (items.some(item => !item.description.trim() || item.rate <= 0)) {
            toast({ title: 'Error', description: 'All items must have description and valid rate', variant: 'destructive' });
            setLoading(false);
            return;
        }

        const invoiceData = {
            clientName: formData.clientName,
            clientAddress: formData.clientAddress,
            clientGST: formData.clientGST || undefined,
            clientState: formData.clientState,
            invoiceNumber: formData.invoiceNumber,
            invoiceDate: formData.invoiceDate,
            dueDate: formData.dueDate,
            poNumber: formData.poNumber || undefined,
            sacCode: formData.sacCode,
            items,
            subtotal,
            gstType,
            cgstAmount,
            sgstAmount,
            igstAmount,
            gstAmount,
            totalAmount,
            status: formData.status,
            notes: formData.notes || undefined,
        };

        try {
            const url = isEditing ? `/api/invoices/${id}` : '/api/invoices';
            const method = isEditing ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(invoiceData),
            });

            if (res.ok) {
                const invoice = await res.json();
                toast({
                    title: isEditing ? 'Invoice updated' : 'Invoice created',
                    description: `Invoice ${invoice.invoiceNumber} has been ${isEditing ? 'updated' : 'created'} successfully.`,
                });
                router.push(`/invoices/${invoice._id}/preview`);
            } else {
                throw new Error('Failed to save invoice');
            }
        } catch (error) {
            console.error('Error saving invoice:', error);
            toast({
                title: 'Error',
                description: 'Failed to save invoice. Please try again.',
                variant: 'destructive',
            });
        }

        setLoading(false);
    };

    if (initialLoading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading invoice...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in max-w-4xl">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        {isEditing ? 'Edit Invoice' : 'New Invoice'}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {isEditing ? `Editing ${formData.invoiceNumber}` : 'Create a new GST-compliant invoice'}
                    </p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Invoice Details */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Invoice Details</CardTitle>
                        <CardDescription>Basic information about the invoice</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label htmlFor="invoiceNumber">Invoice Number</Label>
                            <Input
                                id="invoiceNumber"
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                onChange={handleInputChange}
                                readOnly
                                placeholder="Auto-generated"
                                className="bg-muted"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="invoiceDate">Invoice Date</Label>
                            <Input
                                id="invoiceDate"
                                name="invoiceDate"
                                type="date"
                                value={formData.invoiceDate}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                name="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select value={formData.status} onValueChange={(v) => handleSelectChange('status', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="draft">Draft</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="partially_paid">Partially Paid</SelectItem>
                                    <SelectItem value="paid">Paid</SelectItem>
                                    <SelectItem value="overdue">Overdue</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="sacCode">SAC Code</Label>
                            <Input
                                id="sacCode"
                                name="sacCode"
                                value={formData.sacCode}
                                onChange={handleInputChange}
                                placeholder="998313"
                            />
                        </div>
                        <div className="space-y-2 sm:col-span-2 lg:col-span-3">
                            <Label htmlFor="poNumber">Purchase Order Number (Optional)</Label>
                            <Input
                                id="poNumber"
                                name="poNumber"
                                value={formData.poNumber}
                                onChange={handleInputChange}
                                placeholder="PO Number"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Client Details */}
                <Card className="border-border">
                    <CardHeader>
                        <CardTitle>Bill To</CardTitle>
                        <CardDescription>Client information for the invoice</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="clientName">Client Name *</Label>
                            <Input
                                id="clientName"
                                name="clientName"
                                value={formData.clientName}
                                onChange={handleInputChange}
                                placeholder="Client company name"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientState">Client State *</Label>
                            <Select value={formData.clientState} onValueChange={(v) => handleSelectChange('clientState', v)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select state" />
                                </SelectTrigger>
                                <SelectContent>
                                    {INDIAN_STATES.map((state) => (
                                        <SelectItem key={state} value={state}>
                                            {state}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                            <Label htmlFor="clientAddress">Client Address</Label>
                            <Textarea
                                id="clientAddress"
                                name="clientAddress"
                                value={formData.clientAddress}
                                onChange={handleInputChange}
                                placeholder="Full address"
                                rows={2}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="clientGST">Client GSTIN (Optional)</Label>
                            <Input
                                id="clientGST"
                                name="clientGST"
                                value={formData.clientGST}
                                onChange={handleInputChange}
                                placeholder="GSTIN"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Line Items */}
                <Card className="border-border">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Line Items</CardTitle>
                            <CardDescription>Services or products included in this invoice</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={addItem}>
                            <Plus className="w-4 h-4" />
                            Add Item
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {/* Header */}
                            <div className="hidden sm:grid sm:grid-cols-12 gap-4 text-sm font-medium text-muted-foreground pb-2 border-b border-border">
                                <div className="col-span-5">Description</div>
                                <div className="col-span-2 text-center">Qty</div>
                                <div className="col-span-2 text-right">Rate</div>
                                <div className="col-span-2 text-right">Amount</div>
                                <div className="col-span-1"></div>
                            </div>

                            {/* Items */}
                            {items.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start p-4 sm:p-0 bg-muted/50 sm:bg-transparent rounded-lg sm:rounded-none">
                                    <div className="sm:col-span-5 space-y-1">
                                        <Label className="sm:hidden">Description</Label>
                                        <Input
                                            value={item.description}
                                            onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                                            placeholder="Service description"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label className="sm:hidden">Quantity</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                                            className="text-center"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 space-y-1">
                                        <Label className="sm:hidden">Rate (₹)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            value={item.rate}
                                            onChange={(e) => handleItemChange(index, 'rate', parseFloat(e.target.value) || 0)}
                                            className="text-right"
                                        />
                                    </div>
                                    <div className="sm:col-span-2 flex items-center justify-end">
                                        <span className="sm:hidden mr-2 text-sm text-muted-foreground">Amount:</span>
                                        <span className="font-medium">₹{item.amount.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="sm:col-span-1 flex justify-end">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => removeItem(index)}
                                            disabled={items.length === 1}
                                            className="text-muted-foreground hover:text-destructive"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Totals & Notes */}
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Notes */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle>Notes</CardTitle>
                            <CardDescription>Additional notes for this invoice</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                name="notes"
                                value={formData.notes}
                                onChange={handleInputChange}
                                placeholder="Payment terms, additional notes..."
                                rows={4}
                            />
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card className="border-border">
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>
                                GST Type: {gstType === 'CGST_SGST' ? 'CGST + SGST (Same State)' : 'IGST (Inter-State)'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                                </div>
                                {gstType === 'CGST_SGST' ? (
                                    <>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">CGST (9%)</span>
                                            <span>₹{cgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-muted-foreground">SGST (9%)</span>
                                            <span>₹{sgstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">IGST (18%)</span>
                                        <span>₹{igstAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                                    </div>
                                )}
                                <div className="border-t border-border pt-3">
                                    <div className="flex justify-between">
                                        <span className="font-semibold text-foreground">Total Amount</span>
                                        <span className="text-xl font-bold text-primary">
                                            ₹{totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                    <Button type="button" variant="outline" onClick={() => router.push('/invoices')}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        <Save className="w-4 h-4" />
                        {loading ? 'Saving...' : (isEditing ? 'Update Invoice' : 'Create Invoice')}
                    </Button>
                </div>
            </form>
        </div>
    );
}
