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
    // Send request to the webhook with a longer timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
    
    const response = await fetch(CHAT_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
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
    console.log("Webhook response data received:", responseData);

    // Log the entire response structure for debugging
    console.log("Full response structure:", JSON.stringify(responseData, null, 2));

    // Handle different response structures:

    // Case 1: Direct output array response with individual elements (new format)
    if (Array.isArray(responseData) && responseData.length > 0) {
      console.log("Detected array response format");
      
      // Try to find an element with 'output' property
      const outputItem = responseData.find(item => item.output);
      
      if (outputItem && outputItem.output) {
        console.log("Found output item in array:", outputItem);
        
        // If the output is a string, parse the string
        if (typeof outputItem.output === 'string') {
          const sections = separateNewsSections(outputItem.output);
          console.log("Parsed sections from array item output:", sections);
          
          return {
            news: sections.news || "",
            markets: sections.markets || "",
            copilot: sections.copilot || "",
            newsImage: null,
            marketsImage: null,
            copilotImage: null,
          };
        }
        // If the output is an object, use it directly
        else if (typeof outputItem.output === 'object') {
          return {
            news: outputItem.output.news || "",
            markets: outputItem.output.markets || "",
            copilot: outputItem.output.copilot || "",
            newsImage: outputItem.newsImage || null,
            marketsImage: outputItem.marketsImage || null,
            copilotImage: outputItem.copilotImage || null,
          };
        }
      }
    }

    // Case 2: Regular response with text property (original format)
    if (responseData && responseData.text) {
      // Get the response text
      const fullText = responseData.text;
      console.log("Full response text length:", fullText.length);
      console.log("First 100 characters:", fullText.substring(0, 100));
      console.log("Last 100 characters:", fullText.substring(fullText.length - 100));

      // If the response has 'output' property directly, check if it's a structured object
      if (responseData.output) {
        console.log("Output property found in response:", responseData.output);
        
        // If output is already parsed into sections
        if (typeof responseData.output === 'object' && responseData.output.news) {
          console.log("Found structured output with news section");
          return {
            news: responseData.output.news || "",
            markets: responseData.output.markets || "",
            copilot: responseData.output.copilot || "",
            newsImage: responseData.newsImage || null,
            marketsImage: responseData.marketsImage || null,
            copilotImage: responseData.copilotImage || null,
          };
        } else if (typeof responseData.output === 'string') {
          // If output is a string, try to parse it
          const sections = separateNewsSections(responseData.output);
          return {
            news: sections.news || "",
            markets: sections.markets || "",
            copilot: sections.copilot || "",
            newsImage: responseData.newsImage || null,
            marketsImage: responseData.marketsImage || null,
            copilotImage: responseData.copilotImage || null,
          };
        }
      }

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
    }
    
    // Case 3: If none of the above formats match, try to handle minimal response
    if (responseData && typeof responseData === 'object') {
      console.log("Using fallback response handling");
      
      // If we have direct output somewhere in the response
      if (responseData.output) {
        if (typeof responseData.output === 'string') {
          const sections = separateNewsSections(responseData.output);
          return {
            news: sections.news || "",
            markets: sections.markets || "",
            copilot: sections.copilot || "",
            newsImage: null,
            marketsImage: null,
            copilotImage: null,
          };
        }
      }
      
      // Last resort: stringify the entire response and try to parse
      const jsonString = JSON.stringify(responseData);
      const sections = separateNewsSections(jsonString);
      
      return {
        news: sections.news || "",
        markets: sections.markets || "",
        copilot: sections.copilot || "",
        newsImage: null,
        marketsImage: null,
        copilotImage: null,
      };
    }
    
    throw new Error("Could not parse webhook response format");
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
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout
    
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

    // Check if the response has direct section data
    if (responseData.output && typeof responseData.output === 'object' && responseData.output[section]) {
      console.log(`Found direct ${section} content in output object`);
      return responseData.output[section];
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

    // Check if this is a direct output object string
    try {
      const jsonOutput = JSON.parse(fullText);
      if (jsonOutput && typeof jsonOutput === 'object') {
        if (jsonOutput.news || jsonOutput.markets || jsonOutput.copilot) {
          console.log("Found JSON structure with direct section keys");
          return {
            news: jsonOutput.news || "",
            markets: jsonOutput.markets || "",
            copilot: jsonOutput.copilot || ""
          };
        }
        
        // Check for output key
        if (jsonOutput.output && typeof jsonOutput.output === 'object') {
          if (jsonOutput.output.news || jsonOutput.output.markets || jsonOutput.output.copilot) {
            console.log("Found nested output with section keys");
            return {
              news: jsonOutput.output.news || "",
              markets: jsonOutput.output.markets || "",
              copilot: jsonOutput.output.copilot || ""
            };
          }
        }
      }
    } catch (e) {
      // Not JSON, continue with other methods
      console.log("Text is not JSON, continuing with section parsing");
    }

    // Try parsing by section headers with variations
    // News section patterns - Updated for the "### **News Section**" format
    const newsPatterns = [
      /(?:\*\*News Section\*\*|\bNews Section\b|### \*\*News Section\*\*)([\s\S]*?)(?=\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b|\*\*Markets Section\*\*|\bMarkets Section\b|\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Economy & Markets Section\*\*|### \*\*Copilot Section\*\*|---+|$)/i,
      /(?:\*\*Title:.*?\*\*)([\s\S]*?)(?=\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b|\*\*Markets Section\*\*|\bMarkets Section\b|\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Economy & Markets Section\*\*|### \*\*Copilot Section\*\*|---+|$)/i,
      /(?:BULLET POINTS:)([\s\S]*?)(?=\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b|\*\*Markets Section\*\*|\bMarkets Section\b|\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Economy & Markets Section\*\*|### \*\*Copilot Section\*\*|---+|$)/i,
      /(?:TL;DR:)([\s\S]*?)(?=\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b|\*\*Markets Section\*\*|\bMarkets Section\b|\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Economy & Markets Section\*\*|### \*\*Copilot Section\*\*|---+|$)/i
    ];
    
    // Markets section patterns - Updated for the "### **Economy & Markets Section**" format
    const marketsPatterns = [
      /(?:\*\*Economy & Markets Section\*\*|\bEconomy & Markets Section\b|\*\*Markets Section\*\*|\bMarkets Section\b|### \*\*Economy & Markets Section\*\*)([\s\S]*?)(?=\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Copilot Section\*\*|---+|$)/i,
      /(?:🌍 Big Picture)([\s\S]*?)(?=\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Copilot Section\*\*|TIME:|TIME –|---+|$)/i,
      /(?:📈 What to Watch)([\s\S]*?)(?=\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Copilot Section\*\*|TIME:|TIME –|---+|$)/i,
      /(?:🔑 Key Takeaway)([\s\S]*?)(?=\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Copilot Section\*\*|TIME:|TIME –|---+|$)/i
    ];
    
    // Copilot section patterns - Updated for the "### **Copilot Section**" format
    const copilotPatterns = [
      /(?:\*\*Copilot Section\*\*|\bCopilot Section\b|### \*\*Copilot Section\*\*)([\s\S]*?)$/i,
      /(?:- \*\*Theme: TIME.*?\*\*)([\s\S]*?)$/i,
      /(?:TIME:|TIME –|TIME theme)([\s\S]*?)$/i,
      /(?:- \*\*TIME:)([\s\S]*?)$/i,
      /(?:ATTENTION.*?theme)([\s\S]*?)$/i,
      /(?:PROFIT\/PROGRESS.*?theme)([\s\S]*?)$/i
    ];

    // Try to match each pattern for each section
    for (const pattern of newsPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        sections.news = cleanupSection(match[1]);
        console.log("News section found with pattern:", pattern);
        break;
      }
    }
    
    for (const pattern of marketsPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        sections.markets = cleanupSection(match[1]);
        console.log("Markets section found with pattern:", pattern);
        break;
      }
    }
    
    for (const pattern of copilotPatterns) {
      const match = fullText.match(pattern);
      if (match && match[1]) {
        sections.copilot = cleanupSection(match[1]);
        console.log("Copilot section found with pattern:", pattern);
        break;
      }
    }

    // If markets section contains messaging about unavailability, clear it
    // to prevent showing error messages in the UI
    if (sections.markets && (
        sections.markets.includes("generation process") && sections.markets.includes("encountered a stop") ||
        sections.markets.includes("unavailable") && sections.markets.includes("processing issue") ||
        sections.markets.includes("Content generation") && sections.markets.includes("unavailable")
    )) {
      console.log("Markets section contains unavailability message, clearing it");
      sections.markets = "";
    }

    // Try divider method if patterns didn't work
    if (!sections.news && !sections.markets && !sections.copilot) {
      console.log("Trying divider method...");
      // Try divider method (---) which is often used to separate sections
      const dividers = fullText.split(/---+/);
      
      if (dividers.length >= 3) {
        // If we have at least 3 sections separated by dividers
        sections.news = cleanupSection(dividers[0]);
        sections.markets = cleanupSection(dividers[1]);
        sections.copilot = cleanupSection(dividers.slice(2).join("\n---\n"));  // Combine any additional dividers
        
        console.log("Used divider method for section separation");
      }
    }

    // If still no luck, try keyword-based sectioning
    if (!sections.news || !sections.markets || !sections.copilot) {
      console.log("Some sections still missing, trying keyword-based sectioning...");
      
      // Check for content specific to each section
      const newsKeywords = ["AI News", "News Section", "Title:", "TL;DR", "BULLET POINTS", "Top article"];
      const marketsKeywords = ["Economy & Markets", "Markets Section", "Big Picture", "What to Watch", "Key Takeaway"];
      const copilotKeywords = ["Copilot Section", "Theme: TIME", "Theme: ATTENTION", "Theme: PROFIT", "TIME:", "ATTENTION:", "PROFIT/PROGRESS:"];
      
      // Look for these keywords to identify where sections begin
      let newsStart = -1, marketsStart = -1, copilotStart = -1;
      
      for (const keyword of newsKeywords) {
        const index = fullText.indexOf(keyword);
        if (index !== -1 && (newsStart === -1 || index < newsStart)) {
          newsStart = index;
        }
      }
      
      for (const keyword of marketsKeywords) {
        const index = fullText.indexOf(keyword);
        if (index !== -1 && (marketsStart === -1 || index < marketsStart)) {
          marketsStart = index;
        }
      }
      
      for (const keyword of copilotKeywords) {
        const index = fullText.indexOf(keyword);
        if (index !== -1 && (copilotStart === -1 || index < copilotStart)) {
          copilotStart = index;
        }
      }
      
      // If we found start positions, determine section boundaries
      if (newsStart !== -1 || marketsStart !== -1 || copilotStart !== -1) {
        console.log("Found keyword positions:", {newsStart, marketsStart, copilotStart});
        
        // Sort the start indices to determine section boundaries
        const startIndices = [
          { type: 'news', index: newsStart },
          { type: 'markets', index: marketsStart },
          { type: 'copilot', index: copilotStart }
        ].filter(item => item.index !== -1)
         .sort((a, b) => a.index - b.index);
        
        // Extract sections based on the sorted indices
        for (let i = 0; i < startIndices.length; i++) {
          const currentType = startIndices[i].type;
          const start = startIndices[i].index;
          const end = i < startIndices.length - 1 ? startIndices[i + 1].index : undefined;
          
          const content = fullText.substring(start, end);
          
          if (currentType === 'news' && !sections.news) {
            sections.news = cleanupSection(content);
          } else if (currentType === 'markets' && !sections.markets) {
            sections.markets = cleanupSection(content);
          } else if (currentType === 'copilot' && !sections.copilot) {
            sections.copilot = cleanupSection(content);
          }
        }
      }
    }
    
    // If sections are still empty or extremely short (likely incorrect), try a simple split
    if (!sections.news || !sections.markets || !sections.copilot || 
        sections.news.length < 20 || sections.markets.length < 20 || sections.copilot.length < 20) {
      console.log("Some sections are still missing or too short, trying simple split...");
      
      // Split on multiple newlines which often indicate section breaks
      const chunks = fullText.split(/\n\s*\n\s*\n+/);
      
      if (chunks.length >= 3) {
        // Find the most likely news, markets, and copilot chunks based on keywords
        for (const chunk of chunks) {
          // Skip very small chunks
          if (chunk.length < 20) continue;
          
          // Check if this chunk has news-specific content and we don't have news yet
          if (!sections.news || sections.news.length < 20) {
            if (/news|title|tl;dr|bullet points|top article/i.test(chunk)) {
              sections.news = cleanupSection(chunk);
              continue;
            }
          }
          
          // Check if this chunk has markets-specific content and we don't have markets yet
          if (!sections.markets || sections.markets.length < 20) {
            if (/economy|markets|big picture|what to watch|key takeaway/i.test(chunk)) {
              sections.markets = cleanupSection(chunk);
              continue;
            }
          }
          
          // Check if this chunk has copilot-specific content and we don't have copilot yet
          if (!sections.copilot || sections.copilot.length < 20) {
            if (/copilot|theme|time|attention|profit|progress/i.test(chunk)) {
              sections.copilot = cleanupSection(chunk);
              continue;
            }
          }
        }
      }
    }

    // Last resort: If still empty, divide content into three equal parts
    if (!sections.news || !sections.markets || !sections.copilot) {
      console.log("Using equal division as last resort...");
      const lines = fullText.split('\n');
      const segmentSize = Math.ceil(lines.length / 3);
      
      if (!sections.news) {
        sections.news = cleanupSection(lines.slice(0, segmentSize).join('\n'));
      }
      
      if (!sections.markets) {
        const start = Math.min(segmentSize, lines.length);
        const end = Math.min(segmentSize * 2, lines.length);
        sections.markets = cleanupSection(lines.slice(start, end).join('\n'));
      }
      
      if (!sections.copilot) {
        const start = Math.min(segmentSize * 2, lines.length);
        sections.copilot = cleanupSection(lines.slice(start).join('\n'));
      }
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
    .replace(/^### \*\*News Section\*\*\s*[\r\n]+/im, '**News Section**\n\n') // Fix News Section header with ### prefix
    .replace(/^\*\*Economy & Markets Section\*\*\s*[\r\n]+/im, '**Economy & Markets Section**\n\n') // Fix Markets Section header
    .replace(/^### \*\*Economy & Markets Section\*\*\s*[\r\n]+/im, '**Economy & Markets Section**\n\n') // Fix Markets Section header with ### prefix
    .replace(/^\*\*Copilot Section\*\*\s*[\r\n]+/im, '**Copilot Section**\n\n') // Fix Copilot Section header
    .replace(/^### \*\*Copilot Section\*\*\s*[\r\n]+/im, '**Copilot Section**\n\n'); // Fix Copilot Section header with ### prefix
}
