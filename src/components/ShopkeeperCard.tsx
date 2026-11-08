import React from "react";
import { motion } from "motion/react";
import { Store, MapPin, Phone, MessageSquare, Truck, CheckCircle2, ArrowRight } from "lucide-react";
import { ShopkeeperProfile } from "../types";

interface ShopkeeperCardProps {
  key?: string | number;
  shop: ShopkeeperProfile;
  distance?: number;
  onContact?: () => void;
}

export default function ShopkeeperCard({ shop, distance, onContact }: ShopkeeperCardProps) {
  const handleCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`tel:${shop.contactNumber || shop.whatsappNumber || "9876543210"}`, "_self");
  };

  const handleWhatsApp = (e: React.MouseEvent) => {
    e.stopPropagation();
    const phone = (shop.whatsappNumber || shop.contactNumber || "9876543210").replace(/\D/g, "");
    const cleanPhone = phone.startsWith("91") ? phone : `91${phone}`;
    window.open(`https://wa.me/${cleanPhone}?text=Hello%20${encodeURIComponent(shop.shopName)},%20I%20am%20inquiring%20about%20materials%20on%20WorkSphere.`, "_blank");
  };

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white border border-slate-200/90 hover:border-indigo-500/40 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-all space-y-3.5"
    >
      <div className="flex gap-3.5 items-start">
        <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
          {shop.shopLogoUrl ? (
            <img src={shop.shopLogoUrl} alt={shop.shopName} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            <Store className="w-7 h-7" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h3 className="font-extrabold text-sm text-slate-900 truncate">{shop.shopName}</h3>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 shrink-0">
              {shop.shopCategory || "Hardware"}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 font-medium truncate">
            Proprietor: {shop.ownerName || "Store Owner"}
          </p>

          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate max-w-[160px]">{shop.shopAddress || shop.location?.city || "Local Market"}</span>
            </div>
            {shop.homeDelivery && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                <Truck className="w-3 h-3" /> Delivery
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Operating Hours & Actions */}
      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-slate-400">
          Open: {shop.openingTime || "09:00"} - {shop.closingTime || "21:00"}
        </span>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleWhatsApp}
            title="Chat on WhatsApp"
            className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-xl transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
          </button>
          <button
            onClick={handleCall}
            title="Call Shop"
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
          >
            <Phone className="w-3.5 h-3.5" /> Call Shop
          </button>
        </div>
      </div>
    </motion.div>
  );
}
