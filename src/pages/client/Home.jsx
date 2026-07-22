import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import Hero from '../../components/layout/Hero.jsx';
import Features from '../../components/layout/Features.jsx';
import { useDataCache } from '../../context/DataCacheContext';
import { useSettings } from '../../context/SettingsContext';
import { usePromo } from '../../hooks/usePromo';
import CountdownTimer from '../../components/ui/CountdownTimer';
import {
  ArrowRight, ShoppingCart, Star, TrendingUp,
  Truck, Shield, Headphones, MapPin, Phone, Zap
} from 'lucide-react';

// ─── COMPTEURS STATS ──────────────────────────────────────────────────────────
const StatItem = ({ value, label, icon }) => (
  <div className="flex flex-col items-center gap-1 text-center px-4">
    <span className="text-3xl md:text-4xl font-black text-dakora-green tracking-tighter">{value}</span>
    <span className="text-[10px] md:text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{label}</span>
  </div>
);

export default function Home() {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { products, categories, ready } = useDataCache();
  const { getActivePromo } = usePromo();

  const featuredCategories = categories.slice(0, 6);
  const featuredProducts   = products.slice(0, 3);

  return (
    <div className="space-y-0 pb-20 animate-in fade-in duration-700">

      {/* ══════════════════════════════════════════════════════════
          1. HERO SLIDER
      ══════════════════════════════════════════════════════════ */}
      <Hero />

      {/* ══════════════════════════════════════════════════════════
          2. BANNIÈRE PROMOTIONS
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
        <Link to="/promotions" className="block group">
          <div className="relative bg-gradient-to-r from-red-500 to-orange-500 rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 overflow-hidden shadow-2xl hover:shadow-red-500/30 transition-all duration-500 hover:scale-[1.02]">
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="text-center md:text-left">
                <span className="inline-block px-4 py-1.5 bg-white/20 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-3 animate-pulse">
                  {language === 'fr' ? 'OFFRES SPÉCIALES' : 'SPECIAL OFFERS'}
                </span>
                <h2 className="text-2xl md:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                  {language === 'fr' ? 'Nos Bons Plans du Moment' : 'Our Best Deals'}
                </h2>
                <p className="text-white/90 text-sm md:text-base font-medium">
                  {language === 'fr' 
                    ? 'Profitez de réductions exclusives sur une sélection d\'équipements agricoles.'
                    : 'Enjoy exclusive discounts on a selection of agricultural equipment.'
                  }
                </p>
              </div>
              <div className="flex items-center gap-3 bg-white text-red-500 px-6 py-3 md:px-8 md:py-4 rounded-full font-black uppercase text-xs md:text-sm tracking-widest shadow-xl group-hover:bg-red-100 transition-all">
                {language === 'fr' ? 'Voir les promos' : 'View promos'}
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
              </div>
            </div>
            {/* Décoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"/>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-orange-300/20 rounded-full blur-3xl -ml-16 -mb-16 pointer-events-none"/>
          </div>
        </Link>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. BANDE DE STATS / CONFIANCE
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-white dark:bg-neutral-900 border-y border-gray-100 dark:border-white/5 py-6 md:py-8">
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-6 md:gap-0 md:divide-x md:divide-gray-100 md:dark:divide-white/10">
          <StatItem value="500+" label={language === 'fr' ? 'Clients satisfaits' : 'Happy clients'} />
          <StatItem value="50+" label={language === 'fr' ? 'Modèles disponibles' : 'Available models'} />
          <StatItem value="5 ans" label={language === 'fr' ? 'D\'expertise agricole' : 'Agriculture expertise'} />
          <StatItem value="48h" label={language === 'fr' ? 'Livraison express' : 'Express delivery'} />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          3. AVANTAGES (FEATURES)
      ══════════════════════════════════════════════════════════ */}
      <Features />

      {/* ══════════════════════════════════════════════════════════
          4. CATÉGORIES DYNAMIQUES
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-10 md:mb-14">
          <span className="inline-block px-4 py-1.5 bg-dakora-green/10 text-dakora-green text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4">
            {language === 'fr' ? 'Notre Catalogue' : 'Our Catalog'}
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {t('home_categories_title')}
          </h2>
          <div className="w-16 h-1 bg-dakora-green mx-auto mt-4 rounded-full"/>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-5">
          {!ready ? (
            Array.from({length:6}).map((_, n) => (
              <div key={n} className="h-32 md:h-40 rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse"/>
            ))
          ) : featuredCategories.length === 0 ? (
            <div className="col-span-6 text-center py-12 text-gray-400 italic font-bold text-sm">
              {t('home_categories_soon')}
            </div>
          ) : (
            featuredCategories.map(cat => (
              <Link
                key={cat.id}
                to={`/boutique?category=${cat.id}`}
                className="group flex flex-col items-center gap-3 p-5 md:p-7 bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/20 dark:border-white/5 rounded-[2rem] shadow hover:shadow-dakora-green/20 hover:-translate-y-2 hover:border-dakora-green/30 transition-all duration-400"
              >
                <span className="text-4xl md:text-5xl group-hover:scale-125 transition-transform duration-400">{cat.icon_url || '🌾'}</span>
                <span className="font-black text-[9px] md:text-[10px] uppercase tracking-widest text-center dark:text-white leading-tight line-clamp-2">
                  {language === 'fr' ? cat.name_fr : cat.name_en}
                </span>
              </Link>
            ))
          )}
        </div>

        <div className="flex justify-center mt-8 md:mt-10">
          <Link to="/boutique"
            className="flex items-center gap-3 px-8 py-4 border-2 border-dakora-green text-dakora-green hover:bg-dakora-green hover:text-white rounded-full font-black uppercase text-xs tracking-widest transition-all active:scale-95">
            {language === 'fr' ? 'Voir tous les produits' : 'View all products'}
            <ArrowRight size={16}/>
          </Link>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          5. PRODUITS PHARES
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 dark:bg-black/20 py-16 md:py-24 px-4 md:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 md:mb-14 gap-4">
            <div>
              <span className="inline-block px-4 py-1.5 bg-dakora-green/10 text-dakora-green text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4">
                {language === 'fr' ? 'Sélection Premium' : 'Premium Selection'}
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
                {t('home_featured_title')}
              </h2>
              <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium text-sm md:text-base max-w-lg">
                {t('home_featured_subtitle')}
              </p>
            </div>
            <Link to="/boutique"
              className="group flex-shrink-0 flex items-center gap-3 bg-dakora-green text-white px-6 md:px-8 py-3 md:py-4 rounded-2xl font-black uppercase text-[10px] md:text-xs tracking-widest shadow-xl hover:bg-green-700 transition-all active:scale-95">
              {t('view_all_products')}
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform"/>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 md:gap-8">
            {!ready ? (
              Array.from({length:3}).map((_, n) => (
                <div key={n} className="h-80 md:h-96 rounded-[2rem] bg-gray-100 dark:bg-white/5 animate-pulse"/>
              ))
            ) : featuredProducts.length === 0 ? (
              <div className="col-span-3 text-center py-16 text-gray-400 italic font-bold text-sm">
                {t('no_products')}
              </div>
            ) : (
              featuredProducts.map((prod, idx) => {
                const name  = language === 'fr' ? prod.name_fr : prod.name_en;
                // Vérifier la promo active sur la première variante
                const firstVariantId = prod.variants?.[0]?.id;
                const activePromo = firstVariantId ? getActivePromo(firstVariantId) : null;
                const basePrice = prod.variants?.length
                  ? Math.min(...prod.variants.map(v => Number(v.price)))
                  : prod.variants?.[0]?.price;
                const displayPrice = activePromo ? activePromo.promo_price : basePrice;
                const savings = activePromo ? (basePrice - activePromo.promo_price) : 0;
                const imgUrl = prod.product_images?.[0]?.url;
                return (
                  <Link
                    key={prod.id}
                    to={`/produit/${prod.id}`}
                    className={`group bg-white dark:bg-neutral-900 rounded-[2.5rem] md:rounded-[3.5rem] p-3 md:p-4 shadow-xl border flex flex-col transition-all duration-500 hover:-translate-y-1 ${activePromo ? 'border-red-200 dark:border-red-500/20 shadow-red-100/50' : 'border-white/10 hover:shadow-dakora-green/15'} ${idx === 1 ? 'sm:scale-105 shadow-2xl' : ''}`}
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
                      {/* Badge promo OU badge produit OU populaire */}
                      {activePromo ? (
                        <span className="absolute top-4 left-4 px-3 py-1.5 bg-red-500 text-white text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-1 animate-pulse">
                          <Zap size={9}/> {language === 'fr' ? 'OFFRE LIMITÉE' : 'LIMITED OFFER'}
                        </span>
                      ) : prod.badge ? (
                        <span className="absolute top-4 left-4 px-3 py-1.5 bg-dakora-yellow text-yellow-900 text-[9px] md:text-[10px] font-black uppercase rounded-full shadow-lg">
                          {prod.badge}
                        </span>
                      ) : null}
                      {idx === 1 && !activePromo && (
                        <span className="absolute top-4 right-4 px-3 py-1.5 bg-dakora-green text-white text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-1">
                          <Star size={10} className="fill-current"/> {language === 'fr' ? 'Populaire' : 'Popular'}
                        </span>
                      )}
                    </div>
                    <div className="px-2 md:px-3 pb-3 md:pb-4 flex flex-col flex-grow">
                      <span className="text-[9px] font-black text-dakora-green uppercase tracking-[0.2em] mb-1">
                        {language === 'fr' ? prod.categories?.name_fr : prod.categories?.name_en}
                      </span>
                      <h3 className="text-base md:text-xl font-black text-gray-900 dark:text-white tracking-tighter uppercase leading-tight line-clamp-2 mb-3 flex-grow">
                        {name}
                      </h3>
                      {/* Compte à rebours compact si promo */}
                      {activePromo?.end_timestamp && (
                        <div className="mb-2">
                          <CountdownTimer endTimestamp={activePromo.end_timestamp} language={language} compact/>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-auto">
                        <div>
                          <p className="text-[10px] font-bold text-gray-400 uppercase">{t('price_from')}</p>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-lg md:text-2xl font-black tracking-tighter ${activePromo ? 'text-red-500' : 'text-dakora-green'}`}>
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
                        <span className="p-3 bg-gray-100 dark:bg-white/5 rounded-xl md:rounded-2xl group-hover:bg-dakora-green group-hover:text-white transition-all dark:text-white">
                          <ArrowRight size={18}/>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          6. POURQUOI NOUS CHOISIR
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1.5 bg-dakora-green/10 text-dakora-green text-[10px] font-black uppercase tracking-[0.3em] rounded-full mb-4">
            {language === 'fr' ? 'Pourquoi nous choisir' : 'Why choose us'}
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {language === 'fr' ? 'L\'excellence à votre service' : 'Excellence at your service'}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
          {[
            {
              icon: <Shield size={28} className="text-dakora-green"/>,
              bg: 'bg-dakora-green/10',
              title: language === 'fr' ? 'Qualité Garantie' : 'Guaranteed Quality',
              desc: language === 'fr' ? 'Tous nos équipements sont certifiés et testés avant livraison.' : 'All equipment certified and tested before delivery.'
            },
            {
              icon: <Truck size={28} className="text-blue-500"/>,
              bg: 'bg-blue-500/10',
              title: language === 'fr' ? 'Livraison Rapide' : 'Fast Delivery',
              desc: language === 'fr' ? 'Livraison sous 48h à Douala, partout au Cameroun sous 72h.' : 'Delivery within 48h in Douala, 72h nationwide.'
            },
            {
              icon: <Headphones size={28} className="text-purple-500"/>,
              bg: 'bg-purple-500/10',
              title: language === 'fr' ? 'Support Technique' : 'Technical Support',
              desc: language === 'fr' ? 'Notre équipe vous accompagne pour l\'installation et l\'entretien.' : 'Our team supports installation and maintenance.'
            },
            {
              icon: <TrendingUp size={28} className="text-orange-500"/>,
              bg: 'bg-orange-500/10',
              title: language === 'fr' ? 'Meilleurs Prix' : 'Best Prices',
              desc: language === 'fr' ? 'Des prix compétitifs et des facilités de paiement adaptées.' : 'Competitive prices with flexible payment options.'
            },
          ].map((item, i) => (
            <div key={i} className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 md:p-8 border border-white/20 shadow hover:shadow-md hover:-translate-y-1 transition-all duration-300">
              <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center mb-5`}>
                {item.icon}
              </div>
              <h3 className="font-black text-gray-900 dark:text-white text-base uppercase tracking-tight mb-2">
                {item.title}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          7. TÉMOIGNAGES
      ══════════════════════════════════════════════════════════ */}
      <section className="bg-gray-50 dark:bg-black/20 py-16 md:py-20 px-4 md:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
              {language === 'fr' ? 'Ils nous font confiance' : 'They trust us'}
            </h2>
            <div className="flex justify-center gap-1 mt-3">
              {[1,2,3,4,5].map(s => <Star key={s} size={18} className="text-yellow-400 fill-current"/>)}
              <span className="text-sm font-bold text-gray-500 ml-2">4.9/5</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: 'Jean-Paul M.',
                role: language === 'fr' ? 'Exploitant agricole, Yaoundé' : 'Farmer, Yaoundé',
                text: language === 'fr'
                  ? 'Mon motoculteur Dakora a transformé ma production. Excellent rapport qualité-prix, livraison rapide !'
                  : 'My Dakora tiller transformed my production. Excellent value, fast delivery!',
                stars: 5
              },
              {
                name: 'Marie K.',
                role: language === 'fr' ? 'Productrice de riz, Bafoussam' : 'Rice farmer, Bafoussam',
                text: language === 'fr'
                  ? 'Le service après-vente est remarquable. L\'équipe Dakora m\'a aidée à configurer mon équipement.'
                  : 'After-sales service is remarkable. Dakora team helped me set up my equipment.',
                stars: 5
              },
              {
                name: 'Emmanuel T.',
                role: language === 'fr' ? 'Entrepreneur agricole, Douala' : 'Agricultural entrepreneur, Douala',
                text: language === 'fr'
                  ? 'Commander via WhatsApp est très pratique. J\'ai reçu mon tracteur en 2 jours. Je recommande !'
                  : 'Ordering via WhatsApp is very convenient. I received my tractor in 2 days. Highly recommend!',
                stars: 5
              },
            ].map((t, i) => (
              <div key={i} className="bg-white dark:bg-neutral-900/80 rounded-[2rem] p-6 md:p-7 shadow border border-white/10 flex flex-col gap-4">
                <div className="flex gap-1">
                  {Array.from({length: t.stars}).map((_, s) => (
                    <Star key={s} size={14} className="text-yellow-400 fill-current"/>
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-grow italic">
                  "{t.text}"
                </p>
                <div className="flex items-center gap-3 pt-3 border-t border-black/5 dark:border-white/5">
                  <div className="w-9 h-9 rounded-full bg-dakora-green/10 flex items-center justify-center flex-shrink-0">
                    <span className="font-black text-dakora-green text-sm">{t.name[0]}</span>
                  </div>
                  <div>
                    <p className="font-black text-gray-900 dark:text-white text-xs">{t.name}</p>
                    <p className="text-[10px] text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          8. ZONE DE COUVERTURE
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-12 md:py-16">
        <div className="bg-white/70 dark:bg-white/5 backdrop-blur-xl rounded-[2.5rem] p-8 md:p-12 border border-white/20 shadow-xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="flex-grow text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-3">
                <MapPin size={22} className="text-dakora-green"/>
                <span className="font-black text-lg md:text-2xl text-gray-900 dark:text-white uppercase tracking-tight">
                  {language === 'fr' ? 'Zone de livraison' : 'Delivery zone'}
                </span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
                {language === 'fr'
                  ? 'Nous livrons partout au Cameroun — Douala, Yaoundé, Bafoussam, Garoua et toutes les régions.'
                  : 'We deliver anywhere in Cameroon — Douala, Yaoundé, Bafoussam, Garoua and all regions.'}
              </p>
              <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                {['Douala', 'Yaoundé', 'Bafoussam', 'Garoua', 'Maroua', 'Ngaoundéré'].map(city => (
                  <span key={city} className="px-3 py-1.5 bg-dakora-green/10 text-dakora-green text-[10px] font-black uppercase rounded-full">
                    {city}
                  </span>
                ))}
                <span className="px-3 py-1.5 bg-gray-100 dark:bg-white/10 text-gray-500 text-[10px] font-black uppercase rounded-full">
                  +
                </span>
              </div>
            </div>
            <div className="flex-shrink-0 text-center">
              <a
                href={`https://wa.me/${settings.whatsapp_number || '237690000000'}?text=${encodeURIComponent('Bonjour Dakora Business 👋 Je voudrais connaître les délais de livraison dans ma région.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-7 py-4 bg-[#25D366] text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:bg-[#1ebe5d] transition-all active:scale-95"
              >
                <Phone size={16}/>
                {language === 'fr' ? 'Demander un devis' : 'Request a quote'}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          9. CTA FINAL
      ══════════════════════════════════════════════════════════ */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-8">
        <div className="relative bg-dakora-green rounded-[2.5rem] md:rounded-[3.5rem] p-10 md:p-16 overflow-hidden shadow-2xl text-center">
          <div className="relative z-10 space-y-5 md:space-y-6">
            <h2 className="text-2xl md:text-5xl font-black text-white uppercase italic tracking-tighter">
              {language === 'fr' ? 'Prêt à booster votre rendement ?' : 'Ready to boost your yield?'}
            </h2>
            <p className="text-green-100 font-medium max-w-2xl mx-auto text-sm md:text-base">
              {language === 'fr'
                ? 'Rejoignez les 500+ producteurs qui font confiance à Dakora Business pour leur équipement agricole.'
                : 'Join 500+ farmers who trust Dakora Business for their agricultural equipment.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/boutique"
                className="inline-flex items-center justify-center gap-3 bg-white text-dakora-green px-8 md:px-12 py-4 md:py-5 rounded-full font-black uppercase text-xs md:text-sm tracking-widest shadow-2xl hover:scale-105 transition-all active:scale-95">
                <ShoppingCart size={18}/>
                {t('shop_now')}
              </Link>
              <a
                href={`https://wa.me/${settings.whatsapp_number || '237690000000'}?text=${encodeURIComponent('Bonjour Dakora Business 👋 Je souhaite des informations sur vos équipements agricoles.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-3 bg-white/20 text-white border-2 border-white/30 px-8 md:px-12 py-4 md:py-5 rounded-full font-black uppercase text-xs md:text-sm tracking-widest hover:bg-white/30 transition-all active:scale-95"
              >
                {language === 'fr' ? '💬 Nous contacter' : '💬 Contact us'}
              </a>
            </div>
          </div>
          {/* Décorations */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"/>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"/>
        </div>
      </section>

    </div>
  );
}
