import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { X, Trash2, Layers, Image as ImageIcon, CheckCircle2, UploadCloud, Link as LinkIcon, Star, AlertCircle } from 'lucide-react';
import { createNotification } from '../../utils/notify';
import { rules } from '../../utils/validation';
import FieldInput from '../../components/ui/FieldInput';

// ─── SCHÉMAS DE VALIDATION ────────────────────────────────────────────────────
const productSchema = {
  name_fr:        [rules.nameFr],
  name_en:        [rules.nameEn],
  description_fr: [rules.longText],
  description_en: [rules.longText],
  category_id:    [rules.required],
  badge:          [rules.badge],
};

const variantSchema = {
  label_fr: [rules.nameFr],
  label_en: [rules.nameEn],
  price:    [rules.price],
  stock_quantity: [rules.stock],
};

const EMPTY_PROD_ERRORS = {
  name_fr: null, name_en: null, description_fr: null,
  description_en: null, category_id: null, badge: null,
};

// ─── VALIDATION VARIANTE ─────────────────────────────────────────────────────
const validateVariant = (v) => ({
  label_fr:      rules.nameFr(v.label_fr),
  label_en:      rules.nameEn(v.label_en),
  price:         rules.price(v.price),
  stock_quantity: rules.stock(v.stock_quantity),
});

const isVariantValid = (errs) => Object.values(errs).every(e => e === null);

// ─── COMPOSANT LIGNE VARIANTE ─────────────────────────────────────────────────
const VariantRow = ({ v, i, onChange, onRemove, t, touched }) => {
  const errs = touched ? validateVariant(v) : {};
  const field = (name) => ({
    value: v[name] ?? '',
    onChange: (e) => onChange(i, name, e.target.value),
    error: touched ? errs[name] : null,
  });

  return (
    <div className="bg-white dark:bg-neutral-800 p-4 rounded-2xl border border-black/5 shadow-sm space-y-3 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-4 lg:items-start">
      <FieldInput label={`${t('variant_label_fr')}`} required {...field('label_fr')} placeholder="ex: 7 CV Diesel"/>
      <FieldInput label={`${t('variant_label_en')}`} {...field('label_en')} placeholder="ex: 7 HP Diesel"/>
      <FieldInput label={`${t('variant_price')} (FCFA)`} required type="number" {...field('price')} placeholder="0"/>
      <div className="flex items-end gap-2">
        <FieldInput label={t('variant_stock')} type="number" {...field('stock_quantity')} placeholder="0" className="flex-grow"/>
        <button type="button" onClick={() => onRemove(i)}
          className="mb-[1px] p-2.5 text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 rounded-xl transition-all flex-shrink-0">
          <Trash2 size={16}/>
        </button>
      </div>
    </div>
  );
};

