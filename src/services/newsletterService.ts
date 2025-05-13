
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
          
          // Look for section content in common formats
          // First check - direct properties for sections
          result.news = parsedOutput.news || parsedOutput["AI News piece"] || parsedOutput.newsSection || "";
          result.markets = parsedOutput.markets || parsedOutput.economy || parsedOutput.marketsSection || parsedOutput["Economy & Markets Section"] || "";
          result.copilot = parsedOutput.copilot || parsedOutput.copilotSection || parsedOutput["AI Copilot"] || parsedOutput["Copilot Section"] || "";
          
          // Second check - try common content fields if sections are still empty
          if (!result.news && parsedOutput.content) {
            if (typeof parsedOutput.content === 'object' && parsedOutput.content.news) {
              result.news = parsedOutput.content.news;
            } else if (typeof parsedOutput.content === 'string' && 
                      (parsedOutput.content.includes("News Section") || 
                       parsedOutput.content.includes("AI News piece"))) {
              result.news = parsedOutput.content;
            }
          }
          
          if (!result.markets && parsedOutput.content) {
            if (typeof parsedOutput.content === 'object' && parsedOutput.content.markets) {
              result.markets = parsedOutput.content.markets;
            } else if (typeof parsedOutput.content === 'string' && 
                      (parsedOutput.content.includes("Economy & Markets") || 
                       parsedOutput.content.includes("Markets Section"))) {
              result.markets = parsedOutput.content;
            }
          }
          
          if (!result.copilot && parsedOutput.content) {
            if (typeof parsedOutput.content === 'object' && parsedOutput.content.copilot) {
              result.copilot = parsedOutput.content.copilot;
            } else if (typeof parsedOutput.content === 'string' && 
                      (parsedOutput.content.includes("Copilot") || 
                       parsedOutput.content.includes("AI Copilot"))) {
              result.copilot = parsedOutput.content;
            }
          }
          
          // If the output contains sections array, process it
          if (parsedOutput.sections && Array.isArray(parsedOutput.sections)) {
            console.log("Processing sections array:", parsedOutput.sections);
            parsedOutput.sections.forEach((section: any) => {
              if (section.type === "news" || section.title?.toLowerCase().includes("news")) {
                result.news = section.content || section.text || "";
              }
              if (section.type === "markets" || section.title?.toLowerCase().includes("market") || 
                  section.title?.toLowerCase().includes("economy")) {
                result.markets = section.content || section.text || "";
              }
              if (section.type === "copilot" || section.title?.toLowerCase().includes("copilot") || 
                  section.title?.toLowerCase().includes("ai assistant")) {
                result.copilot = section.content || section.text || "";
              }
            });
          }
          
          // Look for image URLs with multiple possible property names
          result.newsImage = parsedOutput.newsImage || parsedOutput.news_image || parsedOutput.webViewLink || 
                            (parsedOutput.images && parsedOutput.images.news) || null;
          result.marketsImage = parsedOutput.marketsImage || parsedOutput.markets_image || 
                               (parsedOutput.images && parsedOutput.images.markets) || null;
          result.copilotImage = parsedOutput.copilotImage || parsedOutput.copilot_image || 
                               (parsedOutput.images && parsedOutput.images.copilot) || null;
          
          console.log("Extracted section content:", {
            news: result.news ? result.news.substring(0, 50) + "..." : "None",
            markets: result.markets ? result.markets.substring(0, 50) + "..." : "None",
            copilot: result.copilot ? result.copilot.substring(0, 50) + "..." : "None"
          });
          
          console.log("Extracted image URLs:", {
            newsImage: result.newsImage,
            marketsImage: result.marketsImage,
            copilotImage: result.copilotImage
          });
        } catch (error) {
          console.error("Failed to parse webhook output as JSON:", error);
          
          // If parsing fails, check if the string itself contains identifiable section headers
          const outputStr = data.output;
          
          // Simple string-based parsing if JSON parsing failed
          if (outputStr.includes("News Section") || outputStr.includes("AI News piece")) {
            console.log("Using string-based section detection for news");
            result.news = outputStr;
          } else if (outputStr.includes("Economy & Markets") || outputStr.includes("Market")) {
            console.log("Using string-based section detection for markets");
            result.markets = outputStr;
          } else if (outputStr.includes("Copilot") || outputStr.includes("AI Assistant")) {
            console.log("Using string-based section detection for copilot");
            result.copilot = outputStr;
          } else {
            // If no section identifiers found, default to news content
            console.log("No section identifiers found in string, defaulting to news");
            result.news = outputStr;
          }
        }
      } else if (typeof data.output === "object") {
        // Output is already an object
        console.log("Webhook output is already an object");
        
        // Direct section properties
        result.news = data.output.news || data.output["AI News piece"] || data.output.newsSection || "";
        result.markets = data.output.markets || data.output.economy || data.output["Economy & Markets Section"] || data.output.marketsSection || "";
        result.copilot = data.output.copilot || data.output["AI Copilot"] || data.output.copilotSection || data.output["Copilot Section"] || "";
        
        // Check if sections array exists
        if (data.output.sections && Array.isArray(data.output.sections)) {
          console.log("Processing sections array from data.output:", data.output.sections);
          data.output.sections.forEach((section: any) => {
            if (section.type === "news" || section.title?.toLowerCase().includes("news")) {
              result.news = section.content || section.text || "";
            }
            if (section.type === "markets" || section.title?.toLowerCase().includes("market") || 
                section.title?.toLowerCase().includes("economy")) {
              result.markets = section.content || section.text || "";
            }
            if (section.type === "copilot" || section.title?.toLowerCase().includes("copilot") || 
                section.title?.toLowerCase().includes("ai assistant")) {
              result.copilot = section.content || section.text || "";
            }
          });
        }
        
        // Check content object if sections are still empty
        if (!result.news && !result.markets && !result.copilot && data.output.content) {
          console.log("Checking content object:", data.output.content);
          
          if (typeof data.output.content === 'object') {
            result.news = data.output.content.news || "";
            result.markets = data.output.content.markets || data.output.content.economy || "";
            result.copilot = data.output.content.copilot || "";
          } else if (typeof data.output.content === 'string') {
            // If content is a string, try to determine which section it belongs to based on keywords
            const contentStr = data.output.content;
            
            if (contentStr.includes("News Section") || contentStr.includes("AI News piece")) {
              console.log("Content string appears to be news section");
              result.news = contentStr;
            } else if (contentStr.includes("Economy & Markets") || contentStr.includes("Market")) {
              console.log("Content string appears to be markets section");
              result.markets = contentStr;
            } else if (contentStr.includes("Copilot") || contentStr.includes("AI Assistant")) {
              console.log("Content string appears to be copilot section");
              result.copilot = contentStr;
            } else {
              // If no section identifiers, try to split the content by section headers
              console.log("Attempting to split content by section headers");
              const parts = splitContentBySectionHeaders(contentStr);
              result.news = parts.news || "";
              result.markets = parts.markets || "";
              result.copilot = parts.copilot || "";
            }
          }
        }
        
        // Extract image URLs with various possible property names
        result.newsImage = data.output.newsImage || data.output.news_image || 
                         (data.output.images && data.output.images.news) || 
                         data.output.webViewLink || null;
        result.marketsImage = data.output.marketsImage || data.output.markets_image || 
                            (data.output.images && data.output.images.markets) || null;
        result.copilotImage = data.output.copilotImage || data.output.copilot_image || 
                            (data.output.images && data.output.images.copilot) || null;
        
        console.log("Extracted section content from object:", {
          news: result.news ? result.news.substring(0, 50) + "..." : "None",
          markets: result.markets ? result.markets.substring(0, 50) + "..." : "None",
          copilot: result.copilot ? result.copilot.substring(0, 50) + "..." : "None"
        });
        
        console.log("Extracted image URLs from object:", {
          newsImage: result.newsImage,
          marketsImage: result.marketsImage,
          copilotImage: result.copilotImage
        });
      }
    }
    
    // If we still don't have section content, try one more approach with the raw data
    if (!result.news && !result.markets && !result.copilot && data) {
      console.log("Attempting direct data extraction as fallback");
      
      // Try direct properties on data
      result.news = data.news || data["AI News piece"] || data.newsSection || "";
      result.markets = data.markets || data.economy || data["Economy & Markets Section"] || data.marketsSection || "";
      result.copilot = data.copilot || data["AI Copilot"] || data.copilotSection || data["Copilot Section"] || "";
      
      // Try to extract image URLs
      result.newsImage = data.newsImage || data.news_image || data.webViewLink || 
                      (data.images && data.images.news) || null;
      result.marketsImage = data.marketsImage || data.markets_image || 
                         (data.images && data.images.markets) || null;
      result.copilotImage = data.copilotImage || data.copilot_image || 
                         (data.images && data.images.copilot) || null;
    }
    
    // If we've exhausted all options and still don't have content, log an error
    if (!result.news && !result.markets && !result.copilot) {
      console.error("Could not extract any section content from webhook response", data);
      toast.error("Could not extract content from webhook response. Please check the console for details.");
    }
    
    return result;
  } catch (error) {
    console.error("Error in generateNewsletter:", error);
    throw error;
  }
};

