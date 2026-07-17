import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { Plus, Trash2, Folder, X, Edit2, LayoutGrid, List, Filter, X as FilterX } from 'lucide-react';
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

// Liste d'emojis agricoles descriptifs pour l'admin
const AGRICULTURAL_EMOJIS = [
  // Équipements lourds
  '🚜', '🚛', '🚚', '🚙', '🛻', 
  // Outils et machines
  '⛏️', '🔨', '�', '🔧', '🧰', '⚙️', '🔩', '�', '�', '🪜',
  // Cultures et récolte
  '�', '�', '�', '�', '�', '�', '🌳', '🍄', '🌻', '🌷',
  // Légumes
  '�', '�', '�', '�', '🌶️', '🥒', '🥬', '🧅', '🧄', '🥦',
  // Fruits
  '�', '�', '�', '�', '�', '🍒', '🥝', '�', '🥭', '�', '�',
  // Élevage
  '🐄', '🐖', '🐓', '🐑', '🐐', '🐔', '🐣', '🐤', '🥚', '🧀',
  // Produits laitiers et autres
  '🥛', '🍯', '🌰', '🥜', '�', '🧈', '🥩', '�',
  // Irrigation et météo
  '💧', '☀️', '🌧️', '⛈️', '❄️', '🌈', '🌤️', '⛅', '�️', '�️',
  // Stockage et bâtiments
  '🏠', '🏡', '🏢', '🏣', '🏤', '�', '🏦',
  // Autres équipements
  '🔋', '💡', '🔌', '📱', '💻', '📷', '�', '📡'
];

