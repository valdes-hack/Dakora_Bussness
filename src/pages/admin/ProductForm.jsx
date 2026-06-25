import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { X, Trash2, Layers, Image as ImageIcon, CheckCircle2, UploadCloud, Link as LinkIcon, Star } from 'lucide-react';

const ProductForm = ({ product, categories, onClose, onSave }) => {
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [variants, setVariants] = useState([{ label_fr: '', label_en: '', price: '', stock_quantity: 0 }]);

  // ÉTAT STRICTEMENT ALIGNÉ SUR TA BD
  const [formData, setFormData] = useState({
    id: null,
    category_id: '',
    name_fr: '',
    name_en: '',
    description_fr: '',
    description_en: '',
    badge: '',
    is_active: true,
    order_index: 0
  });

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
      setVariants(product.variants?.length > 0 ? product.variants : [{ label_fr: '', label_en: '', price: '', stock_quantity: 0 }]);
      if (product.product_images) {
        setImages(product.product_images.map(img => ({ ...img, isNew: false, type: 'url' })));
      }
    }
  }, [product]);

  // --- GESTION DE LA GALERIE ---
  const handleFileChange = (index, file) => {
    const newImages = [...images];
    newImages[index].file = file;
    newImages[index].url = URL.createObjectURL(file);
    setImages(newImages);
  };

  // --- LOGIQUE D'UPLOAD STORAGE ---
  const uploadToStorage = async (productId, file) => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${productId}/${Math.random()}.${fileExt}`;
    const { data, error } = await supabase.storage.from('products').upload(fileName, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  // --- SAUVEGARDE GLOBALE ---
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let productId = formData.id;

      // 1. Sauvegarde Produit (Respect strict des champs)
      const productPayload = {
        category_id: formData.category_id,
        name_fr: formData.name_fr,
        name_en: formData.name_en,
        description_fr: formData.description_fr,
        description_en: formData.description_en,
        badge: formData.badge,
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

      // 2. Gestion des Images
      await supabase.from('product_images').delete().eq('product_id', productId);
      const finalImages = await Promise.all(images.map(async (img) => {
        let finalUrl = img.url;
        if (img.file) finalUrl = await uploadToStorage(productId, img.file);
        return { product_id: productId, url: finalUrl, is_main: img.is_main };
      }));
      if (finalImages.length > 0) await supabase.from('product_images').insert(finalImages);

      // 3. Gestion des Variantes
      await supabase.from('variants').delete().eq('product_id', productId);
      await supabase.from('variants').insert(variants.map(v => ({
        product_id: productId,
        label_fr: v.label_fr,
        label_en: v.label_en,
        price: v.price,
        stock_quantity: v.stock_quantity
      })));

      onSave();
    } catch (err) {
      alert("Erreur: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 md:p-6 bg-black/80 backdrop-blur-md">
      <div className="bg-white dark:bg-neutral-900 w-full max-w-5xl h-full md:h-auto md:max-h-[95vh] md:rounded-[3rem] shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in zoom-in duration-300">
        
        {/* HEADER FIXE */}
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/50 dark:bg-black/20">
          <h2 className="text-2xl font-black uppercase italic dark:text-white">
            {formData.id ? 'Modifier' : 'Ajouter'} <span className="text-dakora-green">Produit</span>
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full dark:text-white"><X /></button>
        </div>

        <form onSubmit={handleSave} className="flex-grow overflow-y-auto p-6 md:p-10 space-y-10 custom-scrollbar">
          
          {/* SECTION 1 : INFORMATIONS DE BASE */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nom du produit (FR) *</label>
              <input type="text" value={formData.name_fr} onChange={e => setFormData({...formData, name_fr: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-dakora-green dark:text-white font-bold" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nom du produit (EN)</label>
              <input type="text" value={formData.name_en} onChange={e => setFormData({...formData, name_en: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-dakora-green dark:text-white font-bold" />
            </div>
            
            {/* CHAMPS DESCRIPTION AJOUTÉS ICI */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Description (FR)</label>
              <textarea value={formData.description_fr} onChange={e => setFormData({...formData, description_fr: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-dakora-green dark:text-white min-h-[100px]" placeholder="Détails techniques, usage..." />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Description (EN)</label>
              <textarea value={formData.description_en} onChange={e => setFormData({...formData, description_en: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-dakora-green dark:text-white min-h-[100px]" placeholder="Technical details, usage..." />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Catégorie *</label>
              <select value={formData.category_id} onChange={e => setFormData({...formData, category_id: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-dakora-green dark:text-white font-bold" required>
                <option value="">Sélectionner</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name_fr}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Badge (Promo, Nouveau...)</label>
              <input type="text" value={formData.badge} onChange={e => setFormData({...formData, badge: e.target.value})} className="w-full px-6 py-4 rounded-2xl bg-gray-50 dark:bg-white/5 border-none focus:ring-2 focus:ring-dakora-green dark:text-white font-bold" />
            </div>
          </div>

          {/* SECTION 2 : GALERIE (UPLOAD & URL) */}
          <div className="space-y-4">
            <label className="text-xs font-black uppercase tracking-widest text-dakora-green flex items-center gap-2">
              <ImageIcon size={16}/> Galerie Photos
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">

              {/* CARTES DES IMAGES EXISTANTES */}
              {images.map((img, index) => (
                <div key={index} className={`relative rounded-3xl border-2 overflow-hidden transition-all bg-gray-50 dark:bg-white/5 ${img.is_main ? 'border-dakora-green ring-4 ring-dakora-green/20' : 'border-gray-200 dark:border-white/10'}`}>
                  
                  {/* PREVIEW */}
                  <div className="aspect-square">
                    {img.url
                      ? <img src={img.url} className="w-full h-full object-cover" alt=""/>
                      : <div className="w-full h-full flex items-center justify-center text-gray-300 italic text-[10px]">Vide</div>
                    }
                  </div>

                  {/* CHAMP URL si type url */}
                  {img.type === 'url' && (
                    <div className="p-2 border-t border-gray-100 dark:border-white/5">
                      <input
                        type="text"
                        value={img.url}
                        onChange={e => { const ni = [...images]; ni[index].url = e.target.value; setImages(ni); }}
                        className="w-full text-[10px] px-2 py-1.5 rounded-lg bg-gray-100 dark:bg-white/10 dark:text-white border-none"
                        placeholder="Coller l'URL ici..."
                      />
                    </div>
                  )}

                  {/* BOUTON CHOISIR FICHIER si type file */}
                  {img.type === 'file' && (
                    <div className="p-2 border-t border-gray-100 dark:border-white/5">
                      <label className="flex items-center justify-center gap-1 w-full px-3 py-2 bg-dakora-green/10 text-dakora-green rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-dakora-green hover:text-white transition-all">
                        <UploadCloud size={13}/>
                        {img.file ? 'Changer' : 'Choisir'}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => e.target.files[0] && handleFileChange(index, e.target.files[0])}
                        />
                      </label>
                    </div>
                  )}

                  {/* ACTIONS : principale + supprimer */}
                  <div className="p-2 flex items-center justify-between gap-1">
                    <button
                      type="button"
                      onClick={() => setImages(images.map((im, i) => ({ ...im, is_main: i === index })))}
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${img.is_main ? 'bg-dakora-green text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400 hover:bg-dakora-green/20'}`}
                    >
                      <Star size={10}/> {img.is_main ? 'Principale' : 'Définir'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, i) => i !== index))}
                      className="p-1.5 bg-red-100 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                    >
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              ))}

              {/* ZONE D'AJOUT : 2 boutons visibles */}
              <div className="aspect-square rounded-3xl border-2 border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center gap-3 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase text-center">Ajouter une photo</p>
                
                {/* Bouton upload fichier local */}
                <label className="flex items-center gap-2 w-full px-4 py-2.5 bg-dakora-green text-white rounded-2xl text-[10px] font-black uppercase cursor-pointer hover:bg-green-700 transition-all justify-center shadow-md">
                  <UploadCloud size={14}/>
                  Depuis l'ordi
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files[0]) {
                        const file = e.target.files[0];
                        setImages(prev => [...prev, {
                          url: URL.createObjectURL(file),
                          file,
                          is_main: prev.length === 0,
                          isNew: true,
                          type: 'file'
                        }]);
                      }
                    }}
                  />
                </label>

                {/* Bouton ajouter par URL */}
                <button
                  type="button"
                  onClick={() => setImages(prev => [...prev, { url: '', file: null, is_main: prev.length === 0, isNew: true, type: 'url' }])}
                  className="flex items-center gap-2 w-full px-4 py-2.5 bg-blue-500 text-white rounded-2xl text-[10px] font-black uppercase hover:bg-blue-600 transition-all justify-center shadow-md"
                >
                  <LinkIcon size={14}/>
                  Par URL
                </button>
              </div>

            </div>
          </div>

          {/* SECTION 3 : VARIANTES AVEC LABELS STATIQUES */}
          <div className="bg-gray-50 dark:bg-white/5 p-6 md:p-8 rounded-[2.5rem] border border-black/5 dark:border-white/5">
            <div className="flex justify-between items-center mb-6">
              <h4 className="text-xs font-black uppercase tracking-widest text-dakora-green flex items-center gap-2"><Layers size={16}/> Variantes & Prix</h4>
              <button type="button" onClick={() => setVariants([...variants, {label_fr:'', label_en:'', price:'', stock_quantity:0}])} className="text-[10px] font-black uppercase bg-dakora-green text-white px-4 py-2 rounded-full">+ Ajouter une ligne</button>
            </div>
            
            {/* EN-TÊTE STATIQUE DES VARIANTES */}
            <div className="hidden lg:grid grid-cols-4 gap-4 px-4 mb-2 text-[10px] font-black uppercase text-gray-400 tracking-widest">
              <div>Nom / Puissance (FR)</div>
              <div>Nom / Puissance (EN)</div>
              <div>Prix (FCFA)</div>
              <div>Quantité Stock</div>
            </div>

            <div className="space-y-3">
              {variants.map((v, i) => (
                <div key={i} className="bg-white dark:bg-neutral-800 p-4 rounded-2xl flex flex-col lg:grid lg:grid-cols-4 gap-4 items-center shadow-sm border border-black/5">
                  <div className="w-full">
                    <label className="lg:hidden text-[9px] font-bold text-gray-400 uppercase ml-1">Nom (FR)</label>
                    <input type="text" value={v.label_fr} onChange={e => {const nv=[...variants]; nv[i].label_fr=e.target.value; setVariants(nv);}} className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border-none text-xs dark:text-white" required />
                  </div>
                  <div className="w-full">
                    <label className="lg:hidden text-[9px] font-bold text-gray-400 uppercase ml-1">Nom (EN)</label>
                    <input type="text" value={v.label_en} onChange={e => {const nv=[...variants]; nv[i].label_en=e.target.value; setVariants(nv);}} className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border-none text-xs dark:text-white" />
                  </div>
                  <div className="w-full">
                    <label className="lg:hidden text-[9px] font-bold text-gray-400 uppercase ml-1">Prix</label>
                    <input type="number" value={v.price} onChange={e => {const nv=[...variants]; nv[i].price=e.target.value; setVariants(nv);}} className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border-none text-xs font-black text-dakora-green" required />
                  </div>
                  <div className="w-full flex items-center gap-2">
                    <div className="flex-grow">
                      <label className="lg:hidden text-[9px] font-bold text-gray-400 uppercase ml-1">Stock</label>
                      <input type="number" value={v.stock_quantity} onChange={e => {const nv=[...variants]; nv[i].stock_quantity=e.target.value; setVariants(nv);}} className="w-full px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border-none text-xs dark:text-white" />
                    </div>
                    <button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="mt-4 lg:mt-0 p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* FOOTER FIXE */}
        <div className="p-6 md:p-8 border-t border-black/5 dark:border-white/5 flex gap-4 bg-white/80 dark:bg-black/20 backdrop-blur-md">
          <button type="button" onClick={onClose} className="flex-1 py-4 rounded-2xl font-bold uppercase text-xs text-gray-400 hover:bg-gray-100 transition-all">Annuler</button>
          <button onClick={handleSave} disabled={loading} className="flex-[2] py-4 bg-dakora-green text-white rounded-2xl font-black uppercase text-xs shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3">
            {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle2 size={18}/> Enregistrer le matériel</>}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;