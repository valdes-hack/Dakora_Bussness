import { useState, useCallback, memo, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useCart } from '../../context/CartContext';
import { useDataCache } from '../../context/DataCacheContext';
import { useSettings } from '../../context/SettingsContext';
import { usePromo } from '../../hooks/usePromo';
import { ShoppingCart, Check, MessageSquare, SlidersHorizontal, X, ChevronDown, ChevronUp, Zap, ChevronLeft, ChevronRight } from 'lucide-react';
import CountdownTimer from '../../components/ui/CountdownTimer';

// ─── SKELETON ────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="rounded-[2rem] md:rounded-[3.5rem] bg-white/60 dark:bg-white/5 border border-white/20 overflow-hidden animate-pulse">
    <div className="aspect-[4/5] bg-gray-200 dark:bg-white/10" />
    <div className="p-3 md:p-6 space-y-2 md:space-y-3">
      <div className="h-1.5 md:h-2 w-12 md:w-16 bg-gray-200 dark:bg-white/10 rounded-full" />
      <div className="h-3 md:h-5 w-2/3 md:w-3/4 bg-gray-200 dark:bg-white/10 rounded-full" />
      <div className="h-2 md:h-4 w-1/4 md:w-1/3 bg-gray-200 dark:bg-white/10 rounded-full" />
    </div>
  </div>
);

