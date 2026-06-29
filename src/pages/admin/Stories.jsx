import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useSettings } from '../../context/SettingsContext';
import { useDataCache } from '../../context/DataCacheContext';
import { createNotification } from '../../utils/notify';
import {
  Plus, Trash2, Eye, EyeOff, Share2, Upload, Link as LinkIcon,
  CheckCircle2, Loader2, Calendar, X, Package, ImageIcon, ChevronRight
} from 'lucide-react';

// ─── PANNEAU DE PARTAGE ───────────────────────────────────────────────────────
const SharePanel = ({ story, onClose, whatsappNumber, onShare }) => {
  const storyUrl = story.redirect_link
    ? `${window.location.origin}${story.redirect_link}`
    : window.location.origin;
  const title = story.title_fr || 'Dakora Business';
  const [copied, setCopied] = useState(false);

  const copyLink = () => {
    navigator.clipboard.writeText(storyUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareOptions = [
    {
      name: 'WhatsApp',
      bg: 'bg-[#25D366]/10 hover:bg-[#25D366] hover:text-white', text: 'text-[#25D366]',
      auto: false, hint: 'Copie le lien + ouvre WhatsApp. Collez dans votre statut manuellement.',
      action: () => { copyLink(); window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`${title} — ${storyUrl}`)}`, '_blank'); onShare?.('WhatsApp'); },
      icon: <svg viewBox="0 0 32 32" className="w-5 h-5 fill-current"><path d="M16.004 2C8.28 2 2 8.28 2 16.004c0 2.46.643 4.867 1.864 6.99L2 30l7.228-1.895A13.94 13.94 0 0016.004 30C23.72 30 30 23.72 30 16.004 30 8.28 23.72 2 16.004 2zm6.27 19.878c-.343-.172-2.034-1.003-2.348-1.118-.314-.115-.544-.172-.773.172-.229.344-.887 1.118-1.088 1.348-.2.23-.4.258-.743.086-.344-.172-1.452-.535-2.766-1.708-1.022-.913-1.713-2.04-1.913-2.383-.2-.344-.022-.53.15-.7.155-.154.344-.402.516-.603.172-.2.229-.344.344-.573.115-.23.057-.43-.029-.602-.086-.173-.773-1.862-1.059-2.551-.279-.67-.562-.579-.773-.59l-.657-.011a1.261 1.261 0 00-.916.43c-.314.343-1.203 1.175-1.203 2.866s1.23 3.322 1.402 3.552c.172.23 2.42 3.695 5.866 5.183.82.354 1.46.566 1.96.724.824.261 1.573.224 2.165.136.66-.099 2.034-.831 2.32-1.634.286-.802.286-1.49.2-1.634-.085-.143-.314-.229-.657-.4z"/></svg>
    },
    {
      name: 'Facebook',
      bg: 'bg-[#1877F2]/10 hover:bg-[#1877F2] hover:text-white', text: 'text-[#1877F2]',
      auto: true, hint: 'Partage direct via le dialogue Facebook.',
      action: () => { window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(storyUrl)}&quote=${encodeURIComponent(title)}`, '_blank', 'width=600,height=400'); onShare?.('Facebook'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.41c0-3.025 1.792-4.697 4.533-4.697 1.312 0 2.686.236 2.686.236v2.97h-1.514c-1.491 0-1.956.93-1.956 1.886v2.267h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"/></svg>
    },
    {
      name: 'Telegram',
      bg: 'bg-[#0088CC]/10 hover:bg-[#0088CC] hover:text-white', text: 'text-[#0088CC]',
      auto: true, hint: 'Partage direct via Telegram.',
      action: () => { window.open(`https://t.me/share/url?url=${encodeURIComponent(storyUrl)}&text=${encodeURIComponent(title)}`, '_blank'); onShare?.('Telegram'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
    },
    {
      name: 'TikTok',
      bg: 'bg-black/10 hover:bg-black hover:text-white dark:bg-white/10 dark:hover:bg-white dark:hover:text-black', text: 'text-black dark:text-white',
      auto: false, hint: 'Copie le lien. Collez-le en bio ou description TikTok manuellement.',
      action: () => { copyLink(); window.open('https://www.tiktok.com/', '_blank'); onShare?.('TikTok'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.76a4.85 4.85 0 0 1-1.01-.07z"/></svg>
    },
    {
      name: 'Instagram',
      bg: 'bg-[#E1306C]/10 hover:bg-[#E1306C] hover:text-white', text: 'text-[#E1306C]',
      auto: false, hint: 'Copie le lien. Collez-le dans votre bio Instagram manuellement.',
      action: () => { copyLink(); window.open('https://www.instagram.com/', '_blank'); onShare?.('Instagram'); },
      icon: <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
    }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
        <div className="flex items-center justify-between p-6 border-b border-black/5 dark:border-white/10">
          <div className="flex items-center gap-3">
            {story.media_url && <img src={story.media_url} alt="" className="w-12 h-12 rounded-2xl object-cover" />}
            <div>
              <h3 className="font-black text-gray-900 dark:text-white text-sm uppercase tracking-tight">{title}</h3>
              <p className="text-[10px] text-gray-400 font-bold truncate max-w-[180px]">{storyUrl}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-all"><X size={18}/></button>
        </div>
        <div className="px-6 pt-4 pb-2">
          <button onClick={copyLink} className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl border-2 text-xs font-black uppercase tracking-widest transition-all ${copied ? 'border-dakora-green bg-dakora-green/5 text-dakora-green' : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:border-dakora-green'}`}>
            {copied ? <CheckCircle2 size={16}/> : <LinkIcon size={16}/>}
            {copied ? 'Lien copié !' : 'Copier le lien'}
          </button>
        </div>
        <div className="p-6 space-y-2.5">
          {shareOptions.map(opt => (
            <button key={opt.name} onClick={opt.action} className={`w-full flex items-center gap-4 px-5 py-3.5 rounded-2xl transition-all ${opt.bg} ${opt.text}`}>
              <span className="flex-shrink-0">{opt.icon}</span>
              <div className="text-left flex-grow">
                <p className="font-black text-sm">{opt.name}</p>
                <p className="text-[10px] opacity-70 font-medium">{opt.hint}</p>
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

// ─── ÉTAPE 1 : SÉLECTION DU PRODUIT ──────────────────────────────────────────
const ProductPicker = ({ products, language, onSelect, onCancel }) => {
  const [search, setSearch] = useState('');
  const filtered = products.filter(p => {
    const name = (language === 'fr' ? p.name_fr : p.name_en) || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-black text-gray-900 dark:text-white text-base uppercase tracking-tight">
          Choisir un produit
        </h3>
        <button onClick={onCancel} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all">
          <X size={18}/>
        </button>
      </div>
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Rechercher un produit..."
        className="w-full px-4 py-3 rounded-2xl bg-gray-100 dark:bg-neutral-800 border-none focus:ring-2 focus:ring-dakora-green text-sm font-medium dark:text-white outline-none"
        autoFocus
      />
      <div className="max-h-72 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {filtered.length === 0 ? (
          <p className="text-center py-8 text-gray-400 italic text-sm">Aucun produit trouvé</p>
        ) : (
          filtered.map(p => {
            const name = language === 'fr' ? p.name_fr : p.name_en;
            const imgUrl = p.product_images?.[0]?.url;
            const minPrice = p.variants?.length ? Math.min(...p.variants.map(v => Number(v.price))) : 0;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-dakora-green/5 border border-transparent hover:border-dakora-green/20 transition-all text-left group"
              >
                {imgUrl ? (
                  <img src={imgUrl} alt={name} className="w-14 h-14 rounded-xl object-cover flex-shrink-0 border border-black/5" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gray-100 dark:bg-neutral-700 flex items-center justify-center text-2xl flex-shrink-0">📦</div>
                )}
                <div className="flex-grow min-w-0">
                  <p className="font-black text-gray-900 dark:text-white text-sm truncate">{name}</p>
                  <p className="text-[10px] text-dakora-green font-bold">{minPrice.toLocaleString()} FCFA</p>
                  <p className="text-[10px] text-gray-400 truncate mt-0.5">{language === 'fr' ? p.categories?.name_fr : p.categories?.name_en}</p>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-dakora-green transition-colors flex-shrink-0" />
              </button>
            );
          })
        )}
      </div>
      <style>{`.custom-scrollbar::-webkit-scrollbar{width:3px}.custom-scrollbar::-webkit-scrollbar-thumb{background:rgba(0,0,0,.08);border-radius:10px}`}</style>
    </div>
  );
};

// ─── FORMULAIRE STORY (manuel OU depuis produit) ──────────────────────────────
const StoryForm = ({ onClose, onPublished, language }) => {
  // 'pick' = choix du mode, 'product-list' = liste produits, 'edit' = formulaire
  const [step, setStep] = useState('pick');
  const { products } = useDataCache();
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    title_fr: '', title_en: '', redirect_link: '',
    expires_at: '', media_url: '', media_file: null, preview: null
  });

  // Compression image < 300 Ko
  const compressImage = (file) => new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ratio = Math.min(1280 / img.width, 1);
        canvas.width = img.width * ratio;
        canvas.height = img.height * ratio;
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(blob => resolve(blob), 'image/jpeg', 0.75);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  const handleFileSelect = async (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const compressed = await compressImage(file);
    setForm(f => ({ ...f, media_file: compressed, preview: URL.createObjectURL(compressed), media_url: '' }));
  };

  // Préremplissage depuis un produit sélectionné
  const handleProductSelect = (product) => {
    const name = language === 'fr' ? product.name_fr : product.name_en;
    const desc = language === 'fr' ? product.description_fr : product.description_en;
    const imgUrl = product.product_images?.[0]?.url || '';
    const minPrice = product.variants?.length ? Math.min(...product.variants.map(v => Number(v.price))) : 0;
    setForm({
      title_fr: product.name_fr || '',
      title_en: product.name_en || '',
      redirect_link: `/produit/${product.id}`,
      expires_at: '',
      media_url: imgUrl,
      media_file: null,
      preview: null,
      // garde la description en mémoire pour l'afficher
      _desc: desc || `${name} — à partir de ${minPrice.toLocaleString()} FCFA`
    });
    setStep('edit');
  };

  const handlePublish = async () => {
    if (!form.title_fr.trim()) { alert('Le titre FR est obligatoire'); return; }
    if (!form.media_url && !form.media_file) { alert('Ajoutez une image ou une URL'); return; }
    setUploading(true);
    try {
      let mediaUrl = form.media_url;
      if (form.media_file) {
        const fileName = `banners/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage.from('products').upload(fileName, form.media_file, { upsert: false });
        if (upErr) throw upErr;
        const { data: urlData } = supabase.storage.from('products').getPublicUrl(fileName);
        mediaUrl = urlData.publicUrl;
      }
      const { error } = await supabase.from('stories').insert([{
        title_fr: form.title_fr, title_en: form.title_en || null,
        media_url: mediaUrl, redirect_link: form.redirect_link || null,
        expires_at: form.expires_at || null, is_active: true
      }]);
      if (error) throw error;
      onPublished();
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white/60 dark:bg-white/5 backdrop-blur-xl rounded-[3rem] p-8 border border-white/20 shadow-2xl animate-in slide-in-from-top-4 duration-300">

      {/* ÉTAPE 1 : CHOISIR LE MODE */}
      {step === 'pick' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-gray-900 dark:text-white text-xl uppercase tracking-tight">Nouvelle Story</h3>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"><X size={18}/></button>
          </div>
          <p className="text-sm text-gray-500">Comment souhaitez-vous créer cette story ?</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Depuis un produit */}
            <button
              onClick={() => setStep('product-list')}
              className="group flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 border-dakora-green/20 hover:border-dakora-green bg-dakora-green/5 hover:bg-dakora-green/10 transition-all"
            >
              <div className="w-14 h-14 bg-dakora-green/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Package size={28} className="text-dakora-green" />
              </div>
              <div className="text-center">
                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Depuis un produit</p>
                <p className="text-[11px] text-gray-400 mt-1">Choisir un produit existant du catalogue — nom, image et lien préremplis</p>
              </div>
            </button>
            {/* Story libre */}
            <button
              onClick={() => setStep('edit')}
              className="group flex flex-col items-center gap-4 p-8 rounded-[2rem] border-2 border-gray-200 dark:border-white/10 hover:border-dakora-green bg-white/50 dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
            >
              <div className="w-14 h-14 bg-gray-100 dark:bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <ImageIcon size={28} className="text-gray-500 dark:text-gray-300" />
              </div>
              <div className="text-center">
                <p className="font-black text-gray-900 dark:text-white uppercase tracking-tight">Story libre</p>
                <p className="text-[11px] text-gray-400 mt-1">Uploader une image ou URL personnalisée, remplir les champs manuellement</p>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ÉTAPE 2 : LISTE DES PRODUITS */}
      {step === 'product-list' && (
        <ProductPicker
          products={products}
          language={language}
          onSelect={handleProductSelect}
          onCancel={() => setStep('pick')}
        />
      )}

      {/* ÉTAPE 3 : FORMULAIRE D'ÉDITION */}
      {step === 'edit' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep('pick')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all">
                <ChevronRight size={18} className="rotate-180"/>
              </button>
              <h3 className="font-black text-gray-900 dark:text-white uppercase tracking-tight text-base">
                {form.title_fr ? `Story : ${form.title_fr}` : 'Configurer la Story'}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400"><X size={18}/></button>
          </div>

          {/* Bannière info si prérempli depuis un produit */}
          {form._desc && (
            <div className="flex items-start gap-3 p-4 bg-dakora-green/5 border border-dakora-green/20 rounded-2xl">
              <Package size={16} className="text-dakora-green mt-0.5 flex-shrink-0"/>
              <div>
                <p className="text-[10px] font-black uppercase text-dakora-green tracking-widest mb-0.5">Prérempli depuis le catalogue</p>
                <p className="text-xs text-gray-500">{form._desc}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Zone image */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); handleFileSelect(e.dataTransfer.files[0]); }}
              className={`relative aspect-video rounded-[2rem] overflow-hidden border-2 border-dashed transition-all ${dragOver ? 'border-dakora-green bg-dakora-green/5' : 'border-gray-200 dark:border-white/10'}`}
            >
              {(form.preview || form.media_url) ? (
                <div className="relative w-full h-full">
                  <img src={form.preview || form.media_url} alt="preview" className="w-full h-full object-cover" onError={e => { e.target.style.display='none'; }} />
                  <button onClick={() => setForm(f => ({ ...f, media_file: null, preview: null, media_url: '' }))} className="absolute top-3 right-3 p-1.5 bg-black/60 rounded-full text-white hover:bg-black"><X size={14}/></button>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-gray-400 cursor-pointer" onClick={() => fileRef.current?.click()}>
                  <Upload size={28}/>
                  <p className="text-[10px] font-bold uppercase text-center px-4">Glisser-déposer ou cliquer<br/><span className="text-dakora-green">Compression auto &lt; 300 Ko</span></p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => handleFileSelect(e.target.files[0])} />
            </div>

            {/* Champs texte */}
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Titre FR *</label>
                <input type="text" value={form.title_fr} onChange={e => setForm(f => ({ ...f, title_fr: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm font-bold dark:text-white" placeholder="ex: Promotion spéciale" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Titre EN</label>
                <input type="text" value={form.title_en} onChange={e => setForm(f => ({ ...f, title_en: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm font-bold dark:text-white" placeholder="ex: Special offer" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 flex items-center gap-1"><LinkIcon size={10}/> Lien de redirection</label>
                <input type="text" value={form.redirect_link} onChange={e => setForm(f => ({ ...f, redirect_link: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm font-bold dark:text-white" placeholder="/boutique ou /produit/..." />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2 flex items-center gap-1"><Calendar size={10}/> Expiration (optionnel)</label>
                <input type="datetime-local" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm font-bold dark:text-white" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-gray-400 ml-2">Ou URL image externe</label>
                <input type="url" value={form.media_url} onChange={e => setForm(f => ({ ...f, media_url: e.target.value, media_file: null, preview: null }))} className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-neutral-900 border-none focus:ring-2 focus:ring-dakora-green text-sm dark:text-white" placeholder="https://..." />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-black/5 dark:border-white/5">
            <button onClick={onClose} className="px-6 py-3 rounded-2xl font-black uppercase text-xs text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-all">Annuler</button>
            <button onClick={handlePublish} disabled={uploading} className="flex items-center gap-2 px-8 py-3 bg-dakora-green text-white rounded-2xl font-black uppercase text-xs shadow-lg hover:bg-green-700 transition-all disabled:opacity-50">
              {uploading ? <Loader2 size={16} className="animate-spin"/> : <CheckCircle2 size={16}/>} Publier la Story
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── PAGE PRINCIPALE ──────────────────────────────────────────────────────────
const Stories = () => {
  const { language } = useLanguage();
  const { settings } = useSettings();
  const waNumber = settings.whatsapp_number || '237690000000';

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [shareStory, setShareStory] = useState(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => { fetchStories(); }, []);

  const fetchStories = async () => {
    setLoading(true);
    const { data } = await supabase.from('stories').select('*').order('created_at', { ascending: false });
    setStories(data || []);
    setLoading(false);
  };

  const handlePublished = () => {
    setShowForm(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    fetchStories();
    createNotification('Nouvelle story publiée', 'story', '/admin/stories');
  };

  const toggleActive = async (id, current) => {
    await supabase.from('stories').update({ is_active: !current }).eq('id', id);
    setStories(s => s.map(x => x.id === id ? { ...x, is_active: !current } : x));
    createNotification(`Story ${!current ? 'activée' : 'désactivée'}`, 'story', '/admin/stories');
  };

  const deleteStory = async (id) => {
    if (!window.confirm('Supprimer cette story ?')) return;
    await supabase.from('stories').delete().eq('id', id);
    setStories(s => s.filter(x => x.id !== id));
    createNotification('Story supprimée', 'story', '/admin/stories');
  };

  const getStatus = (story) => {
    if (!story.is_active) return { label: 'Désactivée', color: 'bg-gray-100 text-gray-400 dark:bg-white/5' };
    if (story.expires_at && new Date(story.expires_at) < new Date()) return { label: 'Expirée', color: 'bg-red-100 text-red-500 dark:bg-red-500/10' };
    return { label: 'Active', color: 'bg-dakora-green/10 text-dakora-green' };
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-700">

      {/* HEADER */}
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter">
            {language === 'fr' ? 'Gestion des' : 'Manage'} <span className="text-dakora-green">Stories</span>
          </h1>
          <p className="text-gray-500 font-medium mt-1">
            {language === 'fr' ? 'Publiez vos produits et contenus visuels.' : 'Publish your products and visual content.'}
          </p>
        </div>
        <button
          onClick={() => setShowForm(s => !s)}
          className="flex items-center gap-2 px-6 py-3 bg-dakora-green text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-green-700 transition-all"
        >
          {showForm ? <X size={16}/> : <Plus size={16}/>}
          {showForm ? 'Fermer' : 'Nouvelle Story'}
        </button>
      </div>

      {/* TOAST SUCCÈS */}
      {saved && (
        <div className="flex items-center gap-3 p-4 bg-dakora-green/10 text-dakora-green rounded-2xl border border-dakora-green/20 animate-in slide-in-from-top-2">
          <CheckCircle2 size={18}/> <span className="font-bold text-sm">Story publiée avec succès !</span>
        </div>
      )}

      {/* FORMULAIRE */}
      {showForm && (
        <StoryForm
          language={language}
          onClose={() => setShowForm(false)}
          onPublished={handlePublished}
        />
      )}

      {/* LISTE */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="aspect-video rounded-[2.5rem] bg-gray-100 dark:bg-white/5 animate-pulse"/>)}
        </div>
      ) : stories.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10 text-center">
          <div className="text-5xl mb-4">📸</div>
          <p className="text-gray-400 italic font-bold text-sm">Aucune story. Cliquez sur "Nouvelle Story" pour commencer !</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stories.map(story => {
            const status = getStatus(story);
            const isActive = story.is_active && !(story.expires_at && new Date(story.expires_at) < new Date());
            return (
              <div key={story.id} className={`group relative bg-white/40 dark:bg-white/5 rounded-[2.5rem] overflow-hidden border-2 shadow-xl transition-all ${isActive ? 'border-dakora-green' : 'border-gray-200 dark:border-white/10 opacity-70'}`}>
                <div className="aspect-video relative overflow-hidden bg-gray-100 dark:bg-neutral-800">
                  {story.media_url ? (
                    <img src={story.media_url} loading="lazy" alt={story.title_fr} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl">🖼️</div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-5 gap-1">
                    <p className="text-white font-black text-base leading-tight">{story.title_fr}</p>
                    {story.title_en && <p className="text-white/60 text-xs">{story.title_en}</p>}
                    {story.redirect_link && (
                      <p className="text-dakora-green text-[10px] font-bold flex items-center gap-1">
                        <LinkIcon size={10}/> {story.redirect_link}
                      </p>
                    )}
                  </div>
                  <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase ${status.color}`}>{status.label}</span>
                </div>

                <div className="p-4 flex items-center justify-between gap-2 flex-wrap">
                  <div className="text-[10px] text-gray-400 font-bold flex items-center gap-1">
                    {story.expires_at && <><Calendar size={10}/>{new Date(story.expires_at).toLocaleDateString()}</>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setShareStory(story)} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all text-[10px] font-black uppercase">
                      <Share2 size={12}/> Partager
                    </button>
                    <button onClick={() => toggleActive(story.id, story.is_active)} className={`p-2.5 rounded-xl transition-all ${story.is_active ? 'bg-dakora-green/10 text-dakora-green hover:bg-dakora-green hover:text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:bg-dakora-green hover:text-white'}`}>
                      {story.is_active ? <Eye size={16}/> : <EyeOff size={16}/>}
                    </button>
                    <button onClick={() => deleteStory(story.id)} className="p-2.5 bg-red-50 dark:bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                      <Trash2 size={16}/>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {shareStory && <SharePanel story={shareStory} whatsappNumber={waNumber} onClose={() => setShareStory(null)}
        onShare={(network) => {
          createNotification(`Story partagée sur ${network} : ${shareStory.title_fr}`, 'share', '/admin/stories');
        }}
      />}
    </div>
  );
};

export default Stories;
