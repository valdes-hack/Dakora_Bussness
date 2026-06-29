import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { useSettings } from '../../context/SettingsContext';
import { Plus, Pencil, Trash2, AlertCircle, Eye, EyeOff, LayoutGrid, List, Search, X, Share2, Link as LinkIcon, CheckCircle2 } from 'lucide-react';
import ProductForm from './ProductForm';

// ─── PANNEAU PARTAGE PRODUIT ──────────────────────────────────────────────────
const ShareProductPanel = ({ product, language, waNumber, onClose }) => {
  const name = language === 'fr' ? product.name_fr : product.name_en;
  const productUrl = `${window.location.origin}/produit/${product.id}`;
  const imgUrl = product.product_images?.[0]?.url;
  const minPrice = product.variants?.length
    ? Math.min(...product.variants.map(v => Number(v.price))) : 0;
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(productUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareText = `${name} — à partir de ${minPrice.toLocaleString()} FCFA\n${productUrl}`;

  const options = [
    {
      name: 'WhatsApp', auto: false,
      hint: 'Ouvre WhatsApp avec le produit pré-rempli',
      bg: 'bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white', text: 'text-[#25D366]',
      action: () => window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(shareText)}`, '_blank'),
      icon: <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current"><path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/></svg>
    },
    {
      name: 'Facebook', auto: true,
      hint: 'Partage direct via Facebook',
      bg: 'bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white', text: 'text-[#1877F2]',
      action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}&quote=${encodeURIComponent(name)}`, '_blank', 'width=600,height=400'),
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
    },
    {
      name: 'Telegram', auto: true,
      hint: 'Partage direct via Telegram',
      bg: 'bg-[#0088CC]/10 hover:bg-[#0088CC] hover:text-white', text: 'text-[#0088CC]',
      action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(name)}`, '_blank'),
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    },
    {
      name: 'TikTok', auto: false,
      hint: 'Copie le lien — collez en description TikTok',
      bg: 'bg-black/10 hover:bg-black hover:text-white dark:bg-white/10 dark:hover:bg-white dark:hover:text-black', text: 'text-black dark:text-white',
      action: () => { copyLink(); window.open('https://www.tiktok.com/', '_blank'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
    },
    {
      name: 'Instagram', auto: false,
      hint: 'Copie le lien — collez en bio Instagram',
      bg: 'bg-[#E1306C]/10 hover:bg-[#E1306C] hover:text-white', text: 'text-[#E1306C]',
      action: () => { copyLink(); window.open('https://www.instagram.com/', '_blank'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            {imgUrl && <img src={imgUrl} alt="" loading="lazy" className="w-11 h-11 rounded-xl object-cover flex-shrink-0"/>}
            <div className="min-w-0">
              <p className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight truncate max-w-[200px]">{name}</p>
              <p className="text-[10px] text-dakora-green font-bold">{minPrice.toLocaleString()} FCFA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 flex-shrink-0 transition-all"><X size={18}/></button>
        </div>
        {/* Copier lien */}
        <div className="px-5 pt-4 pb-2">
          <button onClick={copyLink}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${copied ? 'border-dakora-green bg-dakora-green/5 text-dakora-green' : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-300 hover:border-dakora-green'}`}>
            {copied ? <CheckCircle2 size={15}/> : <LinkIcon size={15}/>}
            {copied ? 'Lien copié !' : 'Copier le lien produit'}
          </button>
        </div>
        {/* Réseaux */}
        <div className="p-5 space-y-2">
          {options.map(opt => (
            <button key={opt.name} onClick={opt.action}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${opt.bg} ${opt.text}`}>
              <span className="flex-shrink-0">{opt.icon}</span>
              <div className="text-left flex-grow min-w-0">
                <p className="font-black text-sm">{opt.name}</p>
                <p className="text-[10px] opacity-70 font-medium truncate">{opt.hint}</p>
              </div>
              <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-full flex-shrink-0 ${opt.auto ? 'bg-green-500/20 text-green-600' : 'bg-orange-500/20 text-orange-600'}`}>
                {opt.auto ? '✓ Auto' : '~ Manuel'}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const Products = () => {
  const { t, language } = useLanguage();
  const { invalidateCache } = useDataCache();
  const { settings } = useSettings();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [shareProduct, setShareProduct] = useState(null);

  // Filtres & vue
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('admin_view') || 'grid');
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: cats } = await supabase.from('categories').select('*').order('name_fr');
    setCategories(cats || []);
    const { data } = await supabase
      .from('products')
      .select('*, categories(name_fr, name_en), variants(*), product_images(*)')
      .order('created_at', { ascending: false });
    setProducts(data || []);
    setLoading(false);
  };

  const toggleView = (mode) => {
    setViewMode(mode);
    localStorage.setItem('admin_view', mode);
  };

  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase.from('products').update({ is_active: !currentStatus }).eq('id', id);
      if (error) throw error;
      setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      invalidateCache();
    } catch (err) { alert('Erreur activation: ' + err.message); }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('msg_confirm_del'))) {
      try {
        await supabase.from('products').delete().eq('id', id);
        setProducts(prev => prev.filter(p => p.id !== id));
        invalidateCache();
      } catch (err) {
        alert('Erreur suppression: ' + err.message);
        fetchData();
      }
    }
  };

  // Produits filtrés + recherche
  const filtered = useMemo(() => {
    let list = [...products];
    if (filterCat !== 'all') list = list.filter(p => p.category_id === filterCat);
    if (filterStatus === 'active') list = list.filter(p => p.is_active);
    if (filterStatus === 'hidden') list = list.filter(p => !p.is_active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name_fr?.toLowerCase().includes(q) ||
        p.name_en?.toLowerCase().includes(q) ||
        p.badge?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [products, filterCat, filterStatus, search]);

  const hasFilters = filterCat !== 'all' || filterStatus !== 'all' || search.trim();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
            {t('prod_title')?.split(' ')[0]} <span className="text-dakora-green">{t('prod_title')?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">{t('prod_subtitle')}</p>
        </div>
        <button onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="px-8 py-4 bg-dakora-green text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-green-700 transition-all flex items-center gap-3 active:scale-95">
          <Plus size={20}/> {t('prod_add')}
        </button>
      </div>

      {/* BARRE FILTRES */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow p-4 flex flex-wrap items-center gap-3">
        {/* Recherche */}
        <div className="relative flex-grow min-w-[180px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"/>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher un produit...' : 'Search product...'}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none"/>
          {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"><X size={13}/></button>}
        </div>

        {/* Catégorie */}
        <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-neutral-800 text-xs font-bold dark:text-white border-none focus:ring-2 focus:ring-dakora-green outline-none cursor-pointer">
          <option value="all">{language === 'fr' ? 'Toutes catégories' : 'All categories'}</option>
          {categories.map(c => <option key={c.id} value={c.id}>{language === 'fr' ? c.name_fr : c.name_en}</option>)}
        </select>

        {/* Statut */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
          {[
            { v: 'all', label: language === 'fr' ? 'Tous' : 'All' },
            { v: 'active', label: language === 'fr' ? 'En ligne' : 'Online' },
            { v: 'hidden', label: language === 'fr' ? 'Masqués' : 'Hidden' },
          ].map(opt => (
            <button key={opt.v} onClick={() => setFilterStatus(opt.v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filterStatus === opt.v ? 'bg-white dark:bg-neutral-800 shadow text-dakora-green' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-200'}`}>
              {opt.label}
            </button>
          ))}
        </div>

        {/* Réinitialiser */}
        {hasFilters && (
          <button onClick={() => { setSearch(''); setFilterCat('all'); setFilterStatus('all'); }}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-xl text-[10px] font-black uppercase hover:bg-red-100 transition-all">
            <X size={12}/> {language === 'fr' ? 'Effacer' : 'Clear'}
          </button>
        )}

        {/* Spacer */}
        <div className="flex-grow"/>

        {/* Compteur */}
        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">
          {filtered.length} / {products.length}
        </span>

        {/* Toggle vue */}
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/10 p-1 rounded-xl">
          <button onClick={() => toggleView('grid')} aria-label="Vue grille"
            className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-neutral-800 shadow text-dakora-green' : 'text-gray-400 hover:text-gray-600'}`}>
            <LayoutGrid size={15}/>
          </button>
          <button onClick={() => toggleView('list')} aria-label="Vue liste"
            className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white dark:bg-neutral-800 shadow text-dakora-green' : 'text-gray-400 hover:text-gray-600'}`}>
            <List size={15}/>
          </button>
        </div>
      </div>

      {/* CONTENU */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(n => <div key={n} className="h-80 rounded-[3rem] bg-white/40 dark:bg-white/5 animate-pulse border border-white/20"/>)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
          <AlertCircle size={48} className="text-gray-300 mb-4"/>
          <p className="text-gray-400 italic font-bold">{hasFilters ? (language === 'fr' ? 'Aucun résultat pour ces filtres.' : 'No results for these filters.') : t('prod_empty')}</p>
        </div>

      /* ── VUE GRILLE ── */
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(prod => (
            <div key={prod.id}
              className={`group relative bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[3rem] p-8 border border-white/20 shadow-xl transition-all duration-500 flex flex-col justify-between ${!prod.is_active ? 'opacity-60 grayscale-[0.4]' : ''}`}>
              <div>
                <div className="relative h-48 mb-6 rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-black/40 border border-black/5 shadow-inner">
                  {prod.product_images?.[0]?.url ? (
                    <img src={prod.product_images[0].url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" loading="lazy"/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                  )}
                  {prod.badge && (
                    <div className="absolute top-4 left-4 px-4 py-1.5 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase rounded-full shadow-lg">{prod.badge}</div>
                  )}
                  <button onClick={() => toggleActive(prod.id, prod.is_active)}
                    className={`absolute top-4 right-4 p-3 rounded-2xl backdrop-blur-md transition-all shadow-lg ${prod.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'}`}>
                    {prod.is_active ? <Eye size={18}/> : <EyeOff size={18}/>}
                  </button>
                </div>
                <span className="text-[10px] font-black text-dakora-green uppercase tracking-[0.2em]">
                  {language === 'fr' ? prod.categories?.name_fr : prod.categories?.name_en}
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 leading-tight line-clamp-2">
                  {language === 'fr' ? prod.name_fr : prod.name_en}
                </h3>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{prod.is_active ? t('prod_active') : t('prod_hidden')}</span>
                  <button onClick={() => toggleActive(prod.id, prod.is_active)}
                    className={`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none ${prod.is_active ? 'bg-dakora-green' : 'bg-gray-300 dark:bg-gray-700'}`}>
                    <div className={`absolute top-0.5 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${prod.is_active ? 'translate-x-4' : 'translate-x-0'}`}/>
                  </button>
                </div>
              </div>
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-black/5 dark:border-white/5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('variant_price')}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {prod.variants?.[0]?.price?.toLocaleString() || '---'} <span className="text-xs text-dakora-green">FCFA</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShareProduct(prod)}
                    className="p-4 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-2xl hover:bg-blue-500 hover:text-white transition-all shadow-sm active:scale-90">
                    <Share2 size={18}/>
                  </button>
                  <button onClick={() => { setEditProduct(prod); setShowForm(true); }}
                    className="p-4 bg-dakora-green/10 text-dakora-green rounded-2xl hover:bg-dakora-green hover:text-white transition-all shadow-sm active:scale-90">
                    <Pencil size={18}/>
                  </button>
                  <button onClick={() => handleDelete(prod.id)}
                    className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90">
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      /* ── VUE LISTE ── */
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(prod => {
            const name = language === 'fr' ? prod.name_fr : prod.name_en;
            const catName = language === 'fr' ? prod.categories?.name_fr : prod.categories?.name_en;
            const imgUrl = prod.product_images?.[0]?.url;
            const price = prod.variants?.[0]?.price;
            return (
              <div key={prod.id}
                className={`flex items-center gap-4 bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[2rem] px-5 py-4 border border-white/20 shadow transition-all ${!prod.is_active ? 'opacity-60' : ''}`}>
                {/* Image */}
                <div className="w-16 h-16 flex-shrink-0 rounded-[1.2rem] overflow-hidden bg-gray-100 dark:bg-black/40">
                  {imgUrl ? (
                    <img src={imgUrl} loading="lazy" className="w-full h-full object-cover" alt=""/>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                  )}
                </div>
                {/* Infos */}
                <div className="flex-grow min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[9px] font-black text-dakora-green uppercase tracking-widest">{catName}</span>
                    {prod.badge && <span className="px-2 py-0.5 bg-dakora-yellow text-yellow-900 text-[9px] font-black uppercase rounded-full">{prod.badge}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${prod.is_active ? 'bg-dakora-green/10 text-dakora-green' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                      {prod.is_active ? t('prod_active') : t('prod_hidden')}
                    </span>
                  </div>
                  <p className="font-black text-gray-900 dark:text-white text-sm truncate mt-0.5">{name}</p>
                  <p className="text-dakora-green font-black text-xs">{price ? `${price.toLocaleString()} FCFA` : '---'}</p>
                </div>
                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button onClick={() => toggleActive(prod.id, prod.is_active)}
                    className={`p-2.5 rounded-xl transition-all ${prod.is_active ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-dakora-green hover:text-white'}`}>
                    {prod.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}
                  </button>
                  <button onClick={() => setShareProduct(prod)}
                    className="p-2.5 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-xl hover:bg-blue-500 hover:text-white transition-all active:scale-90">
                    <Share2 size={16}/>
                  </button>
                  <button onClick={() => { setEditProduct(prod); setShowForm(true); }}
                    className="p-2.5 bg-dakora-green/10 text-dakora-green rounded-xl hover:bg-dakora-green hover:text-white transition-all active:scale-90">
                    <Pencil size={16}/>
                  </button>
                  <button onClick={() => handleDelete(prod.id)}
                    className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all active:scale-90">
                    <Trash2 size={16}/>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* FORMULAIRE OVERLAY */}
      {showForm && (
        <ProductForm product={editProduct} categories={categories}
          onClose={() => setShowForm(false)} onSave={() => setShowForm(false)} invalidateCache={invalidateCache}/>
      )}

      {/* PANNEAU PARTAGE */}
      {shareProduct && (
        <ShareProductPanel
          product={shareProduct}
          language={language}
          waNumber={settings.whatsapp_number || '237690000000'}
          onClose={() => setShareProduct(null)}
        />
      )}
    </div>
  );
};

export default Products;
