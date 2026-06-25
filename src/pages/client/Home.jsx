import Hero from '../../components/layout/Hero.jsx';
import Features from '../../components/layout/Features.jsx';

export default function Home() {
  return (
    <div className="animate-in fade-in duration-700">
      <Hero />
      <Features />
      
      {/* Section Catégories (prochaine étape) */}
      <section className="py-20 px-6 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl font-bold dark:text-white mb-4">
          Nos Catégories
        </h2>
        <p className="text-gray-500 italic font-medium">Bientôt disponible avec Supabase...</p>
      </section>
    </div>
  );
}