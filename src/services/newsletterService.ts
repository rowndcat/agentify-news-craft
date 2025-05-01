
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
      
      // Check for news section patterns with various formats
      let newsExtracted = false;
      if (content.includes("**News Section") || content.includes("News Section:") || content.includes("### News Section")) {
        // Find the start of news section - check multiple patterns
        let newsStartIndex = -1;
        
        // Check different possible news section headers
        const newsPatterns = [
          "**News Section",
          "News Section:",
          "### News Section",
          "# News Section"
        ];
        
        for (const pattern of newsPatterns) {
          const index = content.indexOf(pattern);
          if (index !== -1 && (newsStartIndex === -1 || index < newsStartIndex)) {
            newsStartIndex = index;
          }
        }
        
        // Find where markets section or separator starts
        const economySectionIndex = Math.max(
          content.indexOf("Economy & Markets Section", newsStartIndex),
          content.indexOf("### Economy & Markets Section", newsStartIndex),
          content.indexOf("**Economy & Markets Section", newsStartIndex),
          content.indexOf("# Economy & Markets Section", newsStartIndex)
        );
        
        const separatorIndex = content.indexOf("---", newsStartIndex);
        
        // Determine end of news section - use whichever comes first
        let newsEndIndex = content.length;
        if (economySectionIndex > -1 && economySectionIndex > newsStartIndex) {
          newsEndIndex = economySectionIndex;
        } else if (separatorIndex > -1 && separatorIndex > newsStartIndex) {
          newsEndIndex = separatorIndex;
        }
        
        // Extract news content
        if (newsStartIndex > -1) {
          newsContent = content.substring(newsStartIndex, newsEndIndex).trim();
          console.log("Extracted news content, length:", newsContent.length);
          newsExtracted = true;
        }
      }
      
      // If no news section was found with previous patterns, try another approach
      if (!newsExtracted && content.trim().length > 0) {
        // If no specific news section was found but we have content, 
        // and it doesn't clearly contain other sections, use it as news
        if (!content.includes("Economy & Markets Section") && !content.includes("Copilot")) {
          newsContent = content.trim();
          console.log("Using full content as news section, length:", newsContent.length);
        }
      }
      
      // Check for markets section
      if (content.includes("Economy & Markets Section")) {
        // Find the start of markets section
        const marketPatterns = [
          "Economy & Markets Section",
          "### Economy & Markets",
          "**Economy & Markets",
          "# Economy & Markets"
        ];
        
        let marketsStartIndex = -1;
        for (const pattern of marketPatterns) {
          const index = content.indexOf(pattern);
          if (index !== -1 && (marketsStartIndex === -1 || index < marketsStartIndex)) {
            marketsStartIndex = index;
          }
        }
        
        // Find where copilot section starts or end of content
        let marketsEndIndex = content.length;
        const copilotPatterns = ["Copilot", "AI Copilot", "### Copilot", "**Copilot", "# Copilot"];
        let copilotStartIndex = -1;
        
        for (const pattern of copilotPatterns) {
          const index = content.indexOf(pattern, marketsStartIndex);
          if (index !== -1 && (copilotStartIndex === -1 || index < copilotStartIndex)) {
            copilotStartIndex = index;
          }
        }
        
        if (copilotStartIndex > marketsStartIndex) {
          marketsEndIndex = copilotStartIndex;
        }
        
        // Extract markets content
        if (marketsStartIndex > -1) {
          marketsContent = content.substring(marketsStartIndex, marketsEndIndex).trim();
          console.log("Extracted markets content, length:", marketsContent.length);
        }
      }
      
      // Check for copilot section
      const copilotPatterns = ["Copilot", "AI Copilot", "### Copilot", "**Copilot", "# Copilot"];
      let copilotStartIndex = -1;
      
      for (const pattern of copilotPatterns) {
        const index = content.indexOf(pattern);
        if (index !== -1 && (copilotStartIndex === -1 || index < copilotStartIndex)) {
          copilotStartIndex = index;
        }
      }
      
      if (copilotStartIndex > -1) {
        copilotContent = content.substring(copilotStartIndex).trim();
        console.log("Extracted copilot content, length:", copilotContent.length);
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
          ? `regenerate news section with the following instructions: ${instructions}`
          : "create a new news section";
        break;
      case 'markets':
        message = instructions 
          ? `regenerate markets and economy section with the following instructions: ${instructions}` 
          : "create a markets and economy section";
        break;
      case 'copilot':
        message = instructions 
          ? `regenerate copilot insights with the following instructions: ${instructions}` 
          : "create a copilot insights section";
        break;
    }
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to regenerate ${section}: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log(`${section} regeneration data received:`, data);
    
    // Extract the relevant section content based on the response
    let regeneratedContent = "";
    
    // Handle different response formats
    if (data.output && typeof data.output === 'string') {
      // Use the existing parser to extract content
      const parsedSections = await generateNewsletter({
        chatId,
        message: `extract ${section} content from: ${data.output}`
      });
      
      regeneratedContent = parsedSections[section] || "";
    } else if (data[section]) {
      // Direct section data
      regeneratedContent = data[section];
    } else if (data.content) {
      // Try to extract from content property
      try {
        const parsedContent = typeof data.content === 'string' ? 
          JSON.parse(data.content) : data.content;
        
        regeneratedContent = parsedContent[section] || "";
      } catch (error) {
        console.error("Error parsing content:", error);
        if (typeof data.content === 'string') {
          regeneratedContent = data.content;
        }
      }
    }
    
    if (!regeneratedContent) {
      toast.warning(`No ${section} content was returned from the API. Please try again.`);
      return "";
    }
    
    return regeneratedContent;
  } catch (error) {
    console.error(`Error regenerating ${section}:`, error);
    toast.error(`Failed to regenerate ${section}. Please try again.`);
    throw error;
  }
};
