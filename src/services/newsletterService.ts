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
    
    // Initialize result object for storing the parsed sections
    let result: { news?: string; markets?: string; copilot?: string; newsImage?: string; marketsImage?: string; copilotImage?: string } = {};
    
    if (data && data.output) {
      console.log("Raw webhook output:", data.output);

      // First, try to parse the data.output as JSON
      if (typeof data.output === "string") {
        try {
          const parsedOutput = JSON.parse(data.output);
          console.log("Parsed webhook output:", parsedOutput);
          extractSectionsFromObject(parsedOutput, result);
          
          // If we have content but the sections aren't separated correctly (all in news)
          if (result.news && !result.markets && !result.copilot && 
              (result.news.includes("Economy & Markets Section") || 
               result.news.includes("Markets Section") || 
               result.news.includes("Copilot Section"))) {
            console.log("All content appears to be in news section - attempting to separate");
            const separatedSections = separateAllSectionsFromCombinedText(result.news);
            result = { ...result, ...separatedSections };
          }
        } catch (error) {
          console.error("Failed to parse webhook output as JSON:", error);
          
          // If parsing as JSON fails, try to separate sections directly from the text
          const outputStr = data.output;
          console.log("Attempting to separate sections from raw string output");
          const separatedSections = separateAllSectionsFromCombinedText(outputStr);
          Object.assign(result, separatedSections);
        }
      } else if (typeof data.output === "object") {
        // Output is already an object
        console.log("Webhook output is already an object");
        extractSectionsFromObject(data.output, result);
      }
    }
    
    // If we've exhausted all options and still don't have content, try direct data
    if (!result.news && !result.markets && !result.copilot && data) {
      console.log("Attempting direct data extraction as fallback");
      extractSectionsFromObject(data, result);
    }
    
    // If we've tried everything and still don't have content, log an error
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

// Helper function to separate all sections from combined text
function separateAllSectionsFromCombinedText(text: string): { news: string; markets: string; copilot: string } {
  console.log("Separating all sections from combined text");
  const result = { news: "", markets: "", copilot: "" };

  // Get section boundaries
  const newsSectionMatch = findSectionStart(text, [
    /News Section/i,
    /\*\*News Section\*\*/i,
    /### \*\*News Section\*\*/i,
    /### News Section/i,
    /## News Section/i
  ]);

  const marketsSectionMatch = findSectionStart(text, [
    /Economy & Markets Section/i,
    /\*\*Economy & Markets Section\*\*/i,
    /### \*\*Economy & Markets Section\*\*/i,
    /### Economy & Markets Section/i,
    /## Economy & Markets Section/i,
    /Markets Section/i,
    /\*\*Markets Section\*\*/i,
    /### \*\*Markets Section\*\*/i,
    /### Markets Section/i,
    /## Markets Section/i,
  ]);

  const copilotSectionMatch = findSectionStart(text, [
    /Copilot Section/i,
    /\*\*Copilot Section\*\*/i,
    /### \*\*Copilot Section\*\*/i,
    /### Copilot Section/i,
    /## Copilot Section/i,
    /\*\*Copilot\*\*/i,
    /### \*\*Copilot\*\*/i,
    /### Copilot/i,
    /## Copilot/i,
  ]);

  // If we find at least two sections, we can determine the boundaries
  if (newsSectionMatch && marketsSectionMatch) {
    result.news = text.substring(newsSectionMatch.index, marketsSectionMatch.index).trim();
    
    if (copilotSectionMatch) {
      result.markets = text.substring(marketsSectionMatch.index, copilotSectionMatch.index).trim();
      result.copilot = text.substring(copilotSectionMatch.index).trim();
    } else {
      result.markets = text.substring(marketsSectionMatch.index).trim();
    }
  } 
  // If we only find news and copilot (missing markets)
  else if (newsSectionMatch && copilotSectionMatch) {
    result.news = text.substring(newsSectionMatch.index, copilotSectionMatch.index).trim();
    result.copilot = text.substring(copilotSectionMatch.index).trim();
  }
  // Only news section found
  else if (newsSectionMatch) {
    result.news = text.substring(newsSectionMatch.index).trim();
  }
  // Fall back to checking for other distinguishing features if section headers aren't found
  else {
    // Try to identify sections by markdown separators
    const parts = text.split(/---+\s*\n/);
    
    if (parts.length >= 3) {
      result.news = parts[0].trim();
      result.markets = parts[1].trim();
      result.copilot = parts.slice(2).join("\n").trim();
    } 
    // Try to identify by emoji headers which are common in the markets section
    else if (text.includes("🌍 Big Picture") && text.includes("📈 What to Watch")) {
      const marketStart = text.indexOf("🌍 Big Picture");
      const beforeMarkets = text.substring(0, marketStart).trim();
      
      if (beforeMarkets.includes("News Section") || 
          beforeMarkets.includes("**News Section**") ||
          beforeMarkets.includes("Additional News Links")) {
        result.news = beforeMarkets;
      }
      
      // Find where copilot might start
      let copilotStart = text.indexOf("**Copilot");
      if (copilotStart === -1) copilotStart = text.indexOf("### Copilot");
      if (copilotStart === -1) copilotStart = text.indexOf("## Copilot");
      if (copilotStart === -1) copilotStart = text.indexOf("TIME: ");
      if (copilotStart === -1) copilotStart = text.indexOf("TIME – Reclaim Your");
      
      if (copilotStart !== -1) {
        result.markets = text.substring(marketStart, copilotStart).trim();
        result.copilot = text.substring(copilotStart).trim();
      } else {
        result.markets = text.substring(marketStart).trim();
      }
    }
    // If all else fails, fall back to using the original text as news
    else {
      result.news = text.trim();
    }
  }
  
  // Log the result for debugging
  console.log("Separation results:");
  console.log("News section found:", result.news ? "Yes" : "No", result.news ? `(${result.news.length} chars)` : "");
  console.log("Markets section found:", result.markets ? "Yes" : "No", result.markets ? `(${result.markets.length} chars)` : "");
  console.log("Copilot section found:", result.copilot ? "Yes" : "No", result.copilot ? `(${result.copilot.length} chars)` : "");
  
  return result;
}

