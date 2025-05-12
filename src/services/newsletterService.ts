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
const WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/dbcfd9ed-a84b-44db-a493-da8f368974f1/chat";

/**
 * Send a request to generate newsletter content
 */
export const generateNewsletter = async (payload: any): Promise<NewsletterSections> => {
  try {
    // In development mode, use mock data for quicker testing
    if (import.meta.env.DEV) {
      console.log("DEV mode detected, using mock data with payload:", payload);
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      return getMockData(payload);
    }

    console.log("Sending API request to generate newsletter", {
      url: `${API_URL}/generate-newsletter`,
      payload
    });

    // Make API request
    const response = await fetch(`${API_URL}/generate-newsletter`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`API request failed with status: ${response.status}`);
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
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
  } catch (error) {
    console.error("Error generating newsletter content:", error);
    
    if (import.meta.env.DEV) {
      console.log("Using sample data in development environment");
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      return getMockData(payload);
    }
    
    throw error;
  }
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
    
    // Prepare payload for regeneration
    const payload = {
      chatId,
      action: `regenerate_${section}`,
      instructions
    };
    
    // In development mode, use mock data for quicker testing
    if (import.meta.env.DEV) {
      console.log(`DEV mode detected, using mock data for ${section} regeneration`);
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      const mockData = getMockData({
        action: `regenerate_${section}`,
        instructions
      });
      
      return mockData[section];
    }
    
    // Try the webhook approach first - complete rewrite of this section
    console.log("Attempting to send webhook request to:", WEBHOOK_URL);
    
    try {
      // Create a plain XMLHttpRequest instead of fetch for better control
      const xhr = new XMLHttpRequest();
      xhr.open('POST', WEBHOOK_URL, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      
      // Log the full request details
      console.log("XHR request payload:", JSON.stringify(payload));
      
      // Promise wrapper for XHR
      await new Promise((resolve, reject) => {
        xhr.onload = function() {
          console.log("XHR status:", xhr.status);
          console.log("XHR response text:", xhr.responseText);
          resolve(xhr);
        };
        
        xhr.onerror = function() {
          console.error("XHR error occurred");
          resolve(xhr); // Resolve anyway to continue the flow
        };
        
        // Actually send the request
        xhr.send(JSON.stringify(payload));
        console.log("XHR request sent successfully");
      });
      
      console.log("XHR request completed, waiting for processing...");
      
      // Wait a moment for webhook to process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // After webhook attempt, fall back to standard API
      console.log("Falling back to standard API for guaranteed response");
      const result = await generateNewsletter(payload);
      
      if (result && result[section]) {
        console.log(`Successfully regenerated ${section} via standard API`);
        return result[section];
      } else {
        throw new Error(`No content returned for ${section} section`);
      }
      
    } catch (webhookError) {
      console.error("Error with webhook attempt:", webhookError);
      
      // Fallback to direct API call if webhook fails
      console.log("Webhook failed, trying standard API directly");
      
      try {
        const result = await generateNewsletter(payload);
        
        if (result && result[section]) {
          console.log(`Successfully regenerated ${section} via direct API`);
          return result[section];
        } else {
          throw new Error(`No content returned for ${section} section`);
        }
      } catch (apiError) {
        console.error(`Error with API regeneration:`, apiError);
        
        // Last resort fallback to mock data in development
        if (import.meta.env.DEV) {
          console.log(`Using mock data for ${section} as final fallback`);
          const mockData = getMockData({
            action: `regenerate_${section}`,
            instructions
          });
          return mockData[section];
        }
        
        throw apiError;
      }
    }
  } catch (error) {
    console.error(`Overall error regenerating ${section}:`, error);
    
    // Final fallback to mock data in development
    if (import.meta.env.DEV) {
      console.log(`DEV mode: Falling back to mock data after all errors`);
      const mockData = getMockData({
        action: `regenerate_${section}`,
        instructions
      });
      return mockData[section];
    }
    
    throw error;
  }
};

// Mock data for development
const getMockData = (payload: any): NewsletterSections => {
  console.log("Mock data requested with payload:", payload);
  
  // If regenerating a specific section
  if (payload.action?.startsWith('regenerate_')) {
    const section = payload.action.split('_')[1];
    const mockData: NewsletterSections = {
      news: "",
      markets: "",
      copilot: "",
    };
    
    const placeholderText = payload.instructions 
      ? `Regenerated ${section} content with instructions: "${payload.instructions}"`
      : `Regenerated ${section} content`;
    
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
  
  // Default is to return full mock newsletter
  return {
    news: getCombinedSectionContent('news', 'Sample news content'),
    markets: getCombinedSectionContent('markets', 'Sample markets content'),
    copilot: getCombinedSectionContent('copilot', 'Sample copilot content'),
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
