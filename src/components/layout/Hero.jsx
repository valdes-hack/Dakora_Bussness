import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useDataCache } from '../../context/DataCacheContext';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import dbLogo from '../../assets/db.png';

const Hero = () => {
  const { t, language } = useLanguage();
  const { settings } = useSettings();
  const { banners, ready } = useDataCache();
  const [currentSlide, setCurrentSlide] = useState(0);
  // animationReset supprimé — causait un re-mount du DOM toutes les 30s (removeChild error)

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
    <section className="relative h-[70vh] sm:h-[75vh] md:h-[85vh] w-full overflow-hidden px-0 md:px-6 mt-2 sm:mt-4">
      <div className="relative h-full w-full md:rounded-[3.5rem] overflow-hidden shadow-2xl">
        
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
              index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
            }`}
          >
            {/* IMAGE DE FOND AVEC ZOOM ULTRA DOUX (KEN BURNS EFFECT) */}
            <div 
              className="absolute inset-0 bg-cover bg-center transition-transform duration-[12s]"
              style={{ 
                backgroundImage: `url(${slide.media_url})`,
                transform: index === currentSlide ? 'scale(1.08)' : 'scale(1)'
              }}
            >
              {/* Double overlay pour garantir un contraste optimal et professionnel */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/40 to-black/60"></div>
              <div className="absolute inset-0 backdrop-brightness-95 dark:backdrop-brightness-90"></div>
            </div>

            {/* CONTENU TEXTE */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-4 sm:px-6 z-20">
              
              {/* Logo + Nom enchaînés avec transition élastique moderne */}
              <div className="flex flex-col items-center gap-0 mb-4 sm:mb-6 md:mb-8 anim-logo group cursor-pointer">
                <img 
                  src={dbLogo} 
                  alt="Logo" 
                  className="h-48 sm:h-64 md:h-80 lg:h-[26rem] w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.55)] transition-all duration-700 group-hover:scale-105 group-hover:rotate-[1deg]" 
                />
                <span className="font-black text-4xl sm:text-6xl md:text-8xl lg:text-[7rem] uppercase tracking-tight drop-shadow-[0_4px_24px_rgba(0,0,0,0.95)] whitespace-nowrap leading-none -mt-6 sm:-mt-10 md:-mt-12 lg:-mt-16 transition-all duration-500 group-hover:text-shadow-glow">
                  <span style={{color:'#A8DC00'}}>{(settings.business_name || 'Dakora Business').split(' ')[0]}</span> <span style={{color:'#159FFF'}}>{(settings.business_name || 'Dakora Business').split(' ').slice(1).join(' ')}</span>
                </span>
              </div>

              {/* Sous-titre + Bouton Boutique */}
              <div className="max-w-3xl w-full space-y-5 sm:space-y-7">
                <p className="text-xs sm:text-sm md:text-lg lg:text-2xl text-white/90 font-medium tracking-wide max-w-2xl mx-auto drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] leading-relaxed anim-subtitle">
                   {language === 'fr'
                     ? (slide.subtitle_fr || settings.slogan_fr || t('slogan'))
                     : (slide.subtitle_en || settings.slogan_en || t('slogan'))
                   }
                </p>

                {/* Bouton Boutique Premium avec lueur de pulsation */}
                <div className="pt-2 sm:pt-4 anim-btn">
                  <Link
                    to="/boutique"
                    className="group relative inline-flex items-center gap-2 sm:gap-3 bg-white text-gray-900 hover:bg-dakora-green hover:text-white font-black py-3 sm:py-3.5 md:py-4.5 px-7 sm:px-9 md:px-11 rounded-full shadow-[0_10px_30px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_35px_rgba(168,220,0,0.3)] active:scale-95 text-xs sm:text-sm uppercase tracking-widest overflow-hidden"
                  >
                    {/* Ripple effect background */}
                    <span className="absolute inset-0 bg-gradient-to-r from-dakora-green/10 to-dakora-blue/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
                    <span className="relative z-10">{t('shop')}</span>
                    <ArrowRight size={14} sm:size={16} md:size={18} className="relative z-10 group-hover:translate-x-2 transition-transform duration-300" />
                  </Link>
                </div>
              </div>

            </div>
          </div>
        ))}

        {/* INDICATEURS BARRES (Points en bas) — Version Épurée & Active */}
        {slides.length > 1 && (
          <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 flex gap-2 sm:gap-3 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Slide ${index + 1}`}
                className={`h-1.5 rounded-full transition-all duration-700 ${
                  index === currentSlide ? 'bg-white w-10 sm:w-14 md:w-16 shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-white/30 w-2.5 sm:w-3 hover:bg-white/60 hover:scale-110'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* ANIMATIONS PREMIUM AVEC RESSORT ELASTIQUE (CUBIC-BEZIER) */}
      <style>{`
        .anim-logo {
          animation: premium-logo-fade-elastic 1.2s cubic-bezier(0.34, 1.3, 0.64, 1) forwards;
          opacity: 0;
        }
        .anim-subtitle {
          animation: premium-subtitle-fade-elastic 1s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
          animation-delay: 0.35s;
          opacity: 0;
        }
        .anim-btn {
          animation: premium-button-fade-elastic 1s cubic-bezier(0.34, 1.25, 0.64, 1) forwards;
          animation-delay: 0.55s;
          opacity: 0;
        }

        @keyframes premium-logo-fade-elastic {
          0% {
            opacity: 0;
            transform: scale(1.15) translateY(-30px);
            filter: blur(10px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0);
          }
        }

        @keyframes premium-subtitle-fade-elastic {
          0% {
            opacity: 0;
            transform: translateY(20px);
            filter: blur(5px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            filter: blur(0);
          }
        }

        @keyframes premium-button-fade-elastic {
          0% {
            opacity: 0;
            transform: translateY(25px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
