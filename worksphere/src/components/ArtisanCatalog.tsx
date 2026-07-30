import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Filter, 
  TrendingUp,
  ChevronRight,
  ArrowRight,
  Star
} from 'lucide-react';
import { useI18n, TranslatedText } from '../lib/i18n';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, doc, setDoc, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Product, Order, OrderStatus, UserRole } from '../types';

export default function ArtisanCatalog() {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [productsValue, productsLoading] = useCollection(
    query(collection(db, "products"), orderBy("createdAt", "desc"), limit(20))
  );

  const products = productsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)) || [];

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = !selectedCategory || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['pottery', 'textiles', 'jewelry', 'woodwork', 'leather', 'sculpture', 'paintings'];

  return (
    <div className="space-y-6 pb-24">
      <div className="bg-[#141414] -mx-4 p-8 pt-12 rounded-b-[3rem] text-white space-y-6">
        <div>
          <h2 className="text-4xl font-black italic tracking-tighter leading-none mb-2">
            LOCAL ARTISAN<br/>TREASURES
          </h2>
          <p className="text-[#F5F5F0]/60 text-sm font-medium tracking-wide">
            Supporting regional craftsmanship through direct commerce.
          </p>
        </div>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={t('searchPlaceholder')}
            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:border-white transition-all backdrop-blur-md"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#141414]/40">{t('categories')}</h3>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`flex-shrink-0 px-6 py-3 rounded-2xl font-bold text-xs transition-all border ${
                selectedCategory === cat 
                ? 'bg-[#141414] text-white border-transparent' 
                : 'bg-white text-[#141414] border-[#141414]/10 hover:border-[#141414]'
              }`}
            >
              {t(cat)}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <div key={product.id}>
            <ConsumerProductCard product={product} />
          </div>
        ))}
        {filteredProducts.length === 0 && !productsLoading && (
          <div className="col-span-2 py-20 text-center bg-white rounded-[2.5rem] border border-[#141414]/5">
            <ShoppingBag className="w-12 h-12 text-[#141414]/10 mx-auto mb-4" />
            <p className="text-[#141414]/40 font-black uppercase tracking-widest text-xs">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
}

function ConsumerProductCard({ product }: { product: Product }) {
  const { t, language } = useI18n();
  const [buying, setBuying] = useState(false);

  const handleBuy = async () => {
    if (!auth.currentUser) return alert('Please sign in to purchase');
    
    setBuying(true);
    const orderId = doc(collection(db, "orders")).id;
    const order: Order = {
      id: orderId,
      consumerId: auth.currentUser.uid,
      artisanId: product.artisanId,
      productId: product.id,
      quantity: 1,
      totalPrice: product.price,
      status: OrderStatus.PENDING,
      shippingAddress: 'Current Location',
      createdAt: Date.now()
    };

    try {
      await setDoc(doc(db, "orders", orderId), order);
      alert('Order placed successfully!');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, "orders");
    } finally {
      setBuying(false);
    }
  };

  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className="bg-white rounded-[2rem] border border-[#141414]/5 overflow-hidden shadow-sm hover:shadow-xl transition-all group"
    >
      <div className="aspect-[4/5] bg-[#141414]/3 relative overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
        />
        <button className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-sm rounded-xl text-[#141414]/40 hover:text-red-500 transition-colors">
          <Star className="w-4 h-4" />
        </button>
      </div>
      <div className="p-4 space-y-3">
        <div>
          <h4 className="font-bold text-sm leading-tight mb-1 truncate">
            <TranslatedText text={product.title} lang={language} />
          </h4>
          <p className="text-[#141414] font-black italic text-lg">₹{product.price}</p>
        </div>
        
        <button 
          onClick={handleBuy}
          disabled={buying}
          className="w-full py-3 bg-[#141414] text-white rounded-xl text-[10px] font-black uppercase tracking-[0.1em] flex items-center justify-center gap-2 hover:bg-[#141414]/90 active:scale-95 transition-all disabled:opacity-50"
        >
          {buying ? t('loading') : (
            <>
              {t('buyNow')}
              <ArrowRight className="w-3 h-3" />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
