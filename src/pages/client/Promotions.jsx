import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { usePromo } from '../../hooks/usePromo';
import CountdownTimer from '../../components/ui/CountdownTimer';
import { ArrowRight, ShoppingCart, Zap } from 'lucide-react';

export default function Promotions() {
  const { t, language } = useLanguage();
  const { products, ready, fastRefresh } = useDataCache();
  const { getActivePromo } = usePromo();

  // Rafraîchissement automatique toutes les 2s
  useEffect(() => {
    const interval = setInterval(() => {
      fastRefresh();
    }, 2000);
    return () => clearInterval(interval);
  }, [fastRefresh]);

  // Filtrer les produits avec promotions actives
  const promoProducts = products.filter(product => {
    const firstVariantId = product.variants?.[0]?.id;
    return firstVariantId && getActivePromo(firstVariantId);
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-black/20 py-20 px-4 md:px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Header de la page */}
        <div className="text-center mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4 animate-pulse">
            {language === 'fr' ? 'OFFRES SPÉCIALES' : 'SPECIAL OFFERS'}
          </span>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter mb-4">
            {language === 'fr' ? 'Nos Bons Plans du Moment' : 'Our Best Deals'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base max-w-2xl mx-auto">
            {language === 'fr' 
              ? 'Profitez de réductions exclusives sur une sélection d\'équipements agricoles. Offres limitées dans le temps !'
              : 'Enjoy exclusive discounts on a selection of agricultural equipment. Limited time offers!'
            }
          </p>
        </div>

        {/* Grille de produits en promotion */}
        {!ready ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-80 md:h-96 rounded-[2rem] md:rounded-[3.5rem] bg-gray-100 dark:bg-white/5 animate-pulse"/>
            ))}
          </div>
        ) : promoProducts.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🎁</div>
            <p className="text-gray-400 italic font-bold text-lg">
              {language === 'fr' ? 'Aucune promotion en cours pour le moment' : 'No active promotions at the moment'}
            </p>
            <Link 
              to="/boutique"
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-dakora-green text-white rounded-full font-black uppercase text-xs tracking-widest hover:bg-green-700 transition-all"
            >
              {language === 'fr' ? 'Voir tous les produits' : 'View all products'}
              <ArrowRight size={16}/>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {promoProducts.map((product) => {
              const name = language === 'fr' ? product.name_fr : product.name_en;
              const firstVariantId = product.variants?.[0]?.id;
              const activePromo = firstVariantId ? getActivePromo(firstVariantId) : null;
              const basePrice = product.variants?.length
                ? Math.min(...product.variants.map(v => Number(v.price)))
                : product.variants?.[0]?.price;
              const displayPrice = activePromo ? activePromo.promo_price : basePrice;
              const savings = activePromo ? (basePrice - activePromo.promo_price) : 0;
              const discountPercent = activePromo ? Math.round((savings / basePrice) * 100) : 0;
              const imgUrl = product.product_images?.[0]?.url;

              return (
                <Link
                  key={product.id}
                  to={`/produit/${product.id}`}
                  className="group bg-white dark:bg-neutral-900 rounded-[2.5rem] md:rounded-[3.5rem] p-3 md:p-4 shadow-2xl border border-red-200 dark:border-red-500/20 flex flex-col transition-all duration-500 hover:-translate-y-1 hover:shadow-red-100/50"
                >
                  <div className="relative aspect-square rounded-[2rem] md:rounded-[2.8rem] overflow-hidden mb-4 md:mb-5 bg-gray-100 dark:bg-black/40">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        alt={name}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                    
                    {/* Badge de réduction */}
                    {activePromo && (
                      <span className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-[9px] md:text-[10px] font-black uppercase rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                        <Zap size={9}/> -{discountPercent}%
                      </span>
                    )}
                  </div>

                  <div className="px-2 md:px-3 pb-3 md:pb-4 flex flex-col flex-grow">
                    <span className="text-[9px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">
                      {language === 'fr' ? product.categories?.name_fr : product.categories?.name_en}
                    </span>
                    <h3 className="text-base md:text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight line-clamp-2 mb-3 flex-grow">
                      {name}
                    </h3>

                    {/* Compte à rebours si promo avec date de fin */}
                    {activePromo?.end_timestamp && (
                      <div className="mb-2">
                        <CountdownTimer endTimestamp={activePromo.end_timestamp} language={language} compact/>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-auto">
                      <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase">{language === 'fr' ? 'Prix promo' : 'Sale price'}</p>
                        <div className="flex items-baseline gap-2">
                          <p className="text-lg md:text-2xl font-black tracking-tighter text-red-500">
                            {displayPrice?.toLocaleString()} <span className="text-[10px] md:text-xs">FCFA</span>
                          </p>
                          {activePromo && (
                            <p className="text-sm text-gray-400 line-through font-bold">{basePrice?.toLocaleString()}</p>
                          )}
                        </div>
                        {savings > 0 && (
                          <p className="text-[9px] font-black text-red-500">
                            -{savings.toLocaleString()} FCFA
                          </p>
                        )}
                      </div>
                      <span className="p-3 bg-red-100 dark:bg-red-500/10 rounded-xl md:rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all dark:text-red-500">
                        <ArrowRight size={18}/>
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Footer CTA */}
        {promoProducts.length > 0 && (
          <div className="mt-16 text-center">
            <Link 
              to="/boutique"
              className="inline-flex items-center gap-3 px-8 py-4 bg-dakora-green text-white rounded-full font-black uppercase text-xs md:text-sm tracking-widest shadow-2xl hover:bg-green-700 transition-all hover:scale-105 active:scale-95"
            >
              <ShoppingCart size={18}/>
              {language === 'fr' ? 'Voir tous les produits' : 'View all products'}
              <ArrowRight size={16}/>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
