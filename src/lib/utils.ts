import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
};

export const generateId = () => Math.random().toString(36).substring(2, 15);

export const generateInvoiceNumber = async (existingCount: number): Promise<string> => {
    const currentYear = new Date().getFullYear();
    const nextNumber = existingCount + 1;
    return `WDGS-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
};
