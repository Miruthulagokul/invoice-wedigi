import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';
import Invoice from '@/lib/models/Invoice';

// GET all payments
export async function GET() {
    try {
        await dbConnect();

        const payments = await Payment.find().sort({ paymentDate: -1 });

        return NextResponse.json(payments);
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}

// POST create new payment
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();
        body.createdAt = new Date().toISOString();

        const payment = new Payment(body);
        await payment.save();

        // Update invoice status based on payments
        const invoice = await Invoice.findById(body.invoiceId);
        if (invoice) {
            const allPayments = await Payment.find({ invoiceId: body.invoiceId });
            const totalPaid = allPayments.reduce((sum, p) => sum + p.amountPaid, 0);

            let newStatus = invoice.status;
            if (totalPaid >= invoice.totalAmount) {
                newStatus = 'paid';
            } else if (totalPaid > 0) {
                newStatus = 'partially_paid';
            }

            if (newStatus !== invoice.status) {
                invoice.status = newStatus;
                invoice.updatedAt = new Date().toISOString();
                await invoice.save();
            }
        }

        return NextResponse.json(payment, { status: 201 });
    } catch (error) {
        console.error('Error creating payment:', error);
        return NextResponse.json({ error: 'Failed to create payment' }, { status: 500 });
    }
}
