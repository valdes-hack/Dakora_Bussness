import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

const SettingsContext = createContext({});

export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({
    whatsapp_number: '',
    business_name: 'Dakora Business',
    slogan_fr: '',
    slogan_en: ''
  });
  const [loadingSettings, setLoadingSettings] = useState(true);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data && data.length > 0) {
      const map = {};
      data.forEach(s => { map[s.key] = s.value; });
      setSettings(prev => ({ ...prev, ...map }));
    }
    setLoadingSettings(false);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loadingSettings, refreshSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