// Helper function to try to split content by section headers
function splitContentBySectionHeaders(content: string): { news: string; markets: string; copilot: string } {
  const result = { news: "", markets: "", copilot: "" };
  
  // Define patterns to look for
  const newsPatterns = [
    /News Section/i, 
    /AI News/i, 
    /\*\*News/i, 
    /### News/i
  ];
  
  const marketsPatterns = [
    /Economy & Markets/i, 
    /Markets Section/i, 
    /\*\*Markets/i, 
    /### Markets/i,
    /### Economy/i
  ];
  
  const copilotPatterns = [
    /Copilot/i, 
    /AI Assistant/i, 
    /\*\*Copilot/i, 
    /### Copilot/i
  ];
  
  // Find positions of section headers
  let newsPos = findFirstMatch(content, newsPatterns);
  let marketsPos = findFirstMatch(content, marketsPatterns);
  let copilotPos = findFirstMatch(content, copilotPatterns);
  
  // Sort positions to determine content ranges
  const positions = [
    { type: 'news', pos: newsPos },
    { type: 'markets', pos: marketsPos },
    { type: 'copilot', pos: copilotPos }
  ].filter(item => item.pos !== -1)
   .sort((a, b) => a.pos - b.pos);
  
  // Extract sections based on their positions
  for (let i = 0; i < positions.length; i++) {
    const current = positions[i];
    const next = positions[i + 1];
    const sectionContent = next 
      ? content.substring(current.pos, next.pos)
      : content.substring(current.pos);
    
    if (current.type === 'news') result.news = sectionContent.trim();
    if (current.type === 'markets') result.markets = sectionContent.trim();
    if (current.type === 'copilot') result.copilot = sectionContent.trim();
  }
  
  // If we found positions but no content was extracted, handle edge case
  if (positions.length > 0 && !result.news && !result.markets && !result.copilot) {
    // Fallback: if we have at least one position, put everything after that position
    // into the corresponding section
    const firstPos = positions[0];
    if (firstPos.type === 'news') result.news = content.substring(firstPos.pos).trim();
    if (firstPos.type === 'markets') result.markets = content.substring(firstPos.pos).trim();
    if (firstPos.type === 'copilot') result.copilot = content.substring(firstPos.pos).trim();
  }
  
  // If still no content found, make a best guess based on keywords
  if (!result.news && !result.markets && !result.copilot) {
    if (content.toLowerCase().includes('news') || content.toLowerCase().includes('article')) {
      result.news = content;
    } else if (content.toLowerCase().includes('market') || content.toLowerCase().includes('economy')) {
      result.markets = content;
    } else if (content.toLowerCase().includes('copilot') || content.toLowerCase().includes('assistant')) {
      result.copilot = content;
    } else {
      // If all else fails, put content in news section
      result.news = content;
    }
  }
  
  return result;
}

// Helper function to find the first occurrence of any pattern in a string
function findFirstMatch(str: string, patterns: RegExp[]): number {
  let firstPos = -1;
  
  for (const pattern of patterns) {
    const match = str.match(pattern);
    if (match && match.index !== undefined) {
      if (firstPos === -1 || match.index < firstPos) {
        firstPos = match.index;
      }
    }
  }
  
  return firstPos;
}

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
    
    // If no content was found, try one more approach with the raw data
    if (!result && data) {
      result = data[section] || data.content || data.text || "";
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