const Categories = () => {
  const { t } = useLanguage();
  const { invalidateCache } = useDataCache();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' ou 'list'
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleEdit = (category) => {
    setForm({
      name_fr: category.name_fr || '',
      name_en: category.name_en || '',
      slug: category.slug || '',
      icon_url: category.icon_url || ''
    });
    setErrors(EMPTY_ERRORS);
    setTouched({});
    setEditingCategory(category);
    setIsEditOpen(true);
  };

  const handleClose = () => {
    setIsAddOpen(false);
    setIsEditOpen(false);
    setEditingCategory(null);
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
      if (editingCategory) {
        // Mode édition
        const { data, error } = await supabase
          .from('categories')
          .update({
            name_fr: form.name_fr.trim(),
            name_en: form.name_en?.trim() || null,
            slug: form.slug?.trim() || form.name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            icon_url: form.icon_url?.trim() || null
          })
          .eq('id', editingCategory.id)
          .select()
          .single();
        if (error) throw error;
        setCategories(prev => prev.map(cat => cat.id === editingCategory.id ? data : cat));
        createNotification(`Catégorie modifiée : ${form.name_fr}`, 'category', '/admin/categories');
      } else {
        // Mode ajout
        const { data, error } = await supabase.from('categories').insert([{
          name_fr: form.name_fr.trim(),
          name_en: form.name_en?.trim() || null,
          slug: form.slug?.trim() || form.name_fr.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          icon_url: form.icon_url?.trim() || null,
          order_index: categories.length
        }]).select().single();
        if (error) throw error;
        setCategories(prev => [...prev, data]);
        createNotification(`Catégorie ajoutée : ${form.name_fr}`, 'category', '/admin/categories');
      }
      handleClose();
      invalidateCache();
    } catch (err) {
      alert((editingCategory ? 'Erreur modification: ' : t('cat_error_add')) + err.message);
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
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500">

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter italic">
            {t('cat_title')} <span className="text-dakora-green">{t('cat_title_green')}</span>
          </h1>
          <p className="text-gray-500 font-medium text-xs md:text-sm">{t('cat_subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Toggle filtre */}
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all ${
              filterOpen
                ? 'bg-dakora-green text-white shadow-lg shadow-dakora-green/20'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
            title={filterOpen ? 'Masquer les filtres' : 'Afficher les filtres'}
          >
            {filterOpen ? <FilterX size={18} /> : <Filter size={18} />}
          </button>
          {/* Toggle vue grille/liste */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
            className={`p-2.5 md:p-3 rounded-xl md:rounded-2xl transition-all ${
              viewMode === 'grid'
                ? 'bg-dakora-green text-white shadow-lg shadow-dakora-green/20'
                : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20'
            }`}
            title={viewMode === 'grid' ? 'Vue liste' : 'Vue grille'}
          >
            {viewMode === 'grid' ? <List size={18} /> : <LayoutGrid size={18} />}
          </button>
          <button onClick={handleOpen}
            className="flex items-center gap-2 bg-dakora-green hover:bg-green-700 text-white font-black py-2.5 md:py-3 px-4 md:px-6 rounded-xl md:rounded-2xl shadow-lg transition-all hover:scale-105 active:scale-95 text-[10px] md:text-sm uppercase tracking-wider">
            <Plus size={16}/> {t('cat_add')}
          </button>
        </div>
      </div>

      {/* MODAL AJOUT/ÉDITION */}
      {(isAddOpen || isEditOpen) && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-neutral-900 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 shadow-2xl p-4 md:p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto space-y-4 md:space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white uppercase italic">
                {editingCategory ? 'Modifier catégorie' : t('cat_modal_title')}
              </h3>
              <button onClick={handleClose} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full transition-all hover:rotate-90">
                <X size={16} sm:size={18}/>
              </button>
            </div>

            {/* Légende */}
            <p className="text-[8px] sm:text-[9px] text-gray-400 font-bold flex items-center gap-1.5">
              <span className="text-red-500">★</span> = Obligatoire
              <span className="ml-3 text-dakora-green">✓</span> = Rempli
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-3 md:space-y-4">

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

              {/* Sélecteur d'emoji agricole */}
              <div>
                <label className="block text-[10px] sm:text-xs font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">
                  {t('cat_icon')} (choisir ou entrer)
                </label>
                <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-2 p-2 sm:p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/10 max-h-32 sm:max-h-40 overflow-y-auto">
                  {AGRICULTURAL_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm(prev => ({ ...prev, icon_url: emoji }))}
                      className={`text-xl sm:text-2xl p-1 sm:p-1.5 rounded-lg transition-all hover:scale-125 hover:bg-white dark:hover:bg-white/10 ${form.icon_url === emoji ? 'bg-dakora-green/20 ring-2 ring-dakora-green' : ''}`}
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
                <FieldInput
                  className="mt-2"
                  value={form.icon_url}
                  onChange={handleChange('icon_url')}
                  onBlur={handleBlur('icon_url')}
                  error={touched.icon_url ? errors.icon_url : null}
                  placeholder="Ou entrez votre propre emoji..."
                />
              </div>

              <div className="flex gap-2 sm:gap-3 md:gap-4 pt-2">
                <button type="button" onClick={handleClose}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 rounded-lg md:rounded-xl font-bold uppercase tracking-wider text-[9px] sm:text-[10px] md:text-xs transition-all hover:bg-gray-200 dark:hover:bg-white/20">
                  {t('btn_cancel')}
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2 sm:py-2.5 md:py-3 bg-dakora-green text-white rounded-lg md:rounded-xl font-black uppercase tracking-wider text-[9px] sm:text-[10px] md:text-xs hover:bg-green-700 shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting
                    ? <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
                    : (editingCategory ? 'Modifier' : t('save'))
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTRE LATÉRAL */}
      {filterOpen && (
        <div className="bg-white/60 dark:bg-white/5 backdrop-blur-md p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-white/20 shadow-xl animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-black text-gray-900 dark:text-white uppercase italic">Filtres</h3>
            <button onClick={() => setFilterOpen(false)} className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-white rounded-full transition-all">
              <X size={16}/>
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-gray-700 dark:text-gray-300 mb-2">
                Rechercher
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Nom de catégorie..."
                className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-dakora-green dark:text-white"
              />
            </div>
          </div>
        </div>
      )}

      {/* LISTE */}
      {loading ? (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" : "space-y-3 sm:space-y-4"}>
          {[1,2,3].map(n => (
            <div key={n} className={viewMode === 'grid' ? "h-20 sm:h-24 md:h-32 rounded-[1.5rem] sm:rounded-2xl md:rounded-3xl bg-white/40 dark:bg-white/5 border border-white/20 animate-pulse" : "h-16 sm:h-20 rounded-xl bg-white/40 dark:bg-white/5 border border-white/20 animate-pulse"}/>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[1.5rem] sm:rounded-[2rem] md:rounded-[2.5rem] p-4 sm:p-6 md:p-10 border border-white/20 border-dashed text-center">
          <p className="text-gray-400 italic font-medium text-xs sm:text-sm md:text-base">{t('cat_empty')}</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6" : "space-y-3 sm:space-y-4"}>
          {categories.filter(cat => 
            !searchQuery || 
            cat.name_fr.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.name_en && cat.name_en.toLowerCase().includes(searchQuery.toLowerCase()))
          ).map(cat => (
            <div key={cat.id} className={`bg-white/60 dark:bg-white/5 backdrop-blur-md p-3 sm:p-4 md:p-6 rounded-[1.2rem] sm:rounded-[1.5rem] md:rounded-[2rem] border border-white/20 shadow-xl group hover:scale-[1.02] transition-all ${
              viewMode === 'grid' ? 'flex items-center justify-between' : 'flex items-center justify-between'
            }`}>
              <div className="flex items-center gap-2 sm:gap-3 md:gap-4 flex-1 min-w-0">
                <div className="text-xl sm:text-2xl md:text-3xl p-1.5 sm:p-2 md:p-3 bg-gray-100 dark:bg-white/10 rounded-lg sm:rounded-xl md:rounded-2xl flex-shrink-0">
                  {cat.icon_url || <Folder className="text-dakora-green w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8"/>}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm md:text-base truncate">{cat.name_fr}</h3>
                  {cat.name_en && <p className="text-[9px] sm:text-[10px] md:text-xs text-gray-400 truncate">{cat.name_en}</p>}
                  <p className="text-[7px] sm:text-[8px] md:text-[10px] bg-dakora-green/10 text-dakora-green px-1 sm:px-1.5 md:px-2 py-0.5 rounded-full inline-block mt-1 font-bold truncate">
                    slug: {cat.slug}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(cat)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-dakora-green hover:bg-dakora-green/10 rounded-lg sm:rounded-xl transition-all">
                  <Edit2 size={14} sm:size={16}/>
                </button>
                <button onClick={() => handleDelete(cat.id)}
                  className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg sm:rounded-xl transition-all">
                  <Trash2 size={14} sm:size={16}/>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Categories;
