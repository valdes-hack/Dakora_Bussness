/**
 * DataCacheContext — Cache global des données Supabase
 *
 * Principe : on charge produits + catégories UNE SEULE FOIS au démarrage
 * de l'app. Toutes les pages lisent depuis ce cache en mémoire → 0ms d'attente.
 * Le cache est invalidé uniquement quand l'admin sauvegarde une modification.
 */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../api/supabaseClient';

const DataCacheContext = createContext({});

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const DataCacheProvider = ({ children }) => {
  const [products, setProducts]     = useState([]);
  const [categories, setCategories] = useState([]);
  const [banners, setBanners]       = useState([]);
  const [ready, setReady]           = useState(false);
  const [error, setError]           = useState(null);
  const lastFetch = useRef(0);
  // On garde les produits dans un ref pour éviter les closures stales
  const productsRef = useRef([]);

  // Synchronise le ref à chaque changement d'état
  useEffect(() => { productsRef.current = products; }, [products]);

  const fetchAll = useCallback(async (force = false) => {
    const now = Date.now();
    // Utilise productsRef.current (toujours à jour) au lieu de products (closure)
    if (!force && now - lastFetch.current < CACHE_TTL && productsRef.current.length > 0) return;

    setError(null);
    try {
      const [
        { data: cats, error: catErr },
        { data: prods, error: prodErr },
        { data: stories, error: storiesErr }
      ] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name_fr, name_en, icon_url, slug, order_index')
          .order('order_index'),

        supabase
          .from('products')
          .select(`
            id, name_fr, name_en, badge, category_id, is_active, order_index,
            description_fr, description_en,
            categories(id, name_fr, name_en),
            variants(id, label_fr, label_en, price, old_price, stock_quantity),
            product_images(id, url, is_main, order_index)
          `)
          .eq('is_active', true)
          .order('order_index')
          .order('created_at', { ascending: false }),

        supabase
          .from('stories')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false })
      ]);

      if (catErr) throw catErr;
      if (prodErr) throw prodErr;
      if (storiesErr) throw storiesErr;

      if (cats)  setCategories(cats);
      if (stories) setBanners(stories);
      if (prods) {
        // Trier les images de chaque produit (principale en tête)
        const sorted = prods.map(p => ({
          ...p,
          product_images: [...(p.product_images || [])].sort((a, b) => {
            if (a.is_main) return -1;
            if (b.is_main) return 1;
            return (a.order_index ?? 99) - (b.order_index ?? 99);
          })
        }));
        setProducts(sorted);
      }
      lastFetch.current = Date.now();
    } catch (err) {
      console.error("DataCache fetch error:", err);
      setError(err.message || String(err));
    } finally {
      setReady(true);
    }
  }, []); // ← plus de dépendance sur products.length → pas de closure stale

  // Chargement initial
  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Précharger les images en arrière-plan
  useEffect(() => {
    if (!products.length) return;
    products.forEach(p => {
      const url = p.product_images?.[0]?.url;
      if (url) {
        const img = new Image();
        img.src = url;
      }
    });
  }, [products]);

  /** Appelé après une sauvegarde/suppression admin pour invalider le cache */
  const invalidateCache = useCallback(() => {
    lastFetch.current = 0;
    fetchAll(true);
  }, [fetchAll]);

  return (
    <DataCacheContext.Provider value={{ products, categories, banners, ready, error, invalidateCache }}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => useContext(DataCacheContext);
