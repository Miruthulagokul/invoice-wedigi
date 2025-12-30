import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Payment from '@/lib/models/Payment';

// GET payments by invoice ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ invoiceId: string }> }
) {
    try {
        await dbConnect();
        const { invoiceId } = await params;

        const payments = await Payment.find({ invoiceId }).sort({ paymentDate: -1 });
        const totalPaid = payments.reduce((sum, p) => sum + p.amountPaid, 0);

        return NextResponse.json({ payments, totalPaid });
    } catch (error) {
        console.error('Error fetching payments:', error);
        return NextResponse.json({ error: 'Failed to fetch payments' }, { status: 500 });
    }
}
