import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { createNotification } from '../../utils/notify';
import { AlertTriangle, Package, Search, X, Save, CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

const STOCK_ALERT_THRESHOLD = 5; // seuil d'alerte stock faible

export default function Inventory() {
  const { t, language } = useLanguage();
  const [variants, setVariants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(null); // id du variant en cours de sauvegarde
  const [saved, setSaved] = useState(null);
  const [search, setSearch] = useState('');
  const [filterAlert, setFilterAlert] = useState(false); // filtre "stock faible seulement"
  const [sortField, setSortField] = useState('stock_quantity');
  const [sortAsc, setSortAsc] = useState(true);

  useEffect(() => { fetchInventory(); }, []);

  const fetchInventory = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('variants')
      .select(`
        id, label_fr, label_en, price, stock_quantity,
        products(id, name_fr, name_en, is_active,
          product_images(url, is_main)
        )
      `)
      .order('stock_quantity', { ascending: true });

    if (!error) setVariants(data || []);
    setLoading(false);
  };

  // Mise à jour du stock d'une variante
  const updateStock = async (variantId, newQty, productName, variantLabel) => {
    const qty = Math.max(0, parseInt(newQty) || 0);
    setSaving(variantId);
    try {
      const { error } = await supabase
        .from('variants')
        .update({ stock_quantity: qty })
        .eq('id', variantId);

      if (error) throw error;

      // Mettre à jour localement
      setVariants(prev => prev.map(v =>
        v.id === variantId ? { ...v, stock_quantity: qty } : v
      ));
      setSaved(variantId);
      setTimeout(() => setSaved(null), 2000);

      // Notification si stock faible après mise à jour
      if (qty <= STOCK_ALERT_THRESHOLD) {
        const label = `${productName} — ${variantLabel}`;
        const msg = qty === 0
          ? `⚠️ Rupture de stock : ${label}`
          : `⚠️ Stock faible (${qty} restant${qty > 1 ? 's' : ''}) : ${label}`;
        createNotification(msg, 'stock', '/admin/inventaire');
      }
    } catch (err) {
      alert('Erreur mise à jour stock : ' + err.message);
    } finally {
      setSaving(null);
    }
  };

  // Filtrage + tri
  const filtered = useMemo(() => {
    let list = [...variants];
    if (filterAlert) list = list.filter(v => v.stock_quantity <= STOCK_ALERT_THRESHOLD);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(v =>
        v.products?.name_fr?.toLowerCase().includes(q) ||
        v.products?.name_en?.toLowerCase().includes(q) ||
        v.label_fr?.toLowerCase().includes(q) ||
        v.label_en?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      let va = a[sortField] ?? 0;
      let vb = b[sortField] ?? 0;
      if (typeof va === 'string') va = va.toLowerCase();
      if (typeof vb === 'string') vb = vb.toLowerCase();
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [variants, search, filterAlert, sortField, sortAsc]);

  const lowStockCount = variants.filter(v => v.stock_quantity <= STOCK_ALERT_THRESHOLD && v.stock_quantity > 0).length;
  const outOfStockCount = variants.filter(v => v.stock_quantity === 0).length;

  const SortBtn = ({ field, label }) => (
    <button onClick={() => { setSortField(field); setSortAsc(sortField === field ? !sortAsc : true); }}
      className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest transition-colors ${sortField === field ? 'text-dakora-green' : 'text-gray-400 hover:text-gray-600'}`}>
      {label}
      {sortField === field ? (sortAsc ? <ChevronUp size={11}/> : <ChevronDown size={11}/>) : null}
    </button>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
          {t('inventory_title')} <span className="text-dakora-green">{t('inventory_title_green')}</span>
        </h1>
        <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium mt-1">
          {language === 'fr' ? 'Gérez les quantités en stock de chaque variante.' : 'Manage stock quantities for each variant.'}
        </p>
      </div>

      {/* STATS RAPIDES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[1.2rem] sm:rounded-[1.5rem] md:rounded-[2rem] p-3 sm:p-4 md:p-6 border border-white/20 shadow">
          <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase text-gray-400 tracking-widest">{language === 'fr' ? 'Total variantes' : 'Total variants'}</p>
          <p className="text-xl sm:text-2xl md:text-4xl font-black text-gray-900 dark:text-white mt-1">{variants.length}</p>
        </div>
        <div className={`backdrop-blur-xl rounded-[1.2rem] sm:rounded-[1.5rem] md:rounded-[2rem] p-3 sm:p-4 md:p-6 border shadow transition-all ${lowStockCount > 0 ? 'bg-yellow-50 dark:bg-yellow-500/10 border-yellow-200 dark:border-yellow-500/20' : 'bg-white/60 dark:bg-white/5 border-white/20'}`}>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase text-yellow-600 tracking-widest flex items-center gap-1.5"><AlertTriangle size={10}/> {language === 'fr' ? 'Stock faible (≤5)' : 'Low stock (≤5)'}</p>
          <p className="text-xl sm:text-2xl md:text-4xl font-black text-yellow-600 mt-1">{lowStockCount}</p>
        </div>
        <div className={`backdrop-blur-xl rounded-[1.2rem] sm:rounded-[1.5rem] md:rounded-[2rem] p-3 sm:p-4 md:p-6 border shadow transition-all ${outOfStockCount > 0 ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/20' : 'bg-white/60 dark:bg-white/5 border-white/20'}`}>
          <p className="text-[8px] sm:text-[9px] md:text-[10px] font-black uppercase text-red-500 tracking-widest flex items-center gap-1.5"><Package size={10}/> {language === 'fr' ? 'Rupture de stock' : 'Out of stock'}</p>
          <p className="text-xl sm:text-2xl md:text-4xl font-black text-red-500 mt-1">{outOfStockCount}</p>
        </div>
      </div>

      {/* BARRE DE FILTRES */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] border border-white/20 shadow p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-grow min-w-[150px] sm:min-w-[180px]">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher...' : 'Search...'}
            className="w-full pl-9 pr-4 py-2 sm:py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-[10px] sm:text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={12}/></button>}
        </div>
        <button onClick={() => setFilterAlert(f => !f)}
          className={`flex items-center justify-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all ${filterAlert ? 'bg-yellow-500 text-white shadow' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-300 hover:bg-yellow-50 hover:text-yellow-600'}`}>
          <AlertTriangle size={11}/> <span className="hidden sm:inline">{language === 'fr' ? 'Stock faible' : 'Low stock'}</span>
          {(lowStockCount + outOfStockCount) > 0 && (
            <span className={`px-1.5 py-0.5 rounded-full text-[8px] sm:text-[9px] ${filterAlert ? 'bg-white/20' : 'bg-red-500 text-white'}`}>
              {lowStockCount + outOfStockCount}
            </span>
          )}
        </button>
        <span className="text-[9px] sm:text-[10px] font-bold text-gray-400 text-center sm:text-right">{filtered.length} / {variants.length}</span>
      </div>

      {/* TABLEAU — Desktop : tableau grid-cols-12 / Mobile : cartes */}
      {loading ? (
        <div className="space-y-3">
          {[1,2,3,4,5].map(n => <div key={n} className="h-20 rounded-2xl bg-white/40 dark:bg-white/5 animate-pulse"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-16 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10 text-center">
          <Package size={48} className="text-gray-300 mb-4"/>
          <p className="text-gray-400 italic font-bold">
            {filterAlert ? (language === 'fr' ? 'Aucun stock faible 🎉' : 'No low stock 🎉') : (language === 'fr' ? 'Aucune variante trouvée' : 'No variant found')}
          </p>
        </div>
      ) : (
        <>
          {/* ── VUE CARTES MOBILE (< md) ── */}
          <div className="md:hidden space-y-2 sm:space-y-3">
            {filtered.map(v => {
              const name = language === 'fr' ? v.products?.name_fr : v.products?.name_en;
              const varLabel = language === 'fr' ? v.label_fr : v.label_en;
              const imgUrl = v.products?.product_images?.find(i => i.is_main)?.url || v.products?.product_images?.[0]?.url;
              const isOut = v.stock_quantity === 0;
              const isLow = v.stock_quantity > 0 && v.stock_quantity <= STOCK_ALERT_THRESHOLD;
              const isSaving = saving === v.id;
              const isSaved = saved === v.id;

              return (
                <div key={v.id} className={`rounded-[1.2rem] sm:rounded-[1.5rem] border p-3 sm:p-4 shadow-sm transition-colors ${
                  isOut ? 'bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20'
                        : isLow ? 'bg-yellow-50 dark:bg-yellow-500/5 border-yellow-200 dark:border-yellow-500/20'
                        : 'bg-white/70 dark:bg-white/5 border-white/20'
                }`}>
                  {/* Ligne 1 : image + nom + badge */}
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    {imgUrl
                      ? <img src={imgUrl} loading="lazy" alt="" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover flex-shrink-0 border border-black/5"/>
                      : <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-lg sm:text-xl flex-shrink-0">📦</div>
                    }
                    <div className="flex-grow min-w-0">
                      <p className="font-black text-gray-900 dark:text-white text-xs sm:text-sm truncate">{name}</p>
                      <p className="text-[9px] sm:text-[10px] text-dakora-green font-bold truncate">{varLabel}</p>
                      <p className="text-[9px] sm:text-[10px] text-gray-400 font-bold mt-0.5">{v.price?.toLocaleString()} FCFA</p>
                    </div>
                    {/* Badge statut */}
                    <span className={`flex-shrink-0 px-2 sm:px-2.5 py-1 rounded-full text-[8px] sm:text-[9px] font-black uppercase flex items-center gap-1 ${
                      isOut ? 'bg-red-100 dark:bg-red-500/10 text-red-600'
                            : isLow ? 'bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700'
                            : 'bg-dakora-green/10 text-dakora-green'
                    }`}>
                      {isOut || isLow ? <AlertTriangle size={8} sm:size={10}/> : null}
                      {isOut ? 'Rupture' : isLow ? `${v.stock_quantity}` : `${v.stock_quantity}`}
                    </span>
                  </div>
                  {/* Ligne 2 : contrôle stock centré et compact pour mobile */}
                  <div className="flex justify-center w-full mt-3 pt-3 border-t border-black/5 dark:border-white/5">
                    <StockInput value={v.stock_quantity} onSave={(qty) => updateStock(v.id, qty, name, varLabel)} isSaving={isSaving} isSaved={isSaved} language={language} mobileMode/>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ── VUE TABLEAU DESKTOP (≥ md) ── */}
          <div className="hidden md:block bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] lg:rounded-[2.5rem] border border-white/20 shadow overflow-hidden">
            <div className="grid grid-cols-12 px-4 md:px-6 py-2.5 md:py-3 bg-gray-50 dark:bg-white/5 border-b border-black/5 dark:border-white/5 items-center gap-2 md:gap-4">
              <div className="col-span-5 md:col-span-5 lg:col-span-5"><SortBtn field="name_fr" label={language === 'fr' ? 'Produit / Variante' : 'Product / Variant'}/></div>
              <div className="col-span-2 md:col-span-2 lg:col-span-2 text-center"><SortBtn field="price" label={language === 'fr' ? 'Prix' : 'Price'}/></div>
              <div className="col-span-2 md:col-span-2 lg:col-span-2 text-center"><SortBtn field="stock_quantity" label="Stock"/></div>
              <div className="col-span-3 md:col-span-3 lg:col-span-3 text-center text-[8px] md:text-[9px] font-black uppercase text-gray-400 tracking-widest">{language === 'fr' ? 'Modifier' : 'Update'}</div>
            </div>
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {filtered.map(v => {
                const name = language === 'fr' ? v.products?.name_fr : v.products?.name_en;
                const varLabel = language === 'fr' ? v.label_fr : v.label_en;
                const imgUrl = v.products?.product_images?.find(i => i.is_main)?.url || v.products?.product_images?.[0]?.url;
                const isOut = v.stock_quantity === 0;
                const isLow = v.stock_quantity > 0 && v.stock_quantity <= STOCK_ALERT_THRESHOLD;
                const isSaving = saving === v.id;
                const isSaved = saved === v.id;
                return (
                  <div key={v.id} className={`grid grid-cols-12 px-4 md:px-6 py-3 md:py-4 items-center gap-2 md:gap-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/5 ${isOut ? 'bg-red-50/30 dark:bg-red-500/5' : isLow ? 'bg-yellow-50/30 dark:bg-yellow-500/5' : ''}`}>
                    <div className="col-span-5 md:col-span-5 lg:col-span-5 flex items-center gap-2 md:gap-3 min-w-0">
                      {imgUrl ? <img src={imgUrl} loading="lazy" alt="" className="w-8 h-8 md:w-10 md:h-10 rounded-xl object-cover flex-shrink-0 border border-black/5"/>
                               : <div className="w-8 h-8 md:w-10 md:h-10 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-base md:text-lg flex-shrink-0">📦</div>}
                      <div className="min-w-0">
                        <p className="font-black text-gray-900 dark:text-white text-xs md:text-sm truncate">{name}</p>
                        <p className="text-[9px] md:text-[10px] text-dakora-green font-bold truncate">{varLabel}</p>
                      </div>
                    </div>
                    <div className="col-span-2 md:col-span-2 lg:col-span-2 text-center">
                      <p className="font-black text-gray-900 dark:text-white text-xs md:text-sm">{v.price?.toLocaleString()}</p>
                      <p className="text-[8px] md:text-[9px] text-gray-400">FCFA</p>
                    </div>
                    <div className="col-span-2 md:col-span-2 lg:col-span-2 flex justify-center">
                      {isOut ? <span className="px-2 md:px-3 py-1 md:py-1.5 bg-red-100 dark:bg-red-500/10 text-red-600 text-[8px] md:text-[10px] font-black uppercase rounded-full flex items-center gap-1"><AlertTriangle size={9} md:size={11}/> <span className="hidden sm:inline">Rupture</span><span className="sm:hidden">!</span></span>
                              : isLow ? <span className="px-2 md:px-3 py-1 md:py-1.5 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 text-[8px] md:text-[10px] font-black uppercase rounded-full flex items-center gap-1"><AlertTriangle size={9} md:size={11}/> {v.stock_quantity}</span>
                              : <span className="px-2 md:px-3 py-1 md:py-1.5 bg-dakora-green/10 text-dakora-green text-[8px] md:text-[10px] font-black uppercase rounded-full">{v.stock_quantity}</span>}
                    </div>
                    <div className="col-span-3 md:col-span-3 lg:col-span-3 flex items-center justify-center">
                      <StockInput value={v.stock_quantity} onSave={(qty) => updateStock(v.id, qty, name, varLabel)} isSaving={isSaving} isSaved={isSaved} language={language}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ─── CONTRÔLE DE STOCK EN LIGNE ───────────────────────────────────────────────
function StockInput({ value, onSave, isSaving, isSaved, language, mobileMode = false }) {
  const [localVal, setLocalVal] = useState(String(value));
  const changed = parseInt(localVal) !== value && localVal !== '';

  useEffect(() => { setLocalVal(String(value)); }, [value]);

  if (mobileMode) {
    // Sur mobile : contrôle complet [ - ] [ input ] [ + ] [ save ] centré et compact
    return (
      <div className="flex items-center gap-2">
        <button onClick={() => { const n = Math.max(0, (parseInt(localVal)||0) - 1); setLocalVal(String(n)); }}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-black flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all text-lg flex-shrink-0">−</button>
        <input
          type="number" min="0" value={localVal}
          onChange={e => setLocalVal(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && changed && onSave(localVal)}
          className="w-16 text-center py-2 rounded-xl bg-gray-50 dark:bg-neutral-800 text-sm font-black dark:text-white border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-dakora-green focus:outline-none"
        />
        <button onClick={() => { const n = (parseInt(localVal)||0) + 1; setLocalVal(String(n)); }}
          className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-black flex items-center justify-center hover:bg-dakora-green/10 hover:text-dakora-green transition-all text-lg flex-shrink-0">+</button>
        <button onClick={() => changed && onSave(localVal)} disabled={!changed || isSaving}
          className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
            isSaved ? 'bg-dakora-green text-white' :
            changed ? 'bg-dakora-green text-white hover:bg-green-700 shadow-md' :
            'bg-gray-100 dark:bg-white/5 text-gray-300 cursor-not-allowed'
          }`}>
          {isSaving ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
            : isSaved ? <CheckCircle2 size={16}/> : <Save size={16}/>}
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 md:gap-1.5">
      <button onClick={() => { const n = Math.max(0, (parseInt(localVal)||0) - 1); setLocalVal(String(n)); }}
        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-black flex items-center justify-center hover:bg-red-100 hover:text-red-500 transition-all text-sm md:text-base">−</button>
      <input type="number" min="0" value={localVal}
        onChange={e => setLocalVal(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && changed && onSave(localVal)}
        className="w-12 md:w-14 text-center px-1.5 md:px-2 py-1 md:py-1.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-xs md:text-sm font-black dark:text-white border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-dakora-green focus:outline-none"/>
      <button onClick={() => { const n = (parseInt(localVal)||0) + 1; setLocalVal(String(n)); }}
        className="w-7 h-7 md:w-8 md:h-8 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-black flex items-center justify-center hover:bg-dakora-green/10 hover:text-dakora-green transition-all text-sm md:text-base">+</button>
      <button onClick={() => changed && onSave(localVal)} disabled={!changed || isSaving}
        className={`w-7 h-7 md:w-8 md:h-8 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
          isSaved ? 'bg-dakora-green text-white' :
          changed ? 'bg-dakora-green text-white hover:bg-green-700 shadow-md' :
          'bg-gray-100 dark:bg-white/5 text-gray-300 cursor-not-allowed'
        }`}>
        {isSaving ? <div className="w-2.5 h-2.5 md:w-3 md:h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
          : isSaved ? <CheckCircle2 size={11} md:size={13}/> : <Save size={11} md:size={13}/>}
      </button>
    </div>
  );
}
