
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }

    const { base64Image, location, deviceInfo } = await req.json();
    if (!base64Image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Extract the actual base64 content from the data URL
    const base64Content = base64Image.split(',')[1];

    // Enhanced authenticity verification with device information
    const isDirectCapture = deviceInfo && deviceInfo.source === 'camera';
    const exifData = deviceInfo?.exif || {};
    const captureTime = exifData.timestamp || 'Not available';
    
    // Enhanced location data
    let locationInfo = "No location data available";
    let formattedAddress = null;
    
    if (location) {
      locationInfo = `The image was taken at latitude: ${location.latitude}, longitude: ${location.longitude}`;
      
      // If address is already resolved from the Google Maps API
      if (location.address) {
        formattedAddress = location.address;
        locationInfo += `, address: ${location.address}`;
      }

      // Attempt to get address if not provided
      if (!location.address && location.latitude && location.longitude) {
        try {
          const GOOGLE_MAPS_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
          if (GOOGLE_MAPS_API_KEY) {
            const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${GOOGLE_MAPS_API_KEY}`;
            const response = await fetch(geocodeUrl);
            const data = await response.json();
            
            if (data.status === "OK" && data.results && data.results.length > 0) {
              formattedAddress = data.results[0].formatted_address;
              locationInfo += `, address: ${formattedAddress}`;
            }
          }
        } catch (error) {
          console.error("Error fetching location details:", error);
        }
      }
    }

    // Device info for enhanced verification
    const deviceContext = deviceInfo ? 
      `This photo was taken directly from a ${deviceInfo.type || 'device'} 
       camera at ${captureTime}.
       ${deviceInfo.model ? 'Device model: ' + deviceInfo.model : ''}` : 
      'No device information available to verify authenticity.';

    // Call Gemini API for image verification with enhanced context
    const response = await fetch("https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": GEMINI_API_KEY,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { 
                text: `Analyze this image and determine if it shows genuine waste or plastic pollution. ${locationInfo}. ${deviceContext}

                VERY IMPORTANT: This should be a real image taken by a user's device. Examine the image carefully for signs it was downloaded from the internet, like watermarks, stock photo indicators, or professional studio quality. Reject images that appear to be screenshots, memes, or stock photos.

                If it's real waste, determine its size category (small, medium, or large) based on the following criteria:
                - Small: Single items or small collections that one person could easily pick up (e.g., a few bottles, a small bag of trash)
                - Medium: Moderate amounts requiring some effort to clean (e.g., a pile of trash, multiple containers)
                - Large: Significant waste that would require a team effort (e.g., dump sites, large collections)

                Provide your analysis in JSON format with keys: 
                - isWaste (boolean): whether this shows actual waste
                - isAuthenticPhoto (boolean): whether this appears to be an authentic user photo and not from the internet
                - confidence (number between 0-100)
                - description (string)
                - reason (string)
                - wasteSize (string: "small", "medium", or "large")` 
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64Content
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 1000
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    // Try to extract JSON from the text response
    let verificationResult;
    
    try {
      // Find JSON-like content within the response
      const jsonMatch = textResponse.match(/\{.*\}/s);
      if (jsonMatch) {
        verificationResult = JSON.parse(jsonMatch[0]);
        
        // Ensure wasteSize has a default value if not provided
        if (!verificationResult.wasteSize) {
          verificationResult.wasteSize = "small";
        }

        // Ensure isAuthenticPhoto field exists
        if (verificationResult.isAuthenticPhoto === undefined) {
          verificationResult.isAuthenticPhoto = isDirectCapture ? true : false;
        }
      } else {
        // If no JSON found, create a response based on text analysis & device info
        const isWaste = textResponse.toLowerCase().includes('waste') || textResponse.toLowerCase().includes('plastic');
        // Default to authentic if captured directly from camera, otherwise be cautious
        const isAuthenticPhoto = isDirectCapture;
        
        // Determine waste size based on keywords in the response
        let wasteSize = "small";
        if (textResponse.toLowerCase().includes('large') || textResponse.toLowerCase().includes('significant')) {
          wasteSize = "large";
        } else if (textResponse.toLowerCase().includes('medium') || textResponse.toLowerCase().includes('moderate')) {
          wasteSize = "medium";
        }
        
        verificationResult = {
          isWaste: isWaste,
          isAuthenticPhoto: isAuthenticPhoto,
          confidence: isDirectCapture ? 80 : 60,
          description: textResponse,
          reason: isDirectCapture ? "Direct camera capture with device metadata" : "AI text analysis",
          wasteSize: wasteSize
        };
      }
    } catch (e) {
      console.log('Error parsing AI response to JSON:', e);
      // Fallback to device info analysis
      verificationResult = {
        isWaste: textResponse.toLowerCase().includes('waste') || textResponse.toLowerCase().includes('plastic'),
        isAuthenticPhoto: isDirectCapture,
        confidence: isDirectCapture ? 70 : 50,
        description: textResponse,
        reason: isDirectCapture ? "Direct camera capture but JSON parsing failed" : "AI text analysis (JSON parsing failed)",
        wasteSize: "small" // Default to small as safest option
      };
    }

    // Include the location details in the response
    return new Response(
      JSON.stringify({ 
        verification: verificationResult,
        location: {
          coordinates: location,
          formattedAddress: formattedAddress
        },
        rawResponse: textResponse
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in verify-waste-image function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
