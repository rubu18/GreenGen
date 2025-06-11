import { useState, useEffect, useRef } from "react";
import { Camera, Upload, CheckCircle, XCircle, Loader2, MapPin, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import Layout from "@/components/Layout";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { createUtilsToast } from "@/lib/utils";
import { updateUserTokensForReport } from "@/utils/rewardUtils";

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
}

interface DeviceInfo {
  source: 'camera' | 'upload';
  type?: string;
  model?: string;
  exif?: {
    timestamp?: string;
    [key: string]: any;
  };
}

const ReportWaste = () => {
  const [title, setTitle] = useState("");
  const [wasteSize, setWasteSize] = useState<string>("small");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verification, setVerification] = useState<{
    isWaste: boolean;
    isAuthenticPhoto?: boolean;
    confidence: number;
    description: string;
    reason: string;
    wasteSize?: string;
  } | null>(null);
  const [geoLocation, setGeoLocation] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationAttempts, setLocationAttempts] = useState(0);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  
  // Enhanced location function with better handling for poor accuracy
  const getCurrentLocation = (isRetry = false) => {
    setLocationLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser. Please enter your location manually.");
      setLocationLoading(false);
      return;
    }

    // Increment attempts and limit to 2 total attempts
    const currentAttempt = isRetry ? locationAttempts + 1 : 1;
    
    if (currentAttempt > 2) {
      setLocationError("Unable to get precise location after multiple attempts. Please enter your location manually.");
      setLocationLoading(false);
      return;
    }
    
    setLocationAttempts(currentAttempt);
    
    // Enhanced geolocation options - more aggressive for better accuracy
    const options = {
      enableHighAccuracy: true,
      timeout: 15000, // Increased timeout
      maximumAge: 0, // Always get fresh location
    };
    
    const successCallback = async (position: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = position.coords;
      
      console.log(`Location attempt ${currentAttempt}: Lat ${latitude}, Long ${longitude}, Accuracy: ${accuracy}m`);
      
      // Check if accuracy is reasonable (less than 1000m)
      const isGoodAccuracy = accuracy && accuracy < 1000;
      const isAcceptableAccuracy = accuracy && accuracy < 5000; // 5km threshold
      
      // Update geoLocation state with coordinates
      setGeoLocation({
        latitude,
        longitude,
        accuracy
      });
      
      // Show coordinate format first, then try to get address
      const coordsString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      
      if (!isAcceptableAccuracy) {
        // Very poor accuracy - suggest manual entry
        setLocation(coordsString);
        toast("Location found but accuracy is poor", {
          description: `Accuracy: ±${Math.round(accuracy || 0)}m. Please verify or enter your location manually for better results.`,
          icon: "⚠️",
        });
        setLocationLoading(false);
        return;
      }
      
      // Set initial location with coordinates
      setLocation(coordsString);
      
      try {
        // Try to get address from coordinates using reverse geocoding
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
          { 
            headers: { 
              'Accept-Language': 'en',
              'User-Agent': 'WasteTracker/1.0'
            } 
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          if (data && data.display_name) {
            const address = data.display_name;
            setGeoLocation(prevState => ({
              ...prevState!,
              address
            }));
            // Update location input with actual address
            setLocation(address);
          }
        }
      } catch (error) {
        console.error("Error getting address:", error);
        // Keep coordinates if address lookup fails
      }
      
      // Show appropriate toast message based on accuracy
      if (isGoodAccuracy) {
        toast("Location found!", {
          description: `Accuracy: ±${Math.round(accuracy || 0)}m`,
          icon: "✅",
        });
      } else {
        toast("Location found", {
          description: `Accuracy: ±${Math.round(accuracy || 0)}m. You can manually refine the location if needed.`,
          icon: "📍",
        });
      }
      
      setLocationLoading(false);
    };

    const errorCallback = (error: GeolocationPositionError) => {
      console.error("Geolocation error:", error);
      
      let errorMessage = "Error getting location. Please enter your location manually.";
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = "Location permission denied. Please allow location access or enter your location manually.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable. Please check your GPS settings or enter your location manually.";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out. Please try again or enter your location manually.";
          break;
      }
      
      setLocationError(errorMessage);
      setLocationLoading(false);
    };
    
    navigator.geolocation.getCurrentPosition(successCallback, errorCallback, options);
  };

  // Handle camera capture specifically
  const handleCameraCapture = () => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };
  
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const preview = reader.result as string;
        setImagePreview(preview);
        
        // Determine if this was a camera capture or file upload
        // The accept attribute is what we use to detect if it's a camera input
        const source = e.target.accept?.includes('capture=camera') ? 'camera' : 'upload';
        
        // Create device info object
        const newDeviceInfo: DeviceInfo = {
          source,
          type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
          model: navigator.userAgent,
          exif: {
            timestamp: new Date().toISOString(),
          }
        };
        
        setDeviceInfo(newDeviceInfo);
        
        // Get location when image is uploaded if not already set
        if (!geoLocation) {
          getCurrentLocation();
        }
        
        // Only verify after a short delay to ensure we might have location
        setTimeout(() => {
          verifyImage(preview, newDeviceInfo);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const verifyImage = async (base64Image: string, deviceContext: DeviceInfo | null) => {
    setVerifying(true);
    setVerification(null);
    
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw new Error("Authentication error");
      }
      
      const { data, error } = await supabase.functions.invoke('verify-waste-image', {
        body: { 
          base64Image,
          location: geoLocation,
          deviceInfo: deviceContext
        },
      });
      
      if (error) {
        throw error;
      }
      
      console.log("Verification response:", data);
      
      if (data.verification) {
        setVerification(data.verification);
        
        // Set the waste size based on AI classification
        if (data.verification.wasteSize) {
          setWasteSize(data.verification.wasteSize);
        }
        
        // Check if image is authentic AND shows waste
        if (!data.verification.isAuthenticPhoto) {
          toast("Image not verified", {
            description: "This appears to be an image from the internet, not a real photo taken by you.",
            icon: "error",
          });
        } else if (!data.verification.isWaste) {
          toast("Verification failed", {
            description: data.verification.reason,
            icon: "error",
          });
        } else {
          toast("Image verified successfully", {
            description: `AI has classified this as ${data.verification.wasteSize || 'small'} waste.`,
            icon: "success",
          });
        }
        
        // Update location if received from verification
        if (data.location?.formattedAddress && (!geoLocation?.address || location.indexOf('(') === -1)) {
          setLocation(data.location.formattedAddress);
          setGeoLocation(prev => ({
            ...prev!,
            address: data.location.formattedAddress
          }));
        }
      } else {
        throw new Error("Invalid verification response");
      }
    } catch (error: any) {
      console.error("Error verifying image:", error);
      toast("Error verifying image", {
        description: error.message || "Please try again with a different image",
        icon: "error",
      });
    } finally {
      setVerifying(false);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      createUtilsToast.error("Authentication Error", "Please login to submit a report");
      return;
    }
    
    // Check if image is verified as waste
    if (verification) {
      if (!verification.isAuthenticPhoto) {
        toast("Cannot submit report", {
          description: "The image does not appear to be a real photo taken by you. Please use your camera to capture the waste directly.",
          icon: "error",
        });
        return;
      }
      
      if (!verification.isWaste) {
        toast("Cannot submit report", {
          description: "The image was not verified as waste. Please upload a different image.",
          icon: "error",
        });
        return;
      }
    }
    
    setSubmitting(true);
    
    try {
      let imageUrl = null;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;
        
        console.log("Uploading image to waste-images bucket...");
        
        const { error: uploadError } = await supabase.storage
          .from('waste-images')
          .upload(filePath, imageFile);
          
        if (uploadError) {
          console.error("Upload error:", uploadError);
          throw new Error(`Error uploading image: ${uploadError.message}`);
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('waste-images')
          .getPublicUrl(filePath);
          
        imageUrl = publicUrl;
        console.log("Image uploaded successfully:", imageUrl);
      }
      
      console.log("Inserting waste report...");
      const { error } = await supabase
        .from('waste_reports')
        .insert({
          user_id: user.id,
          title,
          description,
          location,
          waste_size: wasteSize,
          image_url: imageUrl,
          status: 'approved' // Auto-approve for now
        });
        
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      
      console.log("Waste report submitted successfully");
      
      // Award tokens to the user
      console.log("Awarding tokens to user...");
      const tokenSuccess = await updateUserTokensForReport(user.id, wasteSize, title);
      
      if (tokenSuccess) {
        createUtilsToast.success(
          "Report submitted successfully!",
          `You've earned ${wasteSize === "small" ? "5" : wasteSize === "medium" ? "15" : "30"} tokens for your contribution!`
        );
      } else {
        createUtilsToast.success(
          "Report submitted successfully!",
          "Your report has been submitted for review."
        );
      }
      
      // Reset form
      setTitle("");
      setDescription("");
      setLocation("");
      setWasteSize("small");
      setImageFile(null);
      setImagePreview(null);
      setVerification(null);
      setGeoLocation(null);
      setDeviceInfo(null);
      setLocationAttempts(0);
      setLocationError(null);
      
    } catch (error: any) {
      console.error("Error submitting report:", error);
      createUtilsToast.error(
        "Error submitting report",
        error.message || "Please try again later"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const renderLocationSection = () => {
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center mb-1">
          <Label htmlFor="location" className="text-base">Location</Label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => getCurrentLocation()}
              className="flex items-center gap-1 bg-eco-light/40 hover:bg-eco-light border-eco-light"
              disabled={locationLoading}
            >
              {locationLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Getting location...</span>
                </>
              ) : (
                <>
                  <MapPin className="h-4 w-4 text-eco" />
                  <span>Get GPS location</span>
                </>
              )}
            </Button>
          </div>
        </div>
        <Input
          id="location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Enter the location where you found the waste (e.g., '123 Main St, City' or 'Near Central Park')"
          className="border-eco/30 focus:border-eco focus:ring-eco"
          required
        />
        
        {/* Location suggestions for manual entry */}
        <div className="text-xs text-muted-foreground">
          💡 Tip: Be specific with your location (street address, landmark, or area name) for better tracking
        </div>
        
        {locationError && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">{locationError}</p>
            <p className="text-xs text-yellow-600 mt-1">
              You can manually type your location above (e.g., "Main Street, Downtown" or "Near City Hall")
            </p>
          </div>
        )}
        
        {geoLocation && (
          <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
            <MapPin className="h-3 w-3" />
            <span>
              GPS accuracy: ±{Math.round(geoLocation.accuracy || 0)}m
              {geoLocation.accuracy && geoLocation.accuracy < 100 && (
                <span className="text-green-600 ml-1">(Excellent)</span>
              )}
              {geoLocation.accuracy && geoLocation.accuracy >= 100 && geoLocation.accuracy < 500 && (
                <span className="text-blue-600 ml-1">(Good)</span>
              )}
              {geoLocation.accuracy && geoLocation.accuracy >= 500 && geoLocation.accuracy < 2000 && (
                <span className="text-yellow-600 ml-1">(Fair - consider manual entry)</span>
              )}
              {geoLocation.accuracy && geoLocation.accuracy >= 2000 && (
                <span className="text-red-600 ml-1">(Poor - manual entry recommended)</span>
              )}
            </span>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <Layout>
      <div className="max-w-2xl mx-auto px-4">
        <div className="mb-8 text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold mb-3 flex items-center md:justify-start justify-center gap-3">
            <div className="h-10 w-10 rounded-full bg-eco-light flex items-center justify-center">
              <MapPin className="h-5 w-5 text-eco" />
            </div>
            Report Waste
          </h1>
          <p className="text-gray-600 max-w-lg">
            Help us track and clean up plastic waste by reporting what you find. Your contributions earn you tokens and make our environment cleaner.
          </p>
        </div>
        
        <Card className="border-eco/10 shadow-md overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-eco-light/30 to-transparent border-b border-eco/10">
            <CardTitle>New Waste Report</CardTitle>
            <CardDescription>
              Upload a photo of the waste and provide details to earn rewards.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                {/* Title */}
                <div>
                  <Label htmlFor="title" className="text-base mb-2 block">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Brief title for your report"
                    className="border-eco/30 focus:border-eco focus:ring-eco"
                    required
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <Label className="text-base mb-2 block">
                    Upload Image
                  </Label>
                  
                  {imagePreview ? (
                    <div className="relative rounded-lg overflow-hidden bg-black/5 border border-eco/10">
                      <img
                        src={imagePreview}
                        alt="Waste preview"
                        className="w-full h-64 object-cover"
                      />
                      <div className="absolute top-3 right-3 flex space-x-2">
                        {verifying ? (
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            disabled
                            className="bg-white/70 backdrop-blur-sm shadow-sm"
                          >
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Verifying...
                          </Button>
                        ) : verification ? (
                          <Button
                            type="button"
                            variant={verification.isWaste && verification.isAuthenticPhoto ? "default" : "destructive"}
                            size="sm"
                            className={verification.isWaste && verification.isAuthenticPhoto ? 
                              "bg-green-500 hover:bg-green-600" : 
                              "bg-red-500 hover:bg-red-600"
                            }
                          >
                            {verification.isWaste && verification.isAuthenticPhoto ? (
                              <CheckCircle className="h-4 w-4 mr-2" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            {verification.isWaste && verification.isAuthenticPhoto ? "Verified" : "Not Verified"}
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setImagePreview(null);
                            setImageFile(null);
                            setVerification(null);
                            setGeoLocation(null);
                            setDeviceInfo(null);
                            setLocationAttempts(0);
                          }}
                        >
                          Remove
                        </Button>
                      </div>
                      
                      {verification && (
                        <Alert className="mt-3" variant={verification.isWaste && verification.isAuthenticPhoto ? "default" : "destructive"}>
                          <AlertTitle className="flex items-center">
                            {!verification.isAuthenticPhoto ? (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Not a genuine photo
                              </>
                            ) : verification.isWaste ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Verified as {verification.wasteSize || 'small'} waste ({verification.confidence}% confidence)
                              </>
                            ) : (
                              <>
                                <XCircle className="h-4 w-4 mr-2" />
                                Not verified as waste
                              </>
                            )}
                          </AlertTitle>
                          <AlertDescription className="text-sm mt-1">
                            {!verification.isAuthenticPhoto 
                              ? "This appears to be an image from the internet, not a real photo taken by you."
                              : verification.reason}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div 
                        className="border-2 border-dashed border-eco rounded-xl p-8 text-center cursor-pointer hover:border-eco-dark bg-eco-light/20 hover:bg-eco-light/30 transition-all duration-200"
                        onClick={() => {
                          if (navigator.userAgent.includes('Mobile')) {
                            if (cameraInputRef.current) {
                              cameraInputRef.current.click();
                            }
                          } else {
                            toast("Camera Access", {
                              description: "On desktop browsers, camera access may be limited. Consider using the file upload option if the camera doesn't work.",
                            });
                            if (cameraInputRef.current) {
                              cameraInputRef.current.click();
                            }
                          }
                        }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-eco-light/60 flex items-center justify-center">
                          <Camera className="h-8 w-8 text-eco" />
                        </div>
                        <p className="text-lg font-medium text-eco-dark mb-2">Take a Photo</p>
                        <p className="text-sm text-gray-600">Use your camera to capture waste directly</p>
                        <input
                          ref={cameraInputRef}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                      
                      <div className="flex items-center">
                        <div className="flex-grow border-t border-gray-300"></div>
                        <span className="mx-4 text-gray-500 text-sm">OR</span>
                        <div className="flex-grow border-t border-gray-300"></div>
                      </div>
                      
                      <div 
                        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click();
                          }
                        }}
                      >
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                          <Upload className="h-8 w-8 text-gray-500" />
                        </div>
                        <p className="text-base text-gray-700 mb-1">Upload from device</p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                        <input
                          ref={fileInputRef}
                          id="waste-image"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImageChange}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Waste Size - AI Determined */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-base">Waste Size</Label>
                    {verification && verification.wasteSize && (
                      <span className="text-sm bg-eco-light/30 text-eco-dark px-2 py-1 rounded-full">
                        AI classified as: {verification.wasteSize}
                      </span>
                    )}
                  </div>
                  <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                    <RadioGroup
                      value={wasteSize}
                      onValueChange={setWasteSize}
                      className="flex flex-col sm:flex-row gap-4"
                    >
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white transition-colors">
                        <RadioGroupItem value="small" id="small" className="text-eco border-eco" />
                        <Label htmlFor="small" className="font-medium flex items-center gap-2">
                          <span className="text-eco bg-eco/10 h-6 w-6 flex items-center justify-center rounded-full text-xs">5</span>
                          Small (5 tokens)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white transition-colors">
                        <RadioGroupItem value="medium" id="medium" className="text-eco border-eco" />
                        <Label htmlFor="medium" className="font-medium flex items-center gap-2">
                          <span className="text-eco bg-eco/10 h-6 w-6 flex items-center justify-center rounded-full text-xs">15</span>
                          Medium (15 tokens)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white transition-colors">
                        <RadioGroupItem value="large" id="large" className="text-eco border-eco" />
                        <Label htmlFor="large" className="font-medium flex items-center gap-2">
                          <span className="text-eco bg-eco/10 h-6 w-6 flex items-center justify-center rounded-full text-xs">30</span>
                          Large (30 tokens)
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>
                
                {/* Location */}
                {renderLocationSection()}
                
                {/* Description */}
                <div>
                  <Label htmlFor="description" className="text-base mb-2 block">
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide additional details about the waste"
                    className="min-h-[120px] border-eco/30 focus:border-eco focus:ring-eco resize-none"
                  />
                </div>
              </div>
            </form>
          </CardContent>
          
          <CardFooter className="flex justify-end border-t border-eco/10 pt-6">
            <Button 
              className="bg-eco hover:bg-eco-dark w-full sm:w-auto text-base font-medium shadow-md hover:shadow-lg"
              onClick={handleSubmit}
              size="lg"
              disabled={
                !title || 
                !location || 
                submitting || 
                verifying || 
                (verification && (!verification.isWaste || !verification.isAuthenticPhoto))
              }
            >
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5" />
                  Submit Report
                  <ArrowRight className="h-4 w-4 ml-1 opacity-70" />
                </div>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </Layout>
  );
};

export default ReportWaste;
