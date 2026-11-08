import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Plus, 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  IndianRupee,
  Clock,
  Upload,
  Loader2,
  CheckCircle2,
  Truck,
  Palette,
  X
} from "lucide-react";
import { useI18n } from "../lib/i18n";
import { db, auth, storage, handleFirestoreError, OperationType } from "../firebase";
import { collection, query, where, doc, setDoc, deleteDoc, updateDoc, orderBy } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useCollection } from "react-firebase-hooks/firestore";
import { Product, Order, OrderStatus } from "../types";

export default function ArtisanPortal() {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<"products" | "orders">("products");

  const [productsValue, productsLoading] = useCollection(
    auth.currentUser ? query(
      collection(db, "products"),
      where("artisanId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    ) : null
  );

  const [ordersValue, ordersLoading] = useCollection(
    auth.currentUser ? query(
      collection(db, "orders"),
      where("artisanId", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc")
    ) : null
  );

  const products = productsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)) || [];
  const orders = ordersValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)) || [];

  const totalSales = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Analytics Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sales</span>
          <p className="text-xl font-black text-emerald-600 mt-1">₹{totalSales}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
          <p className="text-xl font-black text-indigo-600 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Active Listings</span>
          <p className="text-xl font-black text-slate-900 mt-1">{products.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-200/60 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'products' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          My Craft Listings ({products.length})
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'orders' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Customer Orders ({orders.length})
        </button>
      </div>

      {/* Products Tab */}
      {activeTab === 'products' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-extrabold text-slate-900">Craft Catalog</h3>
            <button 
              onClick={() => setIsAdding(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Craft Item
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
            {products.length === 0 && !productsLoading && (
              <div className="col-span-2 py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No craft listings yet</p>
                <p className="text-xs text-slate-400">Click '+ Add Craft Item' to list your handmade products.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Orders Tab */
        <div className="space-y-3">
          <h3 className="text-base font-extrabold text-slate-900 px-1">Customer Orders</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <OrderListItem key={order.id} order={order} />
            ))}
            {orders.length === 0 && !ordersLoading && (
              <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
                <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-700">No orders received yet</p>
                <p className="text-xs text-slate-400">When customers order your craft pieces, they will show up here.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAdding && <AddProductModal onClose={() => setIsAdding(false)} />}
    </div>
  );
}

function ProductCard({ product }: { key?: string | number; product: Product }) {
  const handleDelete = async () => {
    if (window.confirm('Delete this product from your craft store?')) {
      await deleteDoc(doc(db, "products", product.id));
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all group flex flex-col justify-between">
      <div className="aspect-square bg-slate-100 relative overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <ImageIcon className="w-8 h-8 text-slate-300 absolute inset-0 m-auto" />
        )}
        <button 
          onClick={handleDelete}
          className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all shadow-xs cursor-pointer"
          title="Delete product"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
          {product.category}
        </span>
      </div>
      <div className="p-3.5 space-y-1">
        <h4 className="font-bold text-xs text-slate-900 truncate">{product.title}</h4>
        <div className="flex items-center justify-between">
          <p className="text-slate-900 font-extrabold text-sm">₹{product.price}</p>
          <span className="text-[11px] text-slate-400 font-medium">Stock: {product.stock}</span>
        </div>
      </div>
    </div>
  );
}

function OrderListItem({ order }: { key?: string | number; order: Order }) {
  const [updating, setUpdating] = useState(false);

  const statusColors: Record<OrderStatus, string> = {
    [OrderStatus.PENDING]: 'bg-amber-50 text-amber-700 border-amber-200',
    [OrderStatus.CONFIRMED]: 'bg-sky-50 text-sky-700 border-sky-200',
    [OrderStatus.SHIPPED]: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    [OrderStatus.DELIVERED]: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    [OrderStatus.CANCELLED]: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const handleUpdateStatus = async (nextStatus: OrderStatus) => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, "orders", order.id), {
        status: nextStatus,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900">Order #{order.id.slice(-6).toUpperCase()}</span>
              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${statusColors[order.status] || "bg-slate-100"}`}>
                {order.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Qty: {order.quantity || 1} • Total: <strong className="text-slate-900">₹{order.totalPrice}</strong>
            </p>
          </div>
        </div>

        <span className="text-[11px] text-slate-400">
          {new Date(order.createdAt).toLocaleDateString()}
        </span>
      </div>

      {order.shippingAddress && (
        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
          <span className="font-bold text-slate-500">Shipping:</span> {order.shippingAddress}
        </p>
      )}

      {/* Status Transition Actions for Artisan */}
      <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
        {order.status === OrderStatus.PENDING && (
          <button
            disabled={updating}
            onClick={() => handleUpdateStatus(OrderStatus.CONFIRMED)}
            className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
          >
            Confirm Order
          </button>
        )}
        {order.status === OrderStatus.CONFIRMED && (
          <button
            disabled={updating}
            onClick={() => handleUpdateStatus(OrderStatus.SHIPPED)}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <Truck className="w-3.5 h-3.5" /> Mark Shipped
          </button>
        )}
        {order.status === OrderStatus.SHIPPED && (
          <button
            disabled={updating}
            onClick={() => handleUpdateStatus(OrderStatus.DELIVERED)}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1 cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Mark Delivered
          </button>
        )}
      </div>
    </div>
  );
}

function AddProductModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    stock: '1',
    category: 'pottery',
    imageUrl: ''
  });

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    setImagePreview(URL.createObjectURL(file));
    setUploadingImage(true);
    try {
      const storageRef = ref(storage, `product-images/${auth.currentUser.uid}/${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setFormData(prev => ({ ...prev, imageUrl: url }));
    } catch (err) {
      alert('Image upload failed. Please try again.');
      setImagePreview(null);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser || !formData.title.trim()) return;

    const docRef = doc(collection(db, "products"));
    const productData: Product = {
      id: docRef.id,
      artisanId: auth.currentUser.uid,
      title: formData.title,
      description: formData.description,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 1,
      category: formData.category,
      imageUrl: formData.imageUrl || `https://images.unsplash.com/photo-1590483736622-39da8af7541b?w=400&h=400&fit=crop`,
      createdAt: Date.now()
    };

    try {
      await setDoc(docRef, productData);
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "products");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="fixed inset-0" onClick={onClose} />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="relative z-10 bg-white w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">Add Handcrafted Item</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Craft Name</label>
            <input
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
              placeholder="e.g. Clay Hand-painted Vase, Kashmiri Shawl..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Price (₹)</label>
              <input
                required
                type="number"
                min="0"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                placeholder="499"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Stock Count</label>
              <input
                required
                type="number"
                min="1"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
                placeholder="5"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Craft Category</label>
            <select
              value={formData.category}
              onChange={e => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:border-indigo-500 focus:outline-none"
            >
              {['pottery', 'textiles', 'jewelry', 'woodwork', 'leather', 'sculpture', 'paintings'].map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Photo Upload */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700">Craft Photo</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl flex flex-col items-center justify-center gap-1.5 cursor-pointer relative overflow-hidden bg-slate-50 transition-colors"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-slate-400" />
                  <p className="text-xs font-bold text-slate-600">Click to upload product image</p>
                  <p className="text-[10px] text-slate-400">JPG, PNG, WEBP</p>
                </>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                  <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageFile}
              className="hidden"
            />
          </div>

          <button
            type="submit"
            disabled={uploadingImage}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
          >
            {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading...</> : "Publish Craft Listing"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
