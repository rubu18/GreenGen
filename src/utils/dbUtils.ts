
import { supabase } from "@/lib/supabase";

/**
 * Ensure the admin_users table exists in the database
 */
export const setupAdminUsersTable = async () => {
  try {
    // Check if admin_users table exists first
    const { error: tableCheckError } = await supabase
      .from('admin_users')
      .select('id')
      .limit(1);
    
    // If there's a specific error about the table not existing, create it
    if (tableCheckError && 
        (tableCheckError.message.includes("does not exist") || 
         tableCheckError.message.includes("relation") || 
         tableCheckError.code === "42P01")) {
      console.log("Admin users table doesn't exist, creating it...");
      
      const { error: createError } = await supabase.rpc('create_admin_users_table');
      
      if (createError) {
        console.error("Failed to create admin_users table:", createError);
        
        // Fallback: try directly with SQL
        const { error: sqlError } = await supabase
          .rpc('exec_sql', { 
            sql: `
              CREATE TABLE IF NOT EXISTS public.admin_users (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
              );
              
              -- Also enable RLS with proper policies
              ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
              
              -- Create policy for insertion
              CREATE POLICY IF NOT EXISTS "Allow authenticated users to insert admin records"
                ON public.admin_users
                FOR INSERT
                WITH CHECK (true);
                
              -- Create policy for viewing records
              CREATE POLICY IF NOT EXISTS "Users can view their own admin records"
                ON public.admin_users
                FOR SELECT
                USING (auth.uid() = user_id);
            `
          });
        
        if (sqlError) {
          console.error("Failed to create admin_users table with SQL:", sqlError);
        } else {
          console.log("Created admin_users table via SQL");
        }
      } else {
        console.log("Created admin_users table via RPC");
      }
    } else {
      console.log("Admin users table exists");
    }
    
  } catch (err) {
    console.error("Error setting up admin_users table:", err);
  }
};

/**
 * Add a user to the admin_users table
 */
export const addAdminUser = async (userId: string) => {
  try {
    // Check if user already exists in admin_users table
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (checkError) {
      console.error("Error checking admin user:", checkError);
      return false;
    }
    
    if (existingAdmin) {
      console.log("User is already an admin");
      return true;
    }
    
    // Add the user to admin_users with explicit column names
    const { error: insertError } = await supabase
      .from('admin_users')
      .insert([{ 
        user_id: userId 
      }]);
    
    if (insertError) {
      console.error("Error adding admin user:", insertError);
      return false;
    }
    
    console.log("User added as admin");
    return true;
    
  } catch (err) {
    console.error("Exception adding admin user:", err);
    return false;
  }
};
