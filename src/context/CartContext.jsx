import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  // On charge le panier sauvegardé ou on part d'une liste vide
  const [cart, setCart] = useState(() => {
    const savedCart = localStorage.getItem('dakora_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Sauvegarde automatique à chaque changement
  useEffect(() => {
    localStorage.setItem('dakora_cart', JSON.stringify(cart));
  }, [cart]);

  // FONCTION : AJOUTER AU PANIER
  const addToCart = (product, variant, quantity = 1) => {
    setCart(prevCart => {
      // On vérifie si CETTE variante de CE produit est déjà là
      const existingItemIndex = prevCart.findIndex(
        item => item.product_id === product.id && item.variant_id === variant.id
      );

      if (existingItemIndex > -1) {
        // Si oui, on augmente juste la quantité
        const newCart = [...prevCart];
        newCart[existingItemIndex].quantity += quantity;
        return newCart;
      } else {
        // Si non, on ajoute un nouvel objet complet
        return [...prevCart, {
          id: `${product.id}-${variant.id}`, // ID unique pour le panier
          product_id: product.id,
          variant_id: variant.id,
          name_fr: product.name_fr,
          name_en: product.name_en,
          variant_label_fr: variant.label_fr,
          variant_label_en: variant.label_en,
          price: variant.price,
          image: product.product_images?.[0]?.url,
          quantity: quantity
        }];
      }
    });
  };

  // FONCTION : MODIFIER QUANTITÉ (+ ou -)
  const updateQuantity = (itemId, newQty) => {
    if (newQty < 1) return removeFromCart(itemId);
    setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity: newQty } : item));
  };

  // FONCTION : SUPPRIMER UN ARTICLE
  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  // FONCTION : VIDER TOUT
  const clearCart = () => setCart([]);

  // CALCULS
  const totalAmount = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{ 
      cart, addToCart, removeFromCart, updateQuantity, clearCart, 
      totalAmount, totalItems 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);