import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, Plus, Trash2, Edit3, Search, X, Loader2 } from "lucide-react";
import { InventoryItem } from "../types";
import { auth, db, handleFirestoreError, OperationType } from "../firebase";
import { 
  collection, 
  query, 
  where, 
  addDoc, 
  deleteDoc, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { cn } from "../lib/utils";
import { useI18n } from "../lib/i18n";

export default function VendorPortal() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [inventoryValue, loading, error] = useCollection(
    auth.currentUser ? query(
      collection(db, "inventory"),
      where("vendorId", "==", auth.currentUser.uid)
    ) : null
  );

  const inventory = inventoryValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as InventoryItem)) || [];

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    if (!confirm(t('confirmDelete'))) return;
    try {
      await deleteDoc(doc(db, "inventory", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">{t('inventory')}</h2>
          <p className="text-sm text-[#141414]/40 font-medium">{t('manageInventory')}</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="p-3 bg-[#141414] text-white rounded-2xl hover:scale-105 transition-transform shadow-lg shadow-[#141414]/20"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#141414]/40 group-focus-within:text-[#141414] transition-colors" />
        <input
          type="text"
          placeholder={t('searchInventory')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white border border-[#141414]/10 rounded-2xl focus:outline-none focus:border-[#141414] transition-all shadow-sm"
        />
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12">{t('loading')}</div>
        ) : filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-[#141414]/10 rounded-2xl p-4 flex items-center justify-between shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#141414]/5 rounded-xl flex items-center justify-center">
                  <Package className="w-6 h-6 text-[#141414]/40" />
                </div>
                <div>
                  <h3 className="font-bold">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-[#141414]/5 px-2 py-0.5 rounded-full text-[#141414]/60">
                      {t(item.category)}
                    </span>
                    <span className="text-xs text-[#141414]/40 font-medium">
                      ₹{item.price} / {item.unit}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setEditingItem(item)}
                  className="p-2 hover:bg-[#141414]/5 rounded-lg transition-colors text-[#141414]/60"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-[#141414]/20">
            <p className="text-[#141414]/40 font-medium">{t('noInventory')}</p>
          </div>
        )}
      </div>

      <AnimatePresence>
        {(isAdding || editingItem) && (
          <InventoryModal 
            item={editingItem} 
            onClose={() => {
              setIsAdding(false);
              setEditingItem(null);
            }} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function InventoryModal({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: item?.name || "",
    price: item?.price || 0,
    unit: item?.unit || "unit",
    category: item?.category || "General",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    setLoading(true);

    try {
      if (item) {
        await updateDoc(doc(db, "inventory", item.id), formData);
      } else {
        await addDoc(collection(db, "inventory"), {
          ...formData,
          vendorId: auth.currentUser.uid,
          createdAt: Date.now(),
        });
      }
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "inventory");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/60 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="w-full max-w-md bg-white rounded-[2.5rem] overflow-hidden shadow-2xl p-8"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold tracking-tight">
            {item ? t('editItem') : t('addItem')}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-[#141414]/5 rounded-full">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t('itemName')}</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t('price')} (₹)</label>
              <input
                required
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) })}
                className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t('unit')}</label>
              <input
                required
                type="text"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all font-bold"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">{t('category')}</label>
            <input
              required
              type="text"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-6 py-4 bg-[#141414]/5 rounded-2xl border-transparent focus:bg-white focus:border-[#141414] transition-all font-bold"
            />
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-5 bg-[#141414] text-white rounded-2xl font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (item ? t('updateItem') : t('addItem'))}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
