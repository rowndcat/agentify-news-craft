
import { toast } from "sonner";

// Define types
export interface NewsletterSections {
  news: string;
  markets: string;
  copilot: string;
}

// Function to generate the newsletter content
export const generateNewsletter = async (payload: { chatId: string; message: string }): Promise<any> => {
  try {
    console.log("Sending generateNewsletter request with payload:", payload);
    
    // Show toast to indicate request is being made
    toast.info("Sending newsletter generation request...");
    
    // Make the API request
    const response = await fetch("https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error("Failed to generate newsletter. Status:", response.status);
      throw new Error(`Failed to generate newsletter. Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Newsletter webhook response:", data);
    
    // Extract the relevant content from the webhook response
    let result: { news?: string; markets?: string; copilot?: string; newsImage?: string; marketsImage?: string; copilotImage?: string } = {};
    
    if (data && data.output) {
      console.log("Raw webhook output:", data.output);
      
      if (typeof data.output === "string") {
        try {
          // Try to parse the output as JSON
          const parsedOutput = JSON.parse(data.output);
          console.log("Parsed webhook output:", parsedOutput);
          
          // Check for section content in parsed output
          result.news = parsedOutput.news || "";
          result.markets = parsedOutput.markets || "";
          result.copilot = parsedOutput.copilot || "";
          
          // Look for image URLs with multiple possible property names
          result.newsImage = parsedOutput.newsImage || parsedOutput.news_image || parsedOutput.webViewLink || 
                            (parsedOutput.images && parsedOutput.images.news) || null;
          result.marketsImage = parsedOutput.marketsImage || parsedOutput.markets_image || 
                               (parsedOutput.images && parsedOutput.images.markets) || null;
          result.copilotImage = parsedOutput.copilotImage || parsedOutput.copilot_image || 
                               (parsedOutput.images && parsedOutput.images.copilot) || null;
          
          console.log("Extracted image URLs:", {
            newsImage: result.newsImage,
            marketsImage: result.marketsImage,
            copilotImage: result.copilotImage
          });
        } catch (error) {
          console.error("Failed to parse webhook output as JSON:", error);
          // If parsing fails, use the string as the news content
          result.news = data.output;
        }
      } else if (typeof data.output === "object") {
        // Output is already an object
        console.log("Webhook output is already an object");
        
        result.news = data.output.news || "";
        result.markets = data.output.markets || "";
        result.copilot = data.output.copilot || "";
        
        // Extract image URLs with various possible property names
        result.newsImage = data.output.newsImage || data.output.news_image || 
                         (data.output.images && data.output.images.news) || 
                         data.output.webViewLink || null;
        result.marketsImage = data.output.marketsImage || data.output.markets_image || 
                            (data.output.images && data.output.images.markets) || null;
        result.copilotImage = data.output.copilotImage || data.output.copilot_image || 
                            (data.output.images && data.output.images.copilot) || null;
        
        console.log("Extracted image URLs from object:", {
          newsImage: result.newsImage,
          marketsImage: result.marketsImage,
          copilotImage: result.copilotImage
        });
      }
    }
    
    return result;
  } catch (error) {
    console.error("Error in generateNewsletter:", error);
    throw error;
  }
};

// Function to regenerate a specific section
export const regenerateSection = async (
  section: "news" | "markets" | "copilot",
  chatId: string,
  instructions?: string
): Promise<string> => {
  try {
    console.log(`Regenerating ${section} section with chatId: ${chatId}`);
    console.log("Instructions:", instructions || "None provided");
    
    // Prepare the payload
    const payload = {
      chatId,
      message: `regenerate ${section} section`,
      instructions: instructions || undefined,
    };
    
    // Make the API request
    const response = await fetch("https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error(`Failed to regenerate ${section} section. Status:`, response.status);
      throw new Error(`Failed to regenerate ${section} section. Status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`Regenerate ${section} webhook response:`, data);
    
    // Extract the content from the response
    let result = "";
    
    if (data && data.output) {
      if (typeof data.output === "string") {
        try {
          // Try to parse the output as JSON
          const parsedOutput = JSON.parse(data.output);
          result = parsedOutput[section] || parsedOutput.content || parsedOutput.text || data.output;
        } catch (error) {
          // If parsing fails, use the string as the content
          result = data.output;
        }
      } else if (typeof data.output === "object") {
        // If output is already an object, extract the relevant section
        result = data.output[section] || data.output.content || data.output.text || "";
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error in regenerateSection (${section}):`, error);
    throw error;
  }
};

// Function to generate section image
export const generateSectionImage = async (section: "news" | "markets" | "copilot", content: string): Promise<string | null> => {
  try {
    console.log(`Generating image for ${section} section with content length:`, content.length);
    
    // Prepare the payload - add section type for easier identification on webhook side
    const payload = {
      section_type: section,
      news_text: content.substring(0, 1000) // Limit to 1000 chars to avoid payload size issues
    };
    
    console.log(`Image generation payload for ${section}:`, payload);
    
    // Make the API request
    const response = await fetch("https://agentify360.app.n8n.cloud/webhook/76840a22-558d-4fae-9f51-aadcd7c3fb7f", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    
    if (!response.ok) {
      console.error(`Failed to generate image for ${section} section. Status:`, response.status);
      
      // Try to get error text if available
      const errorText = await response.text();
      console.error("Error response body:", errorText);
      
      throw new Error(`Failed to generate image for ${section} section. Status: ${response.status}`);
    }
    
    // Get the content type to determine how to parse the response
    const contentType = response.headers.get("content-type");
    console.log(`Image generation response content type for ${section}:`, contentType);
    
    let result = null;
    
    // Handle the response based on content type
    if (contentType && contentType.includes("application/json")) {
      const data = await response.json();
      console.log(`Image generation JSON response for ${section}:`, data);
      
      // Look for webViewLink - this is the main property we expect
      if (data && data.webViewLink) {
        console.log(`Found webViewLink for ${section}:`, data.webViewLink);
        result = data.webViewLink;
      } 
      // Also check for imageURL property as an alternative
      else if (data && data.imageURL) {
        console.log(`Found imageURL for ${section}:`, data.imageURL);
        result = data.imageURL;
      }
      // Look for image URL in other common structures
      else if (data && data.output && data.output.webViewLink) {
        console.log(`Found output.webViewLink for ${section}:`, data.output.webViewLink);
        result = data.output.webViewLink;
      }
      // Special case for direct URL return
      else if (data && typeof data === 'string' && data.startsWith('http')) {
        console.log(`Found direct URL string for ${section}:`, data);
        result = data;
      }
      // Check for any URL-like property in the response
      else {
        console.log(`Searching for URL-like property in response for ${section}`);
        const urlProps = findUrlProperties(data);
        if (urlProps.length > 0) {
          console.log(`Found URL properties for ${section}:`, urlProps);
          result = urlProps[0].value;
        } else {
          console.warn(`No URL found in response for ${section}`);
        }
      }
    } else {
      // Not JSON, try to handle as text
      const textResponse = await response.text();
      console.log(`Non-JSON response for ${section} image generation:`, textResponse);
      
      // Check if the text response is a URL
      if (textResponse && textResponse.trim().startsWith('http')) {
        result = textResponse.trim();
        console.log(`Found URL in text response for ${section}:`, result);
      } else {
        console.warn(`No URL found in text response for ${section}`);
      }
    }
    
    return result;
  } catch (error) {
    console.error(`Error in generateSectionImage (${section}):`, error);
    throw error;
  }
};

// Helper function to recursively find URL properties in an object
function findUrlProperties(obj: any, path = ''): {path: string, value: string}[] {
  const results: {path: string, value: string}[] = [];
  
  if (!obj || typeof obj !== 'object') return results;
  
  for (const [key, value] of Object.entries(obj)) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof value === 'string' && isUrl(value)) {
      results.push({path: currentPath, value});
    } else if (typeof value === 'object' && value !== null) {
      results.push(...findUrlProperties(value, currentPath));
    }
  }
  
  return results;
}

// Helper to check if a string is a URL
function isUrl(str: string): boolean {
  try {
    // Simple check for http/https URLs
    return /^https?:\/\//i.test(str);
  } catch (e) {
    return false;
  }
}
