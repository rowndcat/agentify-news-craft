
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
    
    // Handle API response with "output" property (as seen in console logs)
    if (data.output && typeof data.output === 'string') {
      console.log("Processing API response with output property");
      
      // Extract content sections from markdown format
      const newsSection = extractSection(data.output, "News Section");
      const marketsSection = extractSection(data.output, "Economy & Markets Section");
      const copilotSection = extractSection(data.output, "Copilot") || 
                            extractSection(data.output, "AI Copilot") || 
                            ""; // Fallback if copilot section not found
      
      console.log("Extracted sections:", { newsSection, marketsSection, copilotSection });
      
      return {
        news: newsSection,
        markets: marketsSection,
        copilot: copilotSection
      };
    }
    
    // Check for standard response structure
    if (!data.news && !data.markets && !data.copilot) {
      console.warn("API response doesn't contain newsletter content:", data);
      
      // If data.content exists (different API response format), try to parse it
      if (data.content) {
        try {
          // Try to parse if it's a JSON string
          const parsedContent = typeof data.content === 'string' ? 
            JSON.parse(data.content) : data.content;
          
          return {
            news: parsedContent.news || "",
            markets: parsedContent.markets || "",
            copilot: parsedContent.copilot || "",
          };
        } catch (parseError) {
          console.error("Error parsing content:", parseError);
          // If parsing fails but we have content as string, use it as news content
          if (typeof data.content === 'string') {
            return {
              news: data.content,
              markets: "",
              copilot: "",
            };
          }
        }
      }
      
      // Fallback if no recognizable content format
      toast.error("Received unexpected response format from API");
      return {
        news: "",
        markets: "",
        copilot: "",
      };
    }
    
    // Return the section data from the response
    return {
      news: data.news || "",
      markets: data.markets || "",
      copilot: data.copilot || "",
    };
  } catch (error) {
    console.error("Error generating newsletter:", error);
    toast.error("Failed to generate newsletter content. Please try again.");
    throw error;
  }
};

// Helper function to extract sections from markdown response
function extractSection(markdown: string, sectionTitle: string): string {
  if (!markdown) return "";
  
  // Check for section headers with various formats
  const patterns = [
    new RegExp(`\\#\\#\\# ${sectionTitle}([\\s\\S]*?)(?=\\n\\n\\#\\#\\#|$)`), // ### Section Title
    new RegExp(`\\#\\# ${sectionTitle}([\\s\\S]*?)(?=\\n\\n\\#\\#|$)`), // ## Section Title
    new RegExp(`\\*\\*${sectionTitle}\\*\\*([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`), // **Section Title**
    new RegExp(`\\*\\*${sectionTitle}:\\*\\*([\\s\\S]*?)(?=\\n\\n\\*\\*|$)`), // **Section Title:**
    new RegExp(`${sectionTitle}([\\s\\S]*?)(?=\\n\\n\\*\\*|\\n\\n\\#\\#|$)`) // Section Title (no formatting)
  ];
  
  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  
  // If no specific section matches, try to find any content after the section title
  const simpleMatch = new RegExp(`${sectionTitle}([\\s\\S]*?)$`).exec(markdown);
  if (simpleMatch && simpleMatch[1]) {
    return simpleMatch[1].trim();
  }
  
  // If no specific section matches, return empty string
  return "";
}
