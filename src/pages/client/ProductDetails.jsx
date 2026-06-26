import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { ChevronLeft, MessageCircle, Package, ArrowRight } from 'lucide-react';

// ─── SKELETON détail produit ──────────────────────────────────────────────────
const ProductSkeleton = () => (
  <div className="max-w-7xl mx-auto px-6 py-10 animate-pulse">
    <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded-full mb-10" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
      <div className="aspect-square rounded-[3rem] bg-gray-200 dark:bg-white/10" />
      <div className="space-y-6">
        <div className="h-3 w-24 bg-gray-200 dark:bg-white/10 rounded-full" />
        <div className="h-10 w-3/4 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded-2xl" />
        <div className="flex gap-3">
          {[1,2,3].map(i => <div key={i} className="h-12 w-28 bg-gray-200 dark:bg-white/10 rounded-2xl" />)}
        </div>
        <div className="h-32 bg-gray-200 dark:bg-white/10 rounded-[2.5rem]" />
        <div className="h-16 bg-gray-200 dark:bg-white/10 rounded-[2rem]" />
      </div>
    </div>
  </div>
);

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { settings } = useSettings();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    window.scrollTo({ top: 0, behavior: 'instant' });

    const load = async () => {
      setLoading(true);
      setNotFound(false);

      // Requête produit — champs stricts, pas de * inutile
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name_fr, name_en, description_fr, description_en,
          badge, category_id, is_active,
          categories(name_fr, name_en),
          variants(id, label_fr, label_en, price, old_price, stock_quantity),
          product_images(id, url, is_main, order_index)
        `)
        .eq('id', id)
        .single();

      if (cancelled) return;

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Tri images : principale d'abord
      const sortedImages = [...(data.product_images || [])].sort((a, b) => {
        if (a.is_main) return -1;
        if (b.is_main) return 1;
        return (a.order_index ?? 0) - (b.order_index ?? 0);
      });

      setProduct({ ...data, product_images: sortedImages });
      setMainImage(sortedImages[0]?.url || '');
      setSelectedVariant(data.variants?.[0] || null);
      setLoading(false);

      // Produits similaires en arrière-plan (ne bloque pas l'affichage)
      supabase
        .from('products')
        .select('id, name_fr, name_en, product_images(url, is_main), variants(price)')
        .eq('category_id', data.category_id)
        .neq('id', id)
        .eq('is_active', true)
        .limit(4)
        .then(({ data: sim }) => {
          if (!cancelled) setSimilarProducts(sim || []);
        });
    };

    load();
    return () => { cancelled = true; };
  }, [id]);

  const handleWhatsAppOrder = useCallback(() => {
    if (!product || !selectedVariant) return;
    const phone = settings.whatsapp_number || '237600000000';
    const name = settings.business_name || 'Dakora Business';
    const productName = language === 'fr' ? product.name_fr : product.name_en;
    const variantLabel = language === 'fr' ? selectedVariant.label_fr : selectedVariant.label_en;
    const msg = t('whatsapp_msg').replace('{{name}}', name)
      + ` *${productName}* | ${language === 'fr' ? 'Modèle' : 'Model'} : *${variantLabel}* | Prix : *${selectedVariant.price?.toLocaleString()} FCFA*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, '_blank');
  }, [product, selectedVariant, settings, language, t]);

  if (loading) return <ProductSkeleton />;

  if (notFound) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-6 px-6">
      <p className="text-2xl font-black text-gray-400 uppercase italic">Produit introuvable</p>
      <button onClick={() => navigate('/boutique')}
        className="px-8 py-4 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-xs">
        {t('back_to_shop')}
      </button>
    </div>
  );

  const name = language === 'fr' ? product.name_fr : product.name_en;
  const description = language === 'fr' ? product.description_fr : product.description_en;
  const category = language === 'fr' ? product.categories?.name_fr : product.categories?.name_en;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

      {/* RETOUR */}
      <Link to="/boutique"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-dakora-green font-bold text-xs uppercase tracking-widest mb-10 transition-colors">
        <ChevronLeft size={16} /> {t('back_to_shop')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-start">

        {/* ── GALERIE ── */}
        <div className="space-y-4">
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/20 shadow-2xl">
            <img
              src={mainImage || 'https://via.placeholder.com/800'}
              alt={name}
              loading="eager"
              decoding="async"
              className="w-full h-full object-cover transition-opacity duration-300"
            />
          </div>
          {product.product_images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
              {product.product_images.map((img) => (
                <button
                  key={img.id}
                  onClick={() => setMainImage(img.url)}
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

        {/* ── INFOS & ACHAT ── */}
        <div className="space-y-8">
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
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
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
                {product.variants.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedVariant(v)}
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

          {/* WHATSAPP */}
          <button
            onClick={handleWhatsAppOrder}
            className="w-full py-5 bg-dakora-green text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-green-700 transition-colors flex items-center justify-center gap-4 active:scale-95"
          >
            <MessageCircle size={22} />
            {t('order_whatsapp')}
          </button>
        </div>
      </div>

      {/* PRODUITS SIMILAIRES */}
      {similarProducts.length > 0 && (
        <section className="mt-24">
          <div className="flex justify-between items-end mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
              {t('similar_products')}
            </h2>
            <Link to="/boutique"
              className="text-dakora-green text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
              {t('view_all')} <ArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map(p => {
              const pName = language === 'fr' ? p.name_fr : p.name_en;
              const pImg = p.product_images?.find(i => i.is_main)?.url || p.product_images?.[0]?.url;
              const pPrice = p.variants?.[0]?.price;
              return (
                <Link key={p.id} to={`/produit/${p.id}`} className="group space-y-3">
                  <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/10 shadow-md">
                    {pImg && (
                      <img src={pImg} loading="lazy" decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-400"
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
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ProductDetails;
