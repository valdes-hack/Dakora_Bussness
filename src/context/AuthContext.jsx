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
        .maybeSingle();

      if (error) throw error;

      // Si l'utilisateur est bloqué → déconnecter immédiatement
      if (data?.is_blocked) {
        await supabase.auth.signOut();
        setUser(null);
        setProfile(null);
        return;
      }

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

  // 3. Connexion par email ou nom d'utilisateur
  const login = async (identifier, password) => {
    let email = identifier.trim();

    if (!email.includes('@')) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', identifier.trim())
        .maybeSingle();

      if (error || !data) throw new Error("Nom d'utilisateur non trouvé");

      const { data: emailRow } = await supabase
        .from('profiles')
        .select('email')
        .eq('id', data.id)
        .maybeSingle();

      if (emailRow?.email) {
        email = emailRow.email;
      } else {
        const { data: rpcEmail, error: rpcError } = await supabase.rpc('get_email_by_id', { user_id: data.id });
        if (!rpcError && rpcEmail) {
          email = String(rpcEmail);
        } else {
          throw new Error("Connexion par nom d'utilisateur indisponible — utilisez votre email");
        }
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, login, logout, loading, fetchProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);