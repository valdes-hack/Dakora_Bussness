import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { rules } from '../../utils/validation';
import {
  Users, Plus, Trash2, Shield, ShieldCheck, X, CheckCircle2,
  Loader2, Eye, EyeOff, User, Mail, Lock, AlertCircle,
  UserX, UserCheck, Pencil, Crown
} from 'lucide-react';

const SUPER_ADMIN_EMAIL = 'yannicktchino@gmail.com';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const RoleBadge = ({ role }) => {
  if (role === 'super_admin') {
    return (
      <span className="px-2 py-0.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
        <Crown size={9}/> Super Admin
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-500/10 text-blue-600 text-[9px] font-black uppercase rounded-full flex items-center gap-1">
      <Shield size={9}/> Admin
    </span>
  );
};

// ─── MODAL MOT DE PASSE ───────────────────────────────────────────────────────
const ChangePasswordModal = ({ admin, onClose, onSuccess, isSelf }) => {
  const { language } = useLanguage();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const e = {};
    if (isSelf && !form.currentPassword) e.currentPassword = 'L\'ancien mot de passe est obligatoire';
    if (!form.newPassword || form.newPassword.length < 6) e.newPassword = 'Minimum 6 caractères';
    if (form.newPassword !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      if (isSelf) {
        // Vérifier l'ancien mot de passe en se reconnectant
        const { error: verifyErr } = await supabase.auth.signInWithPassword({
          email: admin.email,
          password: form.currentPassword
        });
        if (verifyErr) {
          setErrors({ currentPassword: 'Mot de passe incorrect' });
          setLoading(false);
          return;
        }
        // Changer le mot de passe
        const { error } = await supabase.auth.updateUser({ password: form.newPassword });
        if (error) throw error;
      } else {
        // Super admin change le mot de passe d'un autre (via updateUser de la session actuelle ne peut pas)
        // On ne peut faire ça qu'avec la service key — on informe l'utilisateur
        throw new Error('Seul l\'utilisateur concerné peut changer son propre mot de passe. Demandez-lui de le faire depuis son profil.');
      }
      onSuccess();
    } catch (err) {
      setGlobalError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const PwdField = ({ label, field, show, toggle, placeholder }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label} <span className="text-red-500 text-xs">★</span>
      </label>
      <div className="relative">
        <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
        <input type={show ? 'text' : 'password'} value={form[field]}
          onChange={e => { setForm(p => ({...p, [field]: e.target.value})); setErrors(p => ({...p, [field]: null})); }}
          placeholder={placeholder}
          className={`w-full pl-9 pr-10 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${errors[field] ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'}`}
        />
        <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
          {show ? <EyeOff size={16}/> : <Eye size={16}/>}
        </button>
      </div>
      {errors[field] && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {errors[field]}</p>}
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div>
            <p className="font-black text-gray-900 dark:text-white text-sm uppercase">
              {language === 'fr' ? 'Changer le mot de passe' : 'Change password'}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">{admin.username || admin.email}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:rotate-90 transition-all"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {globalError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 rounded-2xl">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-red-600 font-bold">{globalError}</p>
            </div>
          )}
          {isSelf && (
            <PwdField label={language === 'fr' ? 'Ancien mot de passe' : 'Current password'}
              field="currentPassword" show={showCurrent} toggle={() => setShowCurrent(s => !s)}
              placeholder={language === 'fr' ? 'Votre mot de passe actuel' : 'Your current password'}/>
          )}
          <PwdField label={language === 'fr' ? 'Nouveau mot de passe' : 'New password'}
            field="newPassword" show={showNew} toggle={() => setShowNew(s => !s)}
            placeholder="Min. 6 caractères"/>
          <PwdField label={language === 'fr' ? 'Confirmer le nouveau' : 'Confirm new password'}
            field="confirmPassword" show={showConfirm} toggle={() => setShowConfirm(s => !s)}
            placeholder={language === 'fr' ? 'Répéter le nouveau mot de passe' : 'Repeat new password'}/>
        </div>
        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            {language === 'fr' ? 'Annuler' : 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={loading}
            className="flex-[2] py-3 bg-dakora-green text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 size={15} className="animate-spin"/> : <><CheckCircle2 size={15}/> {language === 'fr' ? 'Enregistrer' : 'Save'}</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── MODAL CRÉATION ADMIN ─────────────────────────────────────────────────────
const CreateAdminModal = ({ onClose, onCreated, existingEmails }) => {
  const { language } = useLanguage();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd]         = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [globalError, setGlobalError] = useState('');

  const validate = () => {
    const e = {};
    if (!form.username?.trim() || form.username.trim().length < 2) e.username = 'Minimum 2 caractères';
    if (!form.email?.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Email invalide';
    else if (existingEmails.includes(form.email.trim().toLowerCase())) e.email = 'Cet email est déjà utilisé';
    if (!form.password || form.password.length < 6) e.password = 'Minimum 6 caractères';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Les mots de passe ne correspondent pas';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCreate = async () => {
    setGlobalError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const emailLower = form.email.trim().toLowerCase();
      // Déterminer le rôle
      const role = emailLower === SUPER_ADMIN_EMAIL ? 'super_admin' : 'admin';

      // Sauvegarder la session courante
      const { data: currentSession } = await supabase.auth.getSession();

      const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
        email: emailLower,
        password: form.password,
        options: { data: { username: form.username.trim() } }
      });
      if (signUpErr) throw signUpErr;
      if (!signUpData.user) throw new Error('Création du compte échouée');

      const { error: profileErr } = await supabase.from('profiles').upsert([{
        id: signUpData.user.id,
        username: form.username.trim(),
        full_name: form.username.trim(),
        email: emailLower,
        role,
        is_blocked: false,
        updated_at: new Date().toISOString()
      }], { onConflict: 'id' });
      if (profileErr) {
        // Message d'erreur lisible selon le type
        if (profileErr.message?.includes('profiles_username_key') || profileErr.message?.includes('unique')) {
          throw new Error(`Le nom d'utilisateur "${form.username.trim()}" est déjà utilisé. Choisissez-en un autre.`);
        }
        throw profileErr;
      }

      // Restaurer la session admin actuel
      if (currentSession?.session) {
        await supabase.auth.setSession({
          access_token:  currentSession.session.access_token,
          refresh_token: currentSession.session.refresh_token,
        });
      }
      onCreated(role);
    } catch (err) {
      setGlobalError(err.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  const Field = ({ field, label, type = 'text', show, toggle, placeholder, err }) => (
    <div className="space-y-1.5">
      <label className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">
        {label} <span className="text-red-500 text-xs">★</span>
        {!errors[field] && form[field]?.trim() && <span className="text-dakora-green text-xs">✓</span>}
      </label>
      <div className="relative">
        <input type={show !== undefined ? (show ? 'text' : type) : type} value={form[field]}
          onChange={e => { setForm(p => ({...p, [field]: e.target.value})); setErrors(p => ({...p, [field]: null})); }}
          placeholder={placeholder}
          className={`w-full px-4 py-3 rounded-2xl border text-sm font-bold dark:text-white bg-gray-50 dark:bg-white/5 focus:outline-none focus:ring-2 focus:ring-dakora-green transition-all ${errors[field] ? 'border-red-400 bg-red-50/50' : 'border-gray-200 dark:border-white/10'} ${toggle ? 'pr-10' : ''}`}
        />
        {toggle && (
          <button type="button" onClick={toggle} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            {show ? <EyeOff size={16}/> : <Eye size={16}/>}
          </button>
        )}
      </div>
      {errors[field] && <p className="text-[10px] text-red-500 font-bold ml-1 flex items-center gap-1">⚠ {errors[field]}</p>}
    </div>
  );

  const emailIsSuperAdmin = form.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10 sticky top-0 bg-white dark:bg-neutral-900 z-10">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${emailIsSuperAdmin ? 'bg-yellow-100 dark:bg-yellow-500/10' : 'bg-dakora-green/10'}`}>
              {emailIsSuperAdmin ? <Crown size={18} className="text-yellow-600"/> : <Shield size={18} className="text-dakora-green"/>}
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm uppercase">
                {language === 'fr' ? 'Nouvel Admin' : 'New Admin'}
              </p>
              <p className="text-[10px] text-gray-400">
                {emailIsSuperAdmin ? '🔑 Super Admin détecté' : 'Rôle : Admin'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:rotate-90 transition-all"><X size={18}/></button>
        </div>
        <div className="p-6 space-y-4">
          {globalError && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 rounded-2xl">
              <AlertCircle size={15} className="text-red-500 flex-shrink-0 mt-0.5"/>
              <p className="text-xs text-red-600 font-bold">{globalError}</p>
            </div>
          )}
          {emailIsSuperAdmin && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 rounded-2xl flex items-center gap-2">
              <Crown size={14} className="text-yellow-600 flex-shrink-0"/>
              <p className="text-[10px] text-yellow-700 dark:text-yellow-400 font-bold">
                Cet email reçoit automatiquement le rôle Super Admin.
              </p>
            </div>
          )}
          <Field field="username" label={language === 'fr' ? "Nom d'utilisateur" : 'Username'} placeholder="ex: Valdes"/>
          <Field field="email" label="Email" type="email" placeholder="admin@email.com"/>
          <Field field="password" label={language === 'fr' ? 'Mot de passe' : 'Password'} type="password"
            show={showPwd} toggle={() => setShowPwd(s => !s)} placeholder="Min. 6 caractères"/>
          <Field field="confirmPassword" label={language === 'fr' ? 'Confirmer' : 'Confirm'} type="password"
            show={showConfirm} toggle={() => setShowConfirm(s => !s)} placeholder={language === 'fr' ? 'Répéter le mot de passe' : 'Repeat password'}/>
          <div className="p-3 bg-dakora-green/5 border border-dakora-green/20 rounded-2xl">
            <p className="text-[10px] text-dakora-green font-bold">
              💡 Connexion possible avec email <span className="text-gray-500">ou</span> nom d'utilisateur.
            </p>
          </div>
        </div>
        <div className="px-6 pb-6 flex gap-3 sticky bottom-0 bg-white dark:bg-neutral-900 pt-3 border-t border-black/5 dark:border-white/5">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            Annuler
          </button>
          <button onClick={handleCreate} disabled={loading}
            className={`flex-[2] py-3 text-white rounded-2xl font-black uppercase text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${emailIsSuperAdmin ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-dakora-green hover:bg-green-700'}`}>
            {loading ? <Loader2 size={15} className="animate-spin"/> : <><CheckCircle2 size={15}/> Créer</>}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const AdminUsers = () => {
  const { language } = useLanguage();
  const { user: currentUser, profile: currentProfile } = useAuth();
  const isSuperAdmin = currentProfile?.role === 'super_admin';

  const [admins, setAdmins]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [pwdModal, setPwdModal]   = useState(null); // admin sélectionné
  const [deleting, setDeleting]   = useState(null);
  const [toggling, setToggling]   = useState(null);
  const [success, setSuccess]     = useState('');

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

  const existingEmails = admins.map(a => a.email?.toLowerCase()).filter(Boolean);

  const showSuccess = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };

  const handleCreated = (role) => {
    setShowCreate(false);
    showSuccess(role === 'super_admin' ? '👑 Super Admin créé !' : '✅ Administrateur créé avec succès !');
    fetchAdmins();
  };

  const handleToggleBlock = async (admin) => {
    if (!isSuperAdmin) return;
    if (admin.id === currentUser?.id) {
      alert('Impossible de vous bloquer vous-même.');
      return;
    }
    const newState = !admin.is_blocked;
    const confirmed = window.confirm(
      newState
        ? `Bloquer "${admin.username || admin.email}" ? Il ne pourra plus se connecter.`
        : `Débloquer "${admin.username || admin.email}" ?`
    );
    if (!confirmed) return;

    setToggling(admin.id);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_blocked: newState, updated_at: new Date().toISOString() })
        .eq('id', admin.id);

      if (error) throw error;

      // Rafraîchir depuis Supabase pour s'assurer que la valeur est bien persistée
      const { data: updated } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', admin.id)
        .single();

      if (updated) {
        setAdmins(prev => prev.map(a => a.id === admin.id ? updated : a));
        showSuccess(updated.is_blocked ? `🚫 ${admin.username || admin.email} bloqué` : `✅ ${admin.username || admin.email} débloqué`);
      } else {
        // Fallback : mise à jour locale
        setAdmins(prev => prev.map(a => a.id === admin.id ? { ...a, is_blocked: newState } : a));
        showSuccess(newState ? `🚫 Bloqué` : `✅ Débloqué`);
      }
    } catch (err) {
      alert(`Erreur : ${err.message}\n\nVérifiez que les policies RLS sont bien configurées dans Supabase.`);
      // Recharger la liste pour s'assurer que l'état est cohérent
      fetchAdmins();
    } finally {
      setToggling(null);
    }
  };

  const handleDelete = async (admin) => {
    if (!isSuperAdmin) return;
    if (admin.id === currentUser?.id) {
      alert('Impossible de supprimer votre propre compte.');
      return;
    }
    if (admin.role === 'super_admin') {
      alert('Impossible de supprimer un Super Admin.');
      return;
    }
    const confirmed = window.confirm(`Supprimer définitivement "${admin.username || admin.email}" ?\n\nCette action supprime le profil. L'accès admin sera révoqué immédiatement.`);
    if (!confirmed) return;

    setDeleting(admin.id);
    try {
      const { error } = await supabase.from('profiles').delete().eq('id', admin.id);
      if (error) throw error;
      setAdmins(prev => prev.filter(a => a.id !== admin.id));
      showSuccess('Profil supprimé — l\'accès admin est révoqué.');
    } catch (err) {
      alert(`Erreur : ${err.message}\n\nVérifiez que les policies RLS sont bien configurées dans Supabase (policy profiles_delete).`);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {language === 'fr' ? 'Gestion des' : 'Manage'} <span className="text-dakora-green">Utilisateurs</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 text-sm">
            {language === 'fr' ? 'Administrateurs ayant accès à l\'interface de gestion.' : 'Administrators with access to the management interface.'}
          </p>
        </div>
        {/* Un admin ou super_admin peut créer */}
        {(isSuperAdmin || currentProfile?.role === 'admin') && (
          <button onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-5 py-3 bg-dakora-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95">
            <Plus size={15}/> {language === 'fr' ? 'Créer un admin' : 'Create admin'}
          </button>
        )}
      </div>

      {/* Info rôle */}
      {!isSuperAdmin && (
        <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20 rounded-2xl">
          <Shield size={16} className="text-blue-500 flex-shrink-0"/>
          <p className="text-xs text-blue-600 dark:text-blue-400 font-bold">
            {language === 'fr'
              ? 'Vous avez le rôle Admin. Vous pouvez créer des comptes, mais seul le Super Admin peut bloquer ou supprimer des comptes.'
              : 'You have the Admin role. You can create accounts, but only the Super Admin can block or delete accounts.'}
          </p>
        </div>
      )}

      {/* Toast succès */}
      {success && (
        <div className="flex items-center gap-3 p-4 bg-dakora-green/10 text-dakora-green rounded-2xl border border-dakora-green/20 animate-in slide-in-from-top-2">
          <CheckCircle2 size={17}/> <span className="font-bold text-sm">{success}</span>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(n => <div key={n} className="h-20 rounded-2xl bg-white/40 dark:bg-white/5 animate-pulse"/>)}</div>
      ) : admins.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10 text-center">
          <Users size={48} className="text-gray-300 mb-4"/>
          <p className="text-gray-400 italic font-bold text-sm">Aucun administrateur enregistré.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {admins.map(admin => {
            const isMe       = admin.id === currentUser?.id;
            const isBlocked  = !!admin.is_blocked;
            const isSA       = admin.role === 'super_admin';

            return (
              <div key={admin.id}
                className={`flex items-center gap-3 md:gap-4 rounded-[1.5rem] md:rounded-[2rem] px-4 md:px-5 py-4 border shadow-md transition-all ${
                  isBlocked ? 'bg-red-50/50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20 opacity-70'
                  : isSA    ? 'bg-yellow-50/30 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20'
                  : isMe    ? 'bg-white/70 dark:bg-neutral-900/70 border-dakora-green/30'
                            : 'bg-white/70 dark:bg-neutral-900/70 border-white/20'
                }`}>

                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  {admin.profile_photo_url
                    ? <img src={admin.profile_photo_url} loading="lazy" alt="" className="w-11 h-11 md:w-12 md:h-12 rounded-2xl object-cover border-2 border-dakora-green"/>
                    : <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-dakora-green/10 flex items-center justify-center"><User size={18} className="text-dakora-green"/></div>
                  }
                  {isBlocked && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                      <UserX size={11} className="text-white"/>
                    </span>
                  )}
                </div>

                {/* Infos */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-black text-gray-900 dark:text-white text-sm truncate">{admin.username || admin.full_name || 'Sans nom'}</p>
                    {isMe && <span className="px-2 py-0.5 bg-dakora-green/10 text-dakora-green text-[9px] font-black uppercase rounded-full">Vous</span>}
                    <RoleBadge role={admin.role}/>
                    {isBlocked && <span className="px-2 py-0.5 bg-red-100 dark:bg-red-500/10 text-red-500 text-[9px] font-black uppercase rounded-full flex items-center gap-1"><UserX size={9}/> Bloqué</span>}
                  </div>
                  {admin.email && <p className="text-[10px] md:text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1"><Mail size={10}/> {admin.email}</p>}
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
                  {/* Changer son propre mot de passe uniquement */}
                  {isMe && (
                    <button onClick={() => setPwdModal(admin)}
                      className="p-2 md:p-2.5 bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 rounded-xl hover:bg-dakora-green hover:text-white transition-all"
                      title="Changer mon mot de passe">
                      <Lock size={15}/>
                    </button>
                  )}

                  {/* Bloquer / Débloquer — super_admin seulement */}
                  {isSuperAdmin && !isMe && !isSA && (
                    <button onClick={() => handleToggleBlock(admin)} disabled={toggling === admin.id}
                      className={`p-2 md:p-2.5 rounded-xl transition-all disabled:opacity-40 ${
                        isBlocked
                          ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white'
                          : 'bg-orange-100 dark:bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white'
                      }`}
                      title={isBlocked ? 'Débloquer cet admin' : 'Bloquer cet admin'}>
                      {toggling === admin.id
                        ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/>
                        : isBlocked ? <UserCheck size={15}/> : <UserX size={15}/>
                      }
                    </button>
                  )}

                  {/* Supprimer — super_admin seulement */}
                  {isSuperAdmin && !isMe && !isSA && (
                    <button onClick={() => handleDelete(admin)} disabled={deleting === admin.id}
                      className="p-2 md:p-2.5 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90 disabled:opacity-40"
                      title="Supprimer ce profil">
                      {deleting === admin.id
                        ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"/>
                        : <Trash2 size={15}/>
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
      {showCreate && (
        <CreateAdminModal
          onClose={() => setShowCreate(false)}
          onCreated={handleCreated}
          existingEmails={existingEmails}
        />
      )}
      {pwdModal && (
        <ChangePasswordModal
          admin={pwdModal}
          isSelf={pwdModal.id === currentUser?.id}
          onClose={() => setPwdModal(null)}
          onSuccess={() => { setPwdModal(null); showSuccess('Mot de passe mis à jour !'); }}
        />
      )}
    </div>
  );
};

export default AdminUsers;
