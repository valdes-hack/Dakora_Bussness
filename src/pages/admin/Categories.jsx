import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Plus, Trash2, Folder, X } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { createNotification } from '../../utils/notify';
import { rules, validate, isValid } from '../../utils/validation';
import FieldInput from '../../components/ui/FieldInput';

// Schéma de validation pour une catégorie
const catSchema = {
  name_fr: [rules.nameFr],
  name_en:  [rules.nameEn],
  slug:     [rules.slug, rules.maxLen(60)],
  icon_url: [rules.noScript],
};

const EMPTY_ERRORS = { name_fr: null, name_en: null, slug: null, icon_url: null };

const Categories = () => {
  const { t } = useLanguage();
  const { invalidateCache } = useDataCache();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({ name_fr: '', name_en: '', slug: '', icon_url: '' });
  const [errors, setErrors] = useState(EMPTY_ERRORS);
  const [touched, setTouched] = useState({});

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

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    // Auto-générer le slug depuis name_fr si slug non encore touché
    if (field === 'name_fr' && !touched.slug) {
      const autoSlug = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setForm(prev => ({ ...prev, name_fr: value, slug: autoSlug }));
      const newForm = { ...form, name_fr: value, slug: autoSlug };
      setErrors(validate(newForm, catSchema));
    } else {
      setForm(prev => ({ ...prev, [field]: value }));
      const newForm = { ...form, [field]: value };
      setErrors(validate(newForm, catSchema));
    }
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validate(form, catSchema));
  };

  const handleOpen = () => {
    setForm({ name_fr: '', name_en: '', slug: '', icon_url: '' });
    setErrors(EMPTY_ERRORS);
    setTouched({});
    setIsAddOpen(true);
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setForm({ name_fr: '', name_en: '', slug: '', icon_url: '' });
    setErrors(EMPTY_ERRORS);
    setTouched({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Marquer tous les champs comme touchés pour afficher toutes les erreurs
    setTouched({ name_fr: true, name_en: true, slug: true, icon_url: true });
    const currentErrors = validate(form, catSchema);
    setErrors(currentErrors);
    if (!isValid(currentErrors)) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase.from('categories').insert([{
        name_fr: form.name_fr.trim(),
        name_en: form.name_en?.trim() || null,
        slug: form.slug?.trim() || form.name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        icon_url: form.icon_url?.trim() || null,
        order_index: categories.length
      }]).select().single();
      if (error) throw error;
      setCategories(prev => [...prev, data]);
      handleClose();
      invalidateCache();
      createNotification(`Catégorie ajoutée : ${form.name_fr}`, 'category', '/admin/categories');
    } catch (err) {
      alert(t('cat_error_add') + err.message);
      fetchCategories();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('cat_confirm_del'))) return;
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setCategories(prev => prev.filter(cat => cat.id !== id));
      invalidateCache();
      createNotification('Catégorie supprimée', 'category', '/admin/categories');
    } catch (err) {
      alert(t('cat_error_del') + err.message);
      fetchCategories();
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
        <button onClick={handleOpen}
          className="flex items-center gap-2 bg-dakora-green hover:bg-green-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-sm uppercase tracking-wider">
          <Plus size={18}/> {t('cat_add')}
        </button>
      </div>

      {/* MODAL AJOUT */}
      {isAddOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-[2rem] border border-white/20 shadow-2xl p-8 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase italic">{t('cat_modal_title')}</h3>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full transition-all hover:rotate-90">
                <X size={20}/>
              </button>
            </div>

            {/* Légende */}
            <p className="text-[9px] text-gray-400 font-bold flex items-center gap-1.5">
              <span className="text-red-500">★</span> = Obligatoire
              <span className="ml-3 text-dakora-green">✓</span> = Rempli
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">

              <FieldInput
                label={t('cat_name_fr')}
                required
                value={form.name_fr}
                onChange={handleChange('name_fr')}
                onBlur={handleBlur('name_fr')}
                error={touched.name_fr ? errors.name_fr : null}
                placeholder="ex: Motoculteurs"
              />

              <FieldInput
                label={t('cat_name_en')}
                value={form.name_en}
                onChange={handleChange('name_en')}
                onBlur={handleBlur('name_en')}
                error={touched.name_en ? errors.name_en : null}
                placeholder="ex: Tillers"
              />

              <FieldInput
                label={`${t('cat_slug')} — généré automatiquement`}
                value={form.slug}
                onChange={e => {
                  setTouched(p => ({...p, slug: true}));
                  handleChange('slug')(e);
                }}
                onBlur={handleBlur('slug')}
                error={touched.slug ? errors.slug : null}
                placeholder="ex: motoculteurs"
              />

              <FieldInput
                label={`${t('cat_icon')} (emoji ou URL)`}
                value={form.icon_url}
                onChange={handleChange('icon_url')}
                onBlur={handleBlur('icon_url')}
                error={touched.icon_url ? errors.icon_url : null}
                placeholder="🚜 ou https://..."
              />

              <div className="flex gap-4 pt-2">
                <button type="button" onClick={handleClose}
                  className="flex-1 py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-xl font-bold uppercase tracking-wider text-xs transition-all hover:bg-gray-200 dark:hover:bg-white/20">
                  {t('btn_cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-3 bg-dakora-green text-white rounded-xl font-black uppercase tracking-wider text-xs hover:bg-green-700 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    : t('save')
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(n => <div key={n} className="h-32 rounded-3xl bg-white/40 dark:bg-white/5 border border-white/20 animate-pulse"/>)}
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
                  {cat.icon_url || <Folder className="text-dakora-green"/>}
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
                <Trash2 size={18}/>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
