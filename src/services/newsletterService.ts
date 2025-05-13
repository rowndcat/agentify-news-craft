
import { toast } from "sonner";

// Define types
export interface NewsletterSections {
  news: string;
  markets: string;
  copilot: string;
}

// Function to generate the newsletter content with improved timeout and array handling
export const generateNewsletter = async (payload: { chatId: string; message: string }): Promise<any> => {
  try {
    console.log("Sending generateNewsletter request with payload:", payload);
    
    // Show toast to indicate request is being made
    toast.info("Sending newsletter generation request...");
    
    // Create an AbortController for timeout management
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 second timeout
    
    try {
      // Make the API request with timeout
      const response = await fetch("https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if fetch completes
      
      if (!response.ok) {
        console.error("Failed to generate newsletter. Status:", response.status);
        throw new Error(`Failed to generate newsletter. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("Newsletter webhook response:", data);
      
      // Extract the relevant content from the webhook response - handle both array and object formats
      let result: { news?: string; markets?: string; copilot?: string; newsImage?: string; marketsImage?: string; copilotImage?: string } = {};
      
      // Check if the response is an array (new format)
      if (Array.isArray(data)) {
        console.log("Response is an array format");
        // Get the first item with output
        const firstItem = data.find(item => item.output);
        
        if (firstItem && firstItem.output) {
          // Process the output from the array item
          return processOutputContent(firstItem.output);
        } else {
          console.error("No output found in array response", data);
          throw new Error("No output found in the webhook response array");
        }
      } else {
        // Handle original object format
        return processOutputContent(data.output);
      }
      
    } catch (error) {
      clearTimeout(timeoutId); // Clear the timeout on error too
      
      if (error.name === 'AbortError') {
        console.error("Request timed out after 90 seconds");
        throw new Error("Request timed out after 90 seconds. The webhook might be taking too long to respond.");
      }
      
      throw error; // Re-throw all other errors
    }
  } catch (error) {
    console.error("Error in generateNewsletter:", error);
    throw error;
  }
};

// Helper function to process the output content from the webhook response
function processOutputContent(output: any): { news: string; markets: string; copilot: string; newsImage?: string; marketsImage?: string; copilotImage?: string } {
  let result: { news: string; markets: string; copilot: string; newsImage?: string; marketsImage?: string; copilotImage?: string } = {
    news: "",
    markets: "",
    copilot: ""
  };
  
  console.log("Processing output:", typeof output, output instanceof Object ? "is object" : "is not object");
  
  if (typeof output === "string") {
    // Check if this is a JSON string
    try {
      const parsedOutput = JSON.parse(output);
      console.log("Parsed output from string:", parsedOutput);
      return extractContentFromStructure(parsedOutput);
    } catch (error) {
      console.log("Output is not a valid JSON string, processing as raw text");
      
      // If this is clearly a markdown formatted string with sections
      if (output.includes("**News Section**") || output.includes("### **News Section**")) {
        console.log("Found markdown formatted sections in string");
        return extractSectionsFromMarkdown(output);
      } else {
        // Default to assigning to news section if we can't parse it properly
        result.news = output;
      }
    }
  } else if (output && typeof output === "object") {
    // Output is already an object
    return extractContentFromStructure(output);
  } else if (!output) {
    console.error("Empty or null output received");
    throw new Error("Empty or null content received from webhook");
  }
  
  return result;
}

// Extract sections from a structured object
function extractContentFromStructure(data: any): { news: string; markets: string; copilot: string; newsImage?: string; marketsImage?: string; copilotImage?: string } {
  let result: { news: string; markets: string; copilot: string; newsImage?: string; marketsImage?: string; copilotImage?: string } = {
    news: "",
    markets: "",
    copilot: ""
  };
  
  // Look for direct section keys in various formats
  result.news = findContentByKeys(data, ["news", "AI News piece", "newsSection", "News Section"]);
  result.markets = findContentByKeys(data, ["markets", "economy", "marketsSection", "Economy & Markets Section", "Markets & Economy"]);
  result.copilot = findContentByKeys(data, ["copilot", "copilotSection", "AI Copilot", "Copilot Section"]);
  
  // Check for sections array
  if (data.sections && Array.isArray(data.sections)) {
    console.log("Processing sections array:", data.sections);
    data.sections.forEach((section: any) => {
      if (!section) return;
      
      if (section.type === "news" || 
         (section.title && section.title.toLowerCase().includes("news"))) {
        result.news = section.content || section.text || "";
      }
      if (section.type === "markets" || 
         (section.title && (section.title.toLowerCase().includes("market") || 
                            section.title.toLowerCase().includes("economy")))) {
        result.markets = section.content || section.text || "";
      }
      if (section.type === "copilot" || 
         (section.title && (section.title.toLowerCase().includes("copilot") || 
                            section.title.toLowerCase().includes("ai assistant")))) {
        result.copilot = section.content || section.text || "";
      }
    });
  }
  
  // Check for content object as fallback
  if ((!result.news || !result.markets || !result.copilot) && data.content) {
    if (typeof data.content === 'object') {
      if (!result.news) result.news = data.content.news || "";
      if (!result.markets) result.markets = data.content.markets || data.content.economy || "";
      if (!result.copilot) result.copilot = data.content.copilot || "";
    }
  }
  
  // Extract image URLs
  result.newsImage = findContentByKeys(data, ["newsImage", "news_image", "webViewLink"]);
  result.marketsImage = findContentByKeys(data, ["marketsImage", "markets_image"]);
  result.copilotImage = findContentByKeys(data, ["copilotImage", "copilot_image"]);
  
  // Check for images in an images object
  if (data.images) {
    if (!result.newsImage) result.newsImage = data.images.news || null;
    if (!result.marketsImage) result.marketsImage = data.images.markets || null;
    if (!result.copilotImage) result.copilotImage = data.images.copilot || null;
  }
  
  return result;
}

// Helper function to find content by multiple possible keys
function findContentByKeys(obj: any, keys: string[]): string | null {
  if (!obj || typeof obj !== 'object') return null;
  
  for (const key of keys) {
    if (obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return null;
}

// Extract sections from markdown formatted text
function extractSectionsFromMarkdown(markdown: string): { news: string; markets: string; copilot: string } {
  const result = {
    news: "",
    markets: "",
    copilot: ""
  };
  
  // Define patterns to find where each section begins
  const newsPattern = /(?:##?\s*\*?\*?News\s*Section\*?\*?|##?\s*\*?\*?AI\s*News\*?\*?)/i;
  const marketsPattern = /(?:##?\s*\*?\*?Economy\s*&\s*Markets\s*Section\*?\*?|##?\s*\*?\*?Markets\s*&\s*Economy\*?\*?)/i;
  const copilotPattern = /(?:##?\s*\*?\*?Copilot\s*Section\*?\*?|##?\s*\*?\*?AI\s*Copilot\*?\*?)/i;
  
  // Find the starting positions of each section
  const newsMatch = markdown.match(newsPattern);
  const marketsMatch = markdown.match(marketsPattern);
  const copilotMatch = markdown.match(copilotPattern);
  
  // Extract sections based on their positions in the string
  if (newsMatch) {
    const newsStart = newsMatch.index;
    let newsEnd = markdown.length;
    
    // If we find another section after news, set the end of news section
    if (marketsMatch && marketsMatch.index! > newsStart!) {
      newsEnd = marketsMatch.index!;
    } else if (copilotMatch && copilotMatch.index! > newsStart!) {
      newsEnd = copilotMatch.index!;
    }
    
    result.news = markdown.substring(newsStart!, newsEnd).trim();
  }
  
  if (marketsMatch) {
    const marketsStart = marketsMatch.index;
    let marketsEnd = markdown.length;
    
    // If we find copilot section after markets, set the end of markets section
    if (copilotMatch && copilotMatch.index! > marketsStart!) {
      marketsEnd = copilotMatch.index!;
    }
    
    result.markets = markdown.substring(marketsStart!, marketsEnd).trim();
  }
  
  if (copilotMatch) {
    result.copilot = markdown.substring(copilotMatch.index!).trim();
  }
  
  return result;
}

// Function to regenerate a specific section with improved timeout
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
    
    // Create an AbortController for timeout management
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      // Make the API request with timeout
      const response = await fetch("https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if fetch completes
      
      if (!response.ok) {
        console.error(`Failed to regenerate ${section} section. Status:`, response.status);
        throw new Error(`Failed to regenerate ${section} section. Status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`Regenerate ${section} webhook response:`, data);
      
      // Handle array response format (new format)
      if (Array.isArray(data)) {
        const firstItem = data.find(item => item.output);
        if (firstItem && firstItem.output) {
          const processed = processOutputContent(firstItem.output);
          return processed[section] || "";
        }
      }
      
      // Extract the content from the response (old format)
      let result = "";
      
      if (data && data.output) {
        if (typeof data.output === "string") {
          try {
            // Try to parse the output as JSON
            const parsedOutput = JSON.parse(data.output);
            result = parsedOutput[section] || parsedOutput.content || parsedOutput.text || data.output;
          } catch (error) {
            // If parsing fails, use the string as the content
            if (data.output.includes(`${section.charAt(0).toUpperCase() + section.slice(1)} Section`)) {
              result = data.output;
            } else {
              result = data.output;
            }
          }
        } else if (typeof data.output === "object") {
          // If output is already an object, extract the relevant section
          result = data.output[section] || data.output.content || data.output.text || "";
        }
      }
      
      // If no content was found, try one more approach with the raw data
      if (!result && data) {
        result = data[section] || data.content || data.text || "";
      }
      
      return result;
    } catch (error) {
      clearTimeout(timeoutId); // Clear the timeout on error too
      
      if (error.name === 'AbortError') {
        console.error(`Request timed out after 60 seconds when regenerating ${section} section`);
        throw new Error(`Request timed out. The webhook might be taking too long to respond.`);
      }
      
      throw error; // Re-throw all other errors
    }
  } catch (error) {
    console.error(`Error in regenerateSection (${section}):`, error);
    throw error;
  }
};

// Function to generate section image with improved timeout
export const generateSectionImage = async (section: "news" | "markets" | "copilot", content: string): Promise<string | null> => {
  try {
    console.log(`Generating image for ${section} section with content length:`, content.length);
    
    // Prepare the payload - add section type for easier identification on webhook side
    const payload = {
      section_type: section,
      news_text: content.substring(0, 1000) // Limit to 1000 chars to avoid payload size issues
    };
    
    console.log(`Image generation payload for ${section}:`, payload);
    
    // Create an AbortController for timeout management
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    try {
      // Make the API request with timeout
      const response = await fetch("https://agentify360.app.n8n.cloud/webhook/76840a22-558d-4fae-9f51-aadcd7c3fb7f", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId); // Clear the timeout if fetch completes
      
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
        const textResponse = await (response.bodyUsed ? response.clone().text() : response.text());
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
      clearTimeout(timeoutId); // Clear the timeout on error too
      
      if (error.name === 'AbortError') {
        console.error(`Image generation for ${section} timed out after 60 seconds`);
        throw new Error(`Request timed out. The image generation webhook may be taking too long to respond.`);
      }
      
      throw error; // Re-throw all other errors
    }
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