// ─── CARTE PRODUIT ─────────────────────────────────────────────────────────────
const ProductCard = memo(({ product, language, onAddToCart, onWhatsApp, isAdded }) => {
  const { getActivePromo } = usePromo();
  const [variantIndex, setVariantIndex] = useState(0);

  // Cycle des variantes toutes les 5 secondes
  useEffect(() => {
    if (!product.variants || product.variants.length <= 1) return;
    const interval = setInterval(() => {
      setVariantIndex(prev => (prev + 1) % product.variants.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [product.variants, variantIndex]);

  const handlePrevVariant = () => {
    if (!product.variants?.length) return;
    setVariantIndex(prev => (prev - 1 + product.variants.length) % product.variants.length);
  };

  const handleNextVariant = () => {
    if (!product.variants?.length) return;
    setVariantIndex(prev => (prev + 1) % product.variants.length);
  };

  const currentVariant = product.variants?.[variantIndex] || null;
  const activePromoForVariant = currentVariant ? getActivePromo(currentVariant.id) : null;

  const price = currentVariant ? Number(currentVariant.price) : 0;
  const promoPrice = activePromoForVariant ? Number(activePromoForVariant.promo_price) : null;
  const displayPrice = promoPrice ?? price;
  const oldPrice = activePromoForVariant ? price : (currentVariant?.old_price ? Number(currentVariant.old_price) : null);
  const savings = oldPrice && oldPrice > displayPrice ? oldPrice - displayPrice : 0;

  const imageUrl = product.product_images?.[0]?.url;
  const name     = language === 'fr' ? product.name_fr : product.name_en;
  const category = language === 'fr' ? product.categories?.name_fr : product.categories?.name_en;
  const [imgError, setImgError] = useState(false);

  return (
    <div className="group bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md rounded-[1.5rem] md:rounded-[3.5rem] p-2.5 md:p-4 border border-white/20 shadow-xl hover:shadow-dakora-green/10 transition-shadow duration-200 flex flex-col will-change-auto">
      <Link to={`/produit/${product.id}`}
        className="relative aspect-[4/5] rounded-[1.2rem] md:rounded-[2.8rem] overflow-hidden mb-3 md:mb-5 bg-gray-100 dark:bg-black/40 block">
        {imageUrl && !imgError ? (
          <img src={imageUrl} loading="lazy" decoding="async" onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400" alt={name} />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1 md:gap-2 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-neutral-800 dark:to-neutral-700">
            <span className="text-3xl md:text-5xl">📦</span>
            <span className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image indisponible</span>
          </div>
        )}
        {/* Badge promo OU badge produit */}
        {activePromoForVariant ? (
          <span className="absolute top-3 left-3 px-2 py-1 bg-red-500 text-white text-[8px] md:text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-1 animate-pulse">
            <Zap size={9}/> {language === 'fr' ? 'OFFRE LIMITÉE' : 'LIMITED OFFER'}
          </span>
        ) : product.badge ? (
          <span className="absolute top-3 md:top-5 left-3 md:left-5 px-2 md:px-3 py-1 md:py-1.5 bg-dakora-yellow text-yellow-900 text-[8px] md:text-[10px] font-black uppercase rounded-full shadow-lg">
            {product.badge}
          </span>
        ) : null}
      </Link>
      <div className="px-2 md:px-3 pb-2 md:pb-3 flex flex-col flex-grow">
        {category && <span className="text-[8px] md:text-[10px] font-black text-dakora-green uppercase tracking-[0.2em] mb-1">{category}</span>}
        <Link to={`/produit/${product.id}`}>
          <h3 className="text-sm md:text-lg font-black text-gray-900 dark:text-white leading-tight mb-2 md:mb-4 tracking-tighter hover:text-dakora-green transition-colors line-clamp-2">{name}</h3>
        </Link>
        <div className="mt-auto">
          {/* Sélecteur de variante avec flèches opposées */}
          {product.variants?.length > 0 && (
            <div className="flex items-center justify-between mb-3 p-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
              <div className="flex flex-col min-w-0">
                <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                  {language === 'fr' ? 'Option' : 'Option'}
                </span>
                <span className="text-[10px] font-black text-gray-700 dark:text-white truncate max-w-[120px] md:max-w-[150px]">
                  {language === 'fr' ? currentVariant.label_fr : currentVariant.label_en}
                </span>
              </div>
              {product.variants.length > 1 && (
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={(e) => { e.preventDefault(); handlePrevVariant(); }}
                    className="p-1.5 text-gray-400 hover:text-dakora-green hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all active:scale-90"
                    title={language === 'fr' ? 'Option précédente' : 'Previous option'}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <button
                    onClick={(e) => { e.preventDefault(); handleNextVariant(); }}
                    className="p-1.5 text-gray-400 hover:text-dakora-green hover:bg-gray-200 dark:hover:bg-white/10 rounded-lg transition-all active:scale-90"
                    title={language === 'fr' ? 'Option suivante' : 'Next option'}
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Prix */}
          <div className="mb-2 md:mb-3">
            <p className="text-[8px] md:text-[10px] font-bold text-gray-400 uppercase">
              {product.variants?.length > 1 
                ? (language === 'fr' ? 'Modèle sélectionné' : 'Selected model')
                : (language === 'fr' ? 'À partir de' : 'From')}
            </p>
            <div className="flex items-baseline gap-2">
              <p className={`text-lg md:text-2xl font-black tracking-tighter ${activePromoForVariant ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                {displayPrice.toLocaleString()} <span className="text-xs md:text-sm text-dakora-green">FCFA</span>
              </p>
              {activePromoForVariant && (
                <p className="text-sm text-gray-400 line-through font-bold">{price.toLocaleString()}</p>
              )}
            </div>
            {savings > 0 && (
              <p className="text-[9px] font-black text-red-500">
                {language === 'fr' ? `Économisez ${savings.toLocaleString()} FCFA` : `Save ${savings.toLocaleString()} FCFA`}
              </p>
            )}
          </div>
          {/* Compte à rebours compact */}
          {activePromoForVariant?.end_timestamp && (
            <div className="mb-2 md:mb-3">
              <CountdownTimer endTimestamp={activePromoForVariant.end_timestamp} language={language} compact/>
            </div>
          )}
          <div className="flex gap-1.5 md:gap-2">
            <button onClick={e => { e.preventDefault(); onAddToCart(product, currentVariant); }}
              className={`flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3.5 rounded-xl md:rounded-2xl text-[8px] md:text-[10px] font-black uppercase tracking-widest shadow transition-all active:scale-95 ${isAdded ? 'bg-green-500 text-white' : 'bg-dakora-green text-white hover:bg-green-700'}`}>
              {isAdded ? <Check size={13}/> : <ShoppingCart size={13}/>}
              {isAdded ? (language === 'fr' ? 'Ajouté' : 'Added') : (language === 'fr' ? 'Panier' : 'Cart')}
            </button>
            <button onClick={e => { e.preventDefault(); onWhatsApp(product, currentVariant); }}
              className="flex-1 flex items-center justify-center gap-1 md:gap-2 py-2 md:py-3.5 rounded-xl md:rounded-2xl bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white border border-[#25D366]/20 text-[8px] md:text-[10px] font-black uppercase tracking-widest transition-all active:scale-95">
              <MessageSquare size={13}/>
              {language === 'fr' ? 'Payer' : 'Buy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
ProductCard.displayName = 'ProductCard';
        

// ─── SECTION FILTRE (réductible) ─────────────────────────────────────────────
const FilterSection = ({ title, children, defaultOpen = true }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-black/5 dark:border-white/5 pb-4">
      <button onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 hover:text-dakora-green transition-colors">
        {title}
        {open ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
};

// ─── PANNEAU FILTRES ──────────────────────────────────────────────────────────
const FilterPanel = ({ categories, language, filters, setFilters, products, onClose, isMobile }) => {
  // Calcul min/max prix réel depuis les produits
  const allPrices = useMemo(() => products.flatMap(p => p.variants?.map(v => Number(v.price)) || []).filter(Boolean), [products]);
  const globalMin = allPrices.length ? Math.min(...allPrices) : 0;
  const globalMax = allPrices.length ? Math.max(...allPrices) : 5000000;

  // Badges uniques présents dans le catalogue
  const badges = useMemo(() => [...new Set(products.map(p => p.badge).filter(Boolean))], [products]);

  const label = language === 'fr';

  const sortOptions = [
    { value: 'default', label: label ? 'Par défaut' : 'Default' },
    { value: 'price_asc', label: label ? 'Prix croissant' : 'Price: low to high' },
    { value: 'price_desc', label: label ? 'Prix décroissant' : 'Price: high to low' },
    { value: 'name_asc', label: label ? 'Nom A → Z' : 'Name A → Z' },
    { value: 'name_desc', label: label ? 'Nom Z → A' : 'Name Z → A' },
  ];

  const reset = () => setFilters({ category: 'all', priceMin: '', priceMax: '', badge: '', sort: 'default' });
  const hasActive = filters.category !== 'all' || filters.priceMin || filters.priceMax || filters.badge || filters.sort !== 'default';

  return (
    <aside className={`${isMobile ? 'w-full' : 'w-56 md:w-64 flex-shrink-0'} bg-white/80 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2rem] border border-white/20 shadow-xl p-4 md:p-6 space-y-4 md:space-y-5 ${isMobile ? '' : 'sticky top-24 md:top-28 max-h-[calc(100vh-8rem)] overflow-y-auto'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 md:gap-2">
          <SlidersHorizontal size={15} className="text-dakora-green"/>
          <span className="font-black text-xs md:text-sm uppercase tracking-widest text-gray-900 dark:text-white">
            {label ? 'Filtres' : 'Filters'}
          </span>
          {hasActive && (
            <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-dakora-green animate-pulse"/>
          )}
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          {hasActive && (
            <button onClick={reset} className="text-[8px] md:text-[9px] font-black uppercase text-red-400 hover:text-red-500 transition-colors">
              {label ? 'Réinitialiser' : 'Reset'}
            </button>
          )}
          {isMobile && <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600"><X size={16}/></button>}
        </div>
      </div>

      {/* Catégorie */}
      <FilterSection title={label ? 'Catégorie' : 'Category'}>
        <button
          onClick={() => setFilters(f => ({ ...f, category: 'all' }))}
          className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${filters.category === 'all' ? 'bg-dakora-green text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
          {label ? 'Tous les produits' : 'All products'}
        </button>
        {categories.map(cat => (
          <button key={cat.id}
            onClick={() => setFilters(f => ({ ...f, category: cat.id }))}
            className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all flex items-center gap-1.5 md:gap-2 ${filters.category === cat.id ? 'bg-dakora-green text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            <span className="text-sm md:text-base">{cat.icon_url}</span>
            <span className="truncate">{language === 'fr' ? cat.name_fr : cat.name_en}</span>
          </button>
        ))}
      </FilterSection>

      {/* Prix */}
      <FilterSection title={label ? 'Fourchette de prix' : 'Price range'}>
        <div className="flex items-center gap-1.5 md:gap-2">
          <input type="number" placeholder={`Min (${globalMin.toLocaleString()})`} value={filters.priceMin}
            onChange={e => setFilters(f => ({ ...f, priceMin: e.target.value }))}
            className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-neutral-800 text-[10px] md:text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none"/>
        </div>
        <div className="flex items-center gap-1.5 md:gap-2">
          <input type="number" placeholder={`Max (${globalMax.toLocaleString()})`} value={filters.priceMax}
            onChange={e => setFilters(f => ({ ...f, priceMax: e.target.value }))}
            className="w-full px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl bg-gray-50 dark:bg-neutral-800 text-[10px] md:text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none"/>
        </div>
        <p className="text-[8px] md:text-[9px] text-gray-400 font-bold uppercase">FCFA</p>
      </FilterSection>

      {/* Badge */}
      {badges.length > 0 && (
        <FilterSection title={label ? 'Promotion / Badge' : 'Badge'}>
          <button onClick={() => setFilters(f => ({ ...f, badge: '' }))}
            className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${!filters.badge ? 'bg-dakora-green text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            {label ? 'Tous' : 'All'}
          </button>
          {badges.map(b => (
            <button key={b} onClick={() => setFilters(f => ({ ...f, badge: b }))}
              className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${filters.badge === b ? 'bg-dakora-yellow text-yellow-900' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
              {b}
            </button>
          ))}
        </FilterSection>
      )}

      {/* Tri */}
      <FilterSection title={label ? 'Trier par' : 'Sort by'}>
        {sortOptions.map(opt => (
          <button key={opt.value} onClick={() => setFilters(f => ({ ...f, sort: opt.value }))}
            className={`w-full text-left px-2 md:px-3 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[10px] md:text-xs font-bold transition-all ${filters.sort === opt.value ? 'bg-dakora-green text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'}`}>
            {opt.label}
          </button>
        ))}
      </FilterSection>
    </aside>
  );
};

// ─── PAGE BOUTIQUE ─────────────────────────────────────────────────────────────
const Shop = () => {
  const { language } = useLanguage();
  const { addToCart }   = useCart();
  const { settings }    = useSettings();
  const { products, categories, ready, fastRefresh } = useDataCache();
  const { getActivePromo } = usePromo();

  // Rafraîchissement automatique toutes les 2s pour la boutique
  useEffect(() => {
    const interval = setInterval(() => {
      fastRefresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [fastRefresh]);

  const [addedId, setAddedId] = useState(null);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    category: 'all',
    priceMin: '',
    priceMax: '',
    badge: '',
    sort: 'default',
  });

  const handleAddToCart = useCallback((product, selectedVariant) => {
    const variant = selectedVariant || (product.variants?.length ? [...product.variants].sort((a, b) => a.price - b.price)[0] : null);
    if (!variant) return;
    addToCart(product, variant, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  }, [addToCart]);

  const handleWhatsApp = useCallback((product, selectedVariant) => {
    const waNumber = settings.whatsapp_number || '237690000000';
    const siteName = settings.business_name || 'Dakora Business';
    const name = language === 'fr' ? product.name_fr : product.name_en;
    const variant = selectedVariant || (product.variants?.length ? [...product.variants].sort((a, b) => a.price - b.price)[0] : null);
    const varLabel = variant ? (language === 'fr' ? variant.label_fr : variant.label_en) : '';
    const price = variant ? Number(variant.price) : 0;
    const msg = variant 
      ? `Bonjour ${siteName} 👋\nJe suis intéressé(e) par :\n*${name}* (${varLabel}) au prix de *${price.toLocaleString()} FCFA*.\nPouvez-vous m'en dire plus ?`
      : `Bonjour ${siteName} 👋\nJe suis intéressé(e) par :\n*${name}*.\nPouvez-vous m'en dire plus ?`;
    window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [settings.whatsapp_number, settings.business_name, language]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    // Catégorie
    if (filters.category !== 'all') list = list.filter(p => p.category_id === filters.category);
    // Prix min
    if (filters.priceMin) {
      const min = Number(filters.priceMin);
      list = list.filter(p => p.variants?.some(v => Number(v.price) >= min));
    }
    // Prix max
    if (filters.priceMax) {
      const max = Number(filters.priceMax);
      list = list.filter(p => p.variants?.some(v => Number(v.price) <= max));
    }
    // Badge
    if (filters.badge) list = list.filter(p => p.badge === filters.badge);
    // Tri
    if (filters.sort === 'price_asc') {
      list.sort((a, b) => Math.min(...(a.variants?.map(v => Number(v.price)) || [0])) - Math.min(...(b.variants?.map(v => Number(v.price)) || [0])));
    } else if (filters.sort === 'price_desc') {
      list.sort((a, b) => Math.min(...(b.variants?.map(v => Number(v.price)) || [0])) - Math.min(...(a.variants?.map(v => Number(v.price)) || [0])));
    } else if (filters.sort === 'name_asc') {
      list.sort((a, b) => {
        const nameA = (language === 'fr' ? a.name_fr : (a.name_en || a.name_fr)) || '';
        const nameB = (language === 'fr' ? b.name_fr : (b.name_en || b.name_fr)) || '';
        return nameA.localeCompare(nameB);
      });
    } else if (filters.sort === 'name_desc') {
      list.sort((a, b) => {
        const nameA = (language === 'fr' ? a.name_fr : (a.name_en || a.name_fr)) || '';
        const nameB = (language === 'fr' ? b.name_fr : (b.name_en || b.name_fr)) || '';
        return nameB.localeCompare(nameA);
      });
    }
    return list;
  }, [products, filters, language]);

  const hasActiveFilters = filters.category !== 'all' || filters.priceMin || filters.priceMax || filters.badge || filters.sort !== 'default';

  return (
    <div className="min-h-screen pb-16 md:pb-20">
      {/* HEADER */}
      <section className="pt-20 md:pt-24 pb-6 md:pb-8 px-4 md:px-6 text-center">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-2 md:mb-3">
          {language === 'fr' ? 'Notre Boutique' : 'Our Shop'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 font-medium max-w-xl mx-auto text-xs md:text-sm">
          {language === 'fr' ? 'Le meilleur matériel pour votre exploitation.' : 'The best equipment for your farm.'}
        </p>
      </section>

      {/* BOUTON FILTRE MOBILE */}
      <div className="lg:hidden px-4 mb-4 md:mb-6">
        <button onClick={() => setMobileFilterOpen(true)}
          className={`flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border transition-all ${hasActiveFilters ? 'bg-dakora-green text-white border-dakora-green shadow-lg' : 'bg-white/70 dark:bg-white/5 border-white/20 text-gray-600 dark:text-gray-300 shadow'}`}>
          <SlidersHorizontal size={13}/>
          {language === 'fr' ? 'Filtres' : 'Filters'}
          {hasActiveFilters && <span className="w-1.5 md:w-2 h-1.5 md:h-2 rounded-full bg-white animate-pulse"/>}
        </button>
      </div>

      {/* FILTRE MOBILE — drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-[60] flex items-end lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileFilterOpen(false)}/>
          <div className="relative w-full max-h-[85vh] overflow-y-auto bg-white dark:bg-neutral-900 rounded-t-[2rem] md:rounded-t-[2.5rem] p-4 md:p-6 animate-in slide-in-from-bottom-4 duration-300">
            <FilterPanel categories={categories} language={language} filters={filters} setFilters={setFilters}
              products={products} onClose={() => setMobileFilterOpen(false)} isMobile={true}/>
          </div>
        </div>
      )}

      {/* LAYOUT 2 COLONNES : filtre gauche + grille droite */}
      <div className="max-w-7xl mx-auto px-3 md:px-4 lg:px-6 flex gap-4 md:gap-6 lg:gap-8 items-start">

        {/* FILTRE DESKTOP — colonne gauche */}
        <div className="hidden lg:block">
          <FilterPanel categories={categories} language={language} filters={filters} setFilters={setFilters}
            products={products} onClose={() => {}} isMobile={false}/>
        </div>

        {/* GRILLE DROITE */}
        <div className="flex-grow min-w-0">
          {/* Compteur + filtre actifs */}
          <div className="flex items-center justify-between mb-4 md:mb-6 flex-wrap gap-2 md:gap-3">
            <p className="text-[10px] md:text-xs text-gray-400 font-bold">
              {ready ? `${filteredProducts.length} ${language === 'fr' ? 'produit(s)' : 'product(s)'}` : ''}
            </p>
            {hasActiveFilters && (
              <button onClick={() => setFilters({ category: 'all', priceMin: '', priceMax: '', badge: '', sort: 'default' })}
                className="flex items-center gap-1 md:gap-1.5 px-2 md:px-3 py-1 md:py-1.5 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase hover:bg-red-100 transition-all">
                <X size={11}/> {language === 'fr' ? 'Effacer' : 'Clear'}
              </button>
            )}
          </div>

          {!ready ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {Array.from({ length: 6 }).map((_, n) => <SkeletonCard key={n}/>)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-12 md:py-20 bg-white/20 dark:bg-white/5 rounded-[2rem] md:rounded-[3rem] border-2 border-dashed border-gray-200 dark:border-white/10">
              <p className="text-gray-400 italic font-bold text-xs md:text-sm">
                {language === 'fr' ? 'Aucun produit ne correspond à ces filtres.' : 'No products match these filters.'}
              </p>
            </div>
          ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
              {filteredProducts.map(product => {
                return (
                  <ProductCard key={product.id} product={product} language={language}
                    onAddToCart={handleAddToCart} onWhatsApp={handleWhatsApp}
                    isAdded={addedId === product.id}/>
                );
              })}
              </div>
          )}
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>
    </div>
  );
};

export default Shop;
