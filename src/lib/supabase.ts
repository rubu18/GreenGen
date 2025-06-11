
import { createClient } from '@supabase/supabase-js';

// Use the correct values directly from the existing client
const SUPABASE_URL = "https://tvxhruyqhtqeacscpyzk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2eGhydXlxaHRxZWFjc2NweXprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NzA5MTksImV4cCI6MjA2MDQ0NjkxOX0.o4F8KbThtju7x82jG-JFFdMddZmHFpIdga2tQPVTjVY";

// Create client with correct configuration
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    }
  }
);

// Export a function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return SUPABASE_URL && 
         SUPABASE_ANON_KEY && 
         SUPABASE_URL.length > 0 && 
         SUPABASE_ANON_KEY.length > 0;
};
