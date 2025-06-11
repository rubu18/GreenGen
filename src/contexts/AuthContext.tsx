
import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { AuthContextType } from '@/types/auth';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/constants/auth';
import { setupAdminUsersTable, addAdminUser } from '@/utils/dbUtils';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up the auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // If a user just logged in and they're the admin, add them to the admin_users table
      if (session?.user && session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setupAdminUsersTable().then(() => {
          addAdminUser(session.user.id);
        });
      }
    });

    // Get the current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
      
      // Check if current user is admin and update admin_users table
      if (session?.user && session.user.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        setupAdminUsersTable().then(() => {
          addAdminUser(session.user.id);
        });
      }
    });

    // Ensure admin account exists but don't try to log in
    ensureAdminExists();

    return () => subscription.unsubscribe();
  }, []);

  // Function to ensure admin account exists in auth system
  const ensureAdminExists = async () => {
    try {
      // Setup the admin_users table first
      await setupAdminUsersTable();
      
      // Check if admin account exists by trying a signup
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      
      if (signUpError && !signUpError.message.includes("already registered")) {
        console.error("Error ensuring admin account exists:", signUpError);
      } else {
        console.log("Admin account verified in auth system");
      }
    } catch (err) {
      console.error("Error checking admin account:", err);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      console.log("Attempting to sign in with:", email);
      
      // Special case for admin login
      const isAdminLogin = email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
      
      if (isAdminLogin) {
        console.log("Admin login detected, ensuring account exists");
        await ensureAdminExists();
      }
      
      // Attempt to sign in with the provided credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (!error) {
        // If it's an admin login, make sure they're in the admin_users table
        if (isAdminLogin && data?.user) {
          await setupAdminUsersTable();
          await addAdminUser(data.user.id);
        }
        
        // Only navigate if this wasn't triggered by adminLogin component
        // (which handles navigation itself)
        if (!window.location.pathname.includes('admin-login')) {
          navigate('/');
        }
        toast.success("Logged in successfully");
      } else {
        console.error("Login error:", error.message);
        toast.error("Login failed", {
          description: "The email or password you entered is incorrect.",
        });
      }
      return { error };
    } catch (err: any) {
      console.error("Sign in error:", err);
      return { error: err };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      // If trying to sign up as admin, use the admin login flow instead
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        const { error } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
        return { data: null, error };
      } else {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });
        
        if (!error) {
          navigate('/');
          toast.success("Account created successfully");
        }
        
        return { data, error };
      }
    } catch (err: any) {
      console.error("Sign up error:", err);
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const value = {
    user,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