// ─── FORMULAIRE PRODUIT ───────────────────────────────────────────────────────
const ProductForm = ({ product, categories, onClose, onSave, invalidateCache }) => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([{ label_fr: '', label_en: '', price: '', stock_quantity: 0 }]);
  const [variantsTouched, setVariantsTouched] = useState(false);

  const [formData, setFormData] = useState({
    id: null, category_id: '', name_fr: '', name_en: '',
    description_fr: '', description_en: '', badge: '',
    is_active: true, order_index: 0
  });

  const [errors, setErrors] = useState(EMPTY_PROD_ERRORS);
  const [touched, setTouched] = useState({});
  const [globalError, setGlobalError] = useState(null);

  useEffect(() => {
    if (product) {
      setFormData({
        id: product.id,
        category_id: product.category_id || '',
        name_fr: product.name_fr || '',
        name_en: product.name_en || '',
        description_fr: product.description_fr || '',
        description_en: product.description_en || '',
        badge: product.badge || '',
        is_active: product.is_active,
        order_index: product.order_index || 0
      });
      setVariants(product.variants?.length > 0
        ? product.variants.map(v => ({ ...v, price: v.price ?? '', stock_quantity: v.stock_quantity ?? 0 }))
        : [{ label_fr: '', label_en: '', price: '', stock_quantity: 0 }]
      );
      if (product.product_images) {
        setImages(product.product_images.map(img => ({ ...img, isNew: false, type: 'url' })));
      }
    }
  }, [product]);

  // Validation temps réel
  const validateAll = (data) => {
    const errs = {};
    for (const [field, fieldRules] of Object.entries(productSchema)) {
      let err = null;
      for (const rule of fieldRules) {
        err = rule(data[field]);
        if (err) break;
      }
      errs[field] = err;
    }
    return errs;
  };

  const handleChange = (field) => (e) => {
    const value = e.target.value;
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validateAll(newData));
    setGlobalError(null);
  };

  const handleBlur = (field) => () => {
    setTouched(prev => ({ ...prev, [field]: true }));
    setErrors(validateAll(formData));
  };

  const handleVariantChange = (i, field, value) => {
    const nv = [...variants];
    nv[i] = { ...nv[i], [field]: value };
    setVariants(nv);
  };

  const handleFileChange = (index, file) => {
    const newImages = [...images];
    newImages[index].file = file;
    newImages[index].url = URL.createObjectURL(file);
    setImages(newImages);
  };

  const uploadToStorage = async (productId, file) => {
    const ext = file.name.split('.').pop();
    const fileName = `${productId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setGlobalError(null);

    // Marquer tous les champs produit comme touchés
    const allTouched = Object.keys(productSchema).reduce((acc, k) => ({ ...acc, [k]: true }), {});
    setTouched(allTouched);
    setVariantsTouched(true);

    const productErrors = validateAll(formData);
    setErrors(productErrors);
    const productOk = Object.values(productErrors).every(e => e === null);

    // Valider toutes les variantes
    const variantsOk = variants.every(v => isVariantValid(validateVariant(v)));

    if (!productOk || !variantsOk) {
      setGlobalError('Veuillez corriger les erreurs avant de continuer.');
      return;
    }

    if (variants.length === 0) {
      setGlobalError('Ajoutez au moins une variante (modèle + prix).');
      return;
    }

    setLoading(true);
    try {
      let productId = formData.id;
      const productPayload = {
        category_id: formData.category_id,
        name_fr: formData.name_fr.trim(),
        name_en: formData.name_en?.trim() || null,
        description_fr: formData.description_fr?.trim() || null,
        description_en: formData.description_en?.trim() || null,
        badge: formData.badge?.trim() || null,
        is_active: formData.is_active,
        order_index: formData.order_index
      };

      if (productId) {
        await supabase.from('products').update(productPayload).eq('id', productId);
      } else {
        const { data, error } = await supabase.from('products').insert([productPayload]).select().single();
        if (error) throw error;
        productId = data.id;
      }

      // Images
      await supabase.from('product_images').delete().eq('product_id', productId);
      const finalImages = await Promise.all(images.map(async (img) => {
        let finalUrl = img.url;
        if (img.file) finalUrl = await uploadToStorage(productId, img.file);
        return { product_id: productId, url: finalUrl, is_main: !!img.is_main };
      }));
      if (finalImages.length > 0) {
        const { error: insertError } = await supabase.from('product_images').insert(finalImages);
        if (insertError) throw insertError;
      }

      // Variantes
      await supabase.from('variants').delete().eq('product_id', productId);
      await supabase.from('variants').insert(variants.map(v => ({
        product_id: productId,
        label_fr: v.label_fr.trim(),
        label_en: v.label_en?.trim() || null,
        price: Number(v.price),
        stock_quantity: Number(v.stock_quantity) || 0
      })));

      if (invalidateCache) invalidateCache();
      const action = formData.id ? 'modifié' : 'ajouté';
      createNotification(`Produit ${action} : ${formData.name_fr}`, 'product', '/admin/produits');

      // Vérifier si des variantes ont un stock faible ou nul après sauvegarde
      const lowStockVariants = variants.filter(v => parseInt(v.stock_quantity) <= 5);
      for (const v of lowStockVariants) {
        const qty = parseInt(v.stock_quantity) || 0;
        const label = `${formData.name_fr} — ${v.label_fr}`;
        const msg = qty === 0
          ? `⚠️ Rupture de stock : ${label}`
          : `⚠️ Stock faible (${qty} restant${qty > 1 ? 's' : ''}) : ${label}`;
        createNotification(msg, 'stock', '/admin/inventaire');
      }

      onSave();
    } catch (err) {
      setGlobalError('Erreur serveur : ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fieldProps = (field, required = false) => ({
    required,
    value: formData[field],
    onChange: handleChange(field),
    onBlur: handleBlur(field),
    error: touched[field] ? errors[field] : null,
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-5xl h-full md:h-auto md:max-h-[95vh] md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in zoom-in duration-300">

        {/* HEADER */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
          <div>
            <h2 className="text-2xl font-black uppercase italic dark:text-white">
              {formData.id ? t('prod_edit') : t('prod_add')}
            </h2>
            <p className="text-[9px] text-gray-400 font-bold mt-0.5 flex items-center gap-1.5">
              <span className="text-red-500">★</span> = Obligatoire &nbsp;·&nbsp;
              <span className="text-dakora-green">✓</span> = Rempli correctement
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full dark:text-white hover:rotate-90 transition-all"><X/></button>
        </div>

        <form onSubmit={handleSave} noValidate className="flex-grow overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">

          {/* ERREUR GLOBALE */}
          {globalError && (
            <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl animate-in slide-in-from-top-2">
              <AlertCircle size={18} className="text-red-500 flex-shrink-0"/>
              <p className="text-sm text-red-600 dark:text-red-400 font-bold">{globalError}</p>
            </div>
          )}

          {/* SECTION 1 : INFOS DE BASE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FieldInput label={t('prod_name_fr')} required placeholder="ex: Motoculteur Diesel" {...fieldProps('name_fr', true)}/>
            <FieldInput label={t('prod_name_en')} placeholder="ex: Diesel Tiller" {...fieldProps('name_en')}/>
            <FieldInput label={t('prod_desc_fr')} as="textarea" rows={4} placeholder="Description détaillée en français..." {...fieldProps('description_fr')}/>
            <FieldInput label={t('prod_desc_en')} as="textarea" rows={4} placeholder="Detailed description in English..." {...fieldProps('description_en')}/>

            <FieldInput label={t('prod_cat_select')} required as="select" {...fieldProps('category_id', true)}>
              <option value="">— Choisir une catégorie —</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
            </FieldInput>

            <FieldInput label={`${t('prod_badge')} (ex: Promo, Nouveau)`} placeholder="Promo" {...fieldProps('badge')}/>
          </div>

          {/* SECTION 2 : GALERIE */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-dakora-green flex items-center gap-2">
              <ImageIcon size={16}/> {t('prod_gallery')}
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((img, index) => (
                <div key={index} className={`relative rounded-3xl border-2 overflow-hidden transition-all bg-gray-50 dark:bg-white/5 ${img.is_main ? 'border-dakora-green ring-4 ring-dakora-green/20' : 'border-gray-200 dark:border-white/10'}`}>
                  <div className="aspect-square">
                    {img.url
                      ? <img src={img.url} className="w-full h-full object-cover" alt="" loading="lazy"/>
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-[10px]">{t('add_img')}</div>}
                  </div>
                  {img.type === 'url' && (
                    <div className="p-2 border-t border-gray-100 dark:border-white/5">
                      <input type="text" value={img.url}
                        onChange={e => { const ni = [...images]; ni[index].url = e.target.value; setImages(ni); }}
                        className="w-full text-[10px] px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 dark:text-white border-none" placeholder={t('img_paste_url')}/>
                    </div>
                  )}
                  {img.type === 'file' && (
                    <div className="p-2 border-t border-gray-100 dark:border-white/5">
                      <label className="flex items-center justify-center gap-1 w-full px-3 py-2 bg-dakora-green/10 text-dakora-green rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-dakora-green hover:text-white transition-all">
                        <UploadCloud size={13}/> {img.file ? t('img_change') : t('img_choose')}
                        <input type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && handleFileChange(index, e.target.files[0])}/>
                      </label>
                    </div>
                  )}
                  <div className="p-2 flex items-center justify-between gap-1">
                    <button type="button" onClick={() => setImages(images.map((im, i) => ({ ...im, is_main: i === index })))}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${img.is_main ? 'bg-dakora-green text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-dakora-green/20'}`}>
                      <Star size={10}/> {img.is_main ? t('img_main') : t('img_set_main')}
                    </button>
                    <button type="button" onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="p-1.5 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              ))}

              {/* ZONE AJOUT */}
              <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-3 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase text-center">{t('add_img')}</p>
                <label className="flex items-center gap-2 w-full px-4 py-2.5 bg-dakora-green text-white rounded-2xl text-[10px] font-black uppercase cursor-pointer hover:bg-green-700 transition-all justify-center shadow-md">
                  <UploadCloud size={14}/> {t('img_from_device')}
                  <input type="file" accept="image/*" className="hidden" onChange={e => {
                    if (e.target.files[0]) {
                      const file = e.target.files[0];
                      setImages(prev => [...prev, { url: URL.createObjectURL(file), file, is_main: prev.length === 0, isNew: true, type: 'file' }]);
                    }
                  }}/>
                </label>
                <button type="button" onClick={() => setImages(prev => [...prev, { url: '', file: null, is_main: prev.length === 0, isNew: true, type: 'url' }])}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all justify-center shadow-md">
                  <LinkIcon size={14}/> {t('img_by_url')}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3 : VARIANTES */}
          <div className="bg-gray-50 dark:bg-white/5 p-6 md:p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-xs font-black uppercase tracking-widest text-dakora-green flex items-center gap-2">
                  <Layers size={16}/> {t('variant_title')} <span className="text-red-500">★</span>
                </h4>
                <p className="text-[9px] text-gray-400 font-bold mt-1">Au moins une variante obligatoire</p>
              </div>
              <button type="button"
                onClick={() => setVariants(prev => [...prev, { label_fr: '', label_en: '', price: '', stock_quantity: 0 }])}
                className="text-[10px] font-black uppercase bg-dakora-green text-white px-4 py-2 rounded-full hover:bg-green-700 transition-all">
                {t('variant_add_line')}
              </button>
            </div>

            {/* En-têtes desktop */}
            <div className="hidden lg:grid grid-cols-4 gap-4 px-1 mb-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <div>{t('variant_name_fr')} <span className="text-red-500">★</span></div>
              <div>{t('variant_name_en')}</div>
              <div>{t('variant_price')} <span className="text-red-500">★</span></div>
              <div>{t('variant_stock_qty')}</div>
            </div>

            <div className="space-y-4">
              {variants.map((v, i) => (
                <VariantRow
                  key={i} v={v} i={i} t={t}
                  onChange={handleVariantChange}
                  onRemove={(idx) => setVariants(variants.filter((_, ii) => ii !== idx))}
                  touched={variantsTouched}
                />
              ))}
            </div>

            {variants.length === 0 && variantsTouched && (
              <p className="text-center text-sm text-red-500 font-bold mt-4 flex items-center justify-center gap-2">
                <AlertCircle size={16}/> Ajoutez au moins une variante
              </p>
            )}
          </div>
        </form>

        {/* FOOTER */}
        <div className="p-6 md:p-8 border-t border-black/5 dark:border-white/5 flex gap-4 bg-white/80 dark:bg-black/20 backdrop-blur-md">
          <button type="button" onClick={onClose}
            className="flex-1 py-4 rounded-2xl font-bold uppercase text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">
            {t('btn_cancel')}
          </button>
          <button onClick={handleSave} disabled={loading}
            className="flex-[2] py-4 bg-dakora-green text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
            {loading
              ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"/>
              : <><CheckCircle2 size={18}/> {t('btn_save_material')}</>
            }
          </button>
        </div>

        <style>{`
          .custom-scrollbar::-webkit-scrollbar { width: 4px; }
          .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 10px; }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }
        `}</style>
      </div>
    </div>
  );
};

export default ProductForm;
