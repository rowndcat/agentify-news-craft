
import { toast } from "sonner";

const WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/dbcfd9ed-a84b-44db-a493-da8f368974f1/chat";

export interface NewsletterSections {
  news: string;
  markets: string;
  copilot: string;
}

export interface NewsletterRequest {
  chatId: string;
  message?: string;
  action?: 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
  current_content?: Partial<NewsletterSections>;
  instructions?: string;
}

export const generateNewsletter = async (request: NewsletterRequest): Promise<Partial<NewsletterSections>> => {
  try {
    console.log(`Sending request to webhook: ${JSON.stringify(request)}`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate newsletter: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Newsletter data received:", data);
    
    // First, check if the entire response is a string (could be raw markdown)
    if (typeof data === 'string') {
      console.log("Response is a raw string, parsing sections");
      return extractSectionsFromContent(data);
    }
    
    // Check for direct section data in the response
    if (data.news || data.markets || data.copilot) {
      console.log("Found direct section data in response");
      return {
        news: data.news || "",
        markets: data.markets || "",
        copilot: data.copilot || "",
      };
    }
    
    // Handle case where full content is in data.output
    if (data.output) {
      if (typeof data.output === 'string') {
        console.log("Processing raw output content");
        return extractSectionsFromContent(data.output);
      } else if (typeof data.output === 'object') {
        // If output is an object, it might contain the sections directly
        console.log("Output is an object, checking for sections");
        return {
          news: data.output.news || "",
          markets: data.output.markets || "",
          copilot: data.output.copilot || "",
        };
      }
    }
    
    // Check for content in data.content (some APIs use this format)
    if (data.content) {
      if (typeof data.content === 'string') {
        console.log("Processing content field");
        return extractSectionsFromContent(data.content);
      } else if (typeof data.content === 'object') {
        console.log("Content is an object, checking for sections");
        return {
          news: data.content.news || "",
          markets: data.content.markets || "",
          copilot: data.content.copilot || "",
        };
      }
    }
    
    // Fall back to trying the message field if it exists
    if (data.message) {
      if (typeof data.message === 'string') {
        console.log("Using message field as content");
        return extractSectionsFromContent(data.message);
      } else if (typeof data.message === 'object') {
        console.log("Message is an object, checking for sections");
        return {
          news: data.message.news || "",
          markets: data.message.markets || "",
          copilot: data.message.copilot || "",
        };
      }
    }
    
    // Last resort: check if the top-level data itself is the content
    if (typeof data === 'object' && !Array.isArray(data)) {
      // Check if data itself might be the raw markdown content with sections
      const stringifiedData = JSON.stringify(data);
      if (stringifiedData.includes("News Section") || 
          stringifiedData.includes("Economy & Markets") || 
          stringifiedData.includes("Copilot")) {
        console.log("Attempting to parse top-level data as content");
        return extractSectionsFromContent(stringifiedData);
      }
    }
    
    // If we get here, we couldn't extract any useful content
    console.warn("Could not extract newsletter content from response:", data);
    toast.error("Unable to generate newsletter content. Please try again.");
    return {
      news: "",
      markets: "",
      copilot: "",
    };
  } catch (error) {
    console.error("Error generating newsletter:", error);
    toast.error("Failed to generate newsletter content. Please try again.");
    throw error;
  }
};

// Function to extract sections from markdown content using regex
const extractSectionsFromContent = (content: string): Partial<NewsletterSections> => {
  const sections: Partial<NewsletterSections> = {};
  
  console.log("Extracting sections from content, length:", content.length);
  console.log("Content preview:", content.substring(0, 100));
  
  // Extract News Section - looking for various formats
  const newsRegexPatterns = [
    /###\s*\*\*News Section\*\*([^#]+)/si,
    /###\s*News Section([^#]+)/si,
    /##\s*\*\*News Section\*\*([^#]+)/si,
    /##\s*News Section([^#]+)/si,
    /\*\*News Section\*\*([^#]+)/si
  ];

  // Extract Economy & Markets Section - looking for various formats
  const marketsRegexPatterns = [
    /###\s*\*\*Economy & Markets Section\*\*([^#]+)/si,
    /###\s*Economy & Markets Section([^#]+)/si,
    /##\s*\*\*Economy & Markets Section\*\*([^#]+)/si,
    /##\s*Economy & Markets Section([^#]+)/si,
    /\*\*Economy & Markets Section\*\*([^#]+)/si
  ];

  // Extract Copilot Section - looking for various formats
  const copilotRegexPatterns = [
    /###\s*\*\*Copilot\*\*([^#]+)/si,
    /###\s*Copilot([^#]+)/si,
    /###\s*\*\*AI Copilot\*\*([^#]+)/si,
    /###\s*AI Copilot([^#]+)/si,
    /##\s*\*\*Copilot\*\*([^#]+)/si,
    /##\s*Copilot([^#]+)/si,
    /\*\*Copilot\*\*([^#]+)/si,
    /\*\*AI Copilot\*\*([^#]+)/si
  ];

  // Try to match each section with their patterns
  for (const pattern of newsRegexPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      sections.news = `### **News Section**${match[1].trim()}`;
      console.log("Extracted News section, length:", sections.news.length);
      break;
    }
  }
  
  for (const pattern of marketsRegexPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      sections.markets = `### Economy & Markets Section${match[1].trim()}`;
      console.log("Extracted Markets section, length:", sections.markets.length);
      break;
    }
  }
  
  for (const pattern of copilotRegexPatterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      sections.copilot = `### Copilot${match[1].trim()}`;
      console.log("Extracted Copilot section, length:", sections.copilot.length);
      break;
    }
  }
  
  // If sections were successfully extracted, return them
  if (Object.keys(sections).length > 0) {
    return sections;
  }
  
  // Check if the content might be just one specific section
  // This is a fallback for when regenerating single sections
  if (content.includes("TL;DR") && !sections.news) {
    console.log("Content appears to be a news section");
    sections.news = `### **News Section**\n\n${content.trim()}`;
  } else if ((content.includes("Big Picture") || content.includes("What to Watch") || 
              content.includes("Key Takeaway")) && !sections.markets) {
    console.log("Content appears to be a markets section");
    sections.markets = `### Economy & Markets Section\n\n${content.trim()}`;
  } else if (content.includes("insights") && !sections.copilot) {
    console.log("Content appears to be a copilot section");
    sections.copilot = `### Copilot\n\n${content.trim()}`;
  }
  
  // If content has any markdown sections but our regex didn't catch them, 
  // try a more general approach
  if (Object.keys(sections).length === 0 && content.includes('#')) {
    const parts = content.split(/(?=###|##|#)/g);
    console.log(`Split content into ${parts.length} parts based on headers`);
    
    for (const part of parts) {
      const trimmedPart = part.trim();
      if (!trimmedPart) continue;
      
      if ((trimmedPart.toLowerCase().includes('news') || 
           trimmedPart.includes('TL;DR')) && !sections.news) {
        sections.news = trimmedPart;
      } else if ((trimmedPart.toLowerCase().includes('market') || 
                trimmedPart.toLowerCase().includes('economy')) && !sections.markets) {
        sections.markets = trimmedPart;
      } else if ((trimmedPart.toLowerCase().includes('copilot') || 
                trimmedPart.toLowerCase().includes('insights')) && !sections.copilot) {
        sections.copilot = trimmedPart;
      }
    }
  }
  
  // Last resort: if we still have nothing but there is content,
  // just put the whole thing in news section
  if (Object.keys(sections).length === 0 && content.trim()) {
    console.log("Using full content as news");
    return { news: content.trim() };
  }

  return sections;
};

// Function to regenerate a specific section of the newsletter
export const regenerateSection = async (
  section: 'news' | 'markets' | 'copilot',
  chatId: string,
  instructions?: string
): Promise<string> => {
  try {
    console.log(`Regenerating ${section} section with${instructions ? '' : 'out'} instructions`);
    
    // Prepare the message based on the section and instructions
    let message = "";
    
    switch(section) {
      case 'news':
        message = instructions 
          ? `regenerate news section only with the following instructions: ${instructions}`
          : "create a new news section only";
        break;
      case 'markets':
        message = instructions 
          ? `regenerate markets and economy section only with the following instructions: ${instructions}` 
          : "create a markets and economy section only";
        break;
      case 'copilot':
        message = instructions 
          ? `regenerate copilot insights only with the following instructions: ${instructions}` 
          : "create a copilot insights section only";
        break;
    }
    
    // Create a request body that explicitly states which section to regenerate
    const requestBody = {
      chatId,
      message,
      action: `regenerate_${section}`,
      section_to_regenerate: section,
      regenerate_only: true
    };
    
    console.log(`Sending regeneration request for ${section} section only:`, requestBody);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to regenerate ${section}: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`${section} regeneration data received:`, data);
    
    // Check for direct section data
    if (data[section]) {
      return data[section];
    }
    
    // Handle case where the response is a direct string
    if (typeof data === 'string') {
      // For direct string responses, we'll treat it as the requested section
      return data;
    }
    
    // Handle output format
    if (data.output) {
      if (typeof data.output === 'string') {
        // Try to extract just the requested section
        const extractedSections = extractSectionsFromContent(data.output);
        if (extractedSections[section]) {
          return extractedSections[section];
        }
        
        // If the section wasn't found but there's output, return the output as is
        return data.output;
      } else if (typeof data.output === 'object' && data.output[section]) {
        return data.output[section];
      }
    }
    
    // Check content field
    if (data.content) {
      if (typeof data.content === 'string') {
        const extractedSections = extractSectionsFromContent(data.content);
        if (extractedSections[section]) {
          return extractedSections[section];
        }
        return data.content;
      } else if (typeof data.content === 'object' && data.content[section]) {
        return data.content[section];
      }
    }
    
    // Check message property as last resort
    if (data.message) {
      if (typeof data.message === 'string') {
        const extractedSections = extractSectionsFromContent(data.message);
        if (extractedSections[section]) {
          return extractedSections[section];
        }
        return data.message;
      } else if (typeof data.message === 'object' && data.message[section]) {
        return data.message[section];
      }
    }
    
    // If we couldn't extract content, check if the data itself might be the content
    if (typeof data === 'object' && !Array.isArray(data)) {
      const stringifiedData = JSON.stringify(data);
      if (stringifiedData.includes("News Section") || 
          stringifiedData.includes("Economy & Markets") || 
          stringifiedData.includes("Copilot")) {
        const extractedSections = extractSectionsFromContent(stringifiedData);
        if (extractedSections[section]) {
          return extractedSections[section];
        }
      }
    }
    
    // If we couldn't extract content, return empty string and show warning
    console.warn(`Could not extract ${section} content from response:`, data);
    toast.warning(`No ${section} content was returned. Please try again.`);
    return "";
  } catch (error) {
    console.error(`Error regenerating ${section}:`, error);
    toast.error(`Failed to regenerate ${section}. Please try again.`);
    throw error;
  }
};
