import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, X, Plus, Minus, ShoppingCart, Loader2, Store } from "lucide-react";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection } from "firebase/firestore";
import { db } from "../firebase";
import { HardwareVendor, InventoryItem } from "../types";
import { useI18n } from "../lib/i18n";

interface Props {
  onClose: () => void;
  onAdd: (materials: { itemId: string; name: string; quantity: number; pricePerUnit: number }[]) => void;
}

export default function MaterialSelector({ onClose, onAdd }: Props) {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMaterials, setSelectedMaterials] = useState<{ [id: string]: { item: InventoryItem; quantity: number } }>({});
  
  const [vendorsValue, loading] = useCollection(collection(db, "vendors"));
  const vendors = vendorsValue?.docs.map(doc => doc.data() as HardwareVendor) || [];

  const allItems = vendors.flatMap(vendor => 
    vendor.inventory.map(item => ({ ...item, vendorName: vendor.shopName }))
  );

  const filteredItems = allItems.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateQuantity = (item: InventoryItem, delta: number) => {
    setSelectedMaterials(prev => {
      const current = prev[item.id] || { item, quantity: 0 };
      const newQuantity = Math.max(0, current.quantity + delta);
      
      if (newQuantity === 0) {
        const { [item.id]: _, ...rest } = prev;
        return rest;
      }
      
      return {
        ...prev,
        [item.id]: { item, quantity: newQuantity }
      };
    });
  };

  const handleAdd = () => {
    const materials = Object.values(selectedMaterials).map(({ item, quantity }) => ({
      itemId: item.id,
      name: item.name,
      quantity,
      pricePerUnit: item.price
    }));
    onAdd(materials);
    onClose();
  };

  const totalAmount = Object.values(selectedMaterials).reduce(
    (sum, { item, quantity }) => (sum as number) + item.price * quantity, 
    0
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="w-full max-w-2xl bg-[#F5F5F0] rounded-t-[2.5rem] sm:rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="p-6 bg-white border-b border-[#141414]/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#141414] text-white rounded-xl flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">{t('addMaterials')}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#141414]/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 bg-white border-b border-[#141414]/5">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/40" />
            <input
              type="text"
              placeholder={t('searchMaterials')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-[#141414]/5 rounded-2xl focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#141414]/10 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 animate-spin text-[#141414]/20" />
              <p className="text-sm font-bold text-[#141414]/40 uppercase tracking-widest">{t('fetchingVendors')}</p>
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border border-[#141414]/5 flex items-center justify-between group hover:border-[#141414]/20 transition-all">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-[#141414]">{item.name}</h3>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-[#141414]/5 rounded-full text-[#141414]/40">
                      {t(item.category)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <Store className="w-3 h-3 text-[#141414]/40" />
                    <p className="text-xs text-[#141414]/60 font-medium">{(item as any).vendorName}</p>
                  </div>
                  <p className="text-sm font-bold mt-2">₹{item.price} <span className="text-[#141414]/40 font-medium">/ {t(item.unit) || item.unit}</span></p>
                </div>
                
                <div className="flex items-center gap-3 bg-[#141414]/5 p-1 rounded-xl">
                  <button 
                    onClick={() => updateQuantity(item, -1)}
                    className="w-8 h-8 flex items-center justify-center bg-white rounded-lg shadow-sm active:scale-95 transition-transform"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-bold text-sm">
                    {selectedMaterials[item.id]?.quantity || 0}
                  </span>
                  <button 
                    onClick={() => updateQuantity(item, 1)}
                    className="w-8 h-8 flex items-center justify-center bg-[#141414] text-white rounded-lg shadow-sm active:scale-95 transition-transform"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-[#141414]/40 font-medium">{t('noMaterialsFound')}</p>
            </div>
          )}
        </div>

        <AnimatePresence>
          {Object.keys(selectedMaterials).length > 0 && (
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="p-6 bg-white border-t border-[#141414]/10 space-y-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t('totalMaterialsCost')}</p>
                  <p className="text-2xl font-bold">₹{totalAmount}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t('itemsCount')}</p>
                  <p className="text-lg font-bold">{Object.keys(selectedMaterials).length}</p>
                </div>
              </div>
              <button 
                onClick={handleAdd}
                className="w-full py-4 bg-[#141414] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                {t('addToJobQuote')}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
