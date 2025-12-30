import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IInvoiceItem {
    id: string;
    description: string;
    quantity: number;
    rate: number;
    amount: number;
}

export interface IInvoice extends Document {
    clientName: string;
    clientAddress: string;
    clientGST?: string;
    clientState: string;
    invoiceNumber: string;
    invoiceDate: string;
    dueDate: string;
    poNumber?: string;
    sacCode: string;
    items: IInvoiceItem[];
    subtotal: number;
    gstType: 'CGST_SGST' | 'IGST';
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    gstAmount: number;
    totalAmount: number;
    status: 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>({
    id: { type: String, required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
    rate: { type: Number, required: true, default: 0 },
    amount: { type: Number, required: true, default: 0 },
});

const InvoiceSchema = new Schema<IInvoice>(
    {
        clientName: { type: String, required: true },
        clientAddress: { type: String, default: '' },
        clientGST: { type: String },
        clientState: { type: String, required: true },
        invoiceNumber: { type: String, required: true, unique: true },
        invoiceDate: { type: String, required: true },
        dueDate: { type: String, required: true },
        poNumber: { type: String },
        sacCode: { type: String, default: '998313' },
        items: { type: [InvoiceItemSchema], required: true },
        subtotal: { type: Number, required: true, default: 0 },
        gstType: { type: String, enum: ['CGST_SGST', 'IGST'], required: true },
        cgstAmount: { type: Number, default: 0 },
        sgstAmount: { type: Number, default: 0 },
        igstAmount: { type: Number, default: 0 },
        gstAmount: { type: Number, default: 0 },
        totalAmount: { type: Number, required: true, default: 0 },
        status: {
            type: String,
            enum: ['draft', 'sent', 'partially_paid', 'paid', 'overdue'],
            default: 'draft',
        },
        notes: { type: String },
        createdAt: { type: String, default: () => new Date().toISOString() },
        updatedAt: { type: String, default: () => new Date().toISOString() },
    },
    {
        timestamps: false,
    }
);

// Clear the model if it exists (for hot reloading in development)
const Invoice: Model<IInvoice> =
    mongoose.models.Invoice || mongoose.model<IInvoice>('Invoice', InvoiceSchema);

export default Invoice;
