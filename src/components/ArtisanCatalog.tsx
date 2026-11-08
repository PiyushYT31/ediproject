import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  ShoppingBag, 
  Search, 
  Heart,
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { useI18n, TranslatedText } from '../lib/i18n';
import { db } from '../firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { useCollection } from 'react-firebase-hooks/firestore';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import ProductPurchaseModal from './ProductPurchaseModal';

export default function ArtisanCatalog() {
  const { t, language } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [productsValue, productsLoading] = useCollection(
    query(collection(db, "products"), orderBy("createdAt", "desc"), limit(40))
  );

  const products = productsValue?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)) || [];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = !selectedCategory || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const categories = ['pottery', 'textiles', 'jewelry', 'woodwork', 'leather', 'sculpture', 'paintings'];

  return (
    <div className="space-y-6 p-4">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-6 sm:p-8 text-white shadow-xl shadow-indigo-950/20">
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-[11px] font-bold tracking-wide uppercase text-indigo-300 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5" /> Direct Indian Artisan Marketplace
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
            Handcrafted Treasures,<br className="hidden sm:inline" /> Middleman-Free.
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm max-w-md font-medium leading-relaxed">
            Support traditional Indian artisans directly. Verified authentic pottery, woodwork, textiles, and jewelry.
          </p>

          {/* Search bar inside hero */}
          <div className="relative max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search handcrafted items, pottery, shawls..."
              className="w-full pl-11 pr-4 py-3 bg-white/10 hover:bg-white/15 focus:bg-white/20 border border-white/15 rounded-2xl focus:outline-none focus:border-indigo-400 transition-all text-xs font-medium placeholder:text-slate-400 text-white backdrop-blur-md"
            />
          </div>
        </div>

        {/* Decorative background glow */}
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Categories Filter Pills */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {t('categories') || "Craft Categories"}
          </h3>
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              Clear Filter
            </button>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                selectedCategory === cat 
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/30' 
                : 'bg-white text-slate-700 border-slate-200/90 hover:border-indigo-500/40'
              }`}
            >
              {t(cat) || cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {filteredProducts.map((product) => (
          <ConsumerProductCard
            key={product.id}
            product={product}
            onSelect={() => setSelectedProduct(product)}
          />
        ))}

        {filteredProducts.length === 0 && !productsLoading && (
          <div className="col-span-2 py-16 text-center bg-white rounded-3xl border border-slate-200 space-y-2">
            <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No products found</p>
            <p className="text-xs text-slate-400">Try adjusting your search or category filter.</p>
          </div>
        )}
      </div>

      {/* Purchase Modal */}
      {selectedProduct && (
        <ProductPurchaseModal
          isOpen={Boolean(selectedProduct)}
          onClose={() => setSelectedProduct(null)}
          product={selectedProduct}
        />
      )}
    </div>
  );
}

function ConsumerProductCard({
  product,
  onSelect,
}: {
  key?: string | number;
  product: Product;
  onSelect: () => void;
}) {
  const { language } = useI18n();
  const { isFavorite, toggleFavorite } = useApp();
  const favorited = isFavorite(product.id);

  return (
    <motion.div 
      whileHover={{ y: -3 }}
      className="bg-white rounded-2xl border border-slate-200/90 hover:border-indigo-500/40 overflow-hidden shadow-xs hover:shadow-lg transition-all group flex flex-col cursor-pointer"
      onClick={onSelect}
    >
      <div className="aspect-[4/3] sm:aspect-square bg-slate-100 relative overflow-hidden">
        <img 
          src={product.imageUrl} 
          alt={product.title} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
        <button 
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-2.5 right-2.5 p-1.5 bg-white/90 backdrop-blur-sm rounded-xl text-slate-400 hover:text-rose-500 transition-colors shadow-xs"
        >
          <Heart className={`w-4 h-4 transition-all ${favorited ? "fill-rose-500 text-rose-500 scale-110" : ""}`} />
        </button>

        {product.category && (
          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-slate-900/70 text-white text-[10px] font-bold uppercase tracking-wider backdrop-blur-xs">
            {product.category}
          </span>
        )}
      </div>

      <div className="p-3.5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h4 className="font-bold text-xs sm:text-sm text-slate-900 leading-snug line-clamp-1 group-hover:text-indigo-600 transition-colors">
            <TranslatedText text={product.title} lang={language} />
          </h4>
          <p className="text-slate-900 font-extrabold text-base mt-1">₹{product.price}</p>
        </div>
        
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect();
          }}
          className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
        >
          Buy Directly <ArrowRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}
