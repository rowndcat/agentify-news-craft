
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
    
    // Check if the response has the expected structure
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
