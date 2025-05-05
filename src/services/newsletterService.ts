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
  // use heuristics to determine what we have
  if (!result.news && !result.markets && !result.copilot && content.trim()) {
    // If it contains terms clearly related to markets, use as markets
    if (/(stock|market|economy|financial|nasdaq|dow jones|investment)/i.test(content)) {
      result.markets = content.trim();
    }
    // If it contains terms clearly related to AI, use as news
    else if (/(AI|artificial intelligence|technology|neural|machine learning)/i.test(content)) {
      result.news = content.trim();
    }
    // Otherwise, use as news by default
    else {
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
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}):`, errorText);
      throw new Error(`Failed to generate newsletter: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Newsletter data received:", data);
    
    // Case 1: Direct section data in response
    if (data.news || data.markets || data.copilot) {
      console.log("Found direct section data in response");
      return {
        news: data.news || "",
        markets: data.markets || "",
        copilot: data.copilot || "",
      };
    }
    
    // Case 2: API response with "output" property
    if (data.output) {
      console.log("Processing API response with output property");
      
      // If output is a string, try to parse sections from it
      if (typeof data.output === 'string') {
        const extractedSections = extractSectionsFromContent(data.output);
        
        // If we have at least one section, return it
        if (Object.keys(extractedSections).length > 0) {
          return extractedSections;
        }
        
        // If we couldn't extract any sections but have output content,
        // try to determine what we're looking at based on the request
        if (data.output.trim()) {
          if (request.action === 'regenerate_news') {
            return { news: data.output.trim() };
          } else if (request.action === 'regenerate_markets') {
            return { markets: data.output.trim() };
          } else if (request.action === 'regenerate_copilot') {
            return { copilot: data.output.trim() };
          } else {
            // If generating all, put into news as fallback
            return { news: data.output.trim() };
          }
        }
      }
      
      // If output is an object, check for nested section data
      if (typeof data.output === 'object' && data.output !== null) {
        const result: Partial<NewsletterSections> = {};
        if (data.output.news) result.news = data.output.news;
        if (data.output.markets) result.markets = data.output.markets;
        if (data.output.copilot) result.copilot = data.output.copilot;
        if (Object.keys(result).length > 0) {
          return result;
        }
      }
    }
    
    // Case 3: Check for content property
    if (data.content) {
      if (typeof data.content === 'string') {
        try {
          // Try to parse if it's a JSON string
          const parsedContent = JSON.parse(data.content);
          if (parsedContent && typeof parsedContent === 'object') {
            const result: Partial<NewsletterSections> = {};
            if (parsedContent.news) result.news = parsedContent.news;
            if (parsedContent.markets) result.markets = parsedContent.markets;
            if (parsedContent.copilot) result.copilot = parsedContent.copilot;
            if (Object.keys(result).length > 0) {
              return result;
            }
          }
        } catch (parseError) {
          // If parsing fails but we have content as string, extract sections
          const extractedSections = extractSectionsFromContent(data.content);
          if (Object.keys(extractedSections).length > 0) {
            return extractedSections;
          }
          
          // If no sections extracted but specific action, use accordingly
          if (data.content.trim()) {
            if (request.action === 'regenerate_news') {
              return { news: data.content.trim() };
            } else if (request.action === 'regenerate_markets') {
              return { markets: data.content.trim() };
            } else if (request.action === 'regenerate_copilot') {
              return { copilot: data.content.trim() };
            } else {
              // If generating all, attempt to split content
              try {
                // Look for section markers to determine if this is a complete newsletter
                const containsAllSectionMarkers = 
                  /news/i.test(data.content) && 
                  /markets|economy/i.test(data.content) && 
                  /copilot|insights/i.test(data.content);
                
                if (containsAllSectionMarkers) {
                  return extractSectionsFromContent(data.content);
                } else {
                  // Default to news if we can't determine sections
                  return { news: data.content.trim() };
                }
              } catch (error) {
                console.error("Error parsing content:", error);
                return { news: data.content.trim() };
              }
            }
          }
        }
      } else if (typeof data.content === 'object' && data.content !== null) {
        // Direct object with section data
        const result: Partial<NewsletterSections> = {};
        if (data.content.news) result.news = data.content.news;
        if (data.content.markets) result.markets = data.content.markets;
        if (data.content.copilot) result.copilot = data.content.copilot;
        if (Object.keys(result).length > 0) {
          return result;
        }
      }
    }
    
    // Case 4: Check for message property which might contain the content
    if (data.message && typeof data.message === 'string') {
      const extractedSections = extractSectionsFromContent(data.message);
      if (Object.keys(extractedSections).length > 0) {
        return extractedSections;
      }
      
      // If no sections extracted, use according to request type
      if (request.action === 'regenerate_news') {
        return { news: data.message.trim() };
      } else if (request.action === 'regenerate_markets') {
        return { markets: data.message.trim() };
      } else if (request.action === 'regenerate_copilot') {
        return { copilot: data.message.trim() };
      } else {
        return { news: data.message.trim() };
      }
    }
    
    // Check for other potential properties that might contain our data
    const potentialContentProperties = ['result', 'response', 'text', 'generatedContent'];
    for (const prop of potentialContentProperties) {
      if (data[prop] && typeof data[prop] === 'string' && data[prop].trim()) {
        const extractedSections = extractSectionsFromContent(data[prop]);
        if (Object.keys(extractedSections).length > 0) {
          return extractedSections;
        }
        
        // If no sections but we have content, use it based on request
        if (request.action === 'regenerate_news') {
          return { news: data[prop].trim() };
        } else if (request.action === 'regenerate_markets') {
          return { markets: data[prop].trim() };
        } else if (request.action === 'regenerate_copilot') {
          return { copilot: data[prop].trim() };
        } else {
          // For generate all
          return { news: data[prop].trim() };
        }
      }
    }
    
    // If we get to this point and have no content but received a successful response,
    // it might be that the data structure is completely unexpected
    console.warn("Could not extract newsletter content from response:", data);
    
    // Last attempt: stringify the entire response and try to extract something
    const dataString = JSON.stringify(data);
    if (dataString && dataString.length > 10) {
      try {
        // Look for any patterns that might indicate newsletter content
        const contentMatch = dataString.match(/"(?:content|text|message|output)"\s*:\s*"([^"]+)"/);
        if (contentMatch && contentMatch[1]) {
          return { news: contentMatch[1] };
        }
      } catch (e) {
        console.error("Error in final extraction attempt:", e);
      }
    }
    
    toast.error("Received response with unexpected format. Check console for details.");
    return {
      news: "",
      markets: "",
      copilot: "",
    };
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
  instructions?: string
): Promise<string> => {
  // This function is maintained for backward compatibility
  // It now uses the main generateNewsletter function with appropriate action
  
  try {
    console.log(`Regenerating ${section} section with${instructions ? '' : 'out'} instructions`);
    
    const action = `regenerate_${section}` as 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
    
    const result = await generateNewsletter({
      chatId,
      action,
      instructions
    });
    
    return result[section] || "";
  } catch (error) {
    console.error(`Error regenerating ${section}:`, error);
    toast.error(`Failed to regenerate ${section}. Please try again.`);
    throw error;
  }
};
