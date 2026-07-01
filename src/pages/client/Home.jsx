import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Hero from '../../components/layout/Hero.jsx';
import Features from '../../components/layout/Features.jsx';
import { useDataCache } from '../../context/DataCacheContext';
import { ArrowRight, ShoppingCart } from 'lucide-react';

export default function Home() {
  const { t, language } = useLanguage();
  const { products, categories, ready } = useDataCache();

  // On prend les 6 premières catégories et les 3 derniers produits du cache
  const featuredCategories = categories.slice(0, 6);
  const featuredProducts = products.slice(0, 3);

  return (
    <div className="space-y-20 pb-20 animate-in fade-in duration-1000">
      
      {/* 1. SECTION HERO (SLIDER) */}
      <Hero />

      {/* 2. SECTION AVANTAGES */}
      <Features />

      {/* 3. SECTION CATÉGORIES DYNAMIQUE */}
      <section className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {t('home_categories_title')}
          </h2>
          <div className="w-20 h-1.5 bg-dakora-green mx-auto mt-4 rounded-full" />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
          {!ready ? (
            [1, 2, 3, 4, 5, 6].map(n => <div key={n} className="h-40 rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse" />)
          ) : (
            featuredCategories.map(cat => (
              <Link 
                key={cat.id} 
                to="/boutique" 
                className="group flex flex-col items-center p-8 bg-white/60 dark:bg-white/5 backdrop-blur-md border border-white/20 rounded-[2.5rem] shadow-xl hover:shadow-dakora-green/20 hover:-translate-y-2 transition-all duration-500"
              >
                <span className="text-5xl mb-4 group-hover:scale-125 transition-transform duration-500">{cat.icon_url || '🚜'}</span>
                <span className="font-black text-[10px] uppercase tracking-widest text-center dark:text-white leading-tight">
                  {language === 'fr' ? cat.name_fr : cat.name_en}
                </span>
              </Link>
            ))
          )}
        </div>
      </section>

      {/* 4. SECTION PRODUITS PHARES */}
      <section className="bg-gray-100 dark:bg-black/20 py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                {t('home_featured_title')}
              </h2>
              <p className="text-gray-500 mt-2 font-medium">{t('home_featured_subtitle')}</p>
            </div>
            <Link to="/boutique" className="group flex items-center gap-3 bg-dakora-green text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-green-700 transition-all">
              {t('view_all_products')} <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-10">
            {!ready ? (
              [1, 2, 3].map(n => (
                <div key={n} className="h-96 rounded-[2rem] md:rounded-[3.5rem] bg-gray-100 dark:bg-white/5 animate-pulse" />
              ))
            ) : (
              featuredProducts.map(prod => (
                <div key={prod.id} className="group bg-white dark:bg-neutral-900 rounded-[2rem] md:rounded-[3.5rem] p-3 md:p-4 shadow-2xl border border-white/10 flex flex-col transition-all duration-500 hover:shadow-dakora-green/10">
                  <div className="relative aspect-square rounded-[1.8rem] md:rounded-[2.8rem] overflow-hidden mb-4 md:mb-6">
                    <img 
                      src={prod.product_images?.[0]?.url} 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                      alt={prod.name_fr}
                      onError={e => { e.target.style.display='none'; }}
                    />
                    {prod.badge && (
                      <div className="absolute top-4 left-4 md:top-6 md:left-6 px-2 py-1 md:px-4 md:py-2 bg-dakora-yellow text-yellow-900 text-[8px] md:text-[10px] font-black uppercase rounded-full shadow-xl">
                        {prod.badge}
                      </div>
                    )}
                  </div>
                  <div className="px-2 md:px-4 pb-4 md:pb-6 space-y-3 md:space-y-4">
                    <h3 className="text-base md:text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight line-clamp-2">
                      {language === 'fr' ? prod.name_fr : prod.name_en}
                    </h3>
                    <div className="flex justify-between items-center">
                      <p className="text-sm md:text-xl font-black text-dakora-green">
                        {prod.variants?.[0]?.price?.toLocaleString()} <span className="text-[10px] md:text-xs uppercase">FCFA</span>
                      </p>
                      <Link to={`/produit/${prod.id}`} className="p-3 md:p-4 bg-gray-100 dark:bg-white/5 rounded-xl md:rounded-2xl hover:bg-dakora-green hover:text-white transition-all dark:text-white">
                        <ArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* 5. BANNIÈRE DE FIN (RE-ASSURANCE) */}
      <section className="max-w-5xl mx-auto px-6">
        <div className="relative bg-dakora-green rounded-[3.5rem] p-12 md:p-20 overflow-hidden shadow-2xl text-center">
           <div className="relative z-10 space-y-6">
              <h2 className="text-3xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
                {language === 'fr' ? 'Prêt à booster votre rendement ?' : 'Ready to boost your yield?'}
              </h2>
              <p className="text-green-100 font-medium max-w-2xl mx-auto">
                {language === 'fr'
                  ? 'Rejoignez les producteurs qui font confiance à Dakora Business pour leur équipement.'
                  : 'Join the farmers who trust Dakora Business for their equipment.'}
              </p>
              <Link to="/boutique" className="inline-block bg-white text-dakora-green px-12 py-5 rounded-full font-black uppercase text-sm tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95">
                {t('shop_now')}
              </Link>
           </div>
           {/* Décoration fond */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
           <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20" />
        </div>
      </section>

    </div>
  );
}