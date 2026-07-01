import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { rules } from '../../utils/validation';
import FieldInput from '../../components/ui/FieldInput';
import {
  Users, Plus, Trash2, Shield, X, CheckCircle2,
  Loader2, Eye, EyeOff, User, Mail, Lock, AlertCircle
} from 'lucide-react';

// ─── MODAL CRÉATION ADMIN ─────────────────────────────────────────────────────
const CreateAdminModal = ({ onClose, onCreated, currentUser }) => {
  const { language } = useLanguage();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const e = {};
    const usernameErr = rules.nameFr(form.username);
    const emailErr    = rules.required(form.email) || rules.email(form.email);
    const pwdErr      = !form.password ? 'Le mot de passe est obligatoire'
                      : form.password.length < 6 ? 'Minimum 6 caractères' : null;
    const confirmErr  = form.password !== form.confirmPassword ? 'Les mots de passe ne correspondent pas' : null;
    if (usernameErr)  e.username = usernameErr;
    if (emailErr)     e.email    = emailErr;
    if (pwdErr)       e.password = pwdErr;
    if (confirmErr)   e.confirmPassword = confirmErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);

    try {
      // 1. Créer l'utilisateur dans auth.users via signUp
      //    On utilise signUp — le nouvel utilisateur est créé dans Supabase Auth
      //    On sauvegarde la session courante pour la restaurer ensuite
      const { data: currentSession } = await supabase.auth.getSession();

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: form.email.trim().toLowerCase(),
        password: form.password,
        options: {
          // Ne pas envoyer d'email de confirmation (si désactivé dans Supabase)
          emailRedirectTo: undefined,
          data: { username: form.username.trim() }
        }
      });

      if (signUpErr) throw signUpErr;
      if (!signUpData.user) throw new Error('Création du compte échouée');

      const newUserId = signUpData.user.id;

      // 2. Insérer le profil admin dans la table profiles
      const { error: profileErr } = await supabase.from('profiles').upsert([{
        id: newUserId,
        username: form.username.trim(),
        full_name: form.username.trim(),
        email: form.email.trim().toLowerCase(),
        role: 'admin',
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' });

      if (profileErr) throw profileErr;

      // 3. Restaurer la session de l'admin actuel si elle a été remplacée
      if (currentSession?.session) {
        await supabase.auth.setSession({
          access_token:  currentSession.session.access_token,
          refresh_token: currentSession.session.refresh_token,
        });
      }

      onCreated();
    } catch (err) {
      setGlobalError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300 border border-white/20">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-dakora-green/10 rounded-2xl flex items-center justify-center">
              <Shield size={18} className="text-dakora-green"/>
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">
                {language === 'fr' ? 'Nouvel Administrateur' : 'New Administrator'}
              </p>
              <p className="text-[10px] text-gray-400">Rôle : Admin</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:rotate-90 transition-all">
            <X size={18}/>
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Erreur globale */}
          {globalError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl">
              <AlertCircle size={16} className="text-red-500 flex-shrink-0"/>
              <p className="text-xs text-red-600 dark:text-red-400 font-bold">{globalError}</p>
            </div>
          )}

          {/* Légende */}
          <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1.5">
            <span className="text-red-500">★</span> = Obligatoire
          </p>

          <FieldInput
            label={language === 'fr' ? "Nom d'utilisateur" : 'Username'}
            required value={form.username}
            onChange={e => { setForm(p => ({...p, username: e.target.value})); setErrors(p => ({...p, username: null})); }}
            error={errors.username} placeholder="ex: Valdes"
          >
            <div className="relative">
              <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type="text" value={form.username}
                onChange={e => { setForm(p => ({...p, username: e.target.value})); setErrors(p => ({...p, username: null})); }}
                placeholder="ex: Valdes"
                className={`w-full pl-9 pr-4 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${errors.username ? 'border-red-400 bg-red-50/50 dark:bg-red-500/5' : 'border-gray-200 dark:border-white/10'}`}
              />
            </div>
            {errors.username && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {errors.username}</p>}
          </FieldInput>

          {/* Email */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              Email <span className="text-red-500 text-xs">★</span>
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type="email" value={form.email}
                onChange={e => { setForm(p => ({...p, email: e.target.value})); setErrors(p => ({...p, email: null})); }}
                placeholder="admin@email.com"
                className={`w-full pl-9 pr-4 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${errors.email ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'}`}
              />
            </div>
            {errors.email && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {errors.email}</p>}
          </div>

          {/* Mot de passe */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              {language === 'fr' ? 'Mot de passe' : 'Password'} <span className="text-red-500 text-xs">★</span>
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type={showPwd ? 'text' : 'password'} value={form.password}
                onChange={e => { setForm(p => ({...p, password: e.target.value})); setErrors(p => ({...p, password: null})); }}
                placeholder="Min. 6 caractères"
                className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${errors.password ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'}`}
              />
              <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errors.password && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {errors.password}</p>}
          </div>

          {/* Confirmation */}
          <div className="space-y-1.5">
            <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
              {language === 'fr' ? 'Confirmer le mot de passe' : 'Confirm password'} <span className="text-red-500 text-xs">★</span>
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
              <input type={showConfirm ? 'text' : 'password'} value={form.confirmPassword}
                onChange={e => { setForm(p => ({...p, confirmPassword: e.target.value})); setErrors(p => ({...p, confirmPassword: null})); }}
                placeholder="Répéter le mot de passe"
                className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${errors.confirmPassword ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'}`}
              />
              <button type="button" onClick={() => setShowConfirm(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showConfirm ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {errors.confirmPassword}</p>}
          </div>

          {/* Info */}
          <div className="p-3 bg-dakora-green/5 border border-dakora-green/20 rounded-2xl">
            <p className="text-[10px] text-dakora-green font-bold">
              💡 {language === 'fr'
                ? "Le nouvel admin pourra se connecter avec son email OU son nom d'utilisateur."
                : "The new admin can log in with their email OR username."}
            </p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button onClick={handleCreate} disabled={loading}
            className="flex-[2] py-3 bg-dakora-green text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={16} className="animate-spin"/> : <><CheckCircle2 size={16}/> Créer l'admin</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const AdminUsers = () => {
  const { language } = useLanguage();
  const { user: currentUser } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchAdmins(); }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });
    setAdmins(data || []);
    setLoading(false);
  };

  const handleCreated = () => {
    setShowCreate(false);
    setSuccess(language === 'fr' ? 'Administrateur créé avec succès !' : 'Administrator created successfully!');
    setTimeout(() => setSuccess(''), 4000);
    fetchAdmins();
  };

  const handleDelete = async (admin) => {
    if (admin.id === currentUser?.id) {
      alert(language === 'fr' ? 'Impossible de supprimer votre propre compte.' : 'Cannot delete your own account.');
      return;
    }
    const confirmed = window.confirm(
      language === 'fr'
        ? `Supprimer l'admin "${admin.username || admin.full_name}" ?`
        : `Delete admin "${admin.username || admin.full_name}"?`
    );
    if (!confirmed) return;

    setDeleting(admin.id);
    try {
      // Supprimer uniquement le profil (la suppression auth nécessite la service key)
      await supabase.from('profiles').delete().eq('id', admin.id);
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {language === 'fr' ? 'Gestion des' : 'Manage'} <span className="text-dakora-green">Utilisateurs</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {language === 'fr' ? 'Administrateurs ayant accès à l\'interface de gestion.' : 'Administrators with access to the management interface.'}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-6 py-3 bg-dakora-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95">
          <Plus size={16}/> {language === 'fr' ? 'Créer un admin' : 'Create admin'}
        </button>
      </div>

      {/* Toast succès */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-dakora-green/10 text-dakora-green rounded-2xl border border-dakora-green/20 animate-in slide-in-from-top-2">
          <CheckCircle2 size={18}/> <span className="font-bold text-sm">{success}</span>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3].map(n => <div key={n} className="h-20 rounded-2xl bg-white/40 dark:bg-white/5 animate-pulse"/>)}
        </div>
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10 text-center">
          <Users size={48} className="text-gray-300 mb-4"/>
          <p className="text-gray-400 italic font-bold">{language === 'fr' ? 'Aucun administrateur enregistré.' : 'No administrators registered.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map(admin => {
            const isMe = admin.id === currentUser?.id;
            return (
              <div key={admin.id}
                className={`flex items-center gap-4 bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[2rem] px-5 py-4 border shadow-md transition-all ${isMe ? 'border-dakora-green/30' : 'border-white/20'}`}>

                {/* Avatar */}
                {admin.profile_photo_url ? (
                  <img src={admin.profile_photo_url} loading="lazy" alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-dakora-green flex-shrink-0"/>
                ) : (
                  <div className="w-12 h-12 rounded-2xl bg-dakora-green/10 flex items-center justify-center flex-shrink-0">
                    <User size={20} className="text-dakora-green"/>
                  </div>
                )}

                {/* Infos */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 dark:text-white text-sm">{admin.username || admin.full_name || 'Sans nom'}</p>
                    {isMe && (
                      <span className="px-2 py-0.5 bg-dakora-green/10 text-dakora-green text-[9px] font-black uppercase rounded-full">
                        {language === 'fr' ? 'Vous' : 'You'}
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
                      <Shield size={9}/> Admin
                    </span>
                  </div>
                  {admin.email && <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1"><Mail size={11}/> {admin.email}</p>}
                  {admin.updated_at && (
                    <p className="text-[9px] text-gray-300 dark:text-white/30 font-bold mt-0.5">
                      {language === 'fr' ? 'Mis à jour' : 'Updated'} : {new Date(admin.updated_at).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Actions */}
                {!isMe && (
                  <button
                    onClick={() => handleDelete(admin)}
                    disabled={deleting === admin.id}
                    className="p-3 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all active:scale-90 disabled:opacity-40 flex-shrink-0"
                    title={language === 'fr' ? 'Supprimer cet administrateur' : 'Delete this administrator'}
                  >
                    {deleting === admin.id
                      ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"/>
                      : <Trash2 size={16}/>
                    }
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modale création */}
      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

export default AdminUsers;
