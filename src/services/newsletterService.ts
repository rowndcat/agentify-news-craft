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
const WEBHOOK_WAIT_TIME = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 5000; // 5 seconds

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
    
    // Send the webhook request
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      console.log("Webhook request sent, response status:", response.status);
      
      // Check if we got a direct response from the webhook
      if (response.ok) {
        try {
          const webhookData = await response.json();
          console.log("Webhook response data:", webhookData);
          
          // Check if the webhook returned content in the expected format
          if (webhookData && webhookData.output) {
            console.log("Using direct webhook response content");
            
            // Parse the webhook output which is a single markdown string with sections
            const sections = parseWebhookOutput(webhookData.output);
            
            // Return the parsed sections if valid
            if (sections.news || sections.markets || sections.copilot) {
              return sections;
            }
          }
        } catch (parseError) {
          console.error("Error parsing webhook response:", parseError);
        }
      }
      
      // Wait for the webhook to process with retry mechanism
      console.log(`Waiting for webhook to process (up to ${WEBHOOK_WAIT_TIME/1000} seconds)...`);
      
      // First wait period
      await new Promise(resolve => setTimeout(resolve, WEBHOOK_WAIT_TIME));
      
      // Try API connection with retries
      for (let retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
        try {
          console.log(`Making API request attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
          
          // Make API request
          const apiResponse = await fetch(`${API_URL}/generate-newsletter`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(webhookPayload),
            // Add a reasonable timeout for the API request
            signal: AbortSignal.timeout(10000)
          });
          
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            console.log("Raw API response:", data);
            
            // Return the processed sections
            return {
              news: data.news || data.content?.news || "",
              markets: data.markets || data.content?.markets || "",
              copilot: data.copilot || data.content?.copilot || "",
              newsImage: data.newsImage || data.content?.newsImage || null,
              marketsImage: data.marketsImage || data.content?.marketsImage || null,
              copilotImage: data.copilotImage || data.content?.copilotImage || null,
            };
          } else {
            console.log(`API attempt ${retryCount + 1} failed with status: ${apiResponse.status}`);
            
            // If not the last retry, wait before trying again
            if (retryCount < MAX_RETRIES) {
              await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            }
          }
        } catch (apiError) {
          console.error(`API attempt ${retryCount + 1} error:`, apiError);
          
          // If not the last retry, wait before trying again
          if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
      
      console.log("All API attempts failed after webhook processing");
    } catch (webhookError) {
      console.error("Error processing webhook request:", webhookError);
    }
    
    // Only use mock data if in development mode AND if the webhook/API failed
    if (import.meta.env.DEV) {
      console.log("Falling back to mock data after webhook attempt");
      return getMockData(webhookPayload);
    }
    
    throw new Error("Failed to get response from webhook and API after multiple attempts");
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
  console.log("Parsing webhook output:", output.substring(0, 100) + "...");
  
  const sections: NewsletterSections = {
    news: "",
    markets: "",
    copilot: ""
  };
  
  // Split the output by section markers
  const parts = output.split("---");
  
  // Process each part to identify sections
  parts.forEach(part => {
    // Clean up the part
    const trimmedPart = part.trim();
    
    // Identify sections based on headers
    if (trimmedPart.includes("**News Section**") || 
        trimmedPart.includes("### **News Section**")) {
      sections.news = trimmedPart;
      
      // Use a placeholder image for news
      sections.newsImage = sections.newsImage || "https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=800&h=400";
    } 
    else if (trimmedPart.includes("**Economy & Markets Section**") || 
             trimmedPart.includes("### **Economy & Markets Section**")) {
      sections.markets = trimmedPart;
      
      // Use a placeholder image for markets
      sections.marketsImage = sections.marketsImage || "https://images.unsplash.com/photo-1460574283810-2aab119d8511?auto=format&fit=crop&w=800&h=400";
    } 
    else if (trimmedPart.includes("**Copilot Section**") || 
             trimmedPart.includes("### **Copilot Section**") ||
             trimmedPart.includes("**AI Copilot**")) {
      sections.copilot = trimmedPart;
      
      // Use a placeholder image for copilot
      sections.copilotImage = sections.copilotImage || "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&h=400";
    }
  });
  
  // Log the extracted sections
  console.log("Parsed news section:", sections.news ? sections.news.substring(0, 50) + "..." : "None");
  console.log("Parsed markets section:", sections.markets ? sections.markets.substring(0, 50) + "..." : "None");
  console.log("Parsed copilot section:", sections.copilot ? sections.copilot.substring(0, 50) + "..." : "None");
  
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
    
    try {
      // Use fetch with standard mode to get response
      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload)
      });
      
      console.log("Webhook request sent, response status:", response.status);
      
      // Check if we got a direct response from the webhook
      if (response.ok) {
        try {
          const webhookData = await response.json();
          console.log("Webhook response data for regeneration:", webhookData);
          
          // Check if the webhook returned content in the expected format
          if (webhookData && webhookData.output) {
            console.log("Using direct webhook response content for regeneration");
            
            // Parse the webhook output for the specific section
            const sections = parseWebhookOutput(webhookData.output);
            
            // Return the specific regenerated section if available
            if (sections[section]) {
              return sections[section];
            }
          }
        } catch (parseError) {
          console.error("Error parsing webhook regeneration response:", parseError);
        }
      }
      
      // Wait longer for the webhook to process
      console.log(`Waiting for webhook to process (up to ${WEBHOOK_WAIT_TIME/1000} seconds)...`);
      await new Promise(resolve => setTimeout(resolve, WEBHOOK_WAIT_TIME));
      
      // Try API connection with retries
      for (let retryCount = 0; retryCount <= MAX_RETRIES; retryCount++) {
        try {
          console.log(`Making section API request attempt ${retryCount + 1}/${MAX_RETRIES + 1}`);
          
          // Try to get a response from the API
          const apiResponse = await fetch(`${API_URL}/regenerate-section`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify(webhookPayload),
            signal: AbortSignal.timeout(10000)
          });
          
          if (apiResponse.ok) {
            const data = await apiResponse.json();
            if (data && data[section]) {
              return data[section];
            } else {
              console.log(`API returned success but no data for section ${section}`);
            }
          } else {
            console.log(`API attempt ${retryCount + 1} failed with status: ${apiResponse.status}`);
          }
          
          // If not the last retry, wait before trying again
          if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        } catch (apiError) {
          console.error(`API attempt ${retryCount + 1} error:`, apiError);
          
          // If not the last retry, wait before trying again
          if (retryCount < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
          }
        }
      }
    } catch (webhookError) {
      console.error("Error processing webhook request:", webhookError);
    }
    
    // Only use mock data if in development mode AND if the webhook/API failed
    if (import.meta.env.DEV) {
      console.log("Falling back to mock data after webhook attempt for section regeneration");
      const mockData = getMockData({
        chatId: chatId,
        message: `Regenerate ${section} section${instructions ? ` with instructions: ${instructions}` : ''}`
      });
      return mockData[section];
    }
    
    throw new Error(`Failed to regenerate ${section} via webhook and API after multiple attempts`);
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
      content: content
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
      } else {
        console.error("No webViewLink in the response");
        return null;
      }
    } else {
      console.error("Failed to get successful response from image webhook:", response.statusText);
      
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
