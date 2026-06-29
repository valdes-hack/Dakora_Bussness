import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useDataCache } from '../../context/DataCacheContext';
import { useCart } from '../../context/CartContext';
import { ChevronLeft, MessageCircle, Package, ArrowRight, ShoppingCart, Check, Share2, X, Link as LinkIcon, CheckCircle2 } from 'lucide-react';

// ─── SKELETON ─────────────────────────────────────────────────────────────────
const Skeleton = () => (
  <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 animate-pulse">
    <div className="h-3 w-28 bg-gray-200 dark:bg-white/10 rounded-full mb-10" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div className="aspect-square rounded-[3rem] bg-gray-200 dark:bg-white/10" />
      <div className="space-y-5">
        <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded-full" />
        <div className="h-9 w-3/4 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="h-7 w-28 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="flex gap-3">
          {[1,2].map(i => <div key={i} className="h-12 w-28 bg-gray-200 dark:bg-white/10 rounded-2xl" />)}
        </div>
        <div className="h-28 bg-gray-200 dark:bg-white/10 rounded-[2rem]" />
        <div className="h-14 bg-gray-200 dark:bg-white/10 rounded-[2rem]" />
      </div>
    </div>
  </div>
);

// ─── PANNEAU DE PARTAGE PRODUIT ───────────────────────────────────────────────
const ShareProductPanel = ({ product, language, waNumber, onClose }) => {
  const name = language === 'fr' ? product.name_fr : product.name_en;
  const productUrl = `${window.location.origin}/produit/${product.id}`;
  const imgUrl = product.product_images?.[0]?.url || '';
  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map(v => Number(v.price))) : 0;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(productUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = `${name} — à partir de ${minPrice.toLocaleString()} FCFA\n${productUrl}`;

  const options = [
    {
      name: 'WhatsApp', auto: false,
      hint: language === 'fr' ? 'Ouvre WhatsApp avec le produit pré-rempli' : 'Opens WhatsApp with product prefilled',
      bg: 'bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white', text: 'text-[#25D366]',
      action: () => window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`, '_blank'),
      icon: <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current"><path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/></svg>
    },
    {
      name: 'Facebook', auto: true,
      hint: language === 'fr' ? 'Partage direct via Facebook' : 'Direct share via Facebook',
      bg: 'bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white', text: 'text-[#1877F2]',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(name)}`, '_blank', 'width=600,height=400'),
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
    },
    {
      name: 'Telegram', auto: true,
      hint: language === 'fr' ? 'Partage direct via Telegram' : 'Direct share via Telegram',
      bg: 'bg-[#0088CC]/10 hover:bg-[#0088CC] hover:text-white', text: 'text-[#0088CC]',
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(name)}`, '_blank'),
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    },
    {
      name: 'TikTok', auto: false,
      hint: language === 'fr' ? 'Copie le lien — collez en description TikTok' : 'Copies link — paste in TikTok description',
      bg: 'bg-black/10 hover:bg-black hover:text-white dark:bg-white/10 dark:hover:bg-white dark:hover:text-black', text: 'text-black dark:text-white',
      action: () => { copyLink(); window.open('https://www.tiktok.com/', '_blank'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
    },
    {
      name: 'Instagram', auto: false,
      hint: language === 'fr' ? 'Copie le lien — collez en bio Instagram' : 'Copies link — paste in Instagram bio',
      bg: 'bg-[#E1306C]/10 hover:bg-[#E1306C] hover:text-white', text: 'text-[#E1306C]',
      action: () => { copyLink(); window.open('https://www.instagram.com/', '_blank'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            {imgUrl && <img src={imgUrl} alt="" className="w-11 h-11 rounded-xl object-cover flex-shrink-0" />}
            <div className="min-w-0">
              <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight truncate max-w-[180px]">{name}</p>
              <p className="text-[10px] text-dakora-green font-bold">{minPrice.toLocaleString()} FCFA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 flex-shrink-0"><X size={18}/></button>
        </div>
        {/* Copier lien */}
        <div className="px-5 pt-4 pb-2">
          <button onClick={copyLink} className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${copied ? 'border-dakora-green bg-dakora-green/5 text-dakora-green' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:border-dakora-green'}`}>
            {copied ? <CheckCircle2 size={15}/> : <LinkIcon size={15}/>}
            {copied ? (language === 'fr' ? 'Lien copié !' : 'Link copied!') : (language === 'fr' ? 'Copier le lien' : 'Copy link')}
          </button>
        </div>
        {/* Options */}
        <div className="p-5 space-y-2">
          {options.map(opt => (
            <button key={opt.name} onClick={opt.action} className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${opt.bg} ${opt.text}`}>
              <span className="flex-shrink-0">{opt.icon}</span>
              <div className="text-left flex-grow min-w-0">
                <p className="font-black text-sm">{opt.name}</p>
                <p className="text-[10px] opacity-70 font-medium truncate">{opt.hint}</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full flex-shrink-0 ${opt.auto ? 'bg-green-500/20 text-green-600' : 'bg-orange-500/20 text-orange-600'}`}>
                {opt.auto ? '✓ Auto' : '~ Manuel'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const ProductDetails = () => {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { products } = useDataCache(); // ← lecture cache, instantané
  const { addToCart } = useCart();

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage]             = useState('');
  const [similarProducts, setSimilarProducts] = useState([]);
  const [simLoaded, setSimLoaded]             = useState(false);
  const [addedToCart, setAddedToCart]         = useState(false);
  const [showShare, setShowShare]             = useState(false);

  // Trouver le produit dans le cache — 0ms réseau
  const product = useMemo(
    () => products.find(p => p.id === id) || null,
    [products, id]
  );

  // Quand le produit est dispo, initialiser l'état
  useEffect(() => {
    if (!product) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setMainImage(product.product_images?.[0]?.url || '');
    setSelectedVariant(product.variants?.[0] || null);
    setSimLoaded(false);
    setSimilarProducts([]);
  }, [product?.id]); // eslint-disable-line

  // Produits similaires — en arrière-plan, ne bloque rien
  useEffect(() => {
    if (!product || simLoaded) return;
    const sim = products
      .filter(p => p.category_id === product.category_id && p.id !== product.id)
      .slice(0, 4);
    setSimilarProducts(sim);
    setSimLoaded(true);
  }, [product, products, simLoaded]);

  const handleWhatsAppOrder = useCallback(() => {
    if (!product || !selectedVariant) return;
    const phone       = settings.whatsapp_number || '237600000000';
    const name        = settings.business_name   || 'Dakora Business';
    const productName = language === 'fr' ? product.name_fr  : product.name_en;
    const varLabel    = language === 'fr' ? selectedVariant.label_fr : selectedVariant.label_en;
    const msg = t('whatsapp_msg').replace('{{name}}', name)
      + ` *${productName}* | ${language === 'fr' ? 'Modèle' : 'Model'} : *${varLabel}* | Prix : *${selectedVariant.price?.toLocaleString()} FCFA*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [product, selectedVariant, settings, language, t]);

  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant) return;
    addToCart(product, selectedVariant, 1);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [product, selectedVariant, addToCart]);

  // Cache pas encore prêt → skeleton
  if (!product && products.length === 0) return <Skeleton />;

  // Produit introuvable
  if (!product) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-2xl font-black text-gray-400 uppercase italic">Produit introuvable</p>
      <button onClick={() => navigate('/boutique')}
        className="px-8 py-4 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-xs">
        {t('back_to_shop')}
      </button>
    </div>
  );

  const name        = language === 'fr' ? product.name_fr        : product.name_en;
  const description = language === 'fr' ? product.description_fr : product.description_en;
  const category    = language === 'fr' ? product.categories?.name_fr : product.categories?.name_en;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

      {/* RETOUR */}
      <Link to="/boutique"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-dakora-green font-bold text-xs uppercase tracking-widest mb-10 transition-colors">
        <ChevronLeft size={16} /> {t('back_to_shop')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* GALERIE */}
        <div className="space-y-4">
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/20 shadow-2xl">
            <img
              src={mainImage || 'https://via.placeholder.com/800'}
              alt={name}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover transition-opacity duration-200"
            />
          </div>
          {product.product_images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {product.product_images.map(img => (
                <button key={img.id} onClick={() => setMainImage(img.url)}
                  className={`w-20 h-20 flex-shrink-0 rounded-2xl overflow-hidden border-2 transition-all ${
                    mainImage === img.url ? 'border-dakora-green shadow-lg' : 'border-transparent opacity-50 hover:opacity-100'
                  }`}
                >
                  <img src={img.url} loading="lazy" className="w-full h-full object-cover" alt="" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* INFOS */}
        <div className="space-y-7">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {category && (
                <span className="px-3 py-1 bg-dakora-green/10 text-dakora-green text-[10px] font-black uppercase tracking-widest rounded-full">
                  {category}
                </span>
              )}
              {product.badge && (
                <span className="px-3 py-1 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-5">
              {name}
            </h1>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-dakora-green tracking-tighter">
                {selectedVariant?.price?.toLocaleString()} <span className="text-sm">FCFA</span>
              </span>
              {selectedVariant?.old_price && (
                <span className="text-xl text-gray-400 line-through font-bold">
                  {selectedVariant.old_price.toLocaleString()}
                </span>
              )}
            </div>
          </div>

          {/* VARIANTES */}
          {product.variants?.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Package size={14} /> {t('variant_choice')}
              </label>
              <div className="flex flex-wrap gap-3">
                {product.variants.map(v => (
                  <button key={v.id} onClick={() => setSelectedVariant(v)}
                    className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                      selectedVariant?.id === v.id
                        ? 'border-dakora-green bg-dakora-green/5 text-dakora-green shadow-md'
                        : 'border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {language === 'fr' ? v.label_fr : v.label_en}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* DESCRIPTION */}
          {description && (
            <div className="bg-white/60 dark:bg-black/20 backdrop-blur-md p-6 rounded-[2rem] border border-white/20">
              <h4 className="text-xs font-black uppercase tracking-widest text-dakora-green mb-3">{t('description_title')}</h4>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm">{description}</p>
            </div>
          )}

          {/* BOUTONS D'ACTION */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button onClick={handleAddToCart}
              disabled={addedToCart}
              className={`flex-1 py-5 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl transition-all flex items-center justify-center gap-4 active:scale-95 ${
                addedToCart
                  ? 'bg-green-500 text-white'
                  : 'bg-dakora-green text-white hover:bg-green-700'
              }`}>
              {addedToCart ? <Check size={22} /> : <ShoppingCart size={22} />}
              {addedToCart ? t('added') : t('add_to_cart')}
            </button>
            <button onClick={handleWhatsAppOrder}
              className="flex-1 py-5 bg-white dark:bg-white/10 text-gray-900 dark:text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-gray-100 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-4 active:scale-95 border-2 border-dakora-green">
              <MessageCircle size={22} />
              {t('order_whatsapp')}
            </button>
            <button
              onClick={() => setShowShare(true)}
              aria-label="Partager ce produit"
              className="py-5 px-6 bg-white/60 dark:bg-white/5 text-gray-600 dark:text-gray-300 rounded-[2rem] font-black uppercase tracking-widest text-sm shadow hover:bg-gray-100 dark:hover:bg-white/10 transition-all flex items-center justify-center gap-3 active:scale-95 border border-gray-200 dark:border-white/10"
            >
              <Share2 size={20}/>
              <span className="hidden sm:inline text-xs">{language === 'fr' ? 'Partager' : 'Share'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRODUITS SIMILAIRES */}
      {similarProducts.length > 0 && (
        <section className="mt-20">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
              {t('similar_products')}
            </h2>
            <Link to="/boutique"
              className="text-dakora-green text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
              {t('view_all')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {similarProducts.map(p => {
              const pName  = language === 'fr' ? p.name_fr : p.name_en;
              const pImg   = p.product_images?.[0]?.url;
              const pPrice = p.variants?.[0]?.price;
              return (
                <Link key={p.id} to={`/produit/${p.id}`} className="group space-y-3">
                  <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/10 shadow-md">
                    {pImg && (
                      <img src={pImg} loading="lazy" decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        alt={pName} />
                    )}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900 dark:text-white group-hover:text-dakora-green transition-colors line-clamp-2">{pName}</h4>
                    {pPrice && <p className="text-dakora-green font-black text-sm">{Number(pPrice).toLocaleString()} FCFA</p>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
      `}</style>

      {/* PANNEAU DE PARTAGE */}
      {showShare && (
        <ShareProductPanel
          product={product}
          language={language}
          waNumber={settings.whatsapp_number || '237690000000'}
          onClose={() => setShowShare(false)}
        />
      )}
    </div>
  );
};

export default ProductDetails;
