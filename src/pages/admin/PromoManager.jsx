import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import CountdownTimer from '../../components/ui/CountdownTimer';
import { createNotification } from '../../utils/notify';
import {
  Tag, Plus, Trash2, Zap, Clock, CheckCircle2,
  Loader2, X, AlertCircle, Package, TrendingDown
} from 'lucide-react';

const now8h = () => {
  const d = new Date();
  d.setHours(d.getHours() + 8);
  return d.toISOString().slice(0, 16);
};

const formatLocalDateTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' });
};

// ─── MODAL CRÉATION PROMO ─────────────────────────────────────────────────────
const CreatePromoModal = ({ onClose, onCreated, language }) => {
  const { products } = useDataCache();
  const [step, setStep]           = useState('product'); // 'product' | 'variant' | 'form'
  const [selProduct, setSelProduct] = useState(null);
  const [selVariant, setSelVariant] = useState(null);
  const [form, setForm]           = useState({ promo_price: '', end_timestamp: now8h(), label_fr: '', label_en: '' });
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const [search, setSearch]       = useState('');

  const filtered = products.filter(p => {
    const n = (language === 'fr' ? p.name_fr : p.name_en) || '';
    return n.toLowerCase().includes(search.toLowerCase());
  });

  const handleCreate = async () => {
    setError('');
    if (!selVariant) { setError('Sélectionnez une variante'); return; }
    if (!form.promo_price || Number(form.promo_price) <= 0) { setError('Prix promo invalide'); return; }
    if (Number(form.promo_price) >= selVariant.price) { setError('Le prix promo doit être inférieur au prix normal'); return; }
    if (!form.end_timestamp) { setError('Date de fin obligatoire'); return; }

    setLoading(true);
    try {
      const productName = language === 'fr' ? selProduct.name_fr : selProduct.name_en;
      const varLabel    = language === 'fr' ? selVariant.label_fr : selVariant.label_en;
      const { error: insertErr } = await supabase.from('promotions').insert([{
        variant_id:     selVariant.id,
        product_id:     selProduct.id,
        promo_price:    Number(form.promo_price),
        start_date:     new Date().toISOString(),
        end_timestamp:  new Date(form.end_timestamp).toISOString(),
        label_fr:       form.label_fr || `Promo — ${(selProduct.name_fr || '')}`,
        label_en:       form.label_en || `Promo — ${(selProduct.name_en || '')}`,
        is_active:      true,
      }]);
      if (insertErr) throw insertErr;
      createNotification(`🏷️ Promo lancée : ${productName} — ${varLabel} → ${Number(form.promo_price).toLocaleString()} FCFA`, 'promo', '/admin/promos');
      onCreated();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const savings = selVariant && form.promo_price
    ? selVariant.price - Number(form.promo_price)
    : 0;
  const pct = selVariant && savings > 0
    ? Math.round((savings / selVariant.price) * 100)
    : 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-white/20 animate-in slide-in-from-bottom-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10 bg-gradient-to-r from-dakora-green/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-dakora-green rounded-xl flex items-center justify-center"><Zap size={16} className="text-white"/></div>
            <div>
              <p className="font-black text-sm uppercase tracking-tight text-gray-900 dark:text-white">
                {language === 'fr' ? 'Nouvelle Promotion' : 'New Promotion'}
              </p>
              <p className="text-[9px] text-gray-400">
                {step === 'product' ? (language === 'fr' ? 'Étape 1 — Produit' : 'Step 1 — Product')
                 : step === 'variant' ? (language === 'fr' ? 'Étape 2 — Variante' : 'Step 2 — Variant')
                 : (language === 'fr' ? 'Étape 3 — Paramètres' : 'Step 3 — Settings')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:rotate-90 transition-all"><X size={18}/></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-500/10 border border-red-200 rounded-2xl">
              <AlertCircle size={14} className="text-red-500 flex-shrink-0"/>
              <p className="text-xs text-red-600 font-bold">{error}</p>
            </div>
          )}

          {/* ÉTAPE 1 : Sélection produit */}
          {step === 'product' && (
            <div className="space-y-3">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder={language === 'fr' ? 'Rechercher un produit...' : 'Search product...'}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-neutral-800 text-sm font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none"/>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filtered.map(p => {
                  const name = language === 'fr' ? p.name_fr : p.name_en;
                  const img  = p.product_images?.[0]?.url;
                  return (
                    <button key={p.id} onClick={() => { setSelProduct(p); setStep('variant'); }}
                      className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-dakora-green/5 border border-transparent hover:border-dakora-green/20 transition-all text-left group">
                      {img ? <img src={img} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0"/> : <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-xl flex-shrink-0">📦</div>}
                      <div className="flex-grow min-w-0">
                        <p className="font-black text-sm text-gray-900 dark:text-white truncate">{name}</p>
                        <p className="text-[10px] text-gray-400">{p.variants?.length || 0} variante(s)</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 : Sélection variante */}
          {step === 'variant' && selProduct && (
            <div className="space-y-3">
              <button onClick={() => setStep('product')} className="text-[10px] font-black uppercase text-gray-400 hover:text-dakora-green flex items-center gap-1 transition-colors">
                ← {language === 'fr' ? 'Changer de produit' : 'Change product'}
              </button>
              <p className="text-xs font-bold text-gray-500">{language === 'fr' ? 'Choisir la variante à promouvoir' : 'Choose the variant to promote'}</p>
              <div className="space-y-2">
                {(selProduct.variants || []).map(v => (
                  <button key={v.id} onClick={() => { setSelVariant(v); setStep('form'); }}
                    className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-dakora-green/5 border border-gray-100 dark:border-white/5 hover:border-dakora-green/20 transition-all text-left">
                    <div>
                      <p className="font-black text-sm text-gray-900 dark:text-white">{language === 'fr' ? v.label_fr : v.label_en}</p>
                      <p className="text-[10px] text-gray-400">{language === 'fr' ? 'Stock :' : 'Stock:'} {v.stock_quantity}</p>
                    </div>
                    <p className="font-black text-dakora-green text-base">{v.price?.toLocaleString()} FCFA</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 : Formulaire promo */}
          {step === 'form' && selVariant && (
            <div className="space-y-4">
              <button onClick={() => setStep('variant')} className="text-[10px] font-black uppercase text-gray-400 hover:text-dakora-green flex items-center gap-1 transition-colors">
                ← {language === 'fr' ? 'Changer de variante' : 'Change variant'}
              </button>
              {/* Résumé */}
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">{language === 'fr' ? 'Variante sélectionnée' : 'Selected variant'}</p>
                <p className="font-black text-gray-900 dark:text-white">{language === 'fr' ? selProduct.name_fr : selProduct.name_en}</p>
                <p className="text-xs text-dakora-green font-bold">{language === 'fr' ? selVariant.label_fr : selVariant.label_en} — {selVariant.price?.toLocaleString()} FCFA</p>
              </div>

              {/* Prix promo */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
                  {language === 'fr' ? 'Prix promotionnel (FCFA)' : 'Promotional price (FCFA)'}
                  <span className="text-red-500">★</span>
                </label>
                <input type="number" min="0" value={form.promo_price}
                  onChange={e => setForm(p => ({...p, promo_price: e.target.value}))}
                  placeholder={`< ${selVariant.price?.toLocaleString()}`}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 text-base font-black text-dakora-green focus:outline-none focus:ring-2 focus:ring-dakora-green dark:text-dakora-green"/>
                {savings > 0 && (
                  <p className="text-[10px] text-dakora-green font-black ml-1">
                    ✓ Économie : {savings.toLocaleString()} FCFA ({pct}% de réduction)
                  </p>
                )}
              </div>

              {/* Date de fin */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase text-gray-400 ml-1 flex items-center gap-1.5">
                  <Clock size={10}/> {language === 'fr' ? 'Date & heure de fin' : 'End date & time'}
                  <span className="text-red-500">★</span>
                </label>
                <input type="datetime-local" value={form.end_timestamp}
                  onChange={e => setForm(p => ({...p, end_timestamp: e.target.value}))}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 text-sm font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-dakora-green"/>
              </div>

              {/* Labels optionnels */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Label FR</label>
                  <input type="text" value={form.label_fr} onChange={e => setForm(p => ({...p, label_fr: e.target.value}))}
                    placeholder="ex: Soldes d'été"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-dakora-green"/>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-gray-400 ml-1">Label EN</label>
                  <input type="text" value={form.label_en} onChange={e => setForm(p => ({...p, label_en: e.target.value}))}
                    placeholder="ex: Summer Sale"
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-neutral-800 text-xs font-bold dark:text-white focus:outline-none focus:ring-2 focus:ring-dakora-green"/>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'form' && (
          <div className="p-5 border-t border-black/5 dark:border-white/5 flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
              {language === 'fr' ? 'Annuler' : 'Cancel'}
            </button>
            <button onClick={handleCreate} disabled={loading}
              className="flex-[2] py-3 bg-dakora-green text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-green-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 size={15} className="animate-spin"/> : <><Zap size={15}/> {language === 'fr' ? 'Lancer la promo' : 'Launch promo'}</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const PromoManager = () => {
  const { language } = useLanguage();
  const [promos, setPromos]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [toggling, setToggling]   = useState(null);
  const [deleting, setDeleting]   = useState(null);
  const [success, setSuccess]     = useState('');

  useEffect(() => { fetchPromos(); }, []);

  const fetchPromos = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('promotions')
      .select(`*, variants(id, label_fr, label_en, price, products(id, name_fr, name_en, product_images(url, is_main)))`)
      .order('created_at', { ascending: false });
    setPromos(data || []);
    setLoading(false);
  };

  const showSuccessMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3500); };

  const toggleActive = async (promo) => {
    setToggling(promo.id);
    const { error } = await supabase.from('promotions').update({ is_active: !promo.is_active }).eq('id', promo.id);
    if (!error) {
      setPromos(prev => prev.map(p => p.id === promo.id ? { ...p, is_active: !promo.is_active } : p));
      showSuccessMsg(promo.is_active
        ? (language === 'fr' ? 'Promo désactivée' : 'Promo deactivated')
        : (language === 'fr' ? '✅ Promo activée !' : '✅ Promo activated!'));
      const productName = language === 'fr' ? promo.variants?.products?.name_fr : promo.variants?.products?.name_en;
      const varLbl = language === 'fr' ? promo.variants?.label_fr : promo.variants?.label_en;
      createNotification(`🔥 Promo ${!promo.is_active ? 'activée' : 'désactivée'} : ${productName || ''} (${varLbl || ''})`, 'promo', '/admin/promos');
    }
    setToggling(null);
  };

  const deletePromo = async (id) => {
    if (!window.confirm(language === 'fr' ? 'Supprimer cette promotion ?' : 'Delete this promotion?')) return;
    setDeleting(id);
    const promo = promos.find(p => p.id === id);
    const productName = promo?.variants?.products ? (language === 'fr' ? promo.variants.products.name_fr : promo.variants.products.name_en) : '';
    await supabase.from('promotions').delete().eq('id', id);
    setPromos(prev => prev.filter(p => p.id !== id));
    showSuccessMsg(language === 'fr' ? 'Promotion supprimée' : 'Promotion deleted');
    createNotification(`🗑️ Promo supprimée : ${productName || ''}`, 'promo', '/admin/promos');
    setDeleting(null);
  };

  const isExpired = (promo) =>
    promo.end_timestamp && new Date(promo.end_timestamp).getTime() <= Date.now();

  const getStatus = (promo) => {
    if (!promo.is_active) return { label: language === 'fr' ? 'Inactive' : 'Inactive', color: 'bg-gray-100 text-gray-400 dark:bg-white/5' };
    if (isExpired(promo)) return { label: language === 'fr' ? 'Expirée' : 'Expired', color: 'bg-red-100 text-red-500 dark:bg-red-500/10' };
    return { label: language === 'fr' ? 'Active 🔥' : 'Active 🔥', color: 'bg-dakora-green/10 text-dakora-green' };
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {language === 'fr' ? 'Promo' : 'Promo'} <span className="text-dakora-green">Manager</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1 text-sm">
            {language === 'fr' ? 'Créez des promotions chronométrées avec compte à rebours en temps réel.' : 'Create timed promotions with real-time countdown.'}
          </p>
        </div>
        <button onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-5 py-3 bg-dakora-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all active:scale-95">
          <Plus size={15}/> {language === 'fr' ? 'Nouvelle promo' : 'New promo'}
        </button>
      </div>

      {success && (
        <div className="flex items-center gap-3 p-4 bg-dakora-green/10 text-dakora-green rounded-2xl border border-dakora-green/20 animate-in slide-in-from-top-2">
          <CheckCircle2 size={16}/> <span className="font-bold text-sm">{success}</span>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="space-y-3">{[1,2,3].map(n => <div key={n} className="h-24 rounded-2xl bg-white/40 dark:bg-white/5 animate-pulse"/>)}</div>
      ) : promos.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10 text-center">
          <Tag size={48} className="text-gray-300 mb-4"/>
          <p className="text-gray-400 italic font-bold text-sm">{language === 'fr' ? 'Aucune promotion. Créez la première !' : 'No promotions yet. Create the first one!'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {promos.map(promo => {
            const product = promo.variants?.products;
            const variant = promo.variants;
            const name    = language === 'fr' ? product?.name_fr : product?.name_en;
            const varLbl  = language === 'fr' ? variant?.label_fr : variant?.label_en;
            const img     = variant?.products?.product_images?.find(i => i.is_main)?.url
                         || variant?.products?.product_images?.[0]?.url;
            const status  = getStatus(promo);
            const savings = variant?.price ? variant.price - promo.promo_price : 0;
            const pct     = variant?.price && savings > 0 ? Math.round((savings / variant.price) * 100) : 0;
            const expired = isExpired(promo);

            return (
              <div key={promo.id}
                className={`bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[2rem] p-4 md:p-5 border shadow-md transition-all ${!promo.is_active || expired ? 'opacity-60 border-white/20' : 'border-dakora-green/20'}`}>
                <div className="flex items-center gap-3 md:gap-4 flex-wrap">
                  {/* Image */}
                  {img
                    ? <img src={img} loading="lazy" alt="" className="w-14 h-14 rounded-2xl object-cover flex-shrink-0 border border-black/5"/>
                    : <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                  }

                  {/* Infos */}
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-black text-sm text-gray-900 dark:text-white truncate">{name}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${status.color}`}>{status.label}</span>
                      {pct > 0 && <span className="px-2 py-0.5 bg-orange-500 text-white text-[9px] font-black uppercase rounded-full">-{pct}%</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-0.5">{varLbl}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-lg font-black text-dakora-green">{promo.promo_price?.toLocaleString()} FCFA</span>
                      {variant?.price && <span className="text-sm text-gray-400 line-through font-bold">{variant.price?.toLocaleString()}</span>}
                      {savings > 0 && <span className="text-[10px] font-bold text-orange-500">-{savings.toLocaleString()} FCFA</span>}
                    </div>
                    {/* Compte à rebours */}
                    {promo.is_active && !expired && promo.end_timestamp && (
                      <div className="mt-2">
                        <CountdownTimer endTimestamp={promo.end_timestamp} language={language} compact onExpire={fetchPromos}/>
                      </div>
                    )}
                    {expired && <p className="text-[9px] text-red-400 font-bold mt-1">⏱ {language === 'fr' ? 'Expirée le' : 'Expired on'} {formatLocalDateTime(promo.end_timestamp)}</p>}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={() => toggleActive(promo)} disabled={toggling === promo.id}
                      className={`p-2.5 rounded-xl transition-all disabled:opacity-40 ${promo.is_active ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-dakora-green hover:text-white'}`}>
                      {toggling === promo.id ? <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin"/> : <Zap size={15}/>}
                    </button>
                    <button onClick={() => deletePromo(promo.id)} disabled={deleting === promo.id}
                      className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all disabled:opacity-40">
                      {deleting === promo.id ? <div className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin"/> : <Trash2 size={15}/>}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreatePromoModal onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); showSuccessMsg('🏷️ Promotion lancée !'); fetchPromos(); }} language={language}/>}
    </div>
  );
};

export default PromoManager;
