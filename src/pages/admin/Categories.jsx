import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Plus, Trash2, Folder, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';

const Categories = () => {
  const { t } = useLanguage();
  const { invalidateCache } = useDataCache();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [nameFr, setNameFr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [slug, setSlug] = useState('');
  const [iconUrl, setIconUrl] = useState('');

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('order_index', { ascending: true });
      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      const { data, error } = await supabase.from('categories').insert([{
        name_fr: nameFr,
        name_en: nameEn || null,
        slug: slug || nameFr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon_url: iconUrl || null,
        order_index: categories.length
      }]).select().single();
      if (error) throw error;
      // Mise à jour locale optimiste
      setCategories([...categories, data]);
      setNameFr(''); setNameEn(''); setSlug(''); setIconUrl('');
      setIsAddOpen(false);
      invalidateCache();
    } catch (err) {
      alert(t('cat_error_add') + err.message);
      fetchCategories(); // Recharger en cas d'erreur
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('cat_confirm_del'))) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      // Mise à jour locale optimiste
      setCategories(categories.filter(cat => cat.id !== id));
      invalidateCache();
    } catch (err) {
      alert(t('cat_error_del') + err.message);
      fetchCategories(); // Recharger en cas d'erreur
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            {t('cat_title')} <span className="text-dakora-green">{t('cat_title_green')}</span>
          </h1>
          <p className="text-gray-500 font-medium">{t('cat_subtitle')}</p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-2 bg-dakora-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-wider"
        >
          <Plus size={18} /> {t('cat_add')}
        </button>
      </div>

      {/* MODAL AJOUT */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-white/20 shadow-2xl p-8 max-w-md w-full space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic">
                {t('cat_modal_title')}
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('cat_name_fr')} *</label>
                <input type="text" value={nameFr} onChange={e => setNameFr(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white" required />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('cat_name_en')}</label>
                <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('cat_slug')}</label>
                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                  placeholder={t('cat_slug_hint')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">{t('cat_icon')}</label>
                <input type="text" value={iconUrl} onChange={e => setIconUrl(e.target.value)}
                  placeholder={t('cat_icon_hint')}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white" />
              </div>
              <div className="flex gap-4 pt-2">
                <button type="button" onClick={() => setIsAddOpen(false)}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase tracking-wider text-xs">
                  {t('btn_cancel')}
                </button>
                <button type="submit"
                  className="flex-1 py-3 bg-dakora-green text-white rounded-xl font-black uppercase tracking-wider text-xs hover:bg-green-700 shadow-md">
                  {t('save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => <div key={n} className="h-32 rounded-3xl bg-white/40 dark:bg-white/5 border border-white/20 animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/20 border-dashed text-center">
          <p className="text-gray-400 italic font-medium">{t('cat_empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {categories.map(cat => (
            <div key={cat.id} className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-6 rounded-[2rem] border border-white/20 shadow-xl flex items-center justify-between group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-4">
                <div className="text-3xl p-3 bg-gray-100 dark:bg-white/10 rounded-2xl">
                  {cat.icon_url || <Folder className="text-dakora-green" />}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{cat.name_fr}</h3>
                  {cat.name_en && <p className="text-xs text-gray-400">{cat.name_en}</p>}
                  <p className="text-[10px] bg-dakora-green/10 text-dakora-green px-2 py-0.5 rounded-full inline-block mt-1 font-bold">
                    slug: {cat.slug}
                  </p>
                </div>
              </div>
              <button onClick={() => handleDelete(cat.id)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all">
                <Trash2 size={18} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
