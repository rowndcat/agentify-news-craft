
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
  instructions?: string;
  current_content?: string;
}

// Helper function to extract sections from content string using multiple strategies
const extractSectionsFromContent = (content: string): Partial<NewsletterSections> => {
  console.log("Raw content to extract sections from:", content);
  
  const result: Partial<NewsletterSections> = {};
  
  // First, check if the content is a JSON string that we can parse
  try {
    if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
      const parsedJson = JSON.parse(content);
      if (parsedJson.news || parsedJson.markets || parsedJson.copilot) {
        console.log("Successfully parsed JSON content with sections");
        return {
          news: parsedJson.news || "",
          markets: parsedJson.markets || "",
          copilot: parsedJson.copilot || ""
        };
      }
    }
  } catch (e) {
    console.log("Content is not valid JSON, proceeding with manual extraction");
  }
  
  // Clean the content string to handle potential formatting issues
  const cleanContent = content
    .replace(/\\n/g, '\n')  // Replace escaped newlines
    .replace(/\n{3,}/g, '\n\n'); // Replace excessive newlines
  
  console.log("Cleaned content:", cleanContent.substring(0, 150) + "...");
  
  // Check for News Section with format "**News Section**"
  let newsMatch = cleanContent.match(/\*\*News Section\*\*[\s\S]*?(?=\*\*Economy|\*\*Markets|\*\*Copilot|$)/i);
  if (newsMatch && newsMatch[0]) {
    result.news = newsMatch[0].trim();
    console.log("Extracted news section (format 1):", result.news.substring(0, 50) + "...");
  }
  
  // Alternative format: look for section with "### News" or "# News"
  if (!result.news) {
    newsMatch = cleanContent.match(/(?:#+\s*News|News Section)[\s\S]*?(?=#+\s*(?:Economy|Markets|Copilot)|$)/i);
    if (newsMatch && newsMatch[0]) {
      result.news = newsMatch[0].trim();
      console.log("Extracted news section (format 2):", result.news.substring(0, 50) + "...");
    }
  }
  
  // Check for AI News placeholder content format
  if (!result.news && cleanContent.includes("AI News piece") && cleanContent.includes("additional article links")) {
    newsMatch = cleanContent.match(/\*AI News piece\*[\s\S]*?\*7 additional article links\*[\s\S]*?(?=---|\*\*Economy|$)/i);
    if (newsMatch && newsMatch[0]) {
      result.news = "**News Section**\n" + newsMatch[0].trim();
      console.log("Extracted AI News placeholder content");
    }
  }
  
  // Check for Markets section with format "**Economy & Markets Section**"
  let marketsMatch = cleanContent.match(/\*\*Economy & Markets Section\*\*[\s\S]*?(?=\*\*News|\*\*Copilot|$)/i);
  if (marketsMatch && marketsMatch[0]) {
    result.markets = marketsMatch[0].trim();
    console.log("Extracted markets section (format 1):", result.markets.substring(0, 50) + "...");
  }
  
  // Alternative format: look for section with "### Economy" or "# Markets"
  if (!result.markets) {
    marketsMatch = cleanContent.match(/(?:#+\s*(?:Economy|Markets)|Economy & Markets Section)[\s\S]*?(?=#+\s*(?:News|Copilot)|$)/i);
    if (marketsMatch && marketsMatch[0]) {
      result.markets = marketsMatch[0].trim();
      console.log("Extracted markets section (format 2):", result.markets.substring(0, 50) + "...");
    }
  }
  
  // Check for 🌍 Big Picture format which is commonly used in Markets section
  if (!result.markets && cleanContent.includes("🌍 Big Picture")) {
    marketsMatch = cleanContent.match(/(?:###\s*)?🌍 Big Picture[\s\S]*?(?=(?:###\s*)?(?:📈 What to Watch)|$)/i);
    const whatToWatchMatch = cleanContent.match(/(?:###\s*)?📈 What to Watch[\s\S]*?(?=(?:###\s*)?(?:🔑 Key Takeaway)|$)/i);
    const keyTakeawayMatch = cleanContent.match(/(?:###\s*)?🔑 Key Takeaway[\s\S]*?$/i);
    
    let marketsContent = "";
    if (marketsMatch && marketsMatch[0]) marketsContent += marketsMatch[0].trim() + "\n\n";
    if (whatToWatchMatch && whatToWatchMatch[0]) marketsContent += whatToWatchMatch[0].trim() + "\n\n";
    if (keyTakeawayMatch && keyTakeawayMatch[0]) marketsContent += keyTakeawayMatch[0].trim();
    
    if (marketsContent) {
      result.markets = "**Economy & Markets Section**\n" + marketsContent.trim();
      console.log("Extracted markets with emoji sections");
    }
  }
  
  // Check for Copilot section with format "**Copilot**" or "**AI Copilot**"
  let copilotMatch = cleanContent.match(/\*\*(?:Copilot|AI Copilot)\*\*[\s\S]*?$/i);
  if (copilotMatch && copilotMatch[0]) {
    result.copilot = copilotMatch[0].trim();
    console.log("Extracted copilot section (format 1):", result.copilot.substring(0, 50) + "...");
  }
  
  // Alternative format: look for section with "### Copilot" or "# Insights"
  if (!result.copilot) {
    copilotMatch = cleanContent.match(/(?:#+\s*(?:Copilot|Insights)|Copilot)[\s\S]*?$/i);
    if (copilotMatch && copilotMatch[0]) {
      result.copilot = copilotMatch[0].trim();
      console.log("Extracted copilot section (format 2):", result.copilot.substring(0, 50) + "...");
    }
  }
  
  // If we still couldn't extract content, try more aggressive approaches
  if (!result.news && !result.markets && !result.copilot) {
    console.log("Standard extraction failed, trying direct content extraction");
    
    // For a typical 3-section newsletter, we can try to just split the content into thirds
    // This is a last resort, but better than returning nothing
    const contentLines = cleanContent.split('\n').filter(line => line.trim());
    
    if (contentLines.length >= 6) { // Make sure there's enough content to split
      const sectionSize = Math.floor(contentLines.length / 3);
      
      result.news = contentLines.slice(0, sectionSize).join('\n');
      result.markets = contentLines.slice(sectionSize, sectionSize * 2).join('\n');
      result.copilot = contentLines.slice(sectionSize * 2).join('\n');
      
      console.log("Applied fallback content splitting");
    } else if (contentLines.length > 0) {
      // If we have just a little content, assign it to news section
      result.news = cleanContent;
      console.log("Assigned all content to news section as fallback");
    }
  }
  
  // Final check - if we have any content but haven't extracted sections, log this for debugging
  if (cleanContent && Object.keys(result).length === 0) {
    console.warn("Failed to extract any sections from content:", cleanContent);
  }
  
  console.log("Final extracted sections:", {
    newsFound: !!result.news,
    marketsFound: !!result.markets,
    copilotFound: !!result.copilot
  });
  
  return result;
};

export const generateNewsletter = async (request: NewsletterRequest): Promise<Partial<NewsletterSections>> => {
  try {
    console.log(`Sending request to webhook:`, request);
    
    // Create a specific message based on the action type
    let messageToSend = request.message || "";
    let payload = { ...request };
    
    // For regenerate actions, create targeted requests for each section
    if (request.action) {
      const section = request.action.replace('regenerate_', '') as keyof NewsletterSections;
      const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
      
      // Include specific instructions for regeneration
      if (request.instructions) {
        messageToSend = `Regenerate ${sectionTitle} section with these instructions: ${request.instructions}`;
      } else {
        messageToSend = `Regenerate ${sectionTitle} section`;
      }
      
      // If we have current content, include it in the message
      if (request.current_content) {
        messageToSend += `\n\nCurrent content: ${request.current_content}`;
      }
      
      // Update the payload with the constructed message
      payload = {
        chatId: request.chatId,
        message: messageToSend,
        action: request.action,
        current_content: request.current_content
      };
    }
    
    // Send the request with our constructed payload
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to generate newsletter: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Raw response data:", data);
    
    // For regenerate actions, handle targeted section response
    if (request.action) {
      const section = request.action.replace('regenerate_', '') as keyof NewsletterSections;
      console.log(`Processing response for ${section} regeneration`);
      
      // Check if the response has our section directly
      if (data[section] && typeof data[section] === 'string') {
        console.log(`Found direct ${section} property in response`);
        const result: Partial<NewsletterSections> = {};
        result[section] = data[section];
        return result;
      }
      
      // For webhook services, the response may be in message or content field
      const potentialFields = ['message', 'content', 'text', 'output', 'result', 'response'];
      for (const field of potentialFields) {
        if (data[field] && typeof data[field] === 'string') {
          console.log(`Found content in ${field} field`);
          const result: Partial<NewsletterSections> = {};
          result[section] = data[field];
          return result;
        }
      }
      
      // Attempt to extract from any string field in the response
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && value.trim().length > 0) {
          console.log(`Using string content from ${key} field`);
          const result: Partial<NewsletterSections> = {};
          result[section] = value;
          return result;
        }
      }
      
      console.warn(`Could not find content for ${section} regeneration`);
      return {};
    }
    
    // For full generation requests, process the complete response
    console.log("Processing full generation response");
    
    // First, check for direct section properties in the response
    if (typeof data === 'object' && (data.news || data.markets || data.copilot)) {
      console.log("Found direct section properties in response");
      return {
        news: data.news || "",
        markets: data.markets || "",
        copilot: data.copilot || ""
      };
    }
    
    // Check for common response formats like message or content fields
    const potentialFields = ['message', 'content', 'text', 'output', 'result', 'response'];
    for (const field of potentialFields) {
      if (data[field] && typeof data[field] === 'string') {
        console.log(`Found content in ${field} field, extracting sections`);
        return extractSectionsFromContent(data[field]);
      }
    }
    
    // If we didn't find content in common fields, try any string field
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        console.log(`Using string content from ${key} field`);
        return extractSectionsFromContent(value);
      }
    }
    
    // If data itself is a string, try to extract sections from it directly
    if (typeof data === 'string' && data.trim().length > 0) {
      console.log("Response data is a string, extracting sections");
      return extractSectionsFromContent(data);
    }
    
    // Last resort: stringify the entire response and try to extract from that
    try {
      const dataString = JSON.stringify(data);
      if (dataString && dataString !== '{}' && dataString !== '[]') {
        console.log("Attempting extraction from stringified response");
        return extractSectionsFromContent(dataString);
      }
    } catch (e) {
      console.error("Error stringifying response:", e);
    }
    
    console.warn("Failed to extract any content from the response");
    toast.warning("Could not extract newsletter content from the response. Try again or check your API.");
    return {};
  } catch (error) {
    console.error("Error generating newsletter:", error);
    toast.error("Failed to generate newsletter content. Please try again.");
    throw error;
  }
};

// Function to regenerate a specific section of the newsletter
export const regenerateSection = async (
  section: keyof NewsletterSections,
  chatId: string,
  currentContent: string,
  instructions?: string
): Promise<string> => {
  // This function is maintained for backward compatibility
  try {
    console.log(`Regenerating ${section} section with${instructions ? '' : 'out'} instructions`);
    
    const action = `regenerate_${section}` as 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
    
    const result = await generateNewsletter({
      chatId,
      action,
      instructions,
      current_content: currentContent
    });
    
    return result[section] || "";
  } catch (error) {
    console.error(`Error regenerating ${section}:`, error);
    toast.error(`Failed to regenerate ${section}. Please try again.`);
    throw error;
  }
};
