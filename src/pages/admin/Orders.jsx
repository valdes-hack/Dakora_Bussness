import { useLanguage } from '../../context/LanguageContext';

export default function Orders() {
  const { t } = useLanguage();
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
          {t('orders_title')} <span className="text-dakora-green">{t('orders_title_green')}</span>
        </h1>
      </div>
      <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/20 h-64 flex items-center justify-center border-dashed">
        <p className="text-gray-400 italic font-medium">{t('msg_loading')}</p>
      </div>
    </div>
  );
}
