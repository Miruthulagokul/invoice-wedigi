import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Invoice from '@/lib/models/Invoice';

// GET all invoices
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        const query = status && status !== 'all' ? { status } : {};
        const invoices = await Invoice.find(query).sort({ invoiceDate: -1 });

        return NextResponse.json(invoices);
    } catch (error) {
        console.error('Error fetching invoices:', error);
        return NextResponse.json({ error: 'Failed to fetch invoices' }, { status: 500 });
    }
}

// POST create new invoice
export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        const body = await request.json();

        // Generate invoice number if not provided
        if (!body.invoiceNumber) {
            const currentYear = new Date().getFullYear();
            const count = await Invoice.countDocuments({
                invoiceNumber: { $regex: `WDGS-${currentYear}` }
            });
            body.invoiceNumber = `WDGS-${currentYear}-${String(count + 1).padStart(3, '0')}`;
        }

        // Set timestamps
        body.createdAt = new Date().toISOString();
        body.updatedAt = new Date().toISOString();

        const invoice = new Invoice(body);
        await invoice.save();

        return NextResponse.json(invoice, { status: 201 });
    } catch (error) {
        console.error('Error creating invoice:', error);
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
    }
}
