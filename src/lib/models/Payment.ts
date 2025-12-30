import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPayment extends Document {
    invoiceId: mongoose.Types.ObjectId | string;
    paymentDate: string;
    amountPaid: number;
    mode: 'UPI' | 'Bank' | 'Cash';
    referenceId?: string;
    createdAt: string;
}

const PaymentSchema = new Schema<IPayment>(
    {
        invoiceId: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
        paymentDate: { type: String, required: true },
        amountPaid: { type: Number, required: true },
        mode: { type: String, enum: ['UPI', 'Bank', 'Cash'], default: 'UPI' },
        referenceId: { type: String },
        createdAt: { type: String, default: () => new Date().toISOString() },
    },
    {
        timestamps: false,
    }
);

const Payment: Model<IPayment> =
    mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
