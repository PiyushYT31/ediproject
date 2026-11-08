import { InventoryItem } from "@/src/types";

/**
 * Hardware Vendor Integration for WorkSphere
 * A dedicated module for local shops to list material prices.
 */

export interface QuoteRequest {
  jobId: string;
  workerId: string;
  consumerId: string;
  items: {
    itemId: string;
    quantity: number;
  }[];
}

export interface QuoteResponse {
  id: string;
  quoteRequestId: string;
  vendorId: string;
  items: {
    itemId: string;
    name: string;
    quantity: number;
    pricePerUnit: number;
    totalPrice: number;
  }[];
  totalAmount: number;
  status: QuoteStatus;
  createdAt: number;
}

export enum QuoteStatus {
  PENDING = "pending",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
}

export function calculateQuoteTotal(items: { pricePerUnit: number; quantity: number }[]): number {
  return items.reduce((total, item) => total + item.pricePerUnit * item.quantity, 0);
}

export function formatQuoteForWorker(quote: QuoteResponse): string {
  // Generates a transparent, all-inclusive quote for the worker to share with the consumer
  const itemLines = quote.items.map(item => 
    `${item.name}: ${item.quantity} x ₹${item.pricePerUnit} = ₹${item.totalPrice}`
  ).join("\n");
  
  return `WorkSphere Hardware Quote\n--------------------------\n${itemLines}\n--------------------------\nTotal Material Cost: ₹${quote.totalAmount}`;
}
