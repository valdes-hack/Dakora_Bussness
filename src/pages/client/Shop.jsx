import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext'; // Import du panier
import { ShoppingCart, LayoutGrid, Check } from 'lucide-react';

const Shop = () => {
  const { t, language } = useLanguage();
  const { addToCart } = useCart(); // On récupère la fonction d'ajout
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [addedId, setAddedId] = useState(null); // Pour une petite animation de succès

  useEffect(() => {
    fetchShopData();
  }, []);

  const fetchShopData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('categories').select('*').order('order_index');
    setCategories(cats || []);

    const { data: prods } = await supabase
      .from('products')
      .select('*, categories(name_fr, name_en), variants(*), product_images(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    setProducts(prods || []);
    setLoading(false);
  };

  const handleAddToCart = (e, product) => {
    e.preventDefault(); // Empêche de cliquer sur le lien de la fiche produit
    if (product.variants && product.variants.length > 0) {
      // On ajoute la variante la moins chère par défaut
      const defaultVariant = product.variants.sort((a, b) => a.price - b.price)[0];
      addToCart(product, defaultVariant, 1);
      
      // Petite animation de succès sur le bouton
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    }
  };

  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(p => p.category_id === selectedCategory);

  return (
    <div className="min-h-screen pb-20 animate-in fade-in duration-1000">
      
      {/* HEADER DE LA BOUTIQUE */}
      <section className="pt-10 pb-12 px-6 text-center">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-4">
          {t('shop_title')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-2xl mx-auto italic">
          {t('shop_subtitle')}
        </p>
      </section>

      {/* BARRE DE FILTRES (Glassmorphism) */}
      <div className="sticky top-24 z-40 px-4 mb-12">
        <div className="max-w-5xl mx-auto bg-white/60 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 p-2 rounded-[2rem] shadow-2xl flex items-center gap-2 overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === 'all' ? 'bg-dakora-green text-white shadow-lg scale-105' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'}`}
          >
            {t('filter_all')}
          </button>
          {categories.map(cat => (
            <button 
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat.id ? 'bg-dakora-green text-white shadow-lg scale-105' : 'text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-white/5'}`}
            >
              {cat.icon_url} {language === 'fr' ? cat.name_fr : cat.name_en}
            </button>
          ))}
        </div>
      </div>

      {/* GRILLE DE PRODUITS */}
      <div className="max-w-7xl mx-auto px-6">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-[450px] rounded-[3rem] bg-gray-200 dark:bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-20 bg-white/20 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10">
            <p className="text-gray-400 italic font-bold">{t('no_products')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
            {filteredProducts.map(product => {
              const minPrice = product.variants?.length > 0 
                ? Math.min(...product.variants.map(v => v.price)) 
                : 0;

              return (
                <div key={product.id} className="group bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-[3.5rem] p-4 border border-white/20 shadow-xl hover:shadow-dakora-green/20 transition-all duration-500 flex flex-col">
                  
                  {/* LIEN VERS DÉTAILS (IMAGE) */}
                  <Link to={`/produit/${product.id}`} className="relative aspect-[4/5] rounded-[2.8rem] overflow-hidden mb-6 bg-gray-100 dark:bg-black/40">
                    <img 
                      src={product.product_images?.[0]?.url || 'https://via.placeholder.com/600x800'} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={product.name_fr}
                    />
                    {product.badge && (
                      <div className="absolute top-6 left-6 px-4 py-2 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase rounded-full shadow-xl">
                        {product.badge}
                      </div>
                    )}
                  </Link>

                  {/* INFOS PRODUIT */}
                  <div className="px-4 pb-4 flex flex-col flex-grow">
                    <span className="text-[10px] font-black text-dakora-green uppercase tracking-[0.2em] mb-2">
                      {language === 'fr' ? product.categories?.name_fr : product.categories?.name_en}
                    </span>
                    <Link to={`/produit/${product.id}`}>
                      <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-tight mb-4 tracking-tighter hover:text-dakora-green transition-colors">
                        {language === 'fr' ? product.name_fr : product.name_en}
                      </h3>
                    </Link>
                    
                    <div className="mt-auto flex items-end justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{t('price_from')}</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                          {minPrice.toLocaleString()} <span className="text-sm text-dakora-green">FCFA</span>
                        </p>
                      </div>
                      
                      {/* BOUTON D'ACTION AJOUT PANIER */}
                      <button 
                        onClick={(e) => handleAddToCart(e, product)}
                        className={`p-5 rounded-2xl shadow-lg transition-all active:scale-90 ${addedId === product.id ? 'bg-green-500 text-white rotate-[360deg]' : 'bg-dakora-green text-white hover:bg-green-700 hover:rotate-12'}`}
                      >
                        {addedId === product.id ? <Check size={24} /> : <ShoppingCart size={24} />}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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