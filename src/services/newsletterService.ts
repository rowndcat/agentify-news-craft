
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
    console.log("Webhook response data received:", responseData);

    // Ensure we have a valid response with text
    if (!responseData || !responseData.text) {
      console.error("Invalid webhook response - missing text");
      throw new Error("Invalid webhook response");
    }

    // Get the response text
    const fullText = responseData.text;
    console.log("Full response text length:", fullText.length);
    console.log("First 100 characters:", fullText.substring(0, 100));
    console.log("Last 100 characters:", fullText.substring(fullText.length - 100));

    // Use the improved parsing logic to separate sections
    const sections = separateNewsSections(fullText);
    console.log("Parsed section lengths:", {
      news: sections.news.length,
      markets: sections.markets.length,
      copilot: sections.copilot.length
    });

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
    toast.error("Failed to generate newsletter. Please try again.");
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

    // Log the request payload
    console.log("Regenerate section request payload:", {
      chatId,
      message
    });

    // Send request to the webhook with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chatId,
        message,
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

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
    
    console.log(`Extracted ${section} section length:`, sections[section]?.length || 0);
    
    // If we don't have the specific section, use the full text as a fallback
    if (!sections[section] || sections[section].trim().length === 0) {
      console.log("Using full text as fallback for section");
      return responseData.text.trim();
    }
    
    // Return the specific section content
    return sections[section] || "";
  } catch (error) {
    console.error(`Error regenerating ${section} section:`, error);
    toast.error(`Failed to regenerate ${section} section. Please try again.`);
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
    // Send request to the image generation webhook with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(IMAGE_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        section,
        content: content.substring(0, 1000), // Limit content length
      }),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

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
    // Log full text for debugging
    console.log("Full text to separate:", fullText.substring(0, 200) + "...");

    // Check for specific section markers with markdown or plain text
    const newsPattern = /(?:\*\*News Section\*\*|\bNews Section\b)([\s\S]*?)(?=\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b|\*\*Copilot Section\*\*|\bCopilot Section\b|---+|$)/i;
    const marketsPattern = /(?:\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b)([\s\S]*?)(?=\*\*Copilot Section\*\*|\bCopilot Section\b|---+|$)/i;
    const copilotPattern = /(?:\*\*Copilot Section\*\*|\bCopilot Section\b)([\s\S]*?)$/i;

    // Extract sections using the patterns
    const newsMatch = fullText.match(newsPattern);
    const marketsMatch = fullText.match(marketsPattern);
    const copilotMatch = fullText.match(copilotPattern);

    console.log("News section match:", newsMatch ? "found" : "not found");
    console.log("Markets section match:", marketsMatch ? "found" : "not found");
    console.log("Copilot section match:", copilotMatch ? "found" : "not found");

    // Look for section dividers if direct patterns didn't work
    if (!newsMatch && !marketsMatch && !copilotMatch) {
      console.log("Trying divider method...");
      // Try divider method (---) which is often used to separate sections
      const dividers = fullText.split(/---+/);
      
      if (dividers.length >= 3) {
        // If we have at least 3 sections separated by dividers
        // Assume the ordering: news, markets, copilot
        sections.news = cleanupSection(dividers[0]);
        sections.markets = cleanupSection(dividers[1]);
        sections.copilot = cleanupSection(dividers.slice(2).join("\n---\n"));  // Combine any additional dividers
        
        console.log("Used divider method for section separation");
      }
    } else {
      // Use the regex matches if available
      if (newsMatch && newsMatch[1]) {
        sections.news = cleanupSection(newsMatch[1]);
      }
      
      if (marketsMatch && marketsMatch[1]) {
        sections.markets = cleanupSection(marketsMatch[1]);
      }
      
      if (copilotMatch && copilotMatch[1]) {
        sections.copilot = cleanupSection(copilotMatch[1]);
      }
      
      console.log("Used regex patterns for section separation");
    }

    // If we still don't have all sections, try looking for alternative headers
    if (!sections.news || !sections.markets || !sections.copilot) {
      console.log("Some sections still missing, trying alternative headers...");
      
      // Look for content indicators specific to each section
      const titlePattern = /\*\*Title:(.*?)\*\*/;
      const bulletPointsPattern = /BULLET POINTS:/;
      const bigPicturePattern = /🌍 Big Picture/;
      const timeThemePattern = /TIME:|TIME –|TIME theme/i;
      
      // If we don't have news content but can find title/bullet points
      if (!sections.news && (fullText.match(titlePattern) || fullText.match(bulletPointsPattern))) {
        // Extract from the start until we find a markets or copilot indicator
        const endIndex = fullText.search(/(?:Economy & Markets|🌍 Big Picture|Copilot Section|TIME:|TIME –)/i);
        if (endIndex > 0) {
          sections.news = cleanupSection(fullText.substring(0, endIndex));
        }
      }
      
      // If we don't have markets content but can find big picture
      if (!sections.markets && fullText.match(bigPicturePattern)) {
        const startIndex = fullText.search(/(?:🌍 Big Picture)/i);
        const endIndex = fullText.search(/(?:Copilot Section|TIME:|TIME –)/i);
        if (startIndex > 0 && endIndex > startIndex) {
          sections.markets = cleanupSection(fullText.substring(startIndex, endIndex));
        }
      }
      
      // If we don't have copilot content but can find TIME theme
      if (!sections.copilot && fullText.match(timeThemePattern)) {
        const startIndex = fullText.search(/(?:TIME:|TIME –|TIME theme)/i);
        if (startIndex > 0) {
          sections.copilot = cleanupSection(fullText.substring(startIndex));
        }
      }
      
      console.log("After alternative headers search:");
      console.log("News found:", Boolean(sections.news));
      console.log("Markets found:", Boolean(sections.markets));
      console.log("Copilot found:", Boolean(sections.copilot));
    }
    
    // Fallback: If all else fails, try to split text into roughly equal thirds
    if (!sections.news && !sections.markets && !sections.copilot) {
      console.log("No sections found through patterns, using fallback division method");
      
      const lines = fullText.split("\n");
      const segmentSize = Math.floor(lines.length / 3);
      
      sections.news = cleanupSection(lines.slice(0, segmentSize).join("\n"));
      sections.markets = cleanupSection(lines.slice(segmentSize, segmentSize * 2).join("\n"));
      sections.copilot = cleanupSection(lines.slice(segmentSize * 2).join("\n"));
    }
    
    // If any section is still empty, use the full text for that section
    if (!sections.news && !sections.markets && !sections.copilot) {
      console.log("All section detection methods failed, using full text as news section");
      sections.news = cleanupSection(fullText);
    } else if (!sections.news && !sections.markets) {
      console.log("News and markets sections not found, splitting remaining content");
      const remainingText = fullText.replace(sections.copilot, "");
      const midpoint = Math.floor(remainingText.length / 2);
      sections.news = cleanupSection(remainingText.substring(0, midpoint));
      sections.markets = cleanupSection(remainingText.substring(midpoint));
    } else if (!sections.news && !sections.copilot) {
      console.log("News and copilot sections not found, splitting remaining content");
      const remainingText = fullText.replace(sections.markets, "");
      const midpoint = Math.floor(remainingText.length / 2);
      sections.news = cleanupSection(remainingText.substring(0, midpoint));
      sections.copilot = cleanupSection(remainingText.substring(midpoint));
    } else if (!sections.markets && !sections.copilot) {
      console.log("Markets and copilot sections not found, splitting remaining content");
      const remainingText = fullText.replace(sections.news, "");
      const midpoint = Math.floor(remainingText.length / 2);
      sections.markets = cleanupSection(remainingText.substring(0, midpoint));
      sections.copilot = cleanupSection(remainingText.substring(midpoint));
    } else if (!sections.news) {
      console.log("News section not found, using remaining text");
      sections.news = cleanupSection(fullText.replace(sections.markets, "").replace(sections.copilot, ""));
    } else if (!sections.markets) {
      console.log("Markets section not found, using remaining text");
      sections.markets = cleanupSection(fullText.replace(sections.news, "").replace(sections.copilot, ""));
    } else if (!sections.copilot) {
      console.log("Copilot section not found, using remaining text");
      sections.copilot = cleanupSection(fullText.replace(sections.news, "").replace(sections.markets, ""));
    }
    
    // Add section headers if they don't exist
    if (sections.news && !sections.news.includes("News Section")) {
      sections.news = "**News Section**\n\n" + sections.news;
    }
    
    if (sections.markets && !sections.markets.includes("Economy & Markets")) {
      sections.markets = "**Economy & Markets Section**\n\n" + sections.markets;
    }
    
    if (sections.copilot && !sections.copilot.includes("Copilot")) {
      sections.copilot = "**Copilot Section**\n\n" + sections.copilot;
    }
    
    console.log("Final section lengths after all processing:");
    console.log("News section:", sections.news.length);
    console.log("Markets section:", sections.markets.length);
    console.log("Copilot section:", sections.copilot.length);
    
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
    .replace(/---+/g, "") // Remove dividers
    .replace(/^\*\*News Section\*\*\s*[\r\n]+/im, '**News Section**\n\n') // Fix News Section header
    .replace(/^\*\*Economy & Markets Section\*\*\s*[\r\n]+/im, '**Economy & Markets Section**\n\n') // Fix Markets Section header
    .replace(/^\*\*Copilot Section\*\*\s*[\r\n]+/im, '**Copilot Section**\n\n'); // Fix Copilot Section header
}
