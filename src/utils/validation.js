/**
 * validation.js — Règles de validation des formulaires admin.
 * Fonctions pures, sans dépendance React.
 */

// ─── RÈGLES DE BASE ───────────────────────────────────────────────────────────

export const rules = {
  /** Champ obligatoire : non vide après trim */
  required: (value) => {
    if (!value || String(value).trim() === '') return 'Ce champ est obligatoire';
    return null;
  },

  /** Longueur minimale */
  minLen: (min) => (value) => {
    if (value && String(value).trim().length < min)
      return `Minimum ${min} caractères`;
    return null;
  },

  /** Longueur maximale */
  maxLen: (max) => (value) => {
    if (value && String(value).trim().length > max)
      return `Maximum ${max} caractères`;
    return null;
  },

  /** Chiffres uniquement (avec virgule/point autorisés pour les prix) */
  positiveNumber: (value) => {
    const n = Number(value);
    if (value === '' || value === null || value === undefined) return null;
    if (isNaN(n) || n < 0) return 'Doit être un nombre positif';
    return null;
  },

  /** Prix : nombre > 0 */
  price: (value) => {
    const n = Number(value);
    if (!value && value !== 0) return 'Le prix est obligatoire';
    if (isNaN(n) || n <= 0) return 'Le prix doit être supérieur à 0';
    return null;
  },

  /** Stock : entier >= 0 */
  stock: (value) => {
    const n = Number(value);
    if (isNaN(n) || n < 0 || !Number.isInteger(n))
      return 'Le stock doit être un entier ≥ 0';
    return null;
  },

  /** Format slug : lettres, chiffres, tirets uniquement */
  slug: (value) => {
    if (!value) return null;
    if (!/^[a-z0-9-]+$/.test(value))
      return 'Slug : lettres minuscules, chiffres et tirets uniquement';
    return null;
  },

  /** Numéro WhatsApp : format international sans + (ex: 237690000000) */
  whatsapp: (value) => {
    if (!value || value.trim() === '') return 'Le numéro WhatsApp est obligatoire';
    const clean = value.replace(/\s/g, '');
    if (!/^\d{9,15}$/.test(clean))
      return 'Format invalide — ex: 237690000000 (9 à 15 chiffres)';
    return null;
  },

  /** URL valide (http/https) */
  url: (value) => {
    if (!value || value.trim() === '') return null; // optionnel
    try {
      const u = new URL(value);
      if (!['http:', 'https:'].includes(u.protocol))
        return 'URL invalide — doit commencer par http:// ou https://';
    } catch {
      return 'URL invalide';
    }
    return null;
  },

  /** Email */
  email: (value) => {
    if (!value || value.trim() === '') return null; // optionnel
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))
      return 'Adresse email invalide';
    return null;
  },

  /** Numéro de téléphone camerounais/international */
  phone: (value) => {
    if (!value || value.trim() === '') return 'Le téléphone est obligatoire';
    const clean = value.replace(/[\s\-\(\)]/g, '');
    if (!/^\+?\d{8,15}$/.test(clean))
      return 'Numéro invalide — ex: 690000000';
    return null;
  },

  /** Pas de caractères spéciaux dangereux (XSS basique) */
  noScript: (value) => {
    if (!value) return null;
    if (/<script|javascript:|on\w+\s*=/i.test(value))
      return 'Caractères non autorisés';
    return null;
  },

  /** Nom FR (obligatoire + longueur + pas de script) */
  nameFr: (value) => {
    return rules.required(value)
      || rules.minLen(2)(value)
      || rules.maxLen(100)(value)
      || rules.noScript(value);
  },

  /** Nom EN (optionnel + longueur + pas de script) */
  nameEn: (value) => {
    if (!value || value.trim() === '') return null;
    return rules.minLen(2)(value)
      || rules.maxLen(100)(value)
      || rules.noScript(value);
  },

  /** Texte long (description) */
  longText: (value) => {
    if (!value || value.trim() === '') return null;
    return rules.maxLen(2000)(value) || rules.noScript(value);
  },

  /** Badge court (optionnel) */
  badge: (value) => {
    if (!value || value.trim() === '') return null;
    return rules.maxLen(30)(value) || rules.noScript(value);
  },
};

/**
 * Valide un objet de données contre un schéma de règles.
 * @param {object} data   — données du formulaire
 * @param {object} schema — { field: [rule1, rule2, ...] }
 * @returns {object}      — { field: 'message d\'erreur' | null }
 */
export const validate = (data, schema) => {
  const errors = {};
  for (const [field, fieldRules] of Object.entries(schema)) {
    const value = data[field];
    let error = null;
    for (const rule of fieldRules) {
      error = rule(value);
      if (error) break;
    }
    errors[field] = error;
  }
  return errors;
};

/** Retourne true si aucune erreur */
export const isValid = (errors) => Object.values(errors).every(e => e === null);
