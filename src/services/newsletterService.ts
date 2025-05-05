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
  
  // Define patterns for each section with variations
  const newsPatterns = [
    /(?:^|\n)(?:#+\s*|\*\*)?\s*News\s+Section\s*(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?\s*(?:Economy|Markets|Copilot)|$))/i,
    /(?:^|\n)(?:#+\s*|\*\*)?\s*AI\s+News\s*(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?\s*(?:Economy|Markets|Copilot)|$))/i,
    /(?:^|\n)(?:#+\s*|\*\*)?\s*Technology\s+News\s*(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?\s*(?:Economy|Markets|Copilot)|$))/i
  ];
  
  const marketsPatterns = [
    /(?:^|\n)(?:#+\s*|\*\*)?\s*Economy\s*&?\s*Markets\s*(?:Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?\s*(?:News|Copilot|AI\s+Copilot)|$))/i,
    /(?:^|\n)(?:#+\s*|\*\*)?\s*Markets\s*&?\s*Economy\s*(?:Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?\s*(?:News|Copilot|AI\s+Copilot)|$))/i,
    /(?:^|\n)(?:#+\s*|\*\*)?\s*Financial\s+Markets\s*(?:Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)(?=(?:\n\s*(?:#+\s*|\*\*)?\s*(?:News|Copilot|AI\s+Copilot)|$))/i
  ];
  
  const copilotPatterns = [
    /(?:^|\n)(?:#+\s*|\*\*)?\s*Copilot\s*(?:Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)$/i,
    /(?:^|\n)(?:#+\s*|\*\*)?\s*AI\s+Copilot\s*(?:Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)$/i,
    /(?:^|\n)(?:#+\s*|\*\*)?\s*Insights\s*(?:Section)?(?:\*\*)?(?:\:)?(?:\n|$)([\s\S]*?)$/i
  ];
  
  // Try to extract news section
  for (const pattern of newsPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim()) {
      result.news = match[1].trim();
      break;
    }
  }
  
  // Try to extract markets section
  for (const pattern of marketsPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim()) {
      result.markets = match[1].trim();
      break;
    }
  }
  
  // Try to extract copilot section
  for (const pattern of copilotPatterns) {
    const match = content.match(pattern);
    if (match && match[1] && match[1].trim()) {
      result.copilot = match[1].trim();
      break;
    }
  }
  
  // If we couldn't extract any sections but have content,
  // try a more aggressive approach to parse the content
  if (!result.news && !result.markets && !result.copilot && content.trim()) {
    console.log("No sections extracted, trying alternate parsing strategy");
    
    // Try to split by markdown headers
    const sections = content.split(/#{1,3}\s+/);
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
    
    // If still nothing extracted, use crude heuristics as fallback
    if (!result.news && !result.markets && !result.copilot) {
      // Try to guess if content has some obvious sections
      const lines = content.split('\n');
      let currentSection: keyof NewsletterSections | null = null;
      
      for (const line of lines) {
        const lowerLine = line.toLowerCase();
        
        // Detect section headers
        if (lowerLine.includes('news') || lowerLine.includes('ai news')) {
          currentSection = 'news';
          continue;
        } else if (lowerLine.includes('market') || lowerLine.includes('economy')) {
          currentSection = 'markets';
          continue;
        } else if (lowerLine.includes('copilot') || lowerLine.includes('insight')) {
          currentSection = 'copilot';
          continue;
        }
        
        // Add content to current section
        if (currentSection && line.trim()) {
          result[currentSection] = (result[currentSection] || '') + line + '\n';
        }
      }
      
      // Clean up any trailing newlines
      Object.keys(result).forEach(key => {
        const section = key as keyof NewsletterSections;
        if (result[section]) {
          result[section] = result[section]!.trim();
        }
      });
    }
    
    // Last resort - if still nothing extracted, use the entire content as the news section
    if (!result.news && !result.markets && !result.copilot) {
      console.log("Using content as news section by default");
      result.news = content.trim();
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
    
    // Case 1: Direct section properties in response
    if (data.news || data.markets || data.copilot) {
      console.log("Found direct section properties in response");
      return {
        news: data.news || "",
        markets: data.markets || "",
        copilot: data.copilot || "",
      };
    }
    
    // Case 2: Try to extract sections from response properties
    for (const prop of ['content', 'output', 'text', 'message', 'result', 'response']) {
      // String content that might contain sections
      if (data[prop] && typeof data[prop] === 'string') {
        console.log(`Extracting sections from ${prop} property`);
        const extracted = extractSectionsFromContent(data[prop]);
        if (Object.keys(extracted).length > 0) {
          return extracted;
        }
      }
      
      // Object that might contain section properties
      if (data[prop] && typeof data[prop] === 'object') {
        console.log(`Checking for sections in ${prop} object`);
        const result: Partial<NewsletterSections> = {};
        let foundAny = false;
        
        if (data[prop].news) {
          result.news = data[prop].news;
          foundAny = true;
        }
        if (data[prop].markets) {
          result.markets = data[prop].markets;
          foundAny = true;
        }
        if (data[prop].copilot) {
          result.copilot = data[prop].copilot;
          foundAny = true;
        }
        
        if (foundAny) {
          return result;
        }
      }
    }
    
    // Case 3: Last resort - extract from stringified response
    console.log("Attempting to extract from full response");
    // If we have any string content at all in the response
    const allStringContent = Object.values(data)
      .filter(val => typeof val === 'string')
      .join('\n\n');
    
    if (allStringContent.trim()) {
      return extractSectionsFromContent(allStringContent);
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
