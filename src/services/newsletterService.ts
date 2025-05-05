
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
    
    // Create a specific message based on the action type
    let messageToSend = request.message || "";
    
    // For regenerate actions, create targeted requests for each section
    if (request.action) {
      const section = request.action.replace('regenerate_', '') as keyof NewsletterSections;
      const sectionTitle = section.charAt(0).toUpperCase() + section.slice(1);
      
      if (request.instructions) {
        messageToSend = `Generate ${sectionTitle} section with these instructions: ${request.instructions}`;
      } else {
        messageToSend = `Generate ${sectionTitle} section`;
      }
    }
    
    // Send the request with either the original message or our constructed one
    const payload = {
      ...request,
      message: messageToSend
    };
    
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
    console.log("Newsletter data received:", data);
    
    // For regenerate actions, prioritize targeted section processing
    if (request.action) {
      const section = request.action.replace('regenerate_', '') as keyof NewsletterSections;
      
      // If the response includes the specific section we requested
      if (data[section]) {
        const result: Partial<NewsletterSections> = {};
        result[section] = data[section];
        return result;
      }
      
      // Check for direct output text (common response format)
      if (data.output && typeof data.output === 'string') {
        const result: Partial<NewsletterSections> = {};
        result[section] = data.output.trim();
        return result;
      }
      
      // Check for nested output
      if (data.output && typeof data.output === 'object' && data.output[section]) {
        const result: Partial<NewsletterSections> = {};
        result[section] = data.output[section];
        return result;
      }
      
      // Check content property as string
      if (data.content && typeof data.content === 'string') {
        const result: Partial<NewsletterSections> = {};
        result[section] = data.content.trim();
        return result;
      }
      
      // Check message property
      if (data.message && typeof data.message === 'string') {
        const result: Partial<NewsletterSections> = {};
        result[section] = data.message.trim();
        return result;
      }
      
      // Check any other potential string properties
      const potentialContentProperties = ['result', 'response', 'text', 'generatedContent'];
      for (const prop of potentialContentProperties) {
        if (data[prop] && typeof data[prop] === 'string' && data[prop].trim()) {
          const result: Partial<NewsletterSections> = {};
          result[section] = data[prop].trim();
          return result;
        }
      }
      
      // If we couldn't find any direct content, try extraction if we got a string somewhere
      const allStringContent = Object.values(data)
        .filter(v => typeof v === 'string')
        .join('\n');
      
      if (allStringContent) {
        const result: Partial<NewsletterSections> = {};
        result[section] = allStringContent.trim();
        return result;
      }
      
      // Last resort: return empty section
      console.warn(`Could not extract content for ${section} section`);
      const emptyResult: Partial<NewsletterSections> = {};
      emptyResult[section] = "";
      return emptyResult;
    }
    
    // For "generate all" request, proceed with full extraction logic
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
        // put it in the news section by default for "generate all"
        if (data.output.trim()) {
          return { news: data.output.trim() };
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
        const extractedSections = extractSectionsFromContent(data.content);
        if (Object.keys(extractedSections).length > 0) {
          return extractedSections;
        }
        
        // If no sections extracted, attempt to parse as JSON
        try {
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
          // If parsing fails but we have content as string, put in news for "generate all"
          if (data.content.trim()) {
            return { news: data.content.trim() };
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
      
      // If no sections extracted, use as news for "generate all"
      if (data.message.trim()) {
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
        
        // If no sections but we have content, use for news in "generate all"
        if (data[prop].trim()) {
          return { news: data[prop].trim() };
        }
      }
    }
    
    // If we get to this point and have no content but received a successful response,
    // stringify the entire response as a last resort
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
