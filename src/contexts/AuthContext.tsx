import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@supabase/supabase-js';
import type { Tables } from '@/integrations/supabase/types';
import { getResetPasswordRouteWithTokens, isPasswordRecoveryFlow } from '@/lib/authRedirect';

interface AuthContextType {
  user: User | null;
  profile: Tables<'profiles'> | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, profile: null, isAdmin: false, loading: true, signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<'profiles'> | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (currentUser: User | null) => {
    if (currentUser) {
      // Use setTimeout to avoid Supabase auth deadlock
      setTimeout(async () => {
        try {
          const [profileRes, roleRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('user_id', currentUser.id).single(),
            supabase.from('user_roles').select('role').eq('user_id', currentUser.id).eq('role', 'admin').maybeSingle(),
          ]);
          setProfile(profileRes.data);
          setIsAdmin(!!roleRes.data);
        } catch (e) {
          console.error('Error loading user data:', e);
        } finally {
          setLoading(false);
        }
      }, 0);
    } else {
      setProfile(null);
      setIsAdmin(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isPasswordRecoveryFlow() && window.location.pathname !== '/reset-password') {
      window.location.replace(getResetPasswordRouteWithTokens());
      return;
    }

    setLoading(true);

    const handleSession = (sessionUser: User | null) => {
      setUser(sessionUser);
      loadUserData(sessionUser);
    };

    // Register auth listener before reading session to avoid missing recovery events
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        window.location.replace(getResetPasswordRouteWithTokens());
        return;
      }

      if (isPasswordRecoveryFlow()) {
        return;
      }

      handleSession(session?.user ?? null);
    });

    // Get initial session first
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (isPasswordRecoveryFlow()) {
        setUser(session?.user ?? null);
        setLoading(false);
        return;
      }

      handleSession(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [loadUserData]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
