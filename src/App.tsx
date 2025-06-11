
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Index from "./pages/Index";
import ReportWaste from "./pages/ReportWaste";
import CollectWaste from "./pages/CollectWaste";
import Rewards from "./pages/Rewards";
import Leaderboard from "./pages/Leaderboard";
import Settings from "./pages/Settings";
import Login from "./pages/Login";
import AdminLogin from "./pages/AdminLogin";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";
import AdminDashboard from "./pages/AdminDashboard";
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Create admin_users table if it doesn't exist
const setupAdminTable = async () => {
  try {
    console.log("Setting up admin_users table...");
    
    // Create function to create admin_users table if it doesn't exist
    const createFunctionSql = `
      CREATE OR REPLACE FUNCTION create_admin_users_table()
      RETURNS void
      LANGUAGE plpgsql
      AS $$
      BEGIN
        -- Check if the table exists
        IF NOT EXISTS (
          SELECT FROM pg_tables 
          WHERE schemaname = 'public' 
          AND tablename = 'admin_users'
        ) THEN
          -- Create the table if it doesn't exist
          CREATE TABLE public.admin_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES auth.users(id) NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
            CONSTRAINT unique_user_id UNIQUE (user_id)
          );
          
          -- Add comment
          COMMENT ON TABLE public.admin_users IS 'Table to store admin users';
        END IF;
      END;
      $$;
    `;
    
    // Fixed: Don't use .catch on the RPC call
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSql });
    if (error) {
      // This might fail if rpc doesn't exist, which is expected
      console.log("Note: Could not create admin table function directly, will try on auth");
    }
  } catch (err) {
    console.error("Error setting up admin table:", err);
  }
};

// Create the function once at app startup
setupAdminTable();

const queryClient = new QueryClient();

const App = () => {
  // Create admin_users table function when the app starts
  useEffect(() => {
    const createAdminFunction = async () => {
      try {
        // Try to create the function via RPC
        console.log("Creating admin_users_table function...");
        
        const { error } = await supabase.rpc('create_admin_users_table');
        if (error && !error.message.includes("does not exist")) {
          console.error("Error creating admin_users table:", error);
        }
      } catch (err) {
        console.error("Error in admin function setup:", err);
      }
    };
    
    createAdminFunction();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/admin-login" element={<AdminLogin />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              
              {/* Protected routes */}
              <Route
                path="/report"
                element={
                  <ProtectedRoute>
                    <ReportWaste />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/collect"
                element={
                  <ProtectedRoute>
                    <CollectWaste />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rewards"
                element={
                  <ProtectedRoute>
                    <Rewards />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute>
                    <Settings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
