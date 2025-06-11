
import { useState } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface SecuritySettingsProps {
  isUpdating: boolean;
  setIsUpdating: (value: boolean) => void;
}

const SecuritySettings = ({ isUpdating, setIsUpdating }: SecuritySettingsProps) => {
  const handleUpdatePassword = async () => {
    const currentPassword = (document.getElementById('current-password') as HTMLInputElement).value;
    const newPassword = (document.getElementById('new-password') as HTMLInputElement).value;
    const confirmPassword = (document.getElementById('confirm-password') as HTMLInputElement).value;
    
    if (!newPassword || !currentPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) {
        console.error("Error updating password:", error);
        toast.error(error.message || "Failed to update password");
      } else {
        toast.success("Password updated successfully");
        // Clear password fields
        const passwordInputs = document.querySelectorAll('input[type="password"]');
        passwordInputs.forEach(input => (input as HTMLInputElement).value = '');
      }
    } catch (error) {
      console.error("Error in password update:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleSignOutAllDevices = async () => {
    if (!window.confirm("Are you sure you want to sign out from all devices?")) {
      return;
    }
    
    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error("Error signing out from all devices:", error);
        toast.error("Failed to sign out from all devices");
      } else {
        toast.success("Signed out from all devices");
        // Redirect to login after successful global sign out
        window.location.href = "/login";
      }
    } catch (error) {
      console.error("Error in global sign out:", error);
      toast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteAccount = async () => {
    // In a real implementation, you'd want a more secure confirmation flow
    if (!window.confirm("WARNING: This action cannot be undone. Are you absolutely sure you want to delete your account?")) {
      return;
    }
    
    // Fix the comparison to properly check if the prompt result equals the string 'DELETE'
    const promptResult = window.prompt("All your data will be permanently deleted. Type 'DELETE' to confirm.");
    if (promptResult !== 'DELETE') {
      return;
    }
    
    setIsUpdating(true);
    toast.warning("Account deletion initiated", {
      description: "Please contact support to complete this process for security reasons."
    });
    
    // In a real implementation, you would trigger a secure deletion flow here
    // Often this requires backend verification and a cooling period
    
    setIsUpdating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>
          Manage your password and account security.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <Input id="new-password" type="password" />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <Input id="confirm-password" type="password" />
          </div>
          
          <Button 
            className="bg-eco hover:bg-eco-dark"
            disabled={isUpdating}
            onClick={handleUpdatePassword}
          >
            {isUpdating ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
        
        <div className="border-t pt-4 mt-6">
          <h3 className="font-medium mb-4">Other Security Settings</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Two-Factor Authentication</p>
                <p className="text-sm text-gray-500">Add an extra layer of security to your account.</p>
              </div>
              <Button variant="outline">Enable</Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Active Sessions</p>
                <p className="text-sm text-gray-500">Manage your active login sessions.</p>
              </div>
              <Button variant="outline">View</Button>
            </div>
          </div>
        </div>
        
        <div className="border-t pt-4 mt-6">
          <h3 className="font-medium text-red-500 mb-4">Danger Zone</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Sign Out from All Devices</p>
                <p className="text-sm text-gray-500">Log out from all other devices where you're currently logged in.</p>
              </div>
              <Button 
                variant="outline" 
                className="text-red-500 border-red-500 hover:bg-red-50"
                onClick={handleSignOutAllDevices}
                disabled={isUpdating}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Delete Account</p>
                <p className="text-sm text-gray-500">Permanently delete your account and all your data.</p>
              </div>
              <Button 
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isUpdating}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecuritySettings;
