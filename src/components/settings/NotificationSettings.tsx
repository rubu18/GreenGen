
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface UserSettings {
  id: string;
  email_notifications: boolean;
  new_waste_reports: boolean;
  collection_events: boolean;
  token_rewards: boolean;
  weekly_summary: boolean;
}

interface NotificationSettingsProps {
  settings: UserSettings;
  setSettings: React.Dispatch<React.SetStateAction<UserSettings>>;
}

const NotificationSettings = ({ settings, setSettings }: NotificationSettingsProps) => {
  const { user } = useAuth();
  
  const updateSetting = async (field: keyof UserSettings, value: boolean) => {
    if (!user) return;
    
    // Update local state immediately for responsive UI
    setSettings(prev => ({ ...prev, [field]: value }));
    
    try {
      const { error } = await supabase
        .from("user_settings")
        .update({ 
          [field]: value,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) {
        console.error(`Error updating ${field}:`, error);
        // Revert local state if there was an error
        setSettings(prev => ({ ...prev, [field]: !value }));
        toast.error("Failed to update setting");
      } else {
        toast.success("Setting updated", {
          description: `Your ${field.replace(/_/g, " ")} preference has been updated.`
        });
      }
    } catch (error) {
      console.error("Error in settings update:", error);
      // Revert local state if there was an error
      setSettings(prev => ({ ...prev, [field]: !value }));
      toast.error("Something went wrong");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Manage how you receive notifications and updates.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-gray-500">Receive email notifications about your account.</p>
            </div>
            <Switch 
              checked={settings.email_notifications} 
              onCheckedChange={(checked) => updateSetting('email_notifications', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">New Waste Reports</p>
              <p className="text-sm text-gray-500">Notify when new waste is reported in your area.</p>
            </div>
            <Switch 
              checked={settings.new_waste_reports}
              onCheckedChange={(checked) => updateSetting('new_waste_reports', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Collection Events</p>
              <p className="text-sm text-gray-500">Notify about upcoming waste collection events.</p>
            </div>
            <Switch 
              checked={settings.collection_events}
              onCheckedChange={(checked) => updateSetting('collection_events', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Token Rewards</p>
              <p className="text-sm text-gray-500">Notify when you earn new tokens or rewards.</p>
            </div>
            <Switch 
              checked={settings.token_rewards}
              onCheckedChange={(checked) => updateSetting('token_rewards', checked)}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Weekly Summary</p>
              <p className="text-sm text-gray-500">Receive a weekly summary of your waste management activities.</p>
            </div>
            <Switch 
              checked={settings.weekly_summary}
              onCheckedChange={(checked) => updateSetting('weekly_summary', checked)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default NotificationSettings;
