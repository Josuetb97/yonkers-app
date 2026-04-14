import { useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

export default function useAuth() {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================
     INIT SESSION
  ========================= */
  useEffect(() => {
    async function getInitialSession() {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);
    }

    getInitialSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user || null);
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  /* =========================
     LOGIN
  ========================= */
  const login = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    setSession(data.session);
    setUser(data.user);

    return data;
  }, []);

  /* =========================
     REGISTER
  ========================= */
  const register = useCallback(async (email, password, metadata = {}) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata, // nombre del yonker, etc.
      },
    });

    if (error) throw error;

    return data;
  }, []);

  /* =========================
     LOGOUT
  ========================= */
  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, []);

  /* =========================
     GET ACCESS TOKEN
  ========================= */
  const getAccessToken = useCallback(async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  return {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    getAccessToken,
  };
}