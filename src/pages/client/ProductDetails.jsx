import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { ChevronLeft, MessageCircle, Package, ArrowRight } from 'lucide-react';

const ProductDetails = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [mainImage, setMainImage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchProduct = async () => {
    setLoading(true);
    // 1. Récupérer le produit avec ses relations
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(*), variants(*), product_images(*)')
      .eq('id', id)
      .single();

    if (data) {
      setProduct(data);
      setMainImage(data.product_images?.find(img => img.is_main)?.url || data.product_images?.[0]?.url);
      setSelectedVariant(data.variants?.[0]);
      
      // 2. Récupérer les produits similaires (Même catégorie, pas le même ID)
      const { data: similar } = await supabase
        .from('products')
        .select('*, product_images(*), variants(price)')
        .eq('category_id', data.category_id)
        .neq('id', id)
        .eq('is_active', true)
        .limit(4);
      setSimilarProducts(similar || []);
    }
    setLoading(false);
  };

  const handleWhatsAppOrder = () => {
    const phone = settings.whatsapp_number || '237600000000';
    const message = `${t('whatsapp_msg')} *${product.name_fr}* | Modèle : *${selectedVariant?.label_fr}* | Prix : *${selectedVariant?.price} FCFA*`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center animate-pulse text-dakora-green font-black uppercase">Chargement...</div>;
  if (!product) return <div className="p-20 text-center">Produit introuvable</div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* BOUTON RETOUR */}
      <Link to="/boutique" className="inline-flex items-center gap-2 text-gray-500 hover:text-dakora-green font-bold text-xs uppercase tracking-widest mb-10 transition-colors">
        <ChevronLeft size={16} /> {t('back_to_shop')}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
        
        {/* COLONNE GAUCHE : GALERIE */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[3rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/20 shadow-2xl">
            <img src={mainImage || 'https://via.placeholder.com/800'} className="w-full h-full object-cover transition-transform duration-700 hover:scale-110" alt="Product" />
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {product.product_images?.map((img, idx) => (
              <button 
                key={idx} 
                onClick={() => setMainImage(img.url)}
                className={`w-24 h-24 rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all ${mainImage === img.url ? 'border-dakora-green scale-105 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
              >
                <img src={img.url} className="w-full h-full object-cover" alt="thumb" />
              </button>
            ))}
          </div>
        </div>

        {/* COLONNE DROITE : INFOS & ACHAT */}
        <div className="space-y-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="px-3 py-1 bg-dakora-green/10 text-dakora-green text-[10px] font-black uppercase tracking-widest rounded-full">
                {language === 'fr' ? product.categories?.name_fr : product.categories?.name_en}
              </span>
              {product.badge && (
                <span className="px-3 py-1 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase tracking-widest rounded-full shadow-sm">
                  {product.badge}
                </span>
              )}
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-none mb-6">
              {language === 'fr' ? product.name_fr : product.name_en}
            </h1>
            
            {/* PRIX DYNAMIQUE */}
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

          {/* SÉLECTEUR DE VARIANTES */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Package size={14}/> {t('variant_choice')}
            </label>
            <div className="flex flex-wrap gap-3">
              {product.variants?.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariant(v)}
                  className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${selectedVariant?.id === v.id ? 'border-dakora-green bg-dakora-green/5 text-dakora-green shadow-md scale-105' : 'border-gray-100 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                >
                  {language === 'fr' ? v.label_fr : v.label_en}
                </button>
              ))}
            </div>
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white/60 dark:bg-black/20 backdrop-blur-md p-8 rounded-[2.5rem] border border-white/20 shadow-inner">
            <h4 className="text-xs font-black uppercase tracking-widest text-dakora-green mb-4">{t('description_title')}</h4>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
              {language === 'fr' ? product.description_fr : product.description_en}
            </p>
          </div>

          {/* BOUTON WHATSAPP */}
          <button 
            onClick={handleWhatsAppOrder}
            className="w-full py-5 bg-dakora-green text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-green-700 transition-all flex items-center justify-center gap-4 active:scale-95"
          >
            <MessageCircle size={24} />
            {t('order_whatsapp')}
          </button>

        </div>
      </div>

      {/* SECTION PRODUITS SIMILAIRES */}
      {similarProducts.length > 0 && (
        <section className="mt-32">
          <div className="flex justify-between items-end mb-10">
            <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
              {t('similar_products')}
            </h2>
            <Link to="/boutique" className="text-dakora-green text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-2 transition-transform">
              Tout voir <ArrowRight size={14}/>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {similarProducts.map(p => (
              <Link key={p.id} to={`/produit/${p.id}`} className="group space-y-4">
                <div className="aspect-[4/5] rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-white/5 border border-white/10 shadow-lg">
                  <img src={p.product_images?.[0]?.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt=""/>
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white group-hover:text-dakora-green transition-colors">{language === 'fr' ? p.name_fr : p.name_en}</h4>
                  <p className="text-dakora-green font-black text-sm">{p.variants?.[0]?.price?.toLocaleString()} FCFA</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetails;