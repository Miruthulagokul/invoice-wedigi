import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/lib/models/Invoice';
import Payment from '@/lib/models/Payment';

// GET dashboard stats
export async function GET() {
    try {
        await dbConnect();

        const invoices = await Invoice.find();
        const payments = await Payment.find();

        const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const totalGST = invoices.reduce((sum, inv) => sum + inv.gstAmount, 0);
        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);
        const pendingAmount = totalInvoiced - totalPaid;

        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();

        const currentMonthInvoices = invoices.filter(inv => {
            const invDate = new Date(inv.invoiceDate);
            return invDate.getMonth() === currentMonth && invDate.getFullYear() === currentYear;
        });

        const now = new Date();
        const overdueInvoices = invoices.filter(inv => {
            const dueDate = new Date(inv.dueDate);
            return now > dueDate && inv.status !== 'paid';
        });

        // Update overdue status for invoices
        for (const inv of overdueInvoices) {
            if (inv.status !== 'overdue' && inv.status !== 'paid' && inv.status !== 'partially_paid') {
                inv.status = 'overdue';
                inv.updatedAt = new Date().toISOString();
                await inv.save();
            }
        }

        return NextResponse.json({
            totalInvoiced,
            totalGST,
            totalPaid,
            pendingAmount,
            currentMonthInvoices,
            overdueInvoices,
            totalInvoices: invoices.length,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
