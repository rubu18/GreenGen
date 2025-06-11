
import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { LogIn, AlertTriangle, Info, Shield } from 'lucide-react';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';

const ADMIN_EMAIL = "rububasumatarymionju56@gmail.com";
const ADMIN_PASSWORD = "1234567890"; // Show this for the demo

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [loginError, setLoginError] = useState('');
  const { signIn, user } = useAuth();
  const configError = !isSupabaseConfigured();

  // If user is already logged in, redirect to home page
  if (user) {
    return <Navigate to="/" />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (configError) {
      toast("Configuration Error", {
        description: "Supabase is not properly configured. Please set up your environment variables.",
      });
      return;
    }
    
    if (!email || !password) {
      toast("Please fill in all fields", {
        description: "Both email and password are required to log in.",
      });
      return;
    }

    setIsLoading(true);
    setEmailNotConfirmed(false);
    setLoginError('');
    
    try {
      // Special handling for admin login
      if (email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        toast.info("Attempting admin login...");
        // For admin login demo, we always use the predefined password
        const { error } = await signIn(ADMIN_EMAIL, ADMIN_PASSWORD);
        
        if (error) {
          console.error("Admin login error:", error);
          setLoginError("Admin login failed. Please try again.");
          toast.error("Admin login failed", {
            description: "Please try again or contact support.",
          });
        }
      } else {
        // Regular user login
        const { error } = await signIn(email, password);
        
        if (error) {
          console.error("Login error:", error.message);
          
          if (error.message?.includes("Email not confirmed")) {
            setEmailNotConfirmed(true);
            toast("Email not confirmed", {
              description: "Please check your inbox and confirm your email address.",
            });
          } else if (error.message?.includes("Invalid login credentials")) {
            setLoginError("The email or password you entered is incorrect");
            toast("Invalid credentials", {
              description: "The email or password you entered is incorrect.",
            });
          } else {
            setLoginError(error.message || "Login failed");
            toast("Login failed", {
              description: error.message,
            });
          }
        }
      }
    } catch (error: any) {
      setLoginError(error.message || "An unexpected error occurred");
      toast("An unexpected error occurred", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resendConfirmationEmail = async () => {
    if (!email) {
      toast("Email required", {
        description: "Please enter your email address to resend confirmation.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
      });
      
      if (error) {
        toast("Failed to resend confirmation", {
          description: error.message,
        });
      } else {
        toast("Confirmation email sent", {
          description: "Please check your inbox for the confirmation link.",
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
          <CardTitle className="text-2xl font-bold">Log in</CardTitle>
          <CardDescription>
            Enter your email below to log in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Configuration Error</AlertTitle>
              <AlertDescription>
                Supabase is not properly configured. Please connect your project to Supabase 
                and set the proper environment variables before attempting to log in.
              </AlertDescription>
            </Alert>
          )}
          
          <Alert className="mb-4 border-info text-info-foreground bg-info/10">
            <Info className="h-4 w-4" />
            <AlertTitle>Admin Access</AlertTitle>
            <AlertDescription>
              <div className="flex flex-col space-y-2">
                <p>If you have admin privileges, you can use the dedicated admin login page.</p>
                <Link to="/admin-login" className="flex items-center text-eco hover:underline">
                  <Shield className="h-4 w-4 mr-1" />
                  Go to Admin Login
                </Link>
              </div>
            </AlertDescription>
          </Alert>
          
          {loginError && (
            <Alert variant="destructive" className="mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Login Error</AlertTitle>
              <AlertDescription>{loginError}</AlertDescription>
            </Alert>
          )}
          
          {emailNotConfirmed && (
            <Alert className="mb-4 border-amber-500 text-amber-700">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Email not confirmed</AlertTitle>
              <AlertDescription className="space-y-2">
                <p>Your email address has not been confirmed yet. Please check your inbox for the confirmation email.</p>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="mt-2"
                  onClick={resendConfirmationEmail}
                  disabled={isLoading}
                >
                  <span className="flex items-center">
                    <span className="mr-2 h-4 w-4 inline-block">↻</span>
                    Resend confirmation email
                  </span>
                </Button>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-sm text-eco hover:underline">
                  Forgot Password?
                </Link>
              </div>
              <Input 
                id="password" 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
                  Logging in...
                </span>
              ) : (
                <span className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" />
                  Log In
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link to="/signup" className="text-eco font-medium hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Login;
