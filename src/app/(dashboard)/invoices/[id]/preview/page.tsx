'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Invoice, COMPANY_DETAILS } from '@/types/invoice';
import { ArrowLeft, Download, Edit, Printer } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

export default function InvoicePreviewPage() {
    const params = useParams();
    const id = params?.id as string;
    const router = useRouter();
    const { toast } = useToast();
    const invoiceRef = useRef<HTMLDivElement>(null);
    const [invoice, setInvoice] = useState<Invoice | null>(null);
    const [totalPaid, setTotalPaid] = useState(0);
    const [generating, setGenerating] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadInvoice();
        }
    }, [id]);

    const loadInvoice = async () => {
        try {
            const [invoiceRes, paymentsRes] = await Promise.all([
                fetch(`/api/invoices/${id}`),
                fetch(`/api/payments/invoice/${id}`)
            ]);

            if (invoiceRes.ok) {
                const inv = await invoiceRes.json();
                setInvoice(inv);
            } else {
                toast({
                    title: 'Invoice not found',
                    description: 'The invoice you are looking for does not exist.',
                    variant: 'destructive',
                });
                router.push('/invoices');
                return;
            }

            if (paymentsRes.ok) {
                const data = await paymentsRes.json();
                setTotalPaid(data.totalPaid);
            }
        } catch (error) {
            console.error('Error loading invoice:', error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDF = async () => {
        if (!invoiceRef.current || !invoice) return;

        setGenerating(true);
        try {
            const canvas = await html2canvas(invoiceRef.current, {
                scale: 2,
                useCORS: true,
                logging: false,
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
            });

            const imgWidth = 210;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(`${invoice.invoiceNumber}.pdf`);

            toast({
                title: 'PDF Generated',
                description: `Invoice ${invoice.invoiceNumber} has been downloaded.`,
            });
        } catch (error) {
            console.error('PDF generation error:', error);
            toast({
                title: 'Error',
                description: 'Failed to generate PDF. Please try again.',
                variant: 'destructive',
            });
        }
        setGenerating(false);
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-muted-foreground">Loading invoice...</div>
            </div>
        );
    }

    if (!invoice) {
        return null;
    }

    const balance = invoice.totalAmount - totalPaid;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/invoices')}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">{invoice.invoiceNumber}</h1>
                        <p className="text-muted-foreground mt-1">Invoice Preview</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push(`/invoices/${id}/edit`)}>
                        <Edit className="w-4 h-4" />
                        Edit
                    </Button>
                    <Button variant="outline" onClick={handlePrint}>
                        <Printer className="w-4 h-4" />
                        Print
                    </Button>
                    <Button onClick={generatePDF} disabled={generating}>
                        <Download className="w-4 h-4" />
                        {generating ? 'Generating...' : 'Download PDF'}
                    </Button>
                </div>
            </div>

            {/* Invoice Preview */}
            <Card className="border-border overflow-hidden">
                <div
                    ref={invoiceRef}
                    className="invoice-pdf bg-white p-0"
                    style={{ minHeight: '1100px' }}
                >
                    {/* Header with orange stripe */}
                    <div className="relative">
                        <div className="absolute top-0 right-0 w-1/3 h-32" style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)' }}></div>
                        <div className="relative z-10 px-8 py-6 flex justify-between items-start">
                            {/* Logo */}
                            <div>
                                <div className="flex items-center gap-2 mb-4">
                                    <span className="text-3xl font-bold" style={{ color: '#f97316' }}>WeDigi</span>
                                </div>
                                <div className="text-sm text-gray-600 space-y-0.5">
                                    <p className="font-medium text-gray-800">From :</p>
                                    <p>{COMPANY_DETAILS.name},</p>
                                    <p>{COMPANY_DETAILS.address},</p>
                                    <p>{COMPANY_DETAILS.city}, {COMPANY_DETAILS.state}, {COMPANY_DETAILS.pincode}.</p>
                                    <p>GSTIN : {COMPANY_DETAILS.gstin}</p>
                                </div>
                            </div>

                            {/* Invoice Title */}
                            <div className="text-right pr-4 pt-2">
                                <h1 className="text-4xl font-bold text-white mb-6">INVOICE</h1>
                                <div className="text-sm space-y-1 text-gray-700">
                                    <p className="font-medium">Invoice Number</p>
                                    <p className="text-lg font-bold" style={{ color: '#f97316' }}>{invoice.invoiceNumber}</p>
                                    <p className="font-medium mt-2">{format(new Date(invoice.invoiceDate), 'd MMM yyyy').toUpperCase()}</p>
                                    <p>SAC : {invoice.sacCode}</p>
                                    {invoice.poNumber && <p>Purchase Order No : {invoice.poNumber}</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bill To */}
                    <div className="px-8 py-4">
                        <div className="text-sm text-gray-600 space-y-0.5">
                            <p className="font-medium text-gray-800">Bill To :</p>
                            <p className="font-semibold text-gray-800">{invoice.clientName}</p>
                            {invoice.clientAddress && <p>{invoice.clientAddress}</p>}
                            <p>{invoice.clientState}</p>
                            {invoice.clientGST && <p>GSTIN: {invoice.clientGST}</p>}
                        </div>
                    </div>

                    {/* Items Table */}
                    <div className="px-8 py-4">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr style={{ backgroundColor: '#f3f4f6' }}>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b border-gray-200">Sl No</th>
                                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 border-b border-gray-200">Service Provided</th>
                                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 border-b border-gray-200">Price</th>
                                </tr>
                            </thead>
                            <tbody>
                                {invoice.items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-100">
                                        <td className="py-3 px-4 text-sm text-gray-600">{index + 1}</td>
                                        <td className="py-3 px-4 text-sm text-gray-800">{item.description}</td>
                                        <td className="py-3 px-4 text-sm text-gray-800 text-right">{formatCurrency(item.amount)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Totals */}
                    <div className="px-8 py-4 flex justify-end">
                        <div className="w-72 space-y-2 text-sm">
                            <div className="flex justify-between py-1">
                                <span className="text-gray-600">Sub Total :</span>
                                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                            </div>
                            {invoice.gstType === 'CGST_SGST' ? (
                                <>
                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-600">SGST9 (9%) :</span>
                                        <span>{formatCurrency(invoice.sgstAmount)}</span>
                                    </div>
                                    <div className="flex justify-between py-1">
                                        <span className="text-gray-600">CGST9 (9%) :</span>
                                        <span>{formatCurrency(invoice.cgstAmount)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="flex justify-between py-1">
                                    <span className="text-gray-600">IGST (18%) :</span>
                                    <span>{formatCurrency(invoice.igstAmount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between py-2 border-t border-gray-200 font-bold text-base">
                                <span>Total :</span>
                                <span style={{ color: '#f97316' }}>{formatCurrency(invoice.totalAmount)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="px-8 py-4">
                        <p className="text-sm font-medium text-gray-800 mb-2">Notes:</p>
                        <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
                            {invoice.notes ? (
                                invoice.notes.split('\n').map((note, i) => <li key={i}>{note}</li>)
                            ) : (
                                <>
                                    <li>Payment is due within 7 days from the invoice date.</li>
                                    <li>Kindly share payment confirmation once completed.</li>
                                    <li>For any clarifications, contact {COMPANY_DETAILS.email} or {COMPANY_DETAILS.phone}.</li>
                                    <li>This is a computer-generated invoice and does not require a physical signature.</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Bank Details & Signature */}
                    <div className="px-8 py-4 flex justify-between items-end mt-4">
                        {/* Bank Details */}
                        <div className="p-4 rounded-lg text-white text-sm" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)', minWidth: '280px' }}>
                            <p className="font-bold mb-2">Bank Details</p>
                            <p>Account Name: {COMPANY_DETAILS.accountName}</p>
                            <p>Account Number: {COMPANY_DETAILS.accountNumber}</p>
                            <p>IFSC Code: {COMPANY_DETAILS.ifscCode}</p>
                            <p>{COMPANY_DETAILS.bankName}, {COMPANY_DETAILS.branch}</p>
                        </div>

                        {/* Signature */}
                        <div className="text-right">
                            <p className="text-sm text-gray-600 mb-8">For {COMPANY_DETAILS.name.toUpperCase()}</p>
                            <div className="border-t border-gray-300 pt-2">
                                <p className="font-bold text-gray-800">PROPRIETOR</p>
                                <p className="text-sm text-gray-600 mt-2">Name: <span className="text-gray-800">{COMPANY_DETAILS.proprietorName}</span></p>
                                <p className="text-sm text-gray-600">Designation: <span className="text-gray-800">{COMPANY_DETAILS.designation}</span></p>
                                <p className="text-sm text-gray-600">Company: <span className="text-gray-800">WeDigiStudio</span></p>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-8 flex">
                        <div className="flex-1 p-4 text-white text-xs flex items-center gap-6" style={{ background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 100%)' }}>
                            <span>{COMPANY_DETAILS.phone}</span>
                            <span>{COMPANY_DETAILS.website}</span>
                            <span>{COMPANY_DETAILS.email}</span>
                        </div>
                        <div className="p-4 text-white text-right" style={{ background: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)', minWidth: '200px' }}>
                            <p className="text-xl font-bold">THANKYOU</p>
                            <p className="text-sm">for choosing WeDigi</p>
                        </div>
                    </div>
                </div>
            </Card>

            {/* Payment Status */}
            {totalPaid > 0 && (
                <Card className="border-border p-4 no-print">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-sm text-muted-foreground">Payment Status</p>
                            <p className="font-medium">
                                Paid: {formatCurrency(totalPaid)} / {formatCurrency(invoice.totalAmount)}
                            </p>
                        </div>
                        {balance > 0 && (
                            <div className="text-right">
                                <p className="text-sm text-muted-foreground">Balance Due</p>
                                <p className="font-bold text-destructive">{formatCurrency(balance)}</p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
