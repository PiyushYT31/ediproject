import React from "react";
import { motion } from "motion/react";
import { Package, Truck, CheckCircle, Clock, MapPin, MessageSquare, AlertCircle } from "lucide-react";
import { Order, OrderStatus } from "../types";
import { cn } from "../lib/utils";

interface CustomerOrderCardProps {
  key?: string | number;
  order: Order;
  artisanName?: string;
  onOpenChat?: (artisanId: string, artisanName: string) => void;
}

export const CustomerOrderCard: React.FC<CustomerOrderCardProps> = ({
  order,
  artisanName,
  onOpenChat,
}) => {
  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING:
        return {
          bg: "bg-amber-50 text-amber-700 border-amber-200/80",
          icon: Clock,
          label: "Order Placed",
        };
      case OrderStatus.CONFIRMED:
        return {
          bg: "bg-blue-50 text-blue-700 border-blue-200/80",
          icon: CheckCircle,
          label: "Confirmed by Artisan",
        };
      case OrderStatus.SHIPPED:
        return {
          bg: "bg-purple-50 text-purple-700 border-purple-200/80",
          icon: Truck,
          label: "Dispatched / In Transit",
        };
      case OrderStatus.DELIVERED:
        return {
          bg: "bg-emerald-50 text-emerald-700 border-emerald-200/80",
          icon: CheckCircle,
          label: "Delivered",
        };
      case OrderStatus.CANCELLED:
        return {
          bg: "bg-rose-50 text-rose-700 border-rose-200/80",
          icon: AlertCircle,
          label: "Cancelled",
        };
      default:
        return {
          bg: "bg-slate-50 text-slate-700 border-slate-200",
          icon: Clock,
          label: status,
        };
    }
  };

  const statusConfig = getStatusBadge(order.status);
  const StatusIcon = statusConfig.icon;
  const formattedDate = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs hover:shadow-md transition-all space-y-4"
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100/80 flex items-center justify-center shrink-0 overflow-hidden">
            {order.productImage ? (
              <img
                src={order.productImage}
                alt={order.productTitle || "Product"}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-indigo-600" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                #{order.id.slice(0, 8)}
              </span>
              <span className="text-xs text-slate-400 font-medium">{formattedDate}</span>
            </div>
            <h3 className="text-sm font-black text-slate-900 mt-0.5 line-clamp-1">
              {order.productTitle || `Craft Product #${order.productId.slice(0, 6)}`}
            </h3>
            {artisanName && (
              <p className="text-xs text-slate-500 font-medium">By {artisanName}</p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <span
          className={cn(
            "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shrink-0",
            statusConfig.bg
          )}
        >
          <StatusIcon className="w-3.5 h-3.5" />
          {statusConfig.label}
        </span>
      </div>

      {/* Details Bar */}
      <div className="bg-slate-50/80 rounded-2xl p-3 border border-slate-100 flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400 font-medium block text-[11px]">Quantity</span>
          <span className="font-bold text-slate-800">{order.quantity} item(s)</span>
        </div>
        <div className="text-right">
          <span className="text-slate-400 font-medium block text-[11px]">Total Paid</span>
          <span className="font-black text-slate-900 text-sm text-indigo-600">
            ₹{order.totalPrice.toLocaleString("en-IN")}
          </span>
        </div>
      </div>

      {/* Shipping Address */}
      {order.shippingAddress && (
        <div className="flex items-start gap-2 text-xs text-slate-500">
          <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <span className="line-clamp-2">{order.shippingAddress}</span>
        </div>
      )}

      {/* Action Buttons */}
      {onOpenChat && (
        <div className="pt-1 flex items-center justify-end">
          <button
            onClick={() => onOpenChat(order.artisanId, artisanName || "Artisan")}
            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100/80 px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat with Artisan
          </button>
        </div>
      )}
    </motion.div>
  );
};
export default CustomerOrderCard;

