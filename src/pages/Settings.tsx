
import { useState, useEffect } from "react";
import { User, Bell, Shield } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createUtilsToast } from "@/lib/utils";
import Layout from "@/components/Layout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import ProfileSettings from "@/components/settings/ProfileSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import SecuritySettings from "@/components/settings/SecuritySettings";
import LoadingSpinner from "@/components/settings/LoadingSpinner";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
}

interface UserSettings {
  id: string;
  email_notifications: boolean;
  new_waste_reports: boolean;
  collection_events: boolean;
  token_rewards: boolean;
  weekly_summary: boolean;
}

const defaultProfile: UserProfile = {
  id: "",
  full_name: "",
  username: "",
  bio: "",
  location: "",
  avatar_url: null
};

const defaultSettings: UserSettings = {
  id: "",
  email_notifications: true,
  new_waste_reports: true,
  collection_events: true,
  token_rewards: true,
  weekly_summary: false
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const { user } = useAuth();
  
  // Fetch user profile and settings data
  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Fetch user profile
        const { data: profileData, error: profileError } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
          
        if (profileError && profileError.code !== 'PGRST116') {
          console.error("Error fetching user profile:", profileError);
          createUtilsToast.error("Failed to load your profile");
        } 
        
        // If no profile exists or there was a "no rows returned" error, create one
        if (!profileData || (profileError && profileError.code === 'PGRST116')) {
          console.log("No profile found, creating new profile");
          setIsCreatingProfile(true);
          
          // Create default profile
          const newProfile = {
            id: user.id,
            full_name: "",
            username: "",
            bio: "",
            location: "",
            avatar_url: null
          };
          
          const { error: createProfileError } = await supabase
            .from("user_profiles")
            .insert(newProfile);
            
          if (createProfileError) {
            console.error("Error creating user profile:", createProfileError);
            createUtilsToast.error("Failed to create your profile");
          } else {
            setProfile({ ...newProfile });
            createUtilsToast.success("Profile created", "Your profile has been created successfully.");
          }
        } else {
          setProfile(profileData);
        }
        
        // Fetch user settings
        const { data: settingsData, error: settingsError } = await supabase
          .from("user_settings")
          .select("*")
          .eq("id", user.id)
          .maybeSingle();
          
        if (settingsError && settingsError.code !== 'PGRST116') {
          console.error("Error fetching user settings:", settingsError);
          createUtilsToast.error("Failed to load your settings");
        }
        
        // If no settings exist or there was a "no rows returned" error, create them
        if (!settingsData || (settingsError && settingsError.code === 'PGRST116')) {
          console.log("No settings found, creating default settings");
          
          // Create default settings
          const newSettings = {
            id: user.id,
            email_notifications: true,
            new_waste_reports: true,
            collection_events: true,
            token_rewards: true,
            weekly_summary: false
          };
          
          const { error: createSettingsError } = await supabase
            .from("user_settings")
            .insert(newSettings);
            
          if (createSettingsError) {
            console.error("Error creating user settings:", createSettingsError);
            createUtilsToast.error("Failed to create your settings");
          } else {
            setSettings({ ...newSettings });
          }
        } else {
          setSettings(settingsData);
        }
        
      } catch (error) {
        console.error("Error fetching user data:", error);
        createUtilsToast.error("Something went wrong while loading your data");
      } finally {
        setIsLoading(false);
        setIsCreatingProfile(false);
      }
    };
    
    fetchUserData();
  }, [user]);
  
  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto p-8">
          <h1 className="text-3xl font-bold mb-8">Settings</h1>
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-gray-600 mb-8">
          Manage your account settings and preferences.
        </p>
        
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="profile" className="flex items-center">
              <User className="h-4 w-4 mr-2" />
              <span>Profile</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center">
              <Bell className="h-4 w-4 mr-2" />
              <span>Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center">
              <Shield className="h-4 w-4 mr-2" />
              <span>Security</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile">
            <ProfileSettings 
              profile={profile}
              isUpdating={isUpdating}
              setIsUpdating={setIsUpdating}
              setProfile={setProfile}
            />
          </TabsContent>
          
          <TabsContent value="notifications">
            <NotificationSettings 
              settings={settings}
              setSettings={setSettings}
            />
          </TabsContent>
          
          <TabsContent value="security">
            <SecuritySettings 
              isUpdating={isUpdating}
              setIsUpdating={setIsUpdating}
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal for creating profile/settings */}
      <Dialog open={isCreatingProfile} onOpenChange={setIsCreatingProfile}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center justify-center p-4">
            <LoadingSpinner />
            <p className="text-center mt-4">Setting up your profile...</p>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Settings;
