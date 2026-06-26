import { useState, useEffect, useCallback, memo } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { ShoppingCart, Check } from 'lucide-react';

// ─── SKELETON CARD (évite le layout shift) ───────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-[3.5rem] bg-white/60 dark:bg-white/5 border border-white/20 overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-gray-200 dark:bg-white/10" />
    <div className="p-6 space-y-3">
      <div className="h-2 w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
      <div className="h-5 w-3/4 bg-gray-200 dark:bg-white/10 rounded-full" />
      <div className="h-4 w-1/2 bg-gray-200 dark:bg-white/10 rounded-full" />
    </div>
  </div>
);

// ─── CARTE PRODUIT MÉMORISÉE (pas de re-render si les props ne changent pas) ──
const ProductCard = memo(({ product, language, t, onAddToCart, isAdded }) => {
  const minPrice = product.variants?.length > 0
    ? Math.min(...product.variants.map(v => Number(v.price)))
    : 0;
  const imageUrl = product.product_images?.[0]?.url;
  const name = language === 'fr' ? product.name_fr : product.name_en;
  const category = language === 'fr' ? product.categories?.name_fr : product.categories?.name_en;

  return (
    <div className="group bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-[3.5rem] p-4 border border-white/20 shadow-xl hover:shadow-dakora-green/10 transition-shadow duration-300 flex flex-col">

      {/* IMAGE — lazy loading natif */}
      <Link to={`/produit/${product.id}`} className="relative aspect-[4/5] rounded-[2.8rem] overflow-hidden mb-6 bg-gray-100 dark:bg-black/40 block">
        {imageUrl ? (
          <img
            src={imageUrl}
            loading="lazy"
            decoding="async"
            width={600}
            height={750}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            alt={name}
          />
        ) : (
          <div className="w-full h-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-300 text-sm">📦</div>
        )}
        {product.badge && (
          <div className="absolute top-6 left-6 px-4 py-2 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase rounded-full shadow-xl">
            {product.badge}
          </div>
        )}
      </Link>

      {/* INFOS */}
      <div className="px-4 pb-4 flex flex-col flex-grow">
        {category && (
          <span className="text-[10px] font-black text-dakora-green uppercase tracking-[0.2em] mb-2">
            {category}
          </span>
        )}
        <Link to={`/produit/${product.id}`}>
          <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight mb-4 tracking-tighter hover:text-dakora-green transition-colors line-clamp-2">
            {name}
          </h3>
        </Link>

        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase">{t('price_from')}</p>
            <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
              {minPrice.toLocaleString()} <span className="text-sm text-dakora-green">FCFA</span>
            </p>
          </div>
          <button
            onClick={(e) => { e.preventDefault(); onAddToCart(product); }}
            aria-label={t('add_to_cart')}
            className={`p-4 rounded-2xl shadow-lg transition-all duration-200 active:scale-90 ${
              isAdded ? 'bg-green-500 text-white' : 'bg-dakora-green text-white hover:bg-green-700'
            }`}
          >
            {isAdded ? <Check size={22} /> : <ShoppingCart size={22} />}
          </button>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';

// ─── PAGE BOUTIQUE ────────────────────────────────────────────────────────────
const Shop = () => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null);

  useEffect(() => {
    // Lancer les 2 requêtes EN PARALLÈLE
    const fetchAll = async () => {
      setLoading(true);
      const [{ data: cats }, { data: prods }] = await Promise.all([
        supabase.from('categories').select('id, name_fr, name_en, icon_url').order('order_index'),
        supabase
          .from('products')
          .select(`
            id, name_fr, name_en, badge, category_id, is_active,
            categories(name_fr, name_en),
            variants(id, price, label_fr, label_en),
            product_images(url, is_main, order_index)
          `)
          .eq('is_active', true)
          .order('order_index')
          .order('created_at', { ascending: false })
      ]);
      setCategories(cats || []);
      setProducts(prods || []);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const handleAddToCart = useCallback((product) => {
    if (!product.variants?.length) return;
    const variant = [...product.variants].sort((a, b) => a.price - b.price)[0];
    addToCart(product, variant, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1800);
  }, [addToCart]);

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category_id === selectedCategory);

  return (
    <div className="min-h-screen pb-20">

      {/* HEADER */}
      <section className="pt-10 pb-12 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-4">
          {t('shop_title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto italic">
          {t('shop_subtitle')}
        </p>
      </section>

      {/* FILTRES */}
      <div className="sticky top-24 z-40 px-4 mb-12">
        <div className="max-w-5xl mx-auto bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-2 rounded-[2rem] shadow-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              selectedCategory === 'all' ? 'bg-dakora-green text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'
            }`}
          >
            {t('filter_all')}
          </button>
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat.id ? 'bg-dakora-green text-white shadow-lg' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'
              }`}
            >
              {cat.icon_url} {language === 'fr' ? cat.name_fr : cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {Array.from({ length: 6 }).map((_, n) => <SkeletonCard key={n} />)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/20 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-400 italic font-bold">{t('no_products')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                language={language}
                t={t}
                onAddToCart={handleAddToCart}
                isAdded={addedId === product.id}
              />
            ))}
          </div>
        )}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default Shop;
