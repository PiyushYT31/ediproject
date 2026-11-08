import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, CheckCircle2, ShoppingBag, MapPin, IndianRupee, Loader2, Sparkles, CreditCard } from "lucide-react";
import { Product, Order, OrderStatus } from "../types";
import { useAuth } from "../context/AuthContext";
import { useLocation } from "../context/LocationContext";
import { db, handleFirestoreError, OperationType } from "../firebase";
import { collection, doc, setDoc } from "firebase/firestore";
import UPIPaymentModal from "./UPIPaymentModal";

interface ProductPurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product;
  onSuccess?: () => void;
}

export default function ProductPurchaseModal({
  isOpen,
  onClose,
  product,
  onSuccess,
}: ProductPurchaseModalProps) {
  const { user } = useAuth();
  const { location } = useLocation();

  const [quantity, setQuantity] = useState(1);
  const [shippingAddress, setShippingAddress] = useState(
    location.address || `${location.city}, ${location.state}` || "Home Delivery Address"
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showUPI, setShowUPI] = useState(false);
  const [createdOrderId, setCreatedOrderId] = useState<string | null>(null);

  const totalPrice = product.price * quantity;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    const orderId = doc(collection(db, "orders")).id;

    const order: Order = {
      id: orderId,
      consumerId: user.uid,
      artisanId: product.artisanId,
      productId: product.id,
      productTitle: product.title,
      productImage: product.imageUrl,
      quantity,
      totalPrice,
      status: OrderStatus.PENDING,
      shippingAddress: shippingAddress.trim() || location.address || "Customer Address",
      createdAt: Date.now(),
    };

    try {
      await setDoc(doc(db, "orders", orderId), order);
      setCreatedOrderId(orderId);
      setShowUPI(true);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "orders");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {isOpen && !showUPI && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="fixed inset-0" onClick={onClose} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative z-10 w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-100"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">Direct Artisan Checkout</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Product Info */}
              <form onSubmit={handlePlaceOrder} className="p-5 space-y-4">
                <div className="flex gap-3 items-center bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="w-16 h-16 rounded-xl object-cover bg-white border border-slate-200"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 truncate">
                      {product.title}
                    </h4>
                    <span className="text-xs text-indigo-600 font-semibold">
                      {product.category}
                    </span>
                    <p className="text-base font-extrabold text-slate-900 mt-0.5">
                      ₹{product.price}
                    </p>
                  </div>
                </div>

                {/* Quantity Selector */}
                <div className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Quantity</span>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-extrabold text-sm w-4 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(product.stock || 20, q + 1))}
                      className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center justify-center transition-colors cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Delivery Address
                  </label>
                  <textarea
                    rows={2}
                    required
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Enter complete shipping address..."
                    className="w-full p-3 rounded-xl border border-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500 bg-white resize-none"
                  />
                </div>

                {/* Total */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-indigo-950">Total Payable</span>
                  <span className="text-xl font-black text-indigo-950">₹{totalPrice}</span>
                </div>

                {/* Actions */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Processing Order...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" /> Proceed to UPI Payment (₹{totalPrice})
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* UPI Payment Modal */}
      {createdOrderId && (
        <UPIPaymentModal
          isOpen={showUPI}
          onClose={() => {
            setShowUPI(false);
            if (onSuccess) onSuccess();
            onClose();
          }}
          payeeName={`Artisan: ${product.title}`}
          amount={totalPrice}
          jobId={createdOrderId}
          onPaymentSuccess={() => {
            if (onSuccess) onSuccess();
            onClose();
          }}
        />
      )}
    </>
  );
}

