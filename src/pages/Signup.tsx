
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { UserPlus, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '@/lib/supabase';

const ADMIN_EMAIL = "rububasumatarymionju56@gmail.com";

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signUp } = useAuth();
  const configError = !isSupabaseConfigured();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (configError) {
      toast("Configuration Error", {
        description: "Supabase is not properly configured. Please set up your environment variables.",
      });
      return;
    }
    
    if (!email || !password || !confirmPassword) {
      toast("Please fill in all fields", {
        description: "All fields are required to create an account.",
      });
      return;
    }
    
    if (password !== confirmPassword) {
      toast("Passwords don't match", {
        description: "Please ensure your passwords match.",
      });
      return;
    }
    
    if (password.length < 6) {
      toast("Password too short", {
        description: "Password should be at least 6 characters long.",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Skip email validation for the admin email
      const { error } = await signUp(email, password);
      
      if (error) {
        if (error.message.includes("Email address") && email === ADMIN_EMAIL) {
          // Special handling for admin account
          toast("Admin account created", {
            description: "Please login with your admin credentials.",
          });
          // Redirect to login
          window.location.href = "/login";
        } else {
          toast("Signup failed", {
            description: error.message,
          });
        }
      } else {
        toast("Account created", {
          description: "Please check your email to confirm your account.",
        });
      }
    } catch (error: any) {
      toast("An unexpected error occurred", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-eco-accent/10 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Create an account</CardTitle>
          <CardDescription>
            Enter your email below to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                Supabase is not properly configured. Please connect your project to Supabase 
                and set the proper environment variables before attempting to sign up.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="name@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input 
                id="confirm-password" 
                type="password" 
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-eco hover:bg-eco-dark"
              disabled={isLoading || configError}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <span className="animate-spin inline-block h-4 w-4 mr-2 border-2 border-gray-200 border-t-white rounded-full"></span>
                  Creating account...
                </span>
              ) : (
                <span className="flex items-center">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Sign Up
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Already have an account?{" "}
            <Link to="/login" className="text-eco font-medium hover:underline">
              Log in
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Signup;
