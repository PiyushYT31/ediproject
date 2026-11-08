import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Package, Plus, Trash2, Edit3, Search, X, Loader2, Store, Tag, IndianRupee } from "lucide-react";
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
import { useI18n } from "../lib/i18n";
import { MATERIAL_CATEGORIES } from "../constants";

export default function VendorPortal() {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [inventoryValue, loading] = useCollection(
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
    if (!window.confirm(t('confirmDelete') || "Are you sure you want to delete this inventory item?")) return;
    try {
      await deleteDoc(doc(db, "inventory", id));
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `inventory/${id}`);
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Store className="w-5 h-5 text-indigo-600" />
            {t('inventory') || "Shop Inventory"}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            Manage raw materials & hardware supplies available for workers & clients
          </p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
        <input
          type="text"
          placeholder={t('searchInventory') || "Search materials by name or category..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl focus:outline-none focus:border-indigo-500 text-xs font-medium transition-all shadow-xs"
        />
      </div>

      {/* Inventory Items List */}
      <div className="space-y-2.5">
        {loading ? (
          <div className="text-center py-12 text-xs text-slate-400 font-semibold">{t('loading')}</div>
        ) : filteredInventory.length > 0 ? (
          filteredInventory.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-slate-200/90 rounded-2xl p-4 flex items-center justify-between shadow-2xs hover:shadow-xs transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                  <Package className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm text-slate-900 truncate">{item.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                      {t(item.category) || item.category}
                    </span>
                    <span className="text-xs font-extrabold text-slate-800">
                      ₹{item.price} <span className="text-slate-400 font-normal text-[11px]">/ {item.unit}</span>
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button 
                  onClick={() => setEditingItem(item)}
                  className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-indigo-600 cursor-pointer"
                  title="Edit item"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-rose-50 rounded-xl transition-colors text-slate-400 hover:text-rose-600 cursor-pointer"
                  title="Delete item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
            <Package className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">{t('noInventory') || "No items in inventory"}</p>
            <p className="text-xs text-slate-400">Click '+ Add Item' above to list hardware materials in your store.</p>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
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
    unit: item?.unit || "piece",
    category: item?.category || "Pipes & Plumbing",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.name.trim()) return;
    setLoading(true);

    try {
      if (item) {
        await updateDoc(doc(db, "inventory", item.id), {
          ...formData,
          price: Number(formData.price) || 0,
        });
      } else {
        await addDoc(collection(db, "inventory"), {
          ...formData,
          price: Number(formData.price) || 0,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
    >
      <div className="fixed inset-0" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        className="relative z-10 w-full max-w-md bg-white rounded-3xl overflow-hidden shadow-2xl p-6 border border-slate-100"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
            {item ? t('editItem') || "Edit Inventory Item" : t('addItem') || "Add New Material"}
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-700 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('itemName') || "Item / Material Name"}
            </label>
            <input
              required
              type="text"
              placeholder="e.g. PVC Pipe 1 inch, 10A Switch..."
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('price') || "Unit Price (₹)"}
              </label>
              <input
                required
                type="number"
                min="0"
                value={formData.price || ""}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) || 0 })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                {t('unit') || "Unit (e.g. kg, m, pc)"}
              </label>
              <input
                required
                type="text"
                placeholder="piece / meter"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              {t('category') || "Material Category"}
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none transition-all"
            >
              {MATERIAL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <button
            disabled={loading}
            type="submit"
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (item ? t('updateItem') || "Save Changes" : t('addItem') || "Add to Inventory")}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}
