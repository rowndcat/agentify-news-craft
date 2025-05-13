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
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (increased from 90s)
    
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
      
      // Check if the response is an array (new format)
      if (Array.isArray(data)) {
        console.log("Response is in array format with length:", data.length);
        // Get the first item with output
        const firstItem = data.find(item => item.output);
        
        if (firstItem && firstItem.output) {
          console.log("Found output in array item:", typeof firstItem.output);
          // Process the output from the array item
          return extractSectionsFromMarkdown(firstItem.output);
        } else {
          console.error("No output found in array response", data);
          throw new Error("No output found in the webhook response array");
        }
      } else if (data && data.output) {
        // Handle original object format
        return extractSectionsFromMarkdown(data.output);
      } else {
        console.error("Unexpected response format with no output:", data);
        throw new Error("Unexpected response format from webhook");
      }
    } catch (error) {
      clearTimeout(timeoutId); // Clear the timeout on error too
      
      if (error.name === 'AbortError') {
        console.error("Request timed out after 120 seconds");
        throw new Error("Request timed out after 120 seconds. The webhook might be taking too long to respond.");
      }
      
      throw error; // Re-throw all other errors
    }
  } catch (error) {
    console.error("Error in generateNewsletter:", error);
    throw error;
  }
};

// Extract sections from markdown formatted text - completely rewritten for better reliability
function extractSectionsFromMarkdown(markdown: string): { news: string; markets: string; copilot: string; newsImage?: string; marketsImage?: string; copilotImage?: string } {
  console.log("Extracting sections from markdown text:", markdown.substring(0, 100) + "...");
  
  const result = {
    news: "",
    markets: "",
    copilot: "",
    newsImage: null,
    marketsImage: null,
    copilotImage: null
  };
  
  if (!markdown) {
    console.error("Empty markdown received");
    return result;
  }

  // Define patterns to find where each section begins
  const patterns = {
    news: /(?:##?\s*\*?\*?News\s*Section\*?\*?|##?\s*\*?\*?AI\s*News\*?\*?)/i,
    markets: /(?:##?\s*\*?\*?Economy\s*&\s*Markets\s*Section\*?\*?|##?\s*\*?\*?Markets\s*&\s*Economy\*?\*?)/i,
    copilot: /(?:##?\s*\*?\*?Copilot\s*Section\*?\*?|##?\s*\*?\*?AI\s*Copilot\*?\*?)/i
  };

  // Find each section in the markdown
  const matches = {
    news: markdown.match(patterns.news),
    markets: markdown.match(patterns.markets),
    copilot: markdown.match(patterns.copilot)
  };

  // Log what we've found
  console.log("Section matches found:", {
    news: matches.news ? matches.news[0] : "not found",
    markets: matches.markets ? matches.markets[0] : "not found",
    copilot: matches.copilot ? matches.copilot[0] : "not found"
  });

  // Get the indexes where each section starts
  const indexes = {
    news: matches.news ? matches.news.index : -1,
    markets: matches.markets ? matches.markets.index : -1,
    copilot: matches.copilot ? matches.copilot.index : -1
  };

  // Sort sections by their position in the text
  const sections = [
    { name: 'news', index: indexes.news },
    { name: 'markets', index: indexes.markets },
    { name: 'copilot', index: indexes.copilot }
  ].filter(section => section.index !== -1)
    .sort((a, b) => a.index - b.index);

  console.log("Sorted sections by position:", sections.map(s => s.name));

  // Extract each section based on its position relative to the next section
  for (let i = 0; i < sections.length; i++) {
    const currentSection = sections[i];
    const nextSection = sections[i + 1];
    
    const startIndex = currentSection.index;
    const endIndex = nextSection ? nextSection.index : markdown.length;
    
    if (startIndex !== -1 && startIndex < endIndex) {
      const content = markdown.substring(startIndex, endIndex).trim();
      result[currentSection.name] = content;
      
      console.log(`Extracted ${currentSection.name} section (${content.length} chars)`);
      console.log(`${currentSection.name} preview:`, content.substring(0, 50) + "...");
    }
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
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout (increased from 60s)
    
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
        console.log(`Received array response for ${section} regeneration with ${data.length} items`);
        const firstItem = data.find(item => item.output);
        if (firstItem && firstItem.output) {
          const sectionContent = extractSectionFromText(firstItem.output, section);
          return sectionContent || "";
        } else {
          console.error(`No output found in array response for ${section} regeneration`);
          throw new Error(`No output found in response for ${section} regeneration`);
        }
      }
      
      // Extract the content from the response (old format)
      if (data && data.output) {
        return extractSectionFromText(data.output, section) || "";
      }
      
      console.error(`No usable content found in regenerate ${section} response:`, data);
      return "";
      
    } catch (error) {
      clearTimeout(timeoutId); // Clear the timeout on error too
      
      if (error.name === 'AbortError') {
        console.error(`Request timed out after 120 seconds when regenerating ${section} section`);
        throw new Error(`Request timed out. The webhook might be taking too long to respond.`);
      }
      
      throw error; // Re-throw all other errors
    }
  } catch (error) {
    console.error(`Error in regenerateSection (${section}):`, error);
    throw error;
  }
};

// Helper function to extract a specific section from text
function extractSectionFromText(text: string, sectionType: "news" | "markets" | "copilot"): string {
  console.log(`Extracting ${sectionType} section from text:`, text.substring(0, 100) + "...");
  
  // Pattern to find the requested section
  let sectionPattern: RegExp;
  
  switch (sectionType) {
    case "news":
      sectionPattern = /(?:##?\s*\*?\*?News\s*Section\*?\*?|##?\s*\*?\*?AI\s*News\*?\*?)/i;
      break;
    case "markets":
      sectionPattern = /(?:##?\s*\*?\*?Economy\s*&\s*Markets\s*Section\*?\*?|##?\s*\*?\*?Markets\s*&\s*Economy\*?\*?)/i;
      break;
    case "copilot":
      sectionPattern = /(?:##?\s*\*?\*?Copilot\s*Section\*?\*?|##?\s*\*?\*?AI\s*Copilot\*?\*?)/i;
      break;
  }
  
  const sectionMatch = text.match(sectionPattern);
  if (!sectionMatch) {
    console.log(`${sectionType} section heading not found in text`);
    return text; // Return the whole text if section heading not found
  }
  
  const sectionStart = sectionMatch.index;
  let sectionEnd = text.length;
  
  // Look for the next section heading to determine where this section ends
  const otherSections = [
    { name: "news", pattern: /(?:##?\s*\*?\*?News\s*Section\*?\*?|##?\s*\*?\*?AI\s*News\*?\*?)/i },
    { name: "markets", pattern: /(?:##?\s*\*?\*?Economy\s*&\s*Markets\s*Section\*?\*?|##?\s*\*?\*?Markets\s*&\s*Economy\*?\*?)/i },
    { name: "copilot", pattern: /(?:##?\s*\*?\*?Copilot\s*Section\*?\*?|##?\s*\*?\*?AI\s*Copilot\*?\*?)/i }
  ].filter(section => section.name !== sectionType);
  
  for (const section of otherSections) {
    const match = text.substring(sectionStart).match(section.pattern);
    if (match && match.index) {
      const possibleEnd = sectionStart + match.index;
      if (possibleEnd < sectionEnd) {
        sectionEnd = possibleEnd;
      }
    }
  }
  
  const sectionContent = text.substring(sectionStart, sectionEnd).trim();
  console.log(`Extracted ${sectionType} section (${sectionContent.length} chars)`);
  
  return sectionContent;
}

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
