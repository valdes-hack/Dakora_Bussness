import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // 1. Fonction pour récupérer le profil complet (avec la photo)
  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(); // <--- On remplace single() par maybeSingle() !

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      console.warn('Profil non trouvé ou erreur RLS:', err.message);
    }
  };

  // 2. Surveiller l'état de la connexion au démarrage
  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      setLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      } else {
        setUser(null);
        setProfile(null);
      }
      setLoading(false);
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 3. FONCTION LOGIN MAGIQUE (Nom ou Email)
  const login = async (identifier, password) => {
    let email = identifier;

    // Si l'identifiant ne contient pas de "@", on suppose que c'est un "username"
    if (!identifier.includes('@')) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', identifier)
        .single();
      
      if (error || !data) throw new Error("Nom d'utilisateur non trouvé");

      // On récupère l'email via l'ID trouvé (Supabase Auth demande l'email)
      // Note: On pourrait aussi stocker l'email dans la table profiles pour aller plus vite
      const { data: userData, error: userError } = await supabase.rpc('get_email_by_id', { user_id: data.id });
      // Si tu n'as pas créé de fonction RPC, on utilisera une astuce simple :
      // On demande à l'admin de l'enregistrer dans les profiles ou on utilise l'email directement.
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/boutique';
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);