import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Trash2, 
  Package, 
  Image as ImageIcon, 
  ArrowRight,
  TrendingUp,
  ShoppingBag,
  DollarSign,
  Clock,
  Upload,
  Loader2
} from 'lucide-react';
import { useI18n } from '../lib/i18n';
import { db, auth, storage, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Product, Order, OrderStatus } from '../types';

export default function ArtisanPortal() {
  const { t } = useI18n();
  const [isAdding, setIsAdding] = useState(false);
  const [activeTab, setActiveTab] = useState<'products' | 'orders'>('products');

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

  const stats = [
    { label: 'Total Sales', value: orders.reduce((sum, o) => sum + o.totalPrice, 0), icon: DollarSign, color: 'text-green-500' },
    { label: 'Total Orders', value: orders.length, icon: ShoppingBag, color: 'text-blue-500' },
    { label: 'Active Listings', value: products.length, icon: Package, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-8 pb-20">
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-3xl border border-[#141414]/5 shadow-sm space-y-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <p className="text-[10px] uppercase tracking-wider font-bold text-[#141414]/30">{stat.label}</p>
            <p className="text-xl font-black italic tracking-tight">
              {typeof stat.value === 'number' && stat.label.includes('Sales') ? `₹${stat.value}` : stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="flex bg-[#141414]/5 p-1 rounded-2xl">
        <button 
          onClick={() => setActiveTab('products')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'products' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40'}`}
        >
          {t('products')}
        </button>
        <button 
          onClick={() => setActiveTab('orders')}
          className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-[#141414]' : 'text-[#141414]/40'}`}
        >
          {t('orders')}
        </button>
      </div>

      {activeTab === 'products' ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">{t('manageInventory')}</h3>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-[#141414] text-white p-2 rounded-xl hover:scale-105 transition-transform"
            >
              <Plus className="w-6 h-6" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
            {products.length === 0 && !productsLoading && (
              <div className="col-span-2 py-12 text-center bg-white rounded-3xl border border-dashed border-[#141414]/20">
                <Package className="w-10 h-10 text-[#141414]/20 mx-auto mb-3" />
                <p className="text-[#141414]/40 font-bold">{t('noInventory')}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-xl font-bold">{t('orders')}</h3>
          <div className="space-y-3">
            {orders.map((order) => (
              <div key={order.id}>
                <OrderListItem order={order} />
              </div>
            ))}
            {orders.length === 0 && !ordersLoading && (
              <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-[#141414]/20">
                <ShoppingBag className="w-10 h-10 text-[#141414]/20 mx-auto mb-3" />
                <p className="text-[#141414]/40 font-bold">No orders yet</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isAdding && <AddProductModal onClose={() => setIsAdding(false)} />}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const handleDelete = async () => {
    if (confirm('Delete this product?')) {
      await deleteDoc(doc(db, "products", product.id));
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#141414]/5 overflow-hidden shadow-sm group">
      <div className="aspect-square bg-[#141414]/5 relative overflow-hidden">
        {product.imageUrl ? (
          <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        ) : (
          <ImageIcon className="w-8 h-8 text-[#141414]/20 absolute inset-0 m-auto" />
        )}
        <button 
          onClick={handleDelete}
          className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-md rounded-lg text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3">
        <h4 className="font-bold text-sm truncate">{product.title}</h4>
        <div className="flex items-center justify-between mt-1">
          <p className="text-[#141414] font-black italic">₹{product.price}</p>
          <p className="text-[10px] font-bold text-[#141414]/40 uppercase tracking-tighter">Stock: {product.stock}</p>
        </div>
      </div>
    </div>
  );
}

function OrderListItem({ order }: { order: Order }) {
  const statusColors = {
    [OrderStatus.PENDING]: 'bg-yellow-100 text-yellow-700',
    [OrderStatus.CONFIRMED]: 'bg-blue-100 text-blue-700',
    [OrderStatus.SHIPPED]: 'bg-purple-100 text-purple-700',
    [OrderStatus.DELIVERED]: 'bg-green-100 text-green-700',
    [OrderStatus.CANCELLED]: 'bg-red-100 text-red-700',
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-[#141414]/5 shadow-sm flex items-center gap-4">
      <div className="w-12 h-12 bg-[#141414]/5 rounded-xl flex items-center justify-center">
        <ShoppingBag className="w-6 h-6 text-[#141414]/20" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-bold text-[#141414]/40 uppercase tracking-widest">Order ID: {order.id.slice(0, 8)}</p>
          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${statusColors[order.status]}`}>
            {order.status}
          </span>
        </div>
        <p className="font-bold text-[#141414]">Total: ₹{order.totalPrice}</p>
        <p className="text-[10px] text-[#141414]/60 flex items-center gap-1 mt-1">
          <Clock className="w-3 h-3" />
          {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      <button className="p-2 hover:bg-[#141414]/5 rounded-xl transition-colors">
        <ArrowRight className="w-5 h-5" />
      </button>
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

  const MAX_PRODUCT_IMAGE_MB = 10;
  const MAX_PRODUCT_IMAGE_BYTES = MAX_PRODUCT_IMAGE_MB * 1024 * 1024;

  const handleImageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !auth.currentUser) return;

    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      alert(`Image must be under ${MAX_PRODUCT_IMAGE_MB}MB. Your file: ${(file.size/1024/1024).toFixed(1)}MB`);
      return;
    }

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
    if (!auth.currentUser) return;
    if (uploadingImage) { alert('Please wait for image to finish uploading.'); return; }

    const docRef = doc(collection(db, "products"));
    const productData: Product = {
      id: docRef.id,
      artisanId: auth.currentUser.uid,
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      stock: Number(formData.stock),
      category: formData.category,
      imageUrl: formData.imageUrl || `https://images.unsplash.com/photo-1590483736622-39da8af7541b?w=400&h=400&fit=crop`, // Default placeholder
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/80 backdrop-blur-sm">
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <h2 className="text-xl font-black italic uppercase tracking-tight">{t('addItem')}</h2>
          
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-[#141414]/40 tracking-widest">{t('itemName')}</label>
            <input
              required
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 bg-[#141414]/3 border-none rounded-xl focus:ring-2 ring-[#141414]"
              placeholder="Ex: Clay Hand-painted Vase"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#141414]/40 tracking-widest">{t('price')} (₹)</label>
              <input
                required
                type="number"
                value={formData.price}
                onChange={e => setFormData({ ...formData, price: e.target.value })}
                className="w-full px-4 py-3 bg-[#141414]/3 border-none rounded-xl focus:ring-2 ring-[#141414]"
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#141414]/40 tracking-widest">Stock</label>
              <input
                required
                type="number"
                value={formData.stock}
                onChange={e => setFormData({ ...formData, stock: e.target.value })}
                className="w-full px-4 py-3 bg-[#141414]/3 border-none rounded-xl focus:ring-2 ring-[#141414]"
                placeholder="1"
              />
            </div>
          </div>

          {/* Image Upload */}
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-[#141414]/40 tracking-widest">Product Image (up to 10MB)</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-40 border-2 border-dashed border-[#141414]/15 rounded-2xl flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-[#141414]/40 transition-colors relative overflow-hidden bg-[#141414]/3"
            >
              {imagePreview ? (
                <img src={imagePreview} alt="preview" className="absolute inset-0 w-full h-full object-cover rounded-2xl" />
              ) : (
                <>
                  <Upload className="w-6 h-6 text-[#141414]/30" />
                  <p className="text-xs font-bold text-[#141414]/40">Tap to upload product photo</p>
                  <p className="text-[10px] text-[#141414]/25">JPG, PNG, WEBP · Max 10MB</p>
                </>
              )}
              {uploadingImage && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center rounded-2xl">
                  <Loader2 className="w-8 h-8 text-[#141414] animate-spin" />
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

          <div className="flex gap-3 pt-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 font-bold text-[#141414]/40">{t('cancel')}</button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="flex-[2] bg-[#141414] text-white py-4 rounded-2xl font-black italic tracking-tight disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {uploadingImage ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : t('addItem')}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
