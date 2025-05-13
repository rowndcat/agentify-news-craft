
// Define the section types
export interface NewsletterSections {
  news: string;
  markets: string;
  copilot: string;
  newsImage?: string;
  marketsImage?: string;
  copilotImage?: string;
}

// Mock response delay for development
const MOCK_DELAY = 2000;

// API constants
const API_URL = import.meta.env.VITE_API_URL || 'https://api.agentify360.com';
const API_KEY = import.meta.env.VITE_API_KEY || 'demo-key';
const WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat";
const IMAGE_WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/76840a22-558d-4fae-9f51-aadcd7c3fb7f";

// Webhook timeout configuration
const WEBHOOK_WAIT_TIME = 30000; // 30 seconds
const MAX_POLLING_ATTEMPTS = 10;
const POLLING_INTERVAL = 3000; // 3 seconds

/**
 * Send a request to generate newsletter content
 */
export const generateNewsletter = async (payload: any): Promise<NewsletterSections> => {
  try {
    console.log("Sending webhook request for full newsletter generation to:", WEBHOOK_URL);
    
    // Ensure payload has the correct format with chatId and message
    const webhookPayload = {
      chatId: payload.chatId,
      message: "Generate newsletter"
    };
    
    console.log("With webhook payload:", JSON.stringify(webhookPayload));
    
    // Send the initial webhook request
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log("Webhook request sent, response status:", response.status);
    
    // Process direct webhook response if available
    if (response.ok) {
      try {
        const webhookData = await response.json();
        console.log("Direct webhook response received:", webhookData);
        
        // Check if the webhook returned content in the expected format
        if (webhookData && webhookData.output) {
          console.log("Found output in direct webhook response, length:", webhookData.output.length);
          
          // Parse the webhook output which is a single markdown string with sections
          const sections = parseWebhookOutput(webhookData.output);
          
          // If we have at least one section with content, return it
          if (sections.news || sections.markets || sections.copilot) {
            console.log("Successfully parsed sections from direct webhook response");
            return sections;
          }
        }
      } catch (parseError) {
        console.error("Error parsing direct webhook response:", parseError);
      }
    }
    
    // If we didn't get parseable content from the direct response, start polling
    console.log("Starting polling for webhook results...");
    
    // Poll for results
    for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
      console.log(`Polling attempt ${attempt}/${MAX_POLLING_ATTEMPTS}`);
      
      try {
        // Wait for the polling interval
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        
        // Make API request to check for results
        const apiResponse = await fetch(`${API_URL}/check-webhook-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({ chatId: webhookPayload.chatId }),
          signal: AbortSignal.timeout(10000)
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log(`Polling attempt ${attempt}: Response received:`, data);
          
          // If we have content, parse and return it
          if (data && data.output) {
            const sections = parseWebhookOutput(data.output);
            
            if (sections.news || sections.markets || sections.copilot) {
              console.log("Successfully parsed sections from polling response");
              return sections;
            }
          } else if (data && data.status === "processing") {
            console.log("Webhook still processing, continuing to poll...");
            continue;
          }
        } else {
          console.log(`Polling attempt ${attempt} failed with status: ${apiResponse.status}`);
        }
      } catch (pollingError) {
        console.error(`Polling attempt ${attempt} error:`, pollingError);
      }
    }
    
    // If we've reached this point, polling has failed to get results
    console.warn("All polling attempts completed without receiving valid content");
    
    // Only use mock data if in development mode
    if (import.meta.env.DEV) {
      console.log("Using mock data after all polling attempts failed");
      return getMockData(webhookPayload);
    }
    
    throw new Error("Failed to get newsletter content after multiple polling attempts");
  } catch (error) {
    console.error("Error generating newsletter content:", error);
    
    if (import.meta.env.DEV) {
      console.log("Using sample data in development environment as last resort");
      return getMockData(payload);
    }
    
    throw error;
  }
};

/**
 * Parse webhook output which comes as a single markdown string with sections
 */
const parseWebhookOutput = (output: string): NewsletterSections => {
  console.log("Parsing webhook output, first 100 chars:", output.substring(0, 100) + "...");
  
  const sections: NewsletterSections = {
    news: "",
    markets: "",
    copilot: ""
  };
  
  try {
    // Check if the output appears to be valid markdown content
    if (!output || output.trim().length === 0) {
      console.warn("Empty output received");
      return sections;
    }
    
    // Split the output by Markdown section dividers (---)
    const parts = output.split("---").filter(part => part.trim().length > 0);
    console.log(`Split output into ${parts.length} parts`);
    
    // If we didn't get parts using ---, try to identify sections based on headers
    if (parts.length <= 1) {
      console.log("Single part received, trying to split by section headers");
      
      // Look for Markdown headers ### that indicate section starts
      const headerMatches = [...output.matchAll(/#{1,3}\s+\*\*([^*]+)\*\*/g)];
      if (headerMatches && headerMatches.length > 0) {
        console.log(`Found ${headerMatches.length} section headers`);
        
        // Use the header positions to split the content
        const sections: string[] = [];
        headerMatches.forEach((match, i) => {
          const startPos = match.index;
          const endPos = i < headerMatches.length - 1 ? headerMatches[i + 1].index : output.length;
          if (typeof startPos === 'number' && endPos) {
            sections.push(output.substring(startPos, endPos));
          }
        });
        
        if (sections.length > 0) {
          console.log(`Split into ${sections.length} sections using headers`);
          parts.push(...sections);
        }
      }
    }
    
    // Process each part to identify sections
    parts.forEach((part, index) => {
      // Clean up the part
      const trimmedPart = part.trim();
      console.log(`Processing part ${index + 1}, starts with: ${trimmedPart.substring(0, 30)}...`);
      
      // Identify sections based on headers or content
      if (
        trimmedPart.includes("**News Section**") || 
        trimmedPart.includes("### **News Section**") ||
        trimmedPart.toLowerCase().includes("ai news piece") ||
        trimmedPart.includes("### News") ||
        (trimmedPart.toLowerCase().includes("news") && 
         trimmedPart.toLowerCase().includes("article"))
      ) {
        console.log("Found News section");
        sections.news = trimmedPart;
      } 
      else if (
        trimmedPart.includes("**Economy & Markets Section**") || 
        trimmedPart.includes("### **Economy & Markets Section**") ||
        trimmedPart.includes("🌍 Big Picture") ||
        trimmedPart.includes("### 🌍") ||
        trimmedPart.includes("### Economy") ||
        (trimmedPart.toLowerCase().includes("market") && 
         trimmedPart.toLowerCase().includes("economy"))
      ) {
        console.log("Found Markets section");
        sections.markets = trimmedPart;
      } 
      else if (
        trimmedPart.includes("**Copilot Section**") || 
        trimmedPart.includes("### **Copilot Section**") ||
        trimmedPart.includes("**AI Copilot**") ||
        trimmedPart.includes("### Copilot") ||
        (trimmedPart.toLowerCase().includes("copilot") && 
         trimmedPart.toLowerCase().includes("ai"))
      ) {
        console.log("Found Copilot section");
        sections.copilot = trimmedPart;
      }
      // If we couldn't identify the section but it's substantial content
      else if (trimmedPart.length > 200) {
        console.log("Found unidentified substantial content, analyzing...");
        
        // Try to guess the section type based on content
        if (trimmedPart.toLowerCase().includes("news") && !sections.news) {
          console.log("Guessing this is News content based on keywords");
          sections.news = trimmedPart;
        } 
        else if ((trimmedPart.toLowerCase().includes("market") || 
                trimmedPart.toLowerCase().includes("economy")) && 
                !sections.markets) {
          console.log("Guessing this is Markets content based on keywords");
          sections.markets = trimmedPart;
        }
        else if ((trimmedPart.toLowerCase().includes("copilot") || 
                trimmedPart.toLowerCase().includes("insights")) && 
                !sections.copilot) {
          console.log("Guessing this is Copilot content based on keywords");
          sections.copilot = trimmedPart;
        }
        // If we still can't identify it but we're missing a section, make a best guess
        else if (!sections.news) {
          console.log("Assigning unidentified content to empty News section");
          sections.news = trimmedPart;
        }
        else if (!sections.markets) {
          console.log("Assigning unidentified content to empty Markets section");
          sections.markets = trimmedPart;
        }
        else if (!sections.copilot) {
          console.log("Assigning unidentified content to empty Copilot section");
          sections.copilot = trimmedPart;
        }
      }
    });
    
    // Log the extracted sections
    console.log("Parsed news section:", sections.news ? `${sections.news.substring(0, 50)}...` : "None");
    console.log("Parsed markets section:", sections.markets ? `${sections.markets.substring(0, 50)}...` : "None");
    console.log("Parsed copilot section:", sections.copilot ? `${sections.copilot.substring(0, 50)}...` : "None");
  } catch (error) {
    console.error("Error parsing sections:", error);
  }
  
  return sections;
};

/**
 * Regenerate a specific section of the newsletter
 */
export const regenerateSection = async (
  section: 'news' | 'markets' | 'copilot',
  chatId: string,
  instructions?: string
): Promise<string> => {
  try {
    console.log(`Regenerating ${section} with instructions:`, instructions);
    
    // Prepare payload for regeneration with proper format
    const webhookPayload = {
      chatId: chatId,
      message: `Regenerate ${section} section${instructions ? ` with instructions: ${instructions}` : ''}`
    };
    
    console.log("Sending webhook request to:", WEBHOOK_URL);
    console.log("With webhook payload:", JSON.stringify(webhookPayload));
    
    // Send initial request
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookPayload)
    });
    
    console.log("Webhook request sent, response status:", response.status);
    
    // Process direct webhook response if available
    if (response.ok) {
      try {
        const webhookData = await response.json();
        console.log("Direct webhook response received for regeneration:", webhookData);
        
        if (webhookData && webhookData.output) {
          console.log("Found output in direct webhook response, length:", webhookData.output.length);
          
          // Parse the webhook output for the specific section
          const sections = parseWebhookOutput(webhookData.output);
          
          // Return the specific regenerated section if available
          if (sections[section]) {
            console.log(`Successfully parsed ${section} section from direct webhook response`);
            return sections[section];
          }
        }
      } catch (parseError) {
        console.error("Error parsing direct webhook regeneration response:", parseError);
      }
    }
    
    // If we didn't get parseable content from the direct response, start polling
    console.log("Starting polling for regeneration results...");
    
    // Poll for results
    for (let attempt = 1; attempt <= MAX_POLLING_ATTEMPTS; attempt++) {
      console.log(`Polling attempt ${attempt}/${MAX_POLLING_ATTEMPTS}`);
      
      try {
        // Wait for the polling interval
        await new Promise(resolve => setTimeout(resolve, POLLING_INTERVAL));
        
        // Make API request to check for results
        const apiResponse = await fetch(`${API_URL}/check-webhook-result`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          },
          body: JSON.stringify({ chatId: webhookPayload.chatId }),
          signal: AbortSignal.timeout(10000)
        });
        
        if (apiResponse.ok) {
          const data = await apiResponse.json();
          console.log(`Polling attempt ${attempt}: Response received:`, data);
          
          if (data && data.output) {
            const sections = parseWebhookOutput(data.output);
            
            if (sections[section]) {
              console.log(`Successfully parsed ${section} section from polling response`);
              return sections[section];
            }
          }
        } else {
          console.log(`Polling attempt ${attempt} failed with status: ${apiResponse.status}`);
        }
      } catch (pollingError) {
        console.error(`Polling attempt ${attempt} error:`, pollingError);
      }
    }
    
    // If we've reached this point, polling has failed to get results
    console.warn("All polling attempts completed without receiving valid section content");
    
    // Only use mock data if in development mode
    if (import.meta.env.DEV) {
      console.log("Using mock data after all polling attempts failed");
      const mockData = getMockData({
        chatId: chatId,
        message: `Regenerate ${section} section${instructions ? ` with instructions: ${instructions}` : ''}`
      });
      return mockData[section];
    }
    
    throw new Error(`Failed to get ${section} section content after multiple polling attempts`);
  } catch (error) {
    console.error(`Error regenerating ${section}:`, error);
    
    // Final fallback to mock data in development
    if (import.meta.env.DEV) {
      console.log("DEV mode: Using mock data as final fallback");
      const mockData = getMockData({
        chatId: chatId,
        message: `Regenerate ${section} section${instructions ? ` with instructions: ${instructions}` : ''}`
      });
      return mockData[section];
    }
    
    throw error;
  }
};

/**
 * Generate an image for a specific section
 */
export const generateSectionImage = async (
  section: 'news' | 'markets' | 'copilot',
  content: string
): Promise<string | null> => {
  try {
    console.log(`Generating image for ${section} section with content length:`, content.length);
    
    // Prepare payload for image generation
    const payload = {
      section: section,
      content: content.substring(0, 5000) // Limit content length
    };
    
    console.log("Sending image generation webhook request to:", IMAGE_WEBHOOK_URL);
    console.log("With content preview:", content.substring(0, 100) + "...");
    
    // Send request to the image generation webhook
    const response = await fetch(IMAGE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log("Image webhook request sent, response status:", response.status);
    
    if (response.ok) {
      const imageData = await response.json();
      console.log("Image webhook response:", imageData);
      
      // Check if the webhook returned a Google Drive webViewLink
      if (imageData && imageData.webViewLink) {
        console.log("Image generated successfully, webViewLink:", imageData.webViewLink);
        return imageData.webViewLink;
      } 
      // Check for iconLink which is also provided by Google Drive
      else if (imageData && imageData.iconLink) {
        console.log("Image generated, using iconLink:", imageData.iconLink);
        return imageData.iconLink;
      }
      // Check for any URL in the response
      else if (imageData && typeof imageData === 'object') {
        // Log all keys to help with debugging
        console.log("Image response keys:", Object.keys(imageData));
        
        // Try to find any URL-like value in the response
        for (const key of Object.keys(imageData)) {
          const value = imageData[key];
          if (typeof value === 'string' && value.startsWith('http')) {
            console.log(`Found URL in '${key}' field:`, value);
            return value;
          }
        }
        
        // If we have a nested "data" object, check that too
        if (imageData.data && typeof imageData.data === 'object') {
          console.log("Checking nested data object for URLs");
          for (const key of Object.keys(imageData.data)) {
            const value = imageData.data[key];
            if (typeof value === 'string' && value.startsWith('http')) {
              console.log(`Found URL in data.${key} field:`, value);
              return value;
            }
          }
        }
        
        // Last resort: if the entire response is a simple string URL
        if (typeof imageData === 'string' && imageData.startsWith('http')) {
          console.log("Response is a direct URL string:", imageData);
          return imageData;
        }
        
        console.error("No URL found in the response:", imageData);
      }
      
      // For development, return a placeholder image
      if (import.meta.env.DEV) {
        console.log("DEV mode: Using placeholder image");
        return getPlaceholderImage(section);
      }
      
      return null;
    } else {
      console.error("Failed to get successful response from image webhook:", response.statusText);
      
      // Try to log response body for debugging
      try {
        const errorText = await response.text();
        console.error("Error response body:", errorText);
      } catch (e) {
        console.error("Could not read error response body");
      }
      
      // For development, return a placeholder image
      if (import.meta.env.DEV) {
        console.log("DEV mode: Using placeholder image");
        return getPlaceholderImage(section);
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Error generating image for ${section}:`, error);
    
    // For development, return a placeholder image
    if (import.meta.env.DEV) {
      console.log("DEV mode: Using placeholder image due to error");
      return getPlaceholderImage(section);
    }
    
    return null;
  }
};

// Helper to get placeholder images in development
const getPlaceholderImage = (section: string): string => {
  switch(section) {
    case 'news':
      return "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&h=400";
    case 'markets':
      return "https://images.unsplash.com/photo-1460574283810-2aab119d8511?auto=format&fit=crop&w=800&h=400";
    case 'copilot':
      return "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=400";
    default:
      return "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=800&h=400";
  }
};

// Mock data for development
const getMockData = (payload: any): NewsletterSections => {
  console.log("Mock data requested with payload:", payload);
  
  // If regenerating a specific section
  if (payload.message?.startsWith('Regenerate')) {
    const sectionMatch = payload.message.match(/Regenerate\s+(\w+)\s+section/);
    const section = sectionMatch ? sectionMatch[1] : null;
    
    if (section) {
      const mockData: NewsletterSections = {
        news: "",
        markets: "",
        copilot: "",
      };
      
      const placeholderText = payload.message.includes("instructions:") 
        ? `Regenerated ${section} content with instructions from webhook: "${payload.message.split('instructions:')[1].trim()}"`
        : `Regenerated ${section} content from webhook`;
      
      mockData[section as keyof NewsletterSections] = getCombinedSectionContent(section, placeholderText);
      
      // Add mock image URLs for development
      if (section === 'news') {
        mockData.newsImage = "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&h=400";
      } else if (section === 'markets') {
        mockData.marketsImage = "https://images.unsplash.com/photo-1460574283810-2aab119d8511?auto=format&fit=crop&w=800&h=400";
      } else if (section === 'copilot') {
        mockData.copilotImage = "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=400";
      }
      
      return mockData;
    }
  }
  
  // Default is to return full mock newsletter
  return {
    news: getCombinedSectionContent('news', 'Content from webhook: Generate newsletter'),
    markets: getCombinedSectionContent('markets', 'Content from webhook: Generate newsletter'),
    copilot: getCombinedSectionContent('copilot', 'Content from webhook: Generate newsletter'),
    newsImage: "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&h=400",
    marketsImage: "https://images.unsplash.com/photo-1460574283810-2aab119d8511?auto=format&fit=crop&w=800&h=400",
    copilotImage: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=400"
  };
};

// Helper to get content for a specific section
const getCombinedSectionContent = (section: string, customPrefix: string = ''): string => {
  const mockContent: Record<string, string> = {
    news: `
**News Section**

*AI News piece*:
${customPrefix || 'Google DeepMind unveiled new AI model capable of reasoning across multiple steps, outperforming previous benchmarks on mathematical problem-solving by 23%. The model combines transformer architecture with a novel retrieval mechanism allowing it to "show its work" during calculations. Industry experts suggest this advance could lead to more reliable AI systems in healthcare diagnostics and scientific research.'}

*7 additional article links*:
* OpenAI Researchers Publish Paper on Superintelligence Timeline Estimates
* Microsoft Announces Integration of AI Agents Across Office 365 Suite
* EU Parliament Passes Comprehensive AI Act with New Safety Requirements
* Stanford Launches AI Alignment Research Center with $110M Funding
* Meta's New LLM Can Process Million-Token Documents in One Pass
* AI-Generated Patent Application Rejected by US Patent Office
* Japanese Self-Driving Car Startup Raises $220M in Series C Funding
    `,
    markets: `
**Economy & Markets Section**

### 🌍 Big Picture
${customPrefix || 'Global markets showed resilience this week despite ongoing inflation concerns. The Federal Reserve signaled potential rate adjustments as labor market data indicated cooling employment growth while maintaining low unemployment rates. Asian markets outperformed as China announced new economic stimulus measures focused on domestic consumption.'}

### 📈 What to Watch
* Semiconductor sector gained 4.8% following positive earnings reports from industry leaders
* Energy stocks underperformed as crude oil prices declined 2.3% on increased supply forecasts
* Small-cap stocks showed strong momentum, outpacing large-caps by 1.7% this week
* European banking sector continues to struggle with profitability challenges

### 🔑 Key Takeaway
Investor sentiment remains cautiously optimistic as markets navigate conflicting economic signals. While inflation persists above central bank targets, economic growth indicators remain positive, supporting the "soft landing" narrative that has dominated market expectations in recent weeks.
    `,
    copilot: `
**AI Copilot**

${customPrefix || 'Your newsletter aligns well with current market trends showing increased interest in AI infrastructure investments. Consider expanding coverage on semiconductor companies supporting AI development, as this sector has seen a 28% increase in institutional investment over the last quarter.'}

Based on reader engagement metrics, your markets section receives the most click-throughs when focusing on actionable insights rather than general overviews. Consider restructuring to highlight 3-4 specific investment themes with supporting data points.

Recommend incorporating a "Technology Innovation Spotlight" segment highlighting emerging technologies with potential market impact within 6-18 month timeframes. This format has shown 37% higher engagement in comparable financial newsletters according to recent publishing analytics.
    `
  };

  return mockContent[section] || '';
};
