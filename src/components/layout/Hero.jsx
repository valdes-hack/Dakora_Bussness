import { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useDataCache } from '../../context/DataCacheContext';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import logo from '../../assets/logo.jpeg';

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
    <section className="relative h-[85vh] w-full overflow-hidden px-0 md:px-6 mt-4">
      {/* LOGO AU-DESSUS DE LA BANNIERE */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
        <img src={logo} alt="Logo" className="h-24 md:h-36 lg:h-48 w-auto object-contain drop-shadow-2xl" />
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

            {/* TEXTE AU CENTRE (Style Apple Glass) */}
            <div className="relative h-full flex flex-col items-center justify-center text-center px-6 pt-20">
              <div className="max-w-4xl space-y-4 md:space-y-6 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                <h1 className="text-4xl md:text-7xl lg:text-8xl font-black text-white uppercase italic tracking-tighter leading-none drop-shadow-2xl">
                  {language === 'fr' ? slide.title_fr : slide.title_en}
                </h1>
                
                <p className="text-lg md:text-2xl text-white/90 font-medium tracking-tight max-w-2xl mx-auto drop-shadow-md">
                   {language === 'fr'
                     ? (slide.subtitle_fr || settings.slogan_fr || t('slogan'))
                     : (slide.subtitle_en || settings.slogan_en || t('slogan'))
                   }
                </p>

                <div className="pt-8">
                  <Link
                    to="/boutique"
                    className="group inline-flex items-center gap-3 bg-white text-gray-900 hover:bg-dakora-green hover:text-white font-black py-4 px-10 rounded-full shadow-2xl transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-widest"
                  >
                    {t('shop')}
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* INDICATEURS (Points en bas) */}
        {slides.length > 1 && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3 z-20">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  index === currentSlide ? 'bg-white w-12' : 'bg-white/30 w-3 hover:bg-white/50'
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