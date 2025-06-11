
import { Link, useLocation } from "react-router-dom";
import { Home, FileUp, Box, Award, Trophy, Settings, LogOut, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { ADMIN_EMAIL } from "@/constants/auth";
import { createUtilsToast } from "@/lib/utils";

const navItems = [
  {
    label: "Home",
    icon: Home,
    href: "/"
  },
  {
    label: "Report Waste",
    icon: FileUp,
    href: "/report"
  },
  {
    label: "Collect Waste",
    icon: Box,
    href: "/collect"
  },
  {
    label: "Rewards",
    icon: Award,
    href: "/rewards"
  },
  {
    label: "Leaderboard",
    icon: Trophy,
    href: "/leaderboard"
  }
];

const Sidebar = () => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  
  useEffect(() => {
    const checkAdminStatus = async () => {
      setIsCheckingAdmin(true);
      if (!user) {
        setIsAdmin(false);
        setIsCheckingAdmin(false);
        return;
      }
      
      // First directly check if user email matches admin email
      if (user.email && user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
        console.log('User is admin by email match');
        setIsAdmin(true);
        setIsCheckingAdmin(false);
        return;
      }
      
      try {
        // Then check if admin_users table exists and user is in it
        const { data, error } = await supabase
          .from('admin_users')
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error && !error.message.includes("does not exist")) {
          console.error('Error checking admin status:', error);
        }
        
        // Set admin status based on presence in admin_users table
        if (data) {
          console.log('User is admin by database record');
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Exception checking admin status:', err);
      } finally {
        setIsCheckingAdmin(false);
      }
    };
    
    checkAdminStatus();
  }, [user]);
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user?.email) return "U";
    return user.email.substring(0, 2).toUpperCase();
  };
  
  return (
    <div className="w-[200px] h-screen bg-eco-accent border-r border-eco-light flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-eco-light text-eco-dark">
              {getUserInitials()}
            </AvatarFallback>
          </Avatar>
          <div className="overflow-hidden">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            {isAdmin && (
              <span className="text-xs bg-eco text-white px-2 py-0.5 rounded-full">
                Admin
              </span>
            )}
          </div>
        </div>
      </div>
      
      <nav className="flex-1 mt-6">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              <Link 
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium",
                  location.pathname === item.href 
                    ? "active-nav-item" 
                    : "text-gray-700 hover:bg-eco-light hover:text-eco-dark"
                )}
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
          
          {!isCheckingAdmin && isAdmin && (
            <li>
              <Link 
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium",
                  location.pathname === "/admin" 
                    ? "active-nav-item" 
                    : "text-gray-700 hover:bg-eco-light hover:text-eco-dark",
                  "bg-eco-light/50 border-l-4 border-eco"
                )}
                onClick={() => {
                  if (!isAdmin) {
                    createUtilsToast.error("You don't have admin access");
                  }
                }}
              >
                <Shield size={20} className="text-eco" />
                <span>Admin Dashboard</span>
              </Link>
            </li>
          )}
          
          {/* Direct admin access link for admins or those using admin email */}
          {!isAdmin && user?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase() && (
            <li>
              <Link 
                to="/admin"
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium",
                  "text-gray-700 hover:bg-eco-light hover:text-eco-dark",
                  "bg-yellow-50 border-l-4 border-yellow-500"
                )}
              >
                <Shield size={20} className="text-yellow-600" />
                <span>Access Admin (Email Match)</span>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-eco-light mt-auto">
        <Link 
          to="/settings"
          className={cn(
            "flex items-center gap-3 px-4 py-3 text-sm font-medium",
            location.pathname === "/settings" 
              ? "active-nav-item" 
              : "text-gray-700 hover:bg-eco-light hover:text-eco-dark"
          )}
        >
          <Settings size={20} />
          <span>Settings</span>
        </Link>
        
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-4 py-3 text-sm font-medium w-full text-gray-700 hover:bg-eco-light hover:text-eco-dark mt-2"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