// Helper function to find the start of a section using an array of patterns
function findSectionStart(text: string, patterns: RegExp[]): { index: number, match: string } | null {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match.index !== undefined) {
      return { index: match.index, match: match[0] };
    }
  }
  return null;
}

// Helper function to split a single text with multiple sections into separate sections
function splitContentIntoSections(content: string): { news: string; markets: string; copilot: string } {
  console.log("Splitting combined content into sections");
  return separateAllSectionsFromCombinedText(content);
}

// Helper function to extract sections from an object data structure
function extractSectionsFromObject(data: any, result: any): void {
  if (!data) return;
  
  // Direct section properties with various possible names
  result.news = result.news || data.news || data["AI News piece"] || data.newsSection || "";
  result.markets = result.markets || data.markets || data.economy || data["Economy & Markets Section"] || data.marketsSection || "";
  result.copilot = result.copilot || data.copilot || data["AI Copilot"] || data.copilotSection || data["Copilot Section"] || "";
  
  // Check if sections array exists
  if (data.sections && Array.isArray(data.sections)) {
    console.log("Processing sections array:", data.sections);
    data.sections.forEach((section: any) => {
      if (section.type === "news" || (section.title && section.title.toLowerCase().includes("news"))) {
        result.news = section.content || section.text || "";
      }
      if (section.type === "markets" || 
          (section.title && (section.title.toLowerCase().includes("market") || section.title.toLowerCase().includes("economy")))) {
        result.markets = section.content || section.text || "";
      }
      if (section.type === "copilot" || 
          (section.title && (section.title.toLowerCase().includes("copilot") || section.title.toLowerCase().includes("ai assistant")))) {
        result.copilot = section.content || section.text || "";
      }
    });
  }
  
  // Check content object if sections are still empty
  if ((!result.news || !result.markets || !result.copilot) && data.content) {
    console.log("Checking content object:", data.content);
    
    if (typeof data.content === 'object') {
      result.news = result.news || data.content.news || "";
      result.markets = result.markets || data.content.markets || data.content.economy || "";
      result.copilot = result.copilot || data.content.copilot || "";
    } else if (typeof data.content === 'string') {
      // If content is a string and we have no sections yet, try to split it
      if (!result.news && !result.markets && !result.copilot) {
        const sections = separateAllSectionsFromCombinedText(data.content);
        result.news = result.news || sections.news;
        result.markets = result.markets || sections.markets;
        result.copilot = result.copilot || sections.copilot;
      }
    }
  }
  
  // Extract image URLs with various possible property names
  result.newsImage = result.newsImage || data.newsImage || data.news_image || 
                    (data.images && data.images.news) || data.webViewLink || null;
  result.marketsImage = result.marketsImage || data.marketsImage || data.markets_image || 
                      (data.images && data.images.markets) || null;
  result.copilotImage = result.copilotImage || data.copilotImage || data.copilot_image || 
                      (data.images && data.images.copilot) || null;
}

// Helper function to identify which section a single content string belongs to
function identifySingleSectionContent(content: string, result: any): void {
  if (!content) return;
  
  // News-related keywords
  if (content.toLowerCase().includes("news section") || 
      content.toLowerCase().includes("ai news piece") ||
      content.toLowerCase().includes("additional news links") ||
      content.includes("Why this matters:")) {
    result.news = content;
    console.log("Identified content as news section based on keywords");
  } 
  // Markets-related keywords
  else if (content.toLowerCase().includes("economy & markets") || 
           content.toLowerCase().includes("markets section") ||
           content.includes("🌍 Big Picture") ||
           content.includes("📈 What to Watch") ||
           content.includes("🔑 Key Takeaway")) {
    result.markets = content;
    console.log("Identified content as markets section based on keywords");
  } 
  // Copilot-related keywords
  else if (content.toLowerCase().includes("copilot section") || 
           content.toLowerCase().includes("ai copilot") ||
           content.toLowerCase().includes("time: automate") ||
           content.toLowerCase().includes("attention: generate") ||
           content.toLowerCase().includes("profit/progress:")) {
    result.copilot = content;
    console.log("Identified content as copilot section based on keywords");
  }
  // If no clear identification, try to split by sections if it appears to contain multiple sections
  else if (content.includes("News Section") && 
          (content.includes("Economy & Markets") || content.includes("Copilot"))) {
    const sections = separateAllSectionsFromCombinedText(content);
    result.news = sections.news || "";
    result.markets = sections.markets || "";
    result.copilot = sections.copilot || "";
    console.log("Split unidentified content into sections");
  }
  // If still can't identify, put in news as default
  else {
    result.news = content;
    console.log("Could not identify section type, defaulting to news");
  }
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
          // If parsing fails but output contains all sections, separate them
          if (data.output.includes("News Section") && 
             (data.output.includes("Economy & Markets Section") || 
              data.output.includes("Markets Section") || 
              data.output.includes("Copilot Section"))) {
            const sections = separateAllSectionsFromCombinedText(data.output);
            result = sections[section] || data.output;
          } else {
            // If no section separation needed, use the string as is
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
