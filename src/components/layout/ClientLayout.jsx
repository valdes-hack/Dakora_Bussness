import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import { useSettings } from '../../context/SettingsContext';
import { useLanguage } from '../../context/LanguageContext';

const WhatsAppFloat = () => {
  const { settings } = useSettings();
  const { language } = useLanguage();
  const waNumber = settings.whatsapp_number || '237690000000';
  const msg = language === 'fr'
    ? 'Bonjour Dakora Business 👋 Je souhaite obtenir des informations sur vos équipements agricoles.'
    : 'Hello Dakora Business 👋 I would like to get information about your agricultural equipment.';

  return (
    <a
      href={`https://wa.me/${waNumber}?text=${encodeURIComponent(msg)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contacter sur WhatsApp"
      className="fixed bottom-6 right-6 z-50 group"
    >
      {/* Bulle de pulsation */}
      <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-30 animate-ping" />
      {/* Bouton principal */}
      <span className="relative flex items-center justify-center w-14 h-14 bg-[#25D366] rounded-full shadow-2xl shadow-[#25D366]/40 hover:scale-110 transition-transform duration-200 animate-float">
        {/* Icône WhatsApp SVG */}
        <svg viewBox="0 0 32 32" className="w-7 h-7 fill-white" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm0 25.456a11.419 11.419 0 01-5.82-1.595l-.418-.247-4.29 1.126 1.145-4.18-.272-.43a11.438 11.438 0 01-1.756-6.126c0-6.313 5.142-11.456 11.411-11.456 6.27 0 11.412 5.143 11.412 11.456 0 6.314-5.143 11.452-11.412 11.452zm6.27-8.578c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/>
        </svg>
      </span>
      {/* Tooltip */}
      <span className="absolute right-16 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none shadow-xl">
        {language === 'fr' ? 'Nous contacter' : 'Contact us'}
      </span>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .animate-float { animation: float 2.8s ease-in-out infinite; }
      `}</style>
    </a>
  );
};

const ClientLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-neutral-950 transition-colors duration-300">
      <Header />
      <main className="flex-grow pt-28">
        <Outlet />
      </main>
      <Footer />
      <WhatsAppFloat />
    </div>
  );
};

export default ClientLayout;
