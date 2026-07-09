/**
 * notify.js — Système de notifications d'activité admin centralisé.
 *
 * Format du message stocké en BD :
 *   "[TYPE:product|LINK:/admin/produits] Texte lisible..."
 *
 * La table `notifications` a order_id nullable — on l'envoie toujours à null
 * pour les notifications admin (seules les commandes reçues utilisent order_id).
 */
import { supabase } from '../api/supabaseClient';

const PREF_PREFIX = 'notif_pref_';

/** Vérifie si ce type de notification est activé (défaut = true). */
const isNotifEnabled = async (type) => {
  try {
    const { data } = await supabase
      .from('settings')
      .select('value')
      .eq('key', `${PREF_PREFIX}${type}`)
      .maybeSingle();
    return !data || data.value !== 'false';
  } catch {
    return true; // En cas d'erreur réseau, on notifie quand même
  }
};

/**
 * Crée une notification dans la table `notifications`.
 * @param {string} message  Texte affiché dans la cloche
 * @param {string} type     product | category | story | settings | order | share | stock
 * @param {string} [link]   URL de navigation (ex: /admin/produits)
 */
export const createNotification = async (message, type = 'product', link = null) => {
  try {
    const enabled = await isNotifEnabled(type);
    if (!enabled) return;

    // On encode type + lien dans le message pour ne pas modifier le schéma BD
    const encoded = `[TYPE:${type}|LINK:${link || ''}] ${message}`;

    const { error } = await supabase.from('notifications').insert([{
      order_id: null,     // nullable — obligatoire d'envoyer null explicitement
      message: encoded,
      is_read: false,
    }]);

    if (error) {
      console.warn('Notification non insérée:', error.message);
    }
  } catch (err) {
    console.warn('Notification non envoyée:', err.message);
  }
};

/** Parse le message pour extraire type, lien et texte lisible. */
export const parseNotification = (rawMessage) => {
  const match = rawMessage?.match(/^\[TYPE:(\w+)\|LINK:([^\]]*)\]\s(.+)$/s);
  if (match) {
    return { type: match[1], link: match[2] || null, message: match[3] };
  }
  return { type: 'order', link: '/admin/commandes', message: rawMessage };
};

/** Emoji par type */
export const typeIcon = (type) => ({
  product:  '📦',
  category: '🏷️',
  story:    '📸',
  settings: '⚙️',
  order:    '🛒',
  share:    '📤',
  stock:    '⚠️',
  promo:    '🔥',
}[type] || '🔔');

/** Couleur de badge par type */
export const typeColor = (type) => ({
  product:  'bg-dakora-green/10 text-dakora-green',
  category: 'bg-blue-500/10 text-blue-500',
  story:    'bg-purple-500/10 text-purple-500',
  settings: 'bg-orange-500/10 text-orange-500',
  order:    'bg-red-500/10 text-red-500',
  share:    'bg-cyan-500/10 text-cyan-500',
  stock:    'bg-yellow-500/10 text-yellow-600',
  promo:    'bg-pink-500/10 text-pink-500',
}[type] || 'bg-gray-100 text-gray-400');

/** Toutes les catégories configurables dans les préférences */
export const NOTIF_TYPES = [
  { type: 'order',    labelFr: 'Nouvelles commandes',          labelEn: 'New orders',              emoji: '🛒' },
  { type: 'product',  labelFr: 'Produits (ajout/modif/suppr)', labelEn: 'Products (add/edit/del)',  emoji: '📦' },
  { type: 'category', labelFr: 'Catégories (ajout/suppr)',     labelEn: 'Categories (add/del)',     emoji: '🏷️' },
  { type: 'story',    labelFr: 'Stories (publication/suppr)',  labelEn: 'Stories (publish/del)',    emoji: '📸' },
  { type: 'settings', labelFr: 'Paramètres modifiés',          labelEn: 'Settings updated',         emoji: '⚙️' },
  { type: 'share',    labelFr: 'Partages sur réseaux sociaux', labelEn: 'Social media shares',      emoji: '📤' },
  { type: 'stock',    labelFr: 'Alertes de stock faible',      labelEn: 'Low stock alerts',         emoji: '⚠️' },
  { type: 'promo',    labelFr: 'Promotions (lancement/modif)',  labelEn: 'Promotions (launch/edit)', emoji: '🔥' },
];
