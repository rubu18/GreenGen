
import { supabase } from "@/lib/supabase";
import { ADMIN_EMAIL, ADMIN_PASSWORD } from "@/constants/auth";
import { createUtilsToast } from "@/lib/utils";
import { addAdminUser } from "@/utils/dbUtils";

// Function to check if a user is admin
export const checkUserIsAdmin = async (userId: string) => {
  if (!userId) return false;
  
  try {
    // First, check if user is admin by email
    const { data: authData } = await supabase.auth.getUser();
    if (authData?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      console.log("User is admin by email match:", authData.user.email);
      return true;
    }
    
    // Then check if they're in the admin_users table as a backup
    try {
      // Use maybeSingle instead of single to avoid errors when no record is found
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('user_id', userId)
        .maybeSingle();
        
      if (!adminError && adminData) {
        console.log("User is admin by database record");
        return true;
      }
    } catch (err) {
      console.error("Error checking admin_users table:", err);
      // Fall back to email check
      return authData?.user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();
    }
    
    // Call the RPC helper function we created in SQL migration
    try {
      const { data: isAdminData, error: isAdminError } = await supabase.rpc('is_admin', { 
        user_id: userId 
      });
      
      if (!isAdminError && isAdminData === true) {
        console.log("User is admin by is_admin RPC function");
        return true;
      }
    } catch (err) {
      console.error("Error calling is_admin function:", err);
    }
    
    return false;
  } catch (err) {
    console.error("Exception checking admin status:", err);
    return false;
  }
};

// Simpler function to ensure admin account exists
export const ensureAdminAccount = async () => {
  try {
    console.log("Ensuring admin account exists...");
    
    // Check if admin account exists by trying to sign up
    const { error: signUpError } = await supabase.auth.signUp({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD
    });
    
    if (signUpError) {
      if (signUpError.message.includes("already registered")) {
        console.log("Admin account already exists");
        // Automatically add admin to admin_users table if not already there
        try {
          const { data: userData } = await supabase.auth.signInWithPassword({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD
          });
          
          if (userData?.user) {
            await addAdminUser(userData.user.id);
          }
        } catch (err) {
          console.error("Error during auto-add admin:", err);
        }
        return true;
      }
      console.error("Error creating admin account:", signUpError.message);
      return false;
    } else {
      console.log("Admin account created successfully");
      
      // Also ensure they are in admin_users table
      try {
        // Get the user ID of the admin account
        const { data: userData } = await supabase.auth.signInWithPassword({
          email: ADMIN_EMAIL,
          password: ADMIN_PASSWORD
        });
        
        if (userData?.user) {
          await addAdminUser(userData.user.id);
        }
      } catch (err) {
        console.error("Error ensuring admin in admin_users table:", err);
      }
      
      return true;
    }
  } catch (err) {
    console.error("Error ensuring admin account:", err);
    return false;
  }
};

// Add admin user to the admin_users table
export const addUserToAdminTable = async (userId: string) => {
  if (!userId) return false;
  
  try {
    console.log("Adding user to admin_users table:", userId);
    
    // Use the addAdminUser function from dbUtils
    return await addAdminUser(userId);
    
  } catch (err) {
    console.error("Exception adding user to admin_users table:", err);
    createUtilsToast.error("Failed to add user as admin");
    return false;
  }
};
