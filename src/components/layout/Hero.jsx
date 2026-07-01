import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useDataCache } from '../../context/DataCacheContext';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../../assets/logos.png';
import dbLogo from '../../assets/db.png';

const Hero = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { banners, ready } = useDataCache();
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = banners.length > 0 ? banners : [{
    id: 'default',
    media_url: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600",
    title_fr: settings.business_name || 'Dakora Business',
    title_en: settings.business_name || 'Dakora Business',
    subtitle_fr: settings.slogan_fr || "L'excellence agricole à votre portée",
    subtitle_en: settings.slogan_en || "Agricultural excellence at your fingertips"
  }];

  // Défilement automatique toutes les 6 secondes
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  if (!ready) return <div className="h-[70vh] bg-gray-100 dark:bg-neutral-900 animate-pulse rounded-[3rem] m-6" />;

  return (
    <section className="relative h-[60vh] sm:h-[70vh] md:h-[85vh] w-full overflow-hidden px-0 md:px-6 mt-2 sm:mt-4">
      {/* LOGO + NOM — logo au-dessus, centré en haut de la bannière */}
      <div className="absolute top-4 sm:top-6 md:top-8 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 sm:gap-3 md:gap-4 w-full px-4 text-center">
        <img src={dbLogo} alt="Logo" className="h-28 sm:h-36 md:h-48 lg:h-64 w-auto object-contain drop-shadow-[0_10px_15px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-105" />
        <div className="flex leading-none items-center justify-center">
          <span className="font-black text-2xl sm:text-3xl md:text-5xl lg:text-6xl uppercase tracking-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.7)] whitespace-nowrap">
            <span style={{color:'#A8DC00'}}>DAKORA</span> <span style={{color:'#159FFF'}}>BUSINESS</span>
          </span>
        </div>
      </div>

      <div className="relative h-full w-full md:rounded-[3.5rem] overflow-hidden shadow-2xl">
        
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            {/* IMAGE DE FOND AVEC OVERLAY GRADIENT */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[12s]"
              style={{ 
                backgroundImage: `url(${slide.media_url})`,
                transform: index === currentSlide ? 'scale(1.1)' : 'scale(1)'
              }}
            >
              <div className="absolute inset-0 bg-black/30 dark:bg-black/50 backdrop-brightness-90"></div>
            </div>

            {/* TEXTE — collé juste sous le logo */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-6">
              {/* Spacer calculé = hauteur logo + texte + top offset */}
              <div className="h-44 sm:h-52 md:h-64 lg:h-80 flex-shrink-0" />
              <div className="max-w-4xl w-full space-y-1.5 sm:space-y-2 md:space-y-3 animate-in fade-in slide-in-from-bottom-10 duration-1000 -mt-1 sm:-mt-2 md:-mt-4">
                {/* Le titre h1 est masqué car déjà affiché côte à côte avec le logo au-dessus */}
                
                <p className="text-sm sm:text-base md:text-lg lg:text-2xl text-white/90 font-medium tracking-tight max-w-2xl mx-auto drop-shadow-md">
                   {language === 'fr'
                     ? (slide.subtitle_fr || settings.slogan_fr || t('slogan'))
                     : (slide.subtitle_en || settings.slogan_en || t('slogan'))
                   }
                </p>

                <div className="pt-4 sm:pt-6 md:pt-8">
                  <Link
                    to="/boutique"
                    className="group inline-flex items-center gap-2 sm:gap-3 bg-white text-gray-900 hover:bg-dakora-green hover:text-white font-black py-2.5 sm:py-3 md:py-4 px-6 sm:px-8 md:px-10 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 text-xs sm:text-sm uppercase tracking-widest"
                  >
                    {t('shop')}
                    <ArrowRight size={14} sm:size={16} md:size={18} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* INDICATEURS (Points en bas) */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1 sm:h-1.5 rounded-full transition-all duration-500 ${
                  index === currentSlide ? 'bg-white w-8 sm:w-10 md:w-12' : 'bg-white/30 w-2 sm:w-3 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Hero;