
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
      
      // Check for news section (handling multiple possible section headers)
      if (content.includes("### News Section") || content.includes("### **News Section**")) {
        const newsStartIndex = Math.max(
          content.indexOf("### News Section"), 
          content.indexOf("### **News Section**")
        );
        
        // Find where markets section starts, or end of content
        const marketsStartIndex = Math.max(
          content.indexOf("### Economy & Markets Section", newsStartIndex),
          content.indexOf("### **Economy & Markets Section**", newsStartIndex),
          content.indexOf("---", newsStartIndex) // Sometimes sections are separated by markdown dividers
        );
        
        // Extract news content (if we found a valid end point)
        if (marketsStartIndex > newsStartIndex) {
          newsContent = content.substring(newsStartIndex, marketsStartIndex).trim();
        } else {
          // If no markets section found, just take everything from news to the end
          newsContent = content.substring(newsStartIndex).trim();
        }
      }
      
      // Check for markets section
      if (content.includes("### Economy & Markets Section") || content.includes("### **Economy & Markets Section**")) {
        const marketsStartIndex = Math.max(
          content.indexOf("### Economy & Markets Section"),
          content.indexOf("### **Economy & Markets Section**")
        );
        
        // Find where copilot section starts, or end of content
        const copilotStartIndex = Math.max(
          content.indexOf("### Copilot", marketsStartIndex),
          content.indexOf("### **Copilot**", marketsStartIndex),
          content.indexOf("### AI Copilot", marketsStartIndex),
          content.indexOf("### **AI Copilot**", marketsStartIndex),
          content.indexOf("---", marketsStartIndex + 10) // +10 to avoid finding the same divider
        );
        
        // Extract markets content (if we found a valid end point)
        if (copilotStartIndex > marketsStartIndex) {
          marketsContent = content.substring(marketsStartIndex, copilotStartIndex).trim();
        } else {
          // If no copilot section found, just take everything from markets to the end
          marketsContent = content.substring(marketsStartIndex).trim();
        }
      }
      
      // Check for copilot section (if we didn't already reach the end)
      if (content.includes("### Copilot") || content.includes("### **Copilot**") || 
          content.includes("### AI Copilot") || content.includes("### **AI Copilot**")) {
        const copilotStartIndex = Math.max(
          content.indexOf("### Copilot"),
          content.indexOf("### **Copilot**"),
          content.indexOf("### AI Copilot"),
          content.indexOf("### **AI Copilot**")
        );
        
        copilotContent = content.substring(copilotStartIndex).trim();
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
