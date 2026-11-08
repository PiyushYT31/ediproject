import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, QrCode, Smartphone, ExternalLink, ShieldCheck, Copy, Check } from "lucide-react";
import { generateUPIDeepLink } from "../lib/payments";

interface UPIPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  payeeName: string;
  amount: number;
  jobId: string;
  payeeVPA?: string;
  onPaymentSuccess: () => void;
}

export default function UPIPaymentModal({
  isOpen,
  onClose,
  payeeName,
  amount,
  jobId,
  payeeVPA = "worksphere.pay@okhdfcbank",
  onPaymentSuccess,
}: UPIPaymentModalProps) {
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const note = `WorkSphere payment for job #${jobId.slice(-6).toUpperCase()}`;
  const upiDeepLink = generateUPIDeepLink(amount, payeeVPA, payeeName, note);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    upiDeepLink
  )}`;

  const handleCopyUPI = () => {
    navigator.clipboard.writeText(payeeVPA);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCompletePayment = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onPaymentSuccess();
        onClose();
      }, 1500);
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="fixed inset-0" onClick={onClose} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="relative z-10 w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100 text-center"
          >
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h3 className="text-xs font-bold text-slate-900">Direct UPI Settlement</h3>
                  <p className="text-[10px] text-slate-400">Zero Commission / Direct Pay</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {isSuccess ? (
              <div className="p-10 flex flex-col items-center justify-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-slate-900">Payment Settled!</h4>
                  <p className="text-xs text-slate-500 mt-1">₹{amount} sent to {payeeName}</p>
                </div>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {/* Amount Display */}
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    Amount to Pay
                  </span>
                  <div className="text-3xl font-black text-slate-900 mt-0.5">
                    ₹{amount}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">To: {payeeName}</p>
                </div>

                {/* QR Code Container */}
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 inline-block mx-auto shadow-inner">
                  <img
                    src={qrCodeUrl}
                    alt="UPI QR Code"
                    className="w-44 h-44 rounded-xl mx-auto mix-blend-multiply"
                  />
                  <p className="text-[10px] font-bold text-slate-400 mt-2 uppercase tracking-wider flex items-center justify-center gap-1">
                    <QrCode className="w-3 h-3" /> Scan with Any UPI App
                  </p>
                </div>

                {/* Payee VPA with Copy Button */}
                <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-xl text-xs font-semibold text-slate-700">
                  <span className="text-[11px] text-slate-400 font-normal">UPI ID:</span>
                  <span className="font-mono">{payeeVPA}</span>
                  <button
                    onClick={handleCopyUPI}
                    className="p-1 hover:text-indigo-600 transition-colors cursor-pointer"
                    title="Copy UPI ID"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Direct App Link (Mobile) */}
                <a
                  href={upiDeepLink}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  <Smartphone className="w-4 h-4" />
                  Pay via GPay / PhonePe / Paytm
                  <ExternalLink className="w-3 h-3 ml-auto opacity-70" />
                </a>

                {/* Mark as Paid confirmation */}
                <button
                  onClick={handleCompletePayment}
                  disabled={isProcessing}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:border-slate-400 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-all cursor-pointer"
                >
                  {isProcessing ? "Confirming..." : "I have completed payment"}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

