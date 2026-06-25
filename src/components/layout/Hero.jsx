import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Link } from 'react-router-dom';

const Hero = () => {
  const { t } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  // DONNÉES VARIABLES (Plus tard, elles viendront de Supabase)
  const slides = [
    {
      id: 1,
      image: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=1600&auto=format&fit=crop", // Placeholder agricole
      title: "Dakora Business 🚜",
      subtitle: "L'excellence agricole à votre portée",
      cta: "Voir la boutique",
      link: "/boutique"
    },
    {
      id: 2,
      image: "https://images.unsplash.com/photo-1625246333195-78d9c38ad449?q=80&w=1600&auto=format&fit=crop",
      title: "Équipements Modernes",
      subtitle: "Augmentez votre rendement avec nos motoculteurs",
      cta: "Découvrir",
      link: "/boutique"
    }
  ];

  // Défilement automatique
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Change toutes le 5 secondes
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <section className="relative h-[80vh] w-full overflow-hidden">
      {/* AFFICHAGE DES SLIDES */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* IMAGE DE FOND */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] scale-110"
            style={{ backgroundImage: `url(${slide.image})`, transform: index === currentSlide ? 'scale(1)' : 'scale(1.1)' }}
          >
            {/* OVERLAY SOMBRE POUR LA LISIBILITÉ */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
          </div>

          {/* CONTENU TEXTE (Style Apple Glass) */}
          <div className="relative h-full flex flex-col items-center justify-center text-center px-4">
            <div className="bg-white/10 backdrop-blur-md p-8 md:p-12 rounded-3xl border border-white/20 shadow-2xl max-w-3xl">
              <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 tracking-tight">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8 font-medium">
                {slide.subtitle}
              </p>
              <Link
                to={slide.link}
                className="inline-block bg-dakora-green hover:bg-green-700 text-white font-bold py-4 px-10 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
              >
                {slide.cta}
              </Link>
            </div>
          </div>
        </div>
      ))}

      {/* INDICATEURS DE SLIDE (Petits points en bas) */}
      {slides.length > 1 && (
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all ${
                index === currentSlide ? 'bg-white w-8' : 'bg-white/40'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;