import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

const Features = () => {
  const { t } = useLanguage();

  const advantages = [
    { icon: "🚚", title: t('feat_delivery'), desc: t('feat_delivery_desc') },
    { icon: "⭐", title: t('feat_quality'), desc: t('feat_quality_desc') },
    { icon: "🛠️", title: t('feat_support'), desc: t('feat_support_desc') }
  ];

  return (
    <section className="py-16 px-6 bg-gray-50 dark:bg-neutral-900 transition-colors">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        {advantages.map((item, index) => (
          <div 
            key={index} 
            className="p-8 rounded-3xl bg-white/50 dark:bg-white/5 backdrop-blur-sm 
                       border border-gray-200 dark:border-white/10 
                       text-center hover:scale-105 transition-all duration-300 shadow-sm"
          >
            <div className="text-4xl mb-4">{item.icon}</div>
            <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-white">
              {item.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {item.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default Features;