
// Import necessary types
import { toast } from "sonner";

// Define the structure for newsletter sections
export interface NewsletterSections {
  news: string;
  markets: string;
  copilot: string;
}

// Webhook URLs (consider moving to environment variables in a production app)
const CHAT_WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat";
const IMAGE_WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/76840a22-558d-4fae-9f51-aadcd7c3fb7f";

/**
 * Generate a complete newsletter with all sections
 */
export const generateNewsletter = async (payload: {
  chatId: string;
  message: string;
}): Promise<{
  news: string;
  markets: string;
  copilot: string;
  newsImage?: string;
  marketsImage?: string;
  copilotImage?: string;
}> => {
  console.log("Generating newsletter with payload:", payload);

  try {
    // Send request to the webhook
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error("Webhook response error:", response.status, response.statusText);
      throw new Error(`Webhook response error: ${response.statusText}`);
    }

    // Parse the response
    const responseData = await response.json();
    console.log("Webhook response data:", responseData);

    // Ensure we have a valid response with text
    if (!responseData || !responseData.text) {
      console.error("Invalid webhook response - missing text");
      throw new Error("Invalid webhook response");
    }

    // Get the response text
    const fullText = responseData.text;
    console.log("Full response text:", fullText);

    // Separate the sections with advanced parsing logic
    const sections = separateNewsSections(fullText);
    console.log("Parsed sections:", sections);

    // Return the sections
    return {
      news: sections.news || "",
      markets: sections.markets || "",
      copilot: sections.copilot || "",
      newsImage: responseData.newsImage || null,
      marketsImage: responseData.marketsImage || null,
      copilotImage: responseData.copilotImage || null,
    };
  } catch (error) {
    console.error("Error generating newsletter:", error);
    throw error;
  }
};

/**
 * Regenerate a specific section of the newsletter
 */
export const regenerateSection = async (
  section: "news" | "markets" | "copilot",
  chatId: string,
  instructions?: string
): Promise<string> => {
  console.log(`Regenerating ${section} section with chat ID:`, chatId);
  console.log("Instructions:", instructions || "None");

  try {
    // Create the message with instructions if provided
    const message = instructions
      ? `Regenerate ${section} section with these instructions: ${instructions}`
      : `Regenerate ${section} section`;

    // Send request to the webhook
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        message,
      }),
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error("Webhook response error:", response.status, response.statusText);
      throw new Error(`Webhook response error: ${response.statusText}`);
    }

    // Parse the response
    const responseData = await response.json();
    console.log("Section regeneration webhook response data:", responseData);

    // Ensure we have a valid response with text
    if (!responseData || !responseData.text) {
      console.error("Invalid webhook response - missing text");
      throw new Error("Invalid webhook response");
    }

    // The webhook might return all sections or just the one we want
    // Try to extract the specific section we requested
    const sections = separateNewsSections(responseData.text);
    
    // Return the specific section content
    return sections[section] || "";
  } catch (error) {
    console.error(`Error regenerating ${section} section:`, error);
    throw error;
  }
};

/**
 * Generate an image for a specific section using its content
 */
export const generateSectionImage = async (
  section: "news" | "markets" | "copilot", 
  content: string
): Promise<string | null> => {
  if (!content) {
    console.error(`Cannot generate image for ${section} - no content provided`);
    return null;
  }

  console.log(`Generating image for ${section} section`);
  console.log("Content preview:", content.substring(0, 100) + "...");

  try {
    // Send request to the image generation webhook
    const response = await fetch(IMAGE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section,
        content: content.substring(0, 1000), // Limit content length
      }),
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error("Image webhook response error:", response.status, response.statusText);
      throw new Error(`Image webhook response error: ${response.statusText}`);
    }

    // Parse the response
    const responseData = await response.json();
    console.log("Image generation response:", responseData);

    // Return the image URL if available
    if (responseData && responseData.imageUrl) {
      return responseData.imageUrl;
    } else {
      console.warn(`No image URL returned for ${section} section`);
      return null;
    }
  } catch (error) {
    console.error(`Error generating image for ${section} section:`, error);
    return null;
  }
};

/**
 * Separate the newsletter sections from the full text using multiple methods
 */
