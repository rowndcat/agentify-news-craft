
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
      
      // More robust section extraction
      let newsContent = "";
      let marketsContent = "";
      let copilotContent = "";
      
      const content = data.output;
      
      // Check for news section - looking for "News Section" at the beginning or with ** markers
      if (content.includes("News Section") || content.includes("**News Section")) {
        // Find the start of news section
        const newsStartIndex = content.indexOf("News Section");
        
        // Find where markets section or separator starts
        const nextSectionStartIndex = content.indexOf("Economy & Markets Section", newsStartIndex);
        const separatorIndex = content.indexOf("---", newsStartIndex);
        
        // Determine end of news section - use whichever comes first
        let newsEndIndex = content.length;
        if (nextSectionStartIndex > -1) {
          newsEndIndex = nextSectionStartIndex;
        } else if (separatorIndex > -1 && separatorIndex > newsStartIndex) {
          newsEndIndex = separatorIndex;
        }
        
        // Extract news content
        if (newsStartIndex > -1) {
          newsContent = content.substring(newsStartIndex, newsEndIndex).trim();
          console.log("Extracted news content, length:", newsContent.length);
        }
      }
      
      // Check for markets section
      if (content.includes("Economy & Markets Section")) {
        const marketsStartIndex = content.indexOf("Economy & Markets Section");
        
        // Find where copilot section starts or end of content
        let marketsEndIndex = content.length;
        const copilotStartIndex = Math.max(
          content.indexOf("Copilot", marketsStartIndex),
          content.indexOf("AI Copilot", marketsStartIndex)
        );
        
        if (copilotStartIndex > marketsStartIndex) {
          marketsEndIndex = copilotStartIndex;
        }
        
        // Extract markets content
        marketsContent = content.substring(marketsStartIndex, marketsEndIndex).trim();
        console.log("Extracted markets content, length:", marketsContent.length);
      }
      
      // Check for copilot section
      if (content.includes("Copilot") || content.includes("AI Copilot")) {
        const copilotStartIndex = Math.max(
          content.indexOf("Copilot"),
          content.indexOf("AI Copilot")
        );
        
        if (copilotStartIndex > -1) {
          copilotContent = content.substring(copilotStartIndex).trim();
          console.log("Extracted copilot content, length:", copilotContent.length);
        }
      }
      
      console.log("Extracted sections lengths:", { 
        newsLength: newsContent.length, 
        marketsLength: marketsContent.length, 
        copilotLength: copilotContent.length 
      });
      
      return {
        news: newsContent,
        markets: marketsContent,
        copilot: copilotContent
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
