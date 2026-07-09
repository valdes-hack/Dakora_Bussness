/**
 * usePromo — Récupère les promotions actives depuis Supabase et expose
 * des helpers pour vérifier si un variant est en promo.
 *
 * Logique : une promo est active si :
 *   - is_active = true
 *   - start_date <= NOW()
 *   - end_timestamp > NOW()  (ou end_timestamp est null → pas de limite)
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../api/supabaseClient';

const REFRESH_MS = 30_000; // Re-fetch toutes les 30s pour détecter les expirations

export const usePromo = () => {
  const [promos, setPromos] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPromos = useCallback(async () => {
    const now = new Date().toISOString();
    const { data } = await supabase
      .from('promotions')
      .select('*')
      .eq('is_active', true)
      .lte('start_date', now)
      .or(`end_timestamp.is.null,end_timestamp.gt.${now}`);
    setPromos(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPromos();
    const interval = setInterval(fetchPromos, REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchPromos]);

  /**
   * Retourne la promo active pour un variant donné, ou null.
   * @param {string} variantId
   * @returns {object|null}
   */
  const getActivePromo = useCallback((variantId) => {
    if (!variantId) return null;
    const now = Date.now();
    return promos.find(p => {
      if (p.variant_id !== variantId) return false;
      if (p.end_timestamp && new Date(p.end_timestamp).getTime() <= now) return false;
      return true;
    }) || null;
  }, [promos]);

  /** Retourne toutes les promos actives (pour l'admin) */
  const getAllPromos = useCallback(async () => {
    const { data } = await supabase
      .from('promotions')
      .select(`
        *,
        variants(id, label_fr, label_en, price,
          products(id, name_fr, name_en)
        )
      `)
      .order('created_at', { ascending: false });
    return data || [];
  }, []);

  return { promos, loading, getActivePromo, getAllPromos, refetch: fetchPromos };
};
