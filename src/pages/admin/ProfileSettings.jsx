import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import {
  Save, Image as ImageIcon, Plus, Trash2, Phone,
  Type, UploadCloud, User, CheckCircle2, Star
} from 'lucide-react';

const ProfileSettings = () => {
  const { t } = useLanguage();
  const { user, profile } = useAuth();
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // --- ONGLET PROFIL ---
  const [profileData, setProfileData] = useState({
    username: '',
    full_name: '',
    profile_photo_url: ''
  });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);

  // --- ONGLET RÉGLAGES GÉNÉRAUX ---
  const [settings, setSettings] = useState({
    business_name: 'Dakora Business',
    whatsapp_number: '',
    slogan_fr: '',
    slogan_en: ''
  });

  // --- ONGLET BANNIÈRES ---
  const [banners, setBanners] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);

  useEffect(() => {
    if (profile) {
      setProfileData({
        username: profile.username || '',
        full_name: profile.full_name || '',
        profile_photo_url: profile.profile_photo_url || ''
      });
      setPhotoPreview(profile.profile_photo_url || null);
    }
    fetchSettings();
    fetchBanners();
  }, [profile]);

  // ─── FETCH ───────────────────────────────────────────
  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const map = {};
      data.forEach(s => { map[s.key] = s.value; });
      setSettings(prev => ({ ...prev, ...map }));
    }
  };

  const fetchBanners = async () => {
    const { data } = await supabase
      .from('stories')
      .select('*')
      .order('created_at', { ascending: false });
    setBanners(data || []);
  };

  // ─── SAUVEGARDE PROFIL ────────────────────────────────
  const saveProfile = async () => {
    setLoading(true);
    try {
      let photoUrl = profileData.profile_photo_url;

      // Upload photo si un fichier a été sélectionné
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const fileName = `avatars/${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from('products')
          .upload(fileName, photoFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage
          .from('products')
          .getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: profileData.username,
          full_name: profileData.full_name,
          profile_photo_url: photoUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) throw error;
      showSaved();
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── SAUVEGARDE RÉGLAGES GÉNÉRAUX ────────────────────
  const saveGeneral = async () => {
    setLoading(true);
    try {
      const updates = Object.keys(settings).map(key => ({ key, value: settings[key] }));
      const { error } = await supabase
        .from('settings')
        .upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      await refreshSettings(); // Propage les nouveaux settings partout dans le site
      showSaved();
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // ─── BANNIÈRES ────────────────────────────────────────
  const handleAddBanner = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setBannerLoading(true);
    try {
      // Nom de fichier unique pour éviter les collisions
      const ext = file.name.split('.').pop();
      const fileName = `banners/${Date.now()}.${ext}`;

      // Upload dans le bucket 'products' (celui qui existe déjà)
      const { error: uploadErr } = await supabase.storage
        .from('products')
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage
        .from('products')
        .getPublicUrl(fileName);

      const { error: insertErr } = await supabase.from('stories').insert([{
        media_url: urlData.publicUrl,
        title_fr: 'Dakora Business',
        title_en: 'Dakora Business',
        is_active: true
      }]);

      if (insertErr) throw insertErr;
      fetchBanners();
    } catch (err) {
      alert('Erreur upload : ' + err.message + '\n\nVérifie que le bucket "products" existe dans Supabase Storage et que les policies permettent l\'upload.');
    } finally {
      setBannerLoading(false);
      // Reset input pour permettre de re-sélectionner le même fichier
      e.target.value = '';
    }
  };

  const updateBannerTitle = async (id, field, value) => {
    await supabase.from('stories').update({ [field]: value }).eq('id', id);
  };

  const toggleBannerActive = async (id, current) => {
    await supabase.from('stories').update({ is_active: !current }).eq('id', id);
    fetchBanners();
  };

  const deleteBanner = async (id) => {
    if (window.confirm('Supprimer cette bannière ?')) {
      await supabase.from('stories').delete().eq('id', id);
      fetchBanners();
    }
  };

  // ─── HELPER ──────────────────────────────────────────
  const showSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handlePhotoSelect = (file) => {
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const tabs = [
    { id: 'profile', label: t('tab_profile'), icon: <User size={14} /> },
    { id: 'general', label: t('tab_general'), icon: <Phone size={14} /> },
    { id: 'banners', label: t('tab_banners'), icon: <ImageIcon size={14} /> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in duration-700">

      {/* HEADER */}
      <div>
        <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
          {t('settings_title')}
        </h1>
        <p className="text-gray-500 font-medium mt-1">{t('settings_subtitle')}</p>
      </div>

      {/* TABS */}
      <div className="flex gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit border border-black/5 dark:border-white/5">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id
                ? 'bg-white dark:bg-neutral-800 shadow-md text-dakora-green'
                : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════
          ONGLET 1 : MON PROFIL
      ═══════════════════════════════════════════════ */}
      {activeTab === 'profile' && (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white/20 shadow-2xl space-y-8">

          {/* PHOTO DE PROFIL */}
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-28 h-28 rounded-full border-4 border-dakora-green shadow-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
                {photoPreview
                  ? <img src={photoPreview} alt="Profil" className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={40} /></div>
                }
              </div>
              {/* Overlay pour changer la photo */}
              <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <UploadCloud size={24} className="text-white" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => e.target.files[0] && handlePhotoSelect(e.target.files[0])}
                />
              </label>
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-lg">{profileData.username || 'Admin'}</p>
              <p className="text-gray-400 text-sm mb-3">{user?.email}</p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 bg-dakora-green text-white rounded-full text-[10px] font-black uppercase cursor-pointer hover:bg-green-700 transition-all shadow-md">
                <UploadCloud size={14} /> {t('profile_change_photo')}
                <input type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files[0] && handlePhotoSelect(e.target.files[0])} />
              </label>
              {photoFile && (
                <p className="text-[10px] text-dakora-green font-bold mt-2">{t('profile_photo_selected')}</p>
              )}
            </div>
          </div>

          {/* CHAMPS PROFIL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-1">
                <User size={11} /> {t('profile_username')}
              </label>
              <input
                type="text"
                value={profileData.username}
                onChange={e => setProfileData({ ...profileData, username: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green font-bold dark:text-white"
                placeholder="ex: Valdes"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-1">
                <Type size={11} /> {t('profile_fullname')}
              </label>
              <input
                type="text"
                value={profileData.full_name}
                onChange={e => setProfileData({ ...profileData, full_name: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green font-bold dark:text-white"
                placeholder="ex: Valdes Dakora"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/5">
            <button
              onClick={saveProfile}
              disabled={loading}
              className="px-10 py-4 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-green-700 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : saved ? <><CheckCircle2 size={16} /> {t('saved')}</> : <><Save size={16} /> {t('save')}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ONGLET 2 : INFORMATIONS GÉNÉRALES (WhatsApp, Slogan...)
      ═══════════════════════════════════════════════ */}
      {activeTab === 'general' && (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-8 md:p-10 rounded-[3rem] border border-white/20 shadow-2xl space-y-8">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* WHATSAPP */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-dakora-green ml-2 flex items-center gap-1">
                <Phone size={11} /> {t('label_whatsapp')} *
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">+</span>
                <input type="text" value={settings.whatsapp_number}
                  onChange={e => setSettings({ ...settings, whatsapp_number: e.target.value })}
                  placeholder="237690000000"
                  className="w-full pl-8 pr-6 py-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green font-bold dark:text-white" />
              </div>
              <p className="text-[10px] text-gray-400 ml-2">{t('label_whatsapp_hint')}</p>
            </div>

            {/* NOM COMMERCIAL */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2 flex items-center gap-1">
                <Type size={11} /> {t('label_business_name')}
              </label>
              <input
                type="text"
                value={settings.business_name}
                onChange={e => setSettings({ ...settings, business_name: e.target.value })}
                className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green font-bold dark:text-white"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">{t('label_slogan_fr')}</label>
              <textarea value={settings.slogan_fr} onChange={e => setSettings({ ...settings, slogan_fr: e.target.value })}
                rows={3} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white resize-none"
                placeholder="Produisez plus, dépensez moins..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">{t('label_slogan_en')}</label>
              <textarea value={settings.slogan_en} onChange={e => setSettings({ ...settings, slogan_en: e.target.value })}
                rows={3} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white resize-none"
                placeholder="Produce more, spend less..." />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/5">
            <button
              onClick={saveGeneral}
              disabled={loading}
              className="px-10 py-4 bg-dakora-green text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-green-700 transition-all flex items-center gap-3 disabled:opacity-50"
            >
              {loading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : saved ? <><CheckCircle2 size={16} /> {t('saved')}</> : <><Save size={16} /> {t('save_settings')}</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          ONGLET 3 : BANNIÈRES D'ACCUEIL
      ═══════════════════════════════════════════════ */}
      {activeTab === 'banners' && (
        <div className="space-y-6">

          {/* BARRE D'ACTION */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-400 font-medium italic">
              {banners.length} {banners.length > 1 ? t('banner_count_many') : t('banner_count_one')} — {t('banner_slider_info')}
            </p>
            <label className={`cursor-pointer flex items-center gap-2 px-6 py-3 bg-dakora-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg ${bannerLoading ? 'opacity-50 pointer-events-none' : ''}`}>
              {bannerLoading
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <><Plus size={14} /> {t('add_banner')}</>
              }
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAddBanner}
              />
            </label>
          </div>

          {/* GRILLE BANNIÈRES */}
          {banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
              <ImageIcon size={48} className="text-gray-300 mb-4" />
              <p className="text-gray-400 italic font-bold text-center">{t('banner_empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {banners.map(banner => (
                <div
                  key={banner.id}
                  className={`group relative bg-white/40 dark:bg-white/5 rounded-[2.5rem] overflow-hidden border-2 shadow-xl transition-all ${
                    banner.is_active ? 'border-dakora-green' : 'border-gray-200 dark:border-white/10 opacity-60'
                  }`}
                >
                  {/* IMAGE */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={banner.media_url}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      alt=""
                    />
                    {/* Overlay texte */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-5 gap-2">
                      <input className="bg-white/10 backdrop-blur-sm text-white font-black text-base border border-white/20 rounded-xl px-3 py-1.5 w-full focus:ring-2 focus:ring-dakora-green focus:outline-none"
                        defaultValue={banner.title_fr || ''} placeholder={t('banner_title_fr')}
                        onBlur={e => updateBannerTitle(banner.id, 'title_fr', e.target.value)} />
                      <input className="bg-white/10 backdrop-blur-sm text-white/70 text-xs border border-white/10 rounded-xl px-3 py-1.5 w-full focus:ring-2 focus:ring-dakora-green focus:outline-none"
                        defaultValue={banner.title_en || ''} placeholder={t('banner_title_en')}
                        onBlur={e => updateBannerTitle(banner.id, 'title_en', e.target.value)} />
                    </div>
                  </div>

                  {/* ACTIONS */}
                  <div className="p-4 flex items-center justify-between gap-3">
                    <button
                      onClick={() => toggleBannerActive(banner.id, banner.is_active)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                        banner.is_active
                          ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-dakora-green hover:text-white'
                      }`}
                    >
                      <Star size={12} />
                      {banner.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteBanner(banner.id)}
                      className="p-2.5 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
