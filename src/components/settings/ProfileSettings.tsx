
import { useState, useEffect } from "react";
import { User, Camera, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { createUtilsToast } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useForm } from "react-hook-form";
import { Form } from "@/components/ui/form";

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
}

interface ProfileSettingsProps {
  profile: UserProfile;
  isUpdating: boolean;
  setIsUpdating: (value: boolean) => void;
  setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
}

const ProfileSettings = ({ profile, isUpdating, setIsUpdating, setProfile }: ProfileSettingsProps) => {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const profileForm = useForm<UserProfile>({
    defaultValues: profile
  });
  
  useEffect(() => {
    if (profile.avatar_url) {
      setAvatarUrl(profile.avatar_url);
    }
  }, [profile.avatar_url]);
  
  const handleSaveProfile = async (data: UserProfile) => {
    if (!user) return;
    
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: data.full_name,
          username: data.username,
          bio: data.bio,
          location: data.location,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
      
      if (error) {
        console.error("Error updating profile:", error);
        if (error.code === '23505') {
          createUtilsToast.error("Username is already taken");
        } else {
          createUtilsToast.error("Failed to update profile");
        }
      } else {
        createUtilsToast.success("Profile updated", "Your profile information has been updated successfully.");
      }
    } catch (error) {
      console.error("Error in profile update:", error);
      createUtilsToast.error("Something went wrong");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    const fileReader = new FileReader();
    
    fileReader.onloadend = () => {
      setImagePreview(fileReader.result as string);
    };
    
    if (file) {
      fileReader.readAsDataURL(file);
    }
  };

  const uploadAvatarToStorage = async (file: File) => {
    if (!user) return null;

    setUploading(true);
    try {
      // Check if avatars bucket exists, if not we'll use the waste-images bucket
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
      
      let bucketId = 'waste-images';
      if (!bucketsError && buckets) {
        const avatarBucket = buckets.find(b => b.id === 'avatars');
        if (avatarBucket) {
          bucketId = 'avatars';
        }
      }
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data } = await supabase.storage
        .from(bucketId)
        .upload(filePath, file);
        
      if (uploadError) {
        createUtilsToast.error("Error uploading avatar", uploadError.message);
        return null;
      }
      
      const { data: { publicUrl } } = supabase.storage
        .from(bucketId)
        .getPublicUrl(filePath);
        
      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      createUtilsToast.error("Upload failed", "Could not upload avatar image");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleAvatarUpload = async () => {
    if (!imagePreview) return;
    
    // Convert data URL to File object
    const dataURLtoFile = (dataurl: string, filename: string) => {
      const arr = dataurl.split(',');
      const mime = arr[0].match(/:(.*?);/)![1];
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      return new File([u8arr], filename, { type: mime });
    };
    
    const file = dataURLtoFile(imagePreview, `avatar-${Date.now()}.jpg`);
    const publicUrl = await uploadAvatarToStorage(file);
    
    if (publicUrl && user) {
      // Update avatar_url in user_profiles
      const { error } = await supabase
        .from('user_profiles')
        .update({ 
          avatar_url: publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) {
        console.error('Error updating avatar URL:', error);
        createUtilsToast.error("Failed to update profile with new avatar");
      } else {
        setAvatarUrl(publicUrl);
        setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
        createUtilsToast.success("Avatar updated", "Your profile picture has been updated successfully.");
        setAvatarDialogOpen(false);
      }
    }
  };

  const takePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'user'; // This will open the front camera on mobile devices
    
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (!target.files || target.files.length === 0) return;
      
      const file = target.files[0];
      const fileReader = new FileReader();
      
      fileReader.onloadend = () => {
        setImagePreview(fileReader.result as string);
      };
      
      if (file) {
        fileReader.readAsDataURL(file);
      }
    };
    
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
        <CardDescription>
          Update your profile details and personal information.
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-24 w-24">
            <AvatarImage src={avatarUrl || ""} />
            <AvatarFallback className="bg-eco text-white">
              {profile.full_name?.substring(0, 2).toUpperCase() || user?.email?.substring(0, 2).toUpperCase() || "YOU"}
            </AvatarFallback>
          </Avatar>
          
          <Dialog open={avatarDialogOpen} onOpenChange={setAvatarDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2" disabled={isUpdating}>
                <User className="h-4 w-4" />
                <span>Change Avatar</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Update profile picture</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                {imagePreview && (
                  <div className="flex justify-center mb-4">
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className="w-40 h-40 rounded-full object-cover border-2 border-eco"
                    />
                  </div>
                )}
                
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Button 
                      variant="outline" 
                      className="flex items-center gap-2 justify-center"
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e) => handleFileChange(e as any);
                        input.click();
                      }}
                      disabled={uploading}
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Image</span>
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 justify-center"
                      onClick={takePhoto}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4" />
                      <span>Take Photo</span>
                    </Button>
                  </div>
                  
                  <Button 
                    className="bg-eco hover:bg-eco-dark w-full"
                    disabled={!imagePreview || uploading}
                    onClick={handleAvatarUpload}
                  >
                    {uploading ? (
                      <span className="flex items-center">
                        <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                        Uploading...
                      </span>
                    ) : "Save Profile Picture"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Form {...profileForm}>
          <form onSubmit={profileForm.handleSubmit(handleSaveProfile)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input 
                  id="full_name" 
                  placeholder="Enter your name" 
                  {...profileForm.register("full_name")}
                  disabled={isUpdating} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username" 
                  placeholder="Enter your username" 
                  {...profileForm.register("username")}
                  disabled={isUpdating} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={user?.email || ""}
                disabled={true}
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Input 
                id="bio" 
                placeholder="Write a short bio about yourself" 
                {...profileForm.register("bio")}
                disabled={isUpdating} 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input 
                id="location" 
                placeholder="Enter your location" 
                {...profileForm.register("location")}
                disabled={isUpdating} 
              />
            </div>
            
            <Button 
              type="submit" 
              className="bg-eco hover:bg-eco-dark"
              disabled={isUpdating || !profileForm.formState.isDirty}
            >
              {isUpdating ? (
                <span className="flex items-center">
                  <span className="animate-spin h-4 w-4 mr-2 border-2 border-b-transparent rounded-full"></span>
                  Saving...
                </span>
              ) : "Save Changes"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
