
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
  current_content?: string; // Add current content to the request
}

// Helper function to extract sections from content string using multiple strategies
const extractSectionsFromContent = (content: string): Partial<NewsletterSections> => {
  console.log("Extracting sections from content string:", content.substring(0, 100) + "...");
  
  const result: Partial<NewsletterSections> = {};
  
  // Clean the content string to handle potential formatting issues
  const cleanContent = content
    .replace(/\\n/g, '\n')  // Replace escaped newlines
    .replace(/\n{3,}/g, '\n\n'); // Replace excessive newlines
  
  // Define patterns for each section with variations
  const newsPatterns = [
    /(?:^|\n)(?:#+\s*|\*\*)?(?:News Section|AI News|Technology News)(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?(?:Economy|Markets|Copilot)|$))/i,
    // Match variations like "**News Section**" with all content after it
    /\*\*News Section\*\*([\s\S]*?)(?=\*\*Economy|$)/i,
    // Match "News Section" header and grab all content after it
    /News Section([\s\S]*?)(?=Economy & Markets Section|$)/i
  ];
  
  const marketsPatterns = [
    /(?:^|\n)(?:#+\s*|\*\*)?(?:Economy\s*&?\s*Markets|Markets\s*&?\s*Economy|Financial Markets)(?:\s*Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?(?:News|Copilot|AI\s+Copilot)|$))/i,
    // Match variations like "**Economy & Markets Section**" with all content after it
    /\*\*Economy & Markets Section\*\*([\s\S]*?)(?=\*\*Copilot|$)/i,
    // Match "Economy & Markets Section" header and grab all content after it
    /Economy & Markets Section([\s\S]*?)(?=Copilot|$)/i
  ];
  
  const copilotPatterns = [
    /(?:^|\n)(?:#+\s*|\*\*)?(?:Copilot|AI\s+Copilot|Insights)(?:\s*Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)$/i,
    // Match variations like "**Copilot**" with all content after it
    /\*\*(?:Copilot|AI Copilot)\*\*([\s\S]*?)$/i,
    // Match "Copilot" header and grab all content after it
    /Copilot([\s\S]*?)$/i
  ];
  
  // Try to extract news section
  for (const pattern of newsPatterns) {
    const match = cleanContent.match(pattern);
    if (match && match[1] && match[1].trim()) {
      // For news section, include the entire content if it's a placeholder message
      const newsContent = match[1].trim();
      if (newsContent.includes("No specific AI news") || 
          newsContent.includes("No additional articles")) {
        // This is a placeholder - use the whole section including headers
        const fullNewsSection = cleanContent.match(/News Section[\s\S]*?(?=Economy & Markets Section|$)/i);
        if (fullNewsSection && fullNewsSection[0]) {
          result.news = fullNewsSection[0].trim();
          break;
        }
      }
      
      result.news = newsContent;
      break;
    }
  }
  
  // Try to extract markets section
  for (const pattern of marketsPatterns) {
    const match = cleanContent.match(pattern);
    if (match && match[1] && match[1].trim()) {
      result.markets = match[1].trim();
      break;
    }
  }
  
  // Try to extract copilot section
  for (const pattern of copilotPatterns) {
    const match = cleanContent.match(pattern);
    if (match && match[1] && match[1].trim()) {
      result.copilot = match[1].trim();
      break;
    }
  }
  
  // If we couldn't extract any sections but have content,
  // try a more aggressive approach to parse the content
  if (!result.news && !result.markets && !result.copilot && cleanContent.trim()) {
    console.log("No sections extracted, trying alternate parsing strategy");
    
    // Special handling for output that has section headers but doesn't match our patterns
    // First, extract any full news section content
    if (cleanContent.includes("News Section")) {
      // Get everything from "News Section" to "Economy & Markets Section" (or end)
      const newsMatch = cleanContent.match(/News Section[\s\S]*?(?=Economy & Markets Section|$)/i);
      if (newsMatch && newsMatch[0]) {
        result.news = newsMatch[0].trim();
      }
    }
    
    // Extract any markets section content
    if (cleanContent.includes("Economy & Markets Section")) {
      // Get everything from "Economy & Markets Section" to "Copilot" (or end)
      const marketsMatch = cleanContent.match(/Economy & Markets Section[\s\S]*?(?=Copilot|$)/i);
      if (marketsMatch && marketsMatch[0]) {
        result.markets = marketsMatch[0].trim();
      }
    }
    
    // Extract any copilot section content
    if (cleanContent.includes("Copilot")) {
      // Get everything from "Copilot" to the end
      const copilotMatch = cleanContent.match(/Copilot[\s\S]*$/i);
      if (copilotMatch && copilotMatch[0]) {
        result.copilot = copilotMatch[0].trim();
      }
    }
    
    // If we still have nothing, try splitting by markdown headers
    if (!result.news && !result.markets && !result.copilot) {
      const sections = cleanContent.split(/#{1,3}\s+/);
      if (sections.length > 1) {
        // First section might be empty or contain a title
        sections.shift();
        
        // Assign sections based on keywords in their titles
        sections.forEach(section => {
          const sectionTitle = section.split('\n')[0].toLowerCase();
          const sectionContent = section.split('\n').slice(1).join('\n').trim();
          
          if (!sectionContent) return;
          
          if (sectionTitle.includes('news') || sectionTitle.includes('ai') || sectionTitle.includes('tech')) {
            result.news = sectionContent;
          } else if (sectionTitle.includes('market') || sectionTitle.includes('econom') || sectionTitle.includes('financ')) {
            result.markets = sectionContent;
          } else if (sectionTitle.includes('copilot') || sectionTitle.includes('insight') || sectionTitle.includes('analysis')) {
            result.copilot = sectionContent;
          }
        });
      }
    }
    
    // Last resort - if we only have one section's worth of content, try to determine which
    if (Object.keys(result).length === 0 && cleanContent.trim()) {
      // Analyze the content to guess which section it belongs to
      const lowerContent = cleanContent.toLowerCase();
      
      if (lowerContent.includes('news') || lowerContent.includes('ai development') || lowerContent.includes('technology breakthroughs')) {
        result.news = cleanContent.trim();
      } else if (lowerContent.includes('market') || lowerContent.includes('econom') || lowerContent.includes('financ') || lowerContent.includes('inflation')) {
        result.markets = cleanContent.trim();
      } else if (lowerContent.includes('insight') || lowerContent.includes('analysis') || lowerContent.includes('key takeaway')) {
        result.copilot = cleanContent.trim();
      } else {
        // If we can't determine, default to news
        result.news = cleanContent.trim();
      }
    }
  }
  
  console.log("Extracted sections:", {
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
      
      // Make sure we're only sending the relevant section data for regeneration
      payload = {
        chatId: request.chatId,
        message: messageToSend,
        action: request.action,
        // Only include current_content for the section being regenerated
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
      
      // Direct property access - most common format
      if (data[section]) {
        console.log(`Found direct ${section} property in response`);
        const result: Partial<NewsletterSections> = {};
        result[section] = data[section];
        return result;
      }
      
      // Check common properties where content might be
      const potentialProperties = ['content', 'output', 'text', 'message', 'result', 'response', 'generatedContent'];
      
      for (const prop of potentialProperties) {
        // Direct string content in property
        if (data[prop] && typeof data[prop] === 'string' && data[prop].trim()) {
          console.log(`Found content in ${prop} property`);
          const result: Partial<NewsletterSections> = {};
          result[section] = data[prop].trim();
          return result;
        }
        
        // Nested object with section property
        if (data[prop] && typeof data[prop] === 'object' && data[prop][section]) {
          console.log(`Found nested ${section} in ${prop} property`);
          const result: Partial<NewsletterSections> = {};
          result[section] = data[prop][section];
          return result;
        }
      }
      
      // Check for content in any string property
      const anyStringContent = Object.entries(data)
        .filter(([_, value]) => typeof value === 'string' && value.trim().length > 0)
        .map(([_, value]) => value as string)[0];
      
      if (anyStringContent) {
        console.log(`Found content in string property`);
        const result: Partial<NewsletterSections> = {};
        result[section] = anyStringContent.trim();
        return result;
      }
      
      console.warn(`Could not extract content for ${section} section`);
      return {};
    }
    
    // For "generate all" request, handle full sections extraction
    console.log("Processing response for all sections generation");
    
    // Case 1: Response is already a string containing all sections
    if (typeof data === 'string' && data.trim()) {
      console.log("Response is a string, extracting sections");
      return extractSectionsFromContent(data);
    }
    
    // Case 2: Direct section properties in response
    if (data.news || data.markets || data.copilot) {
      console.log("Found direct section properties in response");
      return {
        news: data.news || "",
        markets: data.markets || "",
        copilot: data.copilot || "",
      };
    }
    
    // Case 3: Extract from content property if it exists and is a string
    if (data.content && typeof data.content === 'string' && data.content.trim()) {
      console.log("Extracting sections from content property");
      return extractSectionsFromContent(data.content);
    }
    
    // Case 4: Check message property which is common in webhook responses
    if (data.message && typeof data.message === 'string' && data.message.trim()) {
      console.log("Extracting sections from message property");
      return extractSectionsFromContent(data.message);
    }
    
    // Case 5: Try various other common property names
    const potentialProperties = ['output', 'text', 'result', 'response', 'generatedContent', 'answer'];
    
    for (const prop of potentialProperties) {
      if (data[prop] && typeof data[prop] === 'string' && data[prop].trim()) {
        console.log(`Extracting sections from ${prop} property`);
        return extractSectionsFromContent(data[prop]);
      }
    }
    
    // Case 6: Look for any property that is a string and try to extract sections
    const stringProps = Object.entries(data).filter(([_, value]) => typeof value === 'string' && value.trim().length > 0);
    
    if (stringProps.length > 0) {
      console.log("Found string properties, trying to extract sections");
      // Combine all string properties and try to extract sections
      const combinedContent = stringProps.map(([_, value]) => value).join('\n\n');
      return extractSectionsFromContent(combinedContent);
    }
    
    // Case 7: If data itself doesn't have expected structure, attempt to stringify and parse
    console.log("Attempting to extract from stringified response");
    try {
      const dataStr = JSON.stringify(data);
      if (dataStr && dataStr.length > 2) { // Not just "{}" or "[]"
        return extractSectionsFromContent(dataStr);
      }
    } catch (e) {
      console.error("Error stringifying data:", e);
    }
    
    // If we still couldn't extract any content
    console.warn("Failed to extract any content from the response");
    toast.warning("Failed to extract content from the API response. Try again or check the API format.");
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
