import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { createNotification, NOTIF_TYPES } from '../../utils/notify';
import { rules } from '../../utils/validation';
import FieldInput from '../../components/ui/FieldInput';
import {
  Save, Image as ImageIcon, Plus, Trash2, Phone,
  Type, UploadCloud, User, CheckCircle2, Star, Bell, AlertCircle, MapPin,
  Lock, Eye, EyeOff
} from 'lucide-react';

const ProfileSettings = () => {
  const { t, language } = useLanguage();
  const { user, profile, fetchProfile } = useAuth();
  const { refreshSettings } = useSettings();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // PROFIL
  const [profileData, setProfileData] = useState({ username: '', full_name: '', profile_photo_url: '' });
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [profileErrors, setProfileErrors] = useState({ username: null });

  // RÉGLAGES GÉNÉRAUX
  const [settings, setSettings] = useState({
    business_name: 'Dakora Business', whatsapp_number: '', slogan_fr: '', slogan_en: ''
  });
  const [generalErrors, setGeneralErrors] = useState({ whatsapp_number: null, business_name: null });

  // BANNIÈRES
  const [banners, setBanners] = useState([]);
  const [bannerLoading, setBannerLoading] = useState(false);

  // MOT DE PASSE
  const [showPwdSection, setShowPwdSection] = useState(false);
  const [pwdData, setPwdData]   = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdErrors, setPwdErrors] = useState({});
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdSaved, setPwdSaved]   = useState(false);
  const [showCurrentPwd, setShowCurrentPwd] = useState(false);
  const [showNewPwd, setShowNewPwd]         = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  // PRÉFÉRENCES NOTIFICATIONS — map { type: bool }
  const [notifPrefs, setNotifPrefs] = useState(
    Object.fromEntries(NOTIF_TYPES.map(n => [n.type, true]))
  );
  const [notifLoading, setNotifLoading] = useState(false);

  // VILLES DE LIVRAISON
  const [cities, setCities] = useState([]);
  const [cityLoading, setCityLoading] = useState(false);
  const [newCityFr, setNewCityFr] = useState('');
  const [newCityEn, setNewCityEn] = useState('');

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
    fetchCities();
  }, [profile]);

  const fetchSettings = async () => {
    const { data } = await supabase.from('settings').select('*');
    if (data) {
      const map = {};
      data.forEach(s => { map[s.key] = s.value; });
      setSettings(prev => ({ ...prev, ...map }));
      // Charger les préférences notif
      const prefs = {};
      NOTIF_TYPES.forEach(n => {
        const key = `notif_pref_${n.type}`;
        // valeur par défaut = true sauf si explicitement 'false'
        prefs[n.type] = map[key] !== 'false';
      });
      setNotifPrefs(prefs);
    }
  };

  const fetchBanners = async () => {
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
    setBanners(data || []);
  };

  const fetchCities = async () => {
    const { data } = await supabase.from('delivery_cities').select('*').order('name_fr');
    setCities(data || []);
  };

  // ─── SAUVEGARDE PROFIL ────────────────────────────────
  const saveProfile = async () => {
    const usernameErr = rules.nameFr(profileData.username);
    setProfileErrors({ username: usernameErr });
    if (usernameErr) return;
    setLoading(true);
    try {
      let photoUrl = profileData.profile_photo_url;
      if (photoFile) {
        const ext = photoFile.name.split('.').pop();
        const fileName = `avatars/${user.id}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, photoFile, { upsert: true });
        if (uploadErr) throw uploadErr;
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
        photoUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: profileData.username,
        full_name: profileData.full_name,
        profile_photo_url: photoUrl,
        email: user.email,
        updated_at: new Date().toISOString()
      });
      if (error) throw error;
      await fetchProfile(user.id);
      showSaved();
      createNotification(`Profil mis à jour : ${profileData.username}`, 'settings', '/admin/profil');
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setLoading(false); }
  };

  // ─── CHANGEMENT MOT DE PASSE ──────────────────────────
  const changePassword = async () => {
    const errors = {};
    if (!pwdData.currentPassword) errors.currentPassword = 'L\'ancien mot de passe est obligatoire';
    if (!pwdData.newPassword || pwdData.newPassword.length < 6) errors.newPassword = 'Minimum 6 caractères';
    if (pwdData.newPassword !== pwdData.confirmPassword) errors.confirmPassword = 'Les mots de passe ne correspondent pas';
    setPwdErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPwdLoading(true);
    try {
      // Vérifier l'ancien mot de passe en se reconnectant
      const { error: verifyErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwdData.currentPassword
      });
      if (verifyErr) {
        setPwdErrors({ currentPassword: 'Mot de passe incorrect' });
        setPwdLoading(false);
        return;
      }
      // Changer le mot de passe
      const { error } = await supabase.auth.updateUser({ password: pwdData.newPassword });
      if (error) throw error;

      // Reset
      setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwdErrors({});
      setPwdSaved(true);
      setTimeout(() => { setPwdSaved(false); setShowPwdSection(false); }, 2500);
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setPwdLoading(false);
    }
  };

  // ─── SAUVEGARDE RÉGLAGES GÉNÉRAUX ─────────────────────
  const saveGeneral = async () => {
    const waErr = rules.whatsapp(settings.whatsapp_number);
    const nameErr = rules.nameFr(settings.business_name);
    setGeneralErrors({ whatsapp_number: waErr, business_name: nameErr });
    if (waErr || nameErr) return;
    setLoading(true);
    try {
      const updates = Object.keys(settings).map(key => ({ key, value: settings[key] }));
      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      await refreshSettings();
      showSaved();
      createNotification('Paramètres généraux mis à jour (WhatsApp, slogan, nom)', 'settings', '/admin/profil');
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setLoading(false); }
  };

  // ─── BANNIÈRES ────────────────────────────────────────
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [bannerUrl, setBannerUrl] = useState('');

  const handleAddBannersMultiple = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setBannerLoading(true);
    let successCount = 0;
    let errors = [];

    try {
      for (const file of files) {
        try {
          const ext = file.name.split('.').pop();
          const fileName = `banners/${Date.now()}_${Math.random().toString(36).substr(2, 5)}.${ext}`;
          const { error: uploadErr } = await supabase.storage.from('products').upload(fileName, file, { cacheControl: '3600', upsert: false });
          if (uploadErr) throw uploadErr;
          
          const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
          const { error: insertErr } = await supabase.from('stories').insert([{
            media_url: urlData.publicUrl, title_fr: 'Dakora Business', title_en: 'Dakora Business', is_active: true
          }]);
          if (insertErr) throw insertErr;
          successCount++;
        } catch (err) {
          errors.push(`${file.name}: ${err.message}`);
        }
      }
      
      fetchBanners();
      if (successCount > 0) {
        createNotification(`${successCount} nouvelle(s) bannière(s) ajoutée(s)`, 'settings', '/admin/profil');
      }
      if (errors.length > 0) {
        alert("Certains fichiers n'ont pas pu être importés :\n" + errors.join('\n'));
      }
    } finally {
      setBannerLoading(false);
      e.target.value = '';
    }
  };

  const handleAddBannerByUrl = async (e) => {
    e.preventDefault();
    if (!bannerUrl.trim()) return;
    setBannerLoading(true);
    try {
      const { error: insertErr } = await supabase.from('stories').insert([{
        media_url: bannerUrl.trim(), title_fr: 'Dakora Business', title_en: 'Dakora Business', is_active: true
      }]);
      if (insertErr) throw insertErr;
      setBannerUrl('');
      setShowUrlInput(false);
      fetchBanners();
      createNotification('Nouvelle bannière par URL ajoutée', 'settings', '/admin/profil');
    } catch (err) {
      alert('Erreur ajout URL : ' + err.message);
    } finally {
      setBannerLoading(false);
    }
  };

  const updateBannerTitle = async (id, field, value) => {
    await supabase.from('stories').update({ [field]: value }).eq('id', id);
  };

  const toggleBannerActive = async (id, current) => {
    await supabase.from('stories').update({ is_active: !current }).eq('id', id);
    fetchBanners();
    createNotification(`Bannière ${!current ? 'activée' : 'désactivée'}`, 'settings', '/admin/profil');
  };

  const deleteBanner = async (id) => {
    if (window.confirm('Supprimer cette bannière ?')) {
      await supabase.from('stories').delete().eq('id', id);
      fetchBanners();
      createNotification('Bannière supprimée', 'settings', '/admin/profil');
    }
  };

  // ─── SAUVEGARDE PRÉFÉRENCES NOTIFS ────────────────────
  const saveNotifPrefs = async () => {
    setNotifLoading(true);
    try {
      const updates = NOTIF_TYPES.map(n => ({
        key: `notif_pref_${n.type}`,
        value: notifPrefs[n.type] ? 'true' : 'false'
      }));
      const { error } = await supabase.from('settings').upsert(updates, { onConflict: 'key' });
      if (error) throw error;
      showSaved();
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setNotifLoading(false); }
  };

  // ─── GESTION DES VILLES ────────────────────────────────
  const addCity = async () => {
    if (!newCityFr || !newCityEn) {
      alert('Veuillez remplir les noms en français et en anglais');
      return;
    }
    setCityLoading(true);
    try {
      const { error } = await supabase.from('delivery_cities').insert({
        name_fr: newCityFr,
        name_en: newCityEn
      });
      if (error) throw error;
      setNewCityFr('');
      setNewCityEn('');
      fetchCities();
      showSaved();
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setCityLoading(false); }
  };

  const deleteCity = async (id) => {
    if (window.confirm('Supprimer cette ville ?')) {
      await supabase.from('delivery_cities').delete().eq('id', id);
      fetchCities();
    }
  };

  const toggleCityActive = async (id, isActive) => {
    await supabase.from('delivery_cities').update({ is_active: !isActive }).eq('id', id);
    fetchCities();
  };

  const showSaved = () => { setSaved(true); setTimeout(() => setSaved(false), 2500); };
  const handlePhotoSelect = (file) => { setPhotoFile(file); setPhotoPreview(URL.createObjectURL(file)); };

  const tabs = [
    { id: 'profile', label: t('tab_profile'), icon: <User size={14}/> },
    { id: 'general', label: t('tab_general'), icon: <Phone size={14}/> },
    { id: 'banners', label: t('tab_banners'), icon: <ImageIcon size={14}/> },
    { id: 'cities', label: language === 'fr' ? 'Villes' : 'Cities', icon: <MapPin size={14}/> },
    { id: 'notifications', label: language === 'fr' ? 'Notifications' : 'Notifications', icon: <Bell size={14}/> },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 md:space-y-10 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">{t('settings_title')}</h1>
        <p className="text-gray-500 font-medium mt-1">{t('settings_subtitle')}</p>
      </div>

      {/* TABS */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-gray-100 dark:bg-white/5 rounded-2xl w-fit border border-black/5 dark:border-white/5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-2.5 rounded-xl text-[10px] md:text-xs font-black uppercase tracking-widest transition-all ${
              activeTab === tab.id ? 'bg-white dark:bg-neutral-800 shadow-md text-dakora-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'
            }`}>
            {tab.icon} <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── PROFIL ── */}
      {activeTab === 'profile' && (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl space-y-6 md:space-y-8">
          <div className="flex flex-col sm:flex-row items-center gap-6 md:gap-8">
            <div className="relative group">
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-dakora-green shadow-xl overflow-hidden bg-gray-100 dark:bg-neutral-800">
                {photoPreview
                  ? <img src={photoPreview} alt="Profil" className="w-full h-full object-cover"/>
                  : <div className="w-full h-full flex items-center justify-center text-gray-300"><User size={36}/></div>}
              </div>
              <label className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <UploadCloud size={22} className="text-white"/>
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handlePhotoSelect(e.target.files[0])}/>
              </label>
            </div>
            <div className="text-center sm:text-left">
              <p className="font-black text-gray-900 dark:text-white text-base md:text-lg">{profileData.username || 'Admin'}</p>
              <p className="text-gray-400 text-xs md:text-sm mb-3">{user?.email}</p>
              <label className="inline-flex items-center gap-2 px-4 md:px-5 py-2 md:py-2.5 bg-dakora-green text-white rounded-full text-[9px] md:text-[10px] font-black uppercase cursor-pointer hover:bg-green-700 transition-all shadow-md">
                <UploadCloud size={13}/> {t('profile_change_photo')}
                <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handlePhotoSelect(e.target.files[0])}/>
              </label>
              {photoFile && <p className="text-[9px] md:text-[10px] text-dakora-green font-bold mt-2">{t('profile_photo_selected')}</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FieldInput
              label={t('profile_username')}
              required
              value={profileData.username}
              onChange={e => { setProfileData({...profileData, username: e.target.value}); setProfileErrors({username: null}); }}
              error={profileErrors.username}
              placeholder="ex: Valdes"
            />
            <FieldInput
              label={t('profile_fullname')}
              value={profileData.full_name}
              onChange={e => setProfileData({...profileData, full_name: e.target.value})}
              placeholder="ex: Valdes Dakora"
            />
          </div>

          {/* ── CHANGEMENT MOT DE PASSE ── */}
          <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-black uppercase tracking-widest text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Lock size={14} className="text-dakora-green"/>
                {language === 'fr' ? 'Changer le mot de passe' : 'Change password'}
              </h4>
              <button
                type="button"
                onClick={() => setShowPwdSection(s => !s)}
                className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-xl transition-all ${showPwdSection ? 'bg-gray-100 dark:bg-white/10 text-gray-500' : 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white'}`}
              >
                {showPwdSection ? (language === 'fr' ? 'Masquer' : 'Hide') : (language === 'fr' ? 'Modifier' : 'Edit')}
              </button>
            </div>

            {showPwdSection && (
              <div className="space-y-4 animate-in slide-in-from-top-2 duration-200">
                {/* Ancien mot de passe */}
                <div className="space-y-1.5">
                  <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                    {language === 'fr' ? 'Ancien mot de passe' : 'Current password'}
                    <span className="text-red-500 text-xs">★</span>
                  </label>
                  <div className="relative">
                    <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                    <input
                      type={showCurrentPwd ? 'text' : 'password'}
                      value={pwdData.currentPassword}
                      onChange={e => { setPwdData(p => ({...p, currentPassword: e.target.value})); setPwdErrors(p => ({...p, currentPassword: null})); }}
                      placeholder={language === 'fr' ? 'Votre mot de passe actuel' : 'Your current password'}
                      className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${pwdErrors.currentPassword ? 'border-red-400 bg-red-50/50 dark:bg-red-500/5' : 'border-gray-200 dark:border-white/10'}`}
                    />
                    <button type="button" onClick={() => setShowCurrentPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                      {showCurrentPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                    </button>
                  </div>
                  {pwdErrors.currentPassword && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {pwdErrors.currentPassword}</p>}
                </div>

                {/* Nouveau mot de passe */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      {language === 'fr' ? 'Nouveau mot de passe' : 'New password'}
                      <span className="text-red-500 text-xs">★</span>
                    </label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input
                        type={showNewPwd ? 'text' : 'password'}
                        value={pwdData.newPassword}
                        onChange={e => { setPwdData(p => ({...p, newPassword: e.target.value})); setPwdErrors(p => ({...p, newPassword: null, confirmPassword: null})); }}
                        placeholder="Min. 6 caractères"
                        className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${pwdErrors.newPassword ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'}`}
                      />
                      <button type="button" onClick={() => setShowNewPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showNewPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    {pwdErrors.newPassword && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {pwdErrors.newPassword}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
                      {language === 'fr' ? 'Confirmer' : 'Confirm'}
                      <span className="text-red-500 text-xs">★</span>
                      {!pwdErrors.confirmPassword && pwdData.confirmPassword && pwdData.newPassword === pwdData.confirmPassword && (
                        <span className="text-dakora-green text-xs">✓</span>
                      )}
                    </label>
                    <div className="relative">
                      <Lock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
                      <input
                        type={showConfirmPwd ? 'text' : 'password'}
                        value={pwdData.confirmPassword}
                        onChange={e => { setPwdData(p => ({...p, confirmPassword: e.target.value})); setPwdErrors(p => ({...p, confirmPassword: null})); }}
                        placeholder={language === 'fr' ? 'Répéter le nouveau' : 'Repeat new password'}
                        className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-neutral-900 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${pwdErrors.confirmPassword ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'}`}
                      />
                      <button type="button" onClick={() => setShowConfirmPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                        {showConfirmPwd ? <EyeOff size={15}/> : <Eye size={15}/>}
                      </button>
                    </div>
                    {pwdErrors.confirmPassword && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {pwdErrors.confirmPassword}</p>}
                  </div>
                </div>

                {/* Bouton changer mot de passe */}
                <div className="flex justify-end">
                  <button onClick={changePassword} disabled={pwdLoading}
                    className="flex items-center gap-2 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg hover:bg-gray-700 dark:hover:bg-gray-100 transition-all disabled:opacity-50">
                    {pwdLoading
                      ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>
                      : pwdSaved
                        ? <><CheckCircle2 size={14}/> {language === 'fr' ? 'Modifié !' : 'Changed!'}</>
                        : <><Lock size={14}/> {language === 'fr' ? 'Changer le mot de passe' : 'Change password'}</>
                    }
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/5">
            <button onClick={saveProfile} disabled={loading}
              className="px-6 md:px-10 py-3 md:py-4 bg-dakora-green text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-green-700 transition-all flex items-center gap-2 md:gap-3 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : saved ? <><CheckCircle2 size={15}/> {t('saved')}</> : <><Save size={15}/> {t('save')}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── GÉNÉRAL ── */}
      {activeTab === 'general' && (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <FieldInput
              label={`${t('label_whatsapp')} (sans +)`}
              required
              type="tel"
              value={settings.whatsapp_number}
              onChange={e => { setSettings({...settings, whatsapp_number: e.target.value}); setGeneralErrors(p => ({...p, whatsapp_number: null})); }}
              error={generalErrors.whatsapp_number}
              placeholder="Ex: 237690000000 (votre numéro WhatsApp)"
            />
            <FieldInput
              label={t('label_business_name')}
              required
              value={settings.business_name}
              onChange={e => { setSettings({...settings, business_name: e.target.value}); setGeneralErrors(p => ({...p, business_name: null})); }}
              error={generalErrors.business_name}
              placeholder="Dakora Business"
            />
            <FieldInput
              label={t('label_slogan_fr')}
              as="textarea"
              rows={3}
              value={settings.slogan_fr}
              onChange={e => setSettings({...settings, slogan_fr: e.target.value})}
              placeholder="Produisez plus, dépensez moins..."
            />
            <FieldInput
              label={t('label_slogan_en')}
              as="textarea"
              rows={3}
              value={settings.slogan_en}
              onChange={e => setSettings({...settings, slogan_en: e.target.value})}
              placeholder="Produce more, spend less..."
            />
          </div>
          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/5">
            <button onClick={saveGeneral} disabled={loading}
              className="px-6 md:px-10 py-3 md:py-4 bg-dakora-green text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-green-700 transition-all flex items-center gap-2 md:gap-3 disabled:opacity-50">
              {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : saved ? <><CheckCircle2 size={15}/> {t('saved')}</> : <><Save size={15}/> {t('save_settings')}</>}
            </button>
          </div>
        </div>
      )}

      {/* ── BANNIÈRES ── */}
      {activeTab === 'banners' && (
        <div className="space-y-4 md:space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <p className="text-xs md:text-sm text-gray-400 font-medium italic">
              {banners.length} {banners.length > 1 ? t('banner_count_many') : t('banner_count_one')} — {t('banner_slider_info')}
            </p>
            <div className="flex flex-wrap gap-2">
              <label className={`cursor-pointer flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-dakora-green text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-lg ${bannerLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                {bannerLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><UploadCloud size={13}/> {language === 'fr' ? 'Uploader des images' : 'Upload images'}</>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleAddBannersMultiple}/>
              </label>
              <button
                type="button"
                onClick={() => setShowUrlInput(prev => !prev)}
                className="flex items-center gap-2 px-4 md:px-5 py-2.5 md:py-3 bg-blue-500 text-white rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg"
              >
                <Plus size={13}/> {language === 'fr' ? 'Ajouter par lien URL' : 'Add by URL link'}
              </button>
            </div>
          </div>

          {showUrlInput && (
            <form onSubmit={handleAddBannerByUrl} className="flex gap-2 p-3 md:p-4 bg-gray-50 dark:bg-white/5 rounded-xl md:rounded-2xl border border-black/5 dark:border-white/5 animate-in slide-in-from-top-2 duration-200">
              <input
                type="url"
                required
                value={bannerUrl}
                onChange={e => setBannerUrl(e.target.value)}
                placeholder={language === 'fr' ? 'Coller le lien URL de l\'image de la bannière...' : 'Paste the banner image URL link...'}
                className="flex-grow px-3 md:px-4 py-2.5 md:py-3 rounded-lg md:rounded-xl bg-white dark:bg-neutral-800 text-[10px] md:text-xs font-bold dark:text-white border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-dakora-green outline-none"
              />
              <button
                type="submit"
                disabled={bannerLoading}
                className="px-4 md:px-6 py-2.5 md:py-3 bg-dakora-green text-white rounded-lg md:rounded-xl font-black text-[9px] md:text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all"
              >
                {language === 'fr' ? 'Ajouter' : 'Add'}
              </button>
            </form>
          )}
          {banners.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white/40 dark:bg-white/5 rounded-[2rem] md:rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
              <ImageIcon size={40} className="text-gray-300 mb-4"/>
              <p className="text-gray-400 italic font-bold text-center text-xs md:text-sm">{t('banner_empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {banners.map(banner => (
                <div key={banner.id} className={`group relative bg-white/40 dark:bg-white/5 rounded-[2rem] md:rounded-[2.5rem] overflow-hidden border-2 shadow-xl transition-all ${banner.is_active ? 'border-dakora-green' : 'border-gray-200 dark:border-white/10 opacity-60'}`}>
                  <div className="aspect-video relative overflow-hidden">
                    <img src={banner.media_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" loading="lazy"/>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-3 md:p-5 gap-1.5 md:gap-2">
                      <input className="bg-white/10 backdrop-blur-sm text-white font-black text-sm md:text-base border border-white/20 rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 w-full focus:ring-2 focus:ring-dakora-green focus:outline-none"
                        defaultValue={banner.title_fr || ''} placeholder={t('banner_title_fr')}
                        onBlur={e => updateBannerTitle(banner.id, 'title_fr', e.target.value)}/>
                      <input className="bg-white/10 backdrop-blur-sm text-white/70 text-[10px] md:text-xs border border-white/10 rounded-lg md:rounded-xl px-2 md:px-3 py-1 md:py-1.5 w-full focus:ring-2 focus:ring-dakora-green focus:outline-none"
                        defaultValue={banner.title_en || ''} placeholder={t('banner_title_en')}
                        onBlur={e => updateBannerTitle(banner.id, 'title_en', e.target.value)}/>
                    </div>
                  </div>
                  <div className="p-3 md:p-4 flex items-center justify-between gap-2 md:gap-3">
                    <button onClick={() => toggleBannerActive(banner.id, banner.is_active)}
                      className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all ${banner.is_active ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-dakora-green hover:text-white'}`}>
                      <Star size={11}/> {banner.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button onClick={() => deleteBanner(banner.id)} className="p-2 md:p-2.5 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-lg md:rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── VILLES DE LIVRAISON ── */}
      {activeTab === 'cities' && (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl space-y-6 md:space-y-8">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base md:text-lg uppercase tracking-tight flex items-center gap-2 md:gap-3">
              <MapPin size={18} className="text-dakora-green"/> {language === 'fr' ? 'Villes de Livraison' : 'Delivery Cities'}
            </h3>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {language === 'fr'
                ? 'Gérez les villes où vous effectuez des livraisons. Les clients pourront sélectionner leur ville lors de la commande.'
                : 'Manage the cities where you deliver. Customers can select their city when ordering.'}
            </p>
          </div>

          {/* Formulaire d'ajout */}
          <div className="p-4 md:p-6 bg-gray-50 dark:bg-white/5 rounded-xl md:rounded-2xl border border-black/5 dark:border-white/5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <FieldInput
                label={language === 'fr' ? 'Nom (Français)' : 'Name (French)'}
                value={newCityFr}
                onChange={e => setNewCityFr(e.target.value)}
                placeholder="ex: Douala"
              />
              <FieldInput
                label={language === 'fr' ? 'Nom (Anglais)' : 'Name (English)'}
                value={newCityEn}
                onChange={e => setNewCityEn(e.target.value)}
                placeholder="ex: Douala"
              />
            </div>
            <button
              onClick={addCity}
              disabled={cityLoading}
              className="flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-dakora-green text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-green-700 transition-all disabled:opacity-50"
            >
              {cityLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : <><Plus size={15}/> {language === 'fr' ? 'Ajouter la ville' : 'Add City'}</>}
            </button>
          </div>

          {/* Liste des villes */}
          {cities.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 md:p-20 bg-white/40 dark:bg-white/5 rounded-[2rem] md:rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
              <MapPin size={40} className="text-gray-300 mb-4"/>
              <p className="text-gray-400 italic font-bold text-center text-xs md:text-sm">{language === 'fr' ? 'Aucune ville configurée' : 'No cities configured'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cities.map(city => (
                <div key={city.id} className={`flex items-center justify-between p-4 md:p-5 bg-white/40 dark:bg-white/5 rounded-xl md:rounded-2xl border-2 transition-all ${city.is_active ? 'border-dakora-green' : 'border-gray-200 dark:border-white/10 opacity-60'}`}>
                  <div className="flex items-center gap-3 md:gap-4">
                    <MapPin size={18} className={city.is_active ? 'text-dakora-green' : 'text-gray-400'}/>
                    <div>
                      <p className="font-black text-gray-900 dark:text-white text-sm md:text-base">{city.name_fr}</p>
                      <p className="text-[10px] md:text-xs text-gray-400">{city.name_en}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleCityActive(city.id, city.is_active)}
                      className={`flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-[9px] md:text-[10px] font-black uppercase transition-all ${city.is_active ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-dakora-green hover:text-white'}`}
                    >
                      {city.is_active ? 'Active' : 'Inactive'}
                    </button>
                    <button
                      onClick={() => deleteCity(city.id)}
                      className="p-2 md:p-2.5 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-lg md:rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                      <Trash2 size={15}/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── NOTIFICATIONS ── */}
      {activeTab === 'notifications' && (
        <div className="bg-white/50 dark:bg-white/5 backdrop-blur-xl p-6 md:p-8 lg:p-10 rounded-[2rem] md:rounded-[3rem] border border-white/20 shadow-2xl space-y-6 md:space-y-8">
          <div>
            <h3 className="font-black text-gray-900 dark:text-white text-base md:text-lg uppercase tracking-tight flex items-center gap-2 md:gap-3">
              <Bell size={18} className="text-dakora-green"/> {language === 'fr' ? 'Préférences de Notifications' : 'Notification Preferences'}
            </h3>
            <p className="text-xs md:text-sm text-gray-400 mt-1">
              {language === 'fr'
                ? 'Activez ou désactivez les notifications pour chaque type d\'action admin.'
                : 'Enable or disable notifications for each type of admin action.'}
            </p>
          </div>

          <div className="space-y-3">
            {NOTIF_TYPES.map(n => (
              <div key={n.type}
                className="flex items-center justify-between p-3 md:p-5 bg-gray-50 dark:bg-neutral-900/60 rounded-xl md:rounded-2xl border border-black/5 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
                <div className="flex items-center gap-3 md:gap-4">
                  <span className="text-xl md:text-2xl w-8 md:w-10 text-center">{n.emoji}</span>
                  <div>
                    <p className="font-black text-gray-900 dark:text-white text-xs md:text-sm">
                      {language === 'fr' ? n.labelFr : n.labelEn}
                    </p>
                    <p className="text-[9px] md:text-[10px] text-gray-400 font-medium mt-0.5">
                      {notifPrefs[n.type]
                        ? (language === 'fr' ? 'Activée — vous recevez ces alertes' : 'Enabled — you receive these alerts')
                        : (language === 'fr' ? 'Désactivée — alertes silencieuses' : 'Disabled — silent alerts')}
                    </p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => setNotifPrefs(prev => ({ ...prev, [n.type]: !prev[n.type] }))}
                  className={`w-10 h-5 md:w-12 md:h-6 rounded-full relative transition-colors duration-300 focus:outline-none flex-shrink-0 ${notifPrefs[n.type] ? 'bg-dakora-green' : 'bg-gray-300 dark:bg-gray-600'}`}
                  aria-label={`Toggle ${n.type} notifications`}
                >
                  <div className={`absolute top-0.5 md:top-1 left-0.5 md:left-1 w-4 h-4 md:w-4 md:h-4 bg-white rounded-full shadow transition-transform duration-300 ${notifPrefs[n.type] ? 'translate-x-5 md:translate-x-6' : 'translate-x-0'}`}/>
                </button>
              </div>
            ))}
          </div>

          {/* Info globale */}
          <div className="p-3 md:p-4 bg-dakora-green/5 border border-dakora-green/20 rounded-xl md:rounded-2xl">
            <p className="text-[10px] md:text-[11px] text-dakora-green font-bold">
              {language === 'fr'
                ? '💡 Les notifications désactivées sont simplement ignorées — elles ne créent aucune entrée dans le centre de notifications.'
                : '💡 Disabled notifications are simply ignored — no entry is created in the notification center.'}
            </p>
          </div>

          <div className="flex justify-end pt-4 border-t border-black/5 dark:border-white/5">
            <button onClick={saveNotifPrefs} disabled={notifLoading}
              className="px-6 md:px-10 py-3 md:py-4 bg-dakora-green text-white rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-[10px] md:text-xs shadow-xl hover:bg-green-700 transition-all flex items-center gap-2 md:gap-3 disabled:opacity-50">
              {notifLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                : saved ? <><CheckCircle2 size={15}/> {language === 'fr' ? 'Enregistré !' : 'Saved!'}</> : <><Save size={15}/> {language === 'fr' ? 'Enregistrer les préférences' : 'Save preferences'}</>}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileSettings;
