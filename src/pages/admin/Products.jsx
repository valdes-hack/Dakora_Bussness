import { useState, useEffect } from 'react';
import { supabase } from '../../api/supabaseClient';
import { useLanguage } from '../../context/LanguageContext';
import { useDataCache } from '../../context/DataCacheContext';
import { Plus, Pencil, Trash2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import ProductForm from './ProductForm';

const Products = () => {
  const { t, language } = useLanguage();
  const { invalidateCache } = useDataCache();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

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

  // --- NOUVELLE FONCTION POUR LE BOUTON D'ACTIVATION ---
  const toggleActive = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('products')
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      // Mise à jour locale pour que ce soit instantané visuellement
      setProducts(products.map(p => p.id === id ? { ...p, is_active: !currentStatus } : p));
      // Invalider le cache global pour mettre à jour la boutique
      invalidateCache();
    } catch (err) {
      alert("Erreur activation: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm(t('msg_confirm_del'))) {
      try {
        await supabase.from('products').delete().eq('id', id);
        // Mise à jour locale optimiste
        setProducts(products.filter(p => p.id !== id));
        // Invalider le cache global
        invalidateCache();
      } catch (err) {
        alert("Erreur suppression: " + err.message);
        fetchData(); // Recharger en cas d'erreur
      }
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* HEADER DE PAGE */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white uppercase italic tracking-tighter leading-none">
            {t('prod_title')?.split(' ')[0]} <span className="text-dakora-green">{t('prod_title')?.split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-gray-500 font-medium mt-2">{t('prod_subtitle')}</p>
        </div>
        <button 
          onClick={() => { setEditProduct(null); setShowForm(true); }}
          className="group relative px-8 py-4 bg-dakora-green text-white rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-2xl hover:bg-green-700 transition-all flex items-center gap-3 overflow-hidden active:scale-95"
        >
          <Plus size={20} className="relative z-10"/> 
          <span className="relative z-10">{t('prod_add')}</span>
        </button>
      </div>

      {/* GRILLE DE PRODUITS */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(n => <div key={n} className="h-80 rounded-[3rem] bg-white/40 dark:bg-white/5 animate-pulse border border-white/20"/>)}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-20 bg-white/40 dark:bg-white/5 rounded-[3rem] border border-dashed border-gray-300 dark:border-white/10">
          <AlertCircle size={48} className="text-gray-300 mb-4"/>
          <p className="text-gray-400 italic font-bold">{t('prod_empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(prod => (
            <div 
              key={prod.id} 
              className={`group relative bg-white/70 dark:bg-neutral-900/80 backdrop-blur-xl rounded-[3rem] p-8 border border-white/20 shadow-xl transition-all duration-500 flex flex-col justify-between ${!prod.is_active ? 'opacity-70 grayscale-[0.5]' : ''}`}
            >
              
              <div>
                {/* IMAGE & BADGE & TOGGLE */}
                <div className="relative h-48 mb-6 rounded-[2rem] overflow-hidden bg-gray-100 dark:bg-black/40 border border-black/5 shadow-inner">
                  <img 
                    src={prod.product_images?.[0]?.url || 'https://via.placeholder.com/400'} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" 
                    alt=""
                  />
                  
                  {/* Badge en haut à gauche */}
                  {prod.badge && (
                    <div className="absolute top-4 left-4 px-4 py-1.5 bg-dakora-yellow text-yellow-900 text-[10px] font-black uppercase rounded-full shadow-lg">
                      {prod.badge}
                    </div>
                  )}

                  {/* Bouton d'activation rapide en haut à droite */}
                  <button 
                    onClick={() => toggleActive(prod.id, prod.is_active)}
                    className={`absolute top-4 right-4 p-3 rounded-2xl backdrop-blur-md transition-all shadow-lg ${prod.is_active ? 'bg-green-500/80 text-white' : 'bg-gray-500/80 text-white'}`}
                    title={prod.is_active ? "Désactiver" : "Activer"}
                  >
                    {prod.is_active ? <Eye size={18}/> : <EyeOff size={18}/>}
                  </button>
                </div>

                {/* TEXTES */}
                <span className="text-[10px] font-black text-dakora-green uppercase tracking-[0.2em]">
                  {language === 'fr' ? prod.categories?.name_fr : prod.categories?.name_en}
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1 leading-tight">{language === 'fr' ? prod.name_fr : prod.name_en}</h3>
                
                {/* Indicateur de statut avec Switch Apple */}
                <div className="flex items-center justify-between mt-4">
                   <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                     {prod.is_active ? t('prod_active') : t('prod_hidden')}
                   </span>
                   <button 
                      onClick={() => toggleActive(prod.id, prod.is_active)}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-300 focus:outline-none ${prod.is_active ? 'bg-dakora-green' : 'bg-gray-300 dark:bg-gray-700'}`}
                   >
                      <div className={`absolute top-0.5 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 ${prod.is_active ? 'translate-x-4' : 'translate-x-0'}`} />
                   </button>
                </div>
              </div>

              {/* FOOTER DE CARTE : ACTIONS & PRIX */}
              <div className="mt-8 flex items-center justify-between pt-6 border-t border-black/5 dark:border-white/5">
                <div>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">{t('variant_price')}</p>
                  <p className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">
                    {prod.variants?.[0]?.price?.toLocaleString() || '---'} <span className="text-xs text-dakora-green">FCFA</span>
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => { setEditProduct(prod); setShowForm(true); }}
                    className="p-4 bg-dakora-green/10 text-dakora-green rounded-2xl hover:bg-dakora-green hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <Pencil size={18}/>
                  </button>
                  <button 
                    onClick={() => handleDelete(prod.id)}
                    className="p-4 bg-red-500/10 text-red-500 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <Trash2 size={18}/>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* FORMULAIRE OVERLAY */}
      {showForm && (
        <ProductForm 
          product={editProduct} 
          categories={categories} 
          onClose={() => setShowForm(false)} 
          onSave={() => { setShowForm(false); }} 
          invalidateCache={invalidateCache}
        />
      )}
    </div>
  );
};

export default Products;