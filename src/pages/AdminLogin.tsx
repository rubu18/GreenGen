
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { LogIn, AlertTriangle } from 'lucide-react';
import { ADMIN_EMAIL, ADMIN_PASSWORD } from '@/constants/auth';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { createUtilsToast } from '@/lib/utils';

const AdminLogin = () => {
  const [email, setEmail] = useState(ADMIN_EMAIL); // Pre-fill with admin email
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { signIn, user } = useAuth();

  // If user is already logged in, redirect to home page
  if (user) {
    return <Navigate to="/" />;
  }

  const handleAdminLogin = async () => {
    setIsLoading(true);
    setLoginError('');
    
    try {
      // First sign out any existing session to ensure clean state
      await supabase.auth.signOut();
      
      console.log("Attempting admin login with:", email);
      
      // Check if the entered email is the admin email
      if (email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()) {
        setLoginError("Invalid admin credentials");
        createUtilsToast.error("Admin login failed", "You must use the admin account to login here.");
        setIsLoading(false);
        return;
      }
      
      // Direct login with admin credentials
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password
      });
      
      if (loginError) {
        console.error("Direct admin login error:", loginError);
        setLoginError("Admin login failed: " + loginError.message);
        createUtilsToast.error("Admin login failed", 
          loginError.message || "Please check your credentials and try again."
        );
      } else if (loginData?.user) {
        createUtilsToast.success("Admin login successful");
        
        // First, ensure the user is in the admin_users table
        try {
          const { error: adminInsertError } = await supabase
            .from('admin_users')
            .upsert({ user_id: loginData.user.id })
            .select();
            
          if (!adminInsertError) {
            console.log("Added user to admin_users table");
          }
        } catch (err) {
          console.error("Could not add to admin_users table:", err);
        }
        
        // Redirect to admin page
        window.location.href = "/admin";
      }
    } catch (error: any) {
      console.error("Admin login exception:", error);
      setLoginError(error.message || "An unexpected error occurred");
      createUtilsToast.error("An unexpected error occurred", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-eco-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
          <CardDescription>
            Enter your admin credentials to log in
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="admin-email">Admin Email</Label>
              <Input 
                id="admin-email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter admin email"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Default admin email: {ADMIN_EMAIL}
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-password">Admin Password</Label>
              <Input 
                id="admin-password" 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
              />
            </div>
            <Button 
              onClick={handleAdminLogin} 
              className="w-full bg-eco hover:bg-eco-dark"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-gray-200 border-t-white rounded-full"></span>
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="mr-2" />
                  Login
                </span>
              )}
            </Button>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Not an admin?{" "}
            <Link to="/login" className="text-eco font-medium hover:underline">
              Regular Login
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default AdminLogin;
