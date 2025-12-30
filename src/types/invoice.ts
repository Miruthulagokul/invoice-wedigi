// Types for the Invoice Application

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
}

export type InvoiceStatus = 'draft' | 'sent' | 'partially_paid' | 'paid' | 'overdue';
export type GSTType = 'CGST_SGST' | 'IGST';
export type PaymentMode = 'UPI' | 'Bank' | 'Cash';

export interface Invoice {
  _id?: string;
  id?: string;
  clientName: string;
  clientAddress: string;
  clientGST?: string;
  clientState: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  poNumber?: string;
  sacCode: string;
  items: InvoiceItem[];
  subtotal: number;
  gstType: GSTType;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  gstAmount: number;
  totalAmount: number;
  status: InvoiceStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  _id?: string;
  id?: string;
  invoiceId: string;
  paymentDate: string;
  amountPaid: number;
  mode: PaymentMode;
  referenceId?: string;
  createdAt: string;
}

export interface User {
  _id?: string;
  id?: string;
  email: string;
  name: string;
  password?: string;
}

export interface CompanyDetails {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin: string;
  phone: string;
  email: string;
  website: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  ifscCode: string;
  branch: string;
  proprietorName: string;
  designation: string;
}

export const COMPANY_DETAILS: CompanyDetails = {
  name: 'WeDigi Studio',
  address: 'Kavitha Street, UR Nagar, Padi',
  city: 'Chennai',
  state: 'Tamil Nadu',
  pincode: '600050',
  gstin: '33EHSPA2932N1Z2',
  phone: '+91 88380 23321',
  email: 'contact@wedigistudio.com',
  website: 'www.wedigistudio.com',
  bankName: 'TMB',
  accountName: 'Wedigi Studio',
  accountNumber: '171150050800792',
  ifscCode: 'TMBL0000171',
  branch: 'Kurnool branch',
  proprietorName: 'Swayam S',
  designation: 'Director',
};

export const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh',
  'Goa', 'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram',
  'Nagaland', 'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu',
  'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal',
  'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

export interface DashboardStats {
  totalInvoiced: number;
  totalGST: number;
  totalPaid: number;
  pendingAmount: number;
  currentMonthInvoices: Invoice[];
  overdueInvoices: Invoice[];
  totalInvoices: number;
}