function separateNewsSections(fullText: string): NewsletterSections {
  console.log("Separating sections from full text...");
  
  // Initialize empty sections
  const sections: NewsletterSections = {
    news: "",
    markets: "",
    copilot: "",
  };
  
  try {
    // First attempt: Look for explicit section markers
    // Method 1: Check for standard section headers with markdown
    const newsPattern1 = /(?:###\s*\*\*News Section\*\*|##\s*News Section|News Section)([\s\S]*?)(?=###\s*\*\*Economy & Markets Section\*\*|##\s*Economy & Markets Section|Economy & Markets Section|###\s*\*\*Copilot\*\*|##\s*Copilot|Copilot Section|$)/i;
    const marketsPattern1 = /(?:###\s*\*\*Economy & Markets Section\*\*|##\s*Economy & Markets Section|Economy & Markets Section)([\s\S]*?)(?=###\s*\*\*Copilot\*\*|##\s*Copilot|Copilot Section|$)/i;
    const copilotPattern1 = /(?:###\s*\*\*Copilot\*\*|###\s*\*\*Copilot Section\*\*|##\s*Copilot|Copilot Section)([\s\S]*?)$/i;
    
    // Method 2: Look for emoji section headers (used in Markets section)
    const newsPattern2 = /([\s\S]*?)(?=🌍\s*Big Picture|###\s*🌍\s*Big Picture)/i;
    const marketsPattern2 = /(?:🌍\s*Big Picture|###\s*🌍\s*Big Picture)([\s\S]*?)(?=TIME:|###\s*\*\*Copilot\*\*|Copilot Section|$)/i;
    const copilotPattern2 = /(?:TIME:|###\s*\*\*Copilot\*\*|Copilot Section)([\s\S]*?)$/i;
    
    // Method 3: Identify by common content patterns
    const hasNewsIndicators = fullText.includes("News Section") || fullText.includes("Additional News Links");
    const hasMarketsIndicators = fullText.includes("Big Picture") || fullText.includes("What to Watch") || fullText.includes("Key Takeaway");
    const hasCopilotIndicators = fullText.includes("TIME:") || fullText.includes("ATTENTION:") || fullText.includes("PROFIT/PROGRESS:") || fullText.includes("Copilot Section");
    
    // Try Method 1 first (explicit section headers)
    let newsMatch = fullText.match(newsPattern1);
    let marketsMatch = fullText.match(marketsPattern1);
    let copilotMatch = fullText.match(copilotPattern1);
    
    // If not all sections found, try Method 2 (emoji headers)
    if (!newsMatch?.[1] || !marketsMatch?.[1] || !copilotMatch?.[1]) {
      newsMatch = fullText.match(newsPattern2);
      marketsMatch = fullText.match(marketsPattern2);
      copilotMatch = fullText.match(copilotPattern2);
    }
    
    // If still not successful, attempt fallback division
    if (!newsMatch?.[1] || !marketsMatch?.[1] || !copilotMatch?.[1]) {
      // Check for special markers or dividers like "---"
      const dividers = fullText.split(/---+/);
      if (dividers.length >= 3) {
        // Assume the content is divided by "---" into sections
        sections.news = dividers[0].trim();
        sections.markets = dividers[1].trim();
        sections.copilot = dividers[2].trim();
        console.log("Used divider method for section separation");
      } else {
        // Last resort: Try to identify by content patterns and rough splitting
        const lines = fullText.split("\n");
        let currentSection = hasNewsIndicators ? "news" : "";
        
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          
          // Try to detect section transitions
          if ((line.includes("Economy & Markets") || (line.includes("🌍") && line.includes("Big Picture"))) && i > lines.length / 4) {
            currentSection = "markets";
            continue;
          } else if ((line.includes("Copilot") || line.includes("TIME:") || line.includes("ATTENTION:")) && i > lines.length / 2) {
            currentSection = "copilot";
            continue;
          }
          
          // Add content to current section
          if (currentSection) {
            sections[currentSection as keyof NewsletterSections] += line + "\n";
          } else if (i < lines.length / 3) {
            // If no section detected yet and in first third, assume news
            sections.news += line + "\n";
            currentSection = "news";
          }
        }
        console.log("Used content pattern fallback for section separation");
      }
    } else {
      // Use the matches from either Method 1 or Method 2
      sections.news = newsMatch?.[1]?.trim() || "";
      sections.markets = marketsMatch?.[1]?.trim() || "";
      sections.copilot = copilotMatch?.[1]?.trim() || "";
      console.log("Used regex patterns for section separation");
    }
    
    // Clean up sections
    sections.news = cleanupSection(sections.news);
    sections.markets = cleanupSection(sections.markets);
    sections.copilot = cleanupSection(sections.copilot);
    
    // Log the detected sections for debugging
    console.log("News section length:", sections.news.length);
    console.log("Markets section length:", sections.markets.length);
    console.log("Copilot section length:", sections.copilot.length);
    
    // Add section headers if they don't exist
    if (sections.news && !sections.news.includes("News Section")) {
      sections.news = "### **News Section**\n\n" + sections.news;
    }
    if (sections.markets && !sections.markets.includes("Economy & Markets Section")) {
      sections.markets = "### **Economy & Markets Section**\n\n" + sections.markets;
    }
    if (sections.copilot && !sections.copilot.includes("Copilot Section")) {
      sections.copilot = "### **Copilot Section**\n\n" + sections.copilot;
    }
    
    return sections;
  } catch (error) {
    console.error("Error separating newsletter sections:", error);
    return sections;
  }
}

/**
 * Clean up a section by removing excess whitespace and cleaning up markers
 */
function cleanupSection(text: string): string {
  if (!text) return "";
  
  return text
    .replace(/^\s+|\s+$/g, "") // Trim whitespace
    .replace(/\n{3,}/g, "\n\n") // Normalize multiple newlines
    .replace(/---+/g, ""); // Remove dividers
}
