
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
    
    // First, check for direct section data in the response
    if (data.news || data.markets || data.copilot) {
      console.log("Found direct section data in response");
      return {
        news: data.news || "",
        markets: data.markets || "",
        copilot: data.copilot || "",
      };
    }
    
    // Handle case where full content is in data.output
    if (data.output && typeof data.output === 'string') {
      console.log("Processing raw output content");
      return extractSectionsFromContent(data.output);
    }
    
    // Fall back to trying the message field if it exists
    if (data.message && typeof data.message === 'string') {
      console.log("Using message field as content");
      return extractSectionsFromContent(data.message);
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
  
  // Extract News Section - looking for various formats
  const newsRegexPatterns = [
    /###\s*\*\*News Section\*\*([^#]+)/si,
    /###\s*News Section([^#]+)/si,
    /##\s*\*\*News Section\*\*([^#]+)/si,
    /##\s*News Section([^#]+)/si
  ];

  // Extract Economy & Markets Section - looking for various formats
  const marketsRegexPatterns = [
    /###\s*\*\*Economy & Markets Section\*\*([^#]+)/si,
    /###\s*Economy & Markets Section([^#]+)/si,
    /##\s*\*\*Economy & Markets Section\*\*([^#]+)/si,
    /##\s*Economy & Markets Section([^#]+)/si
  ];

  // Extract Copilot Section - looking for various formats
  const copilotRegexPatterns = [
    /###\s*\*\*Copilot\*\*([^#]+)/si,
    /###\s*Copilot([^#]+)/si,
    /###\s*\*\*AI Copilot\*\*([^#]+)/si,
    /###\s*AI Copilot([^#]+)/si,
    /##\s*\*\*Copilot\*\*([^#]+)/si,
    /##\s*Copilot([^#]+)/si
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
  
  // If no sections were extracted but there is content, 
  // treat the entire content as the news section
  if (content.trim()) {
    console.log("Using full content as news");
    return { news: content.trim() };
  }

  return {};
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
    // and doesn't include any other section content
    const requestBody: any = {
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
    
    // Extract the relevant section content based on the response
    
    // Check for direct section data
    if (data[section]) {
      return data[section];
    }
    
    // Handle output format - extract just the requested section
    if (data.output && typeof data.output === 'string') {
      const extractedSections = extractSectionsFromContent(data.output);
      if (extractedSections[section]) {
        return extractedSections[section];
      }
      
      // If the section wasn't found but there's output, return the whole output
      // It's likely that the output is just the requested section without the headers
      return data.output;
    }
    
    // Check message property as last resort
    if (data.message && typeof data.message === 'string') {
      const extractedSections = extractSectionsFromContent(data.message);
      if (extractedSections[section]) {
        return extractedSections[section];
      }
      return data.message;
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
