/**
 * Payment Gateway Integration for WorkSphere
 * Integrated UPI (Google Pay) for direct, middleman-free settlements.
 */

export enum PaymentStatus {
  PENDING = "pending",
  SUCCESS = "success",
  FAILED = "failed",
}

export interface PaymentRequest {
  id: string;
  jobId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: number;
}

export async function initiateUPIPayment(
  amount: number,
  payeeVPA: string,
  payeeName: string,
  transactionNote: string
): Promise<PaymentStatus> {
  // Simulated UPI payment flow
  // In production, this would use a library or a deep link to a UPI app
  console.log(`Initiating UPI payment of ₹${amount} to ${payeeVPA} (${payeeName})`);

  return new Promise((resolve) => {
    setTimeout(() => {
      const isSuccess = Math.random() > 0.1; // 90% success rate
      resolve(isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED);
    }, 2000);
  });
}

export function generateUPIDeepLink(
  amount: number,
  payeeVPA: string,
  payeeName: string,
  transactionNote: string
): string {
  // Standard UPI deep link format
  // upi://pay?pa=payeeVPA&pn=payeeName&am=amount&cu=INR&tn=transactionNote
  const params = new URLSearchParams({
    pa: payeeVPA,
    pn: payeeName,
    am: amount.toString(),
    cu: "INR",
    tn: transactionNote,
  });

  return `upi://pay?${params.toString()}`;
}
