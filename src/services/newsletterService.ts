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

// Set the correct webhook URL
const WEBHOOK_URL = 'https://agentify360.app.n8n.cloud/webhook/dbcfd9ed-a84b-44db-a493-da8f368974f1/chat';

/**
 * Send a request to generate newsletter content
 */
export const generateNewsletter = async (payload: any): Promise<NewsletterSections> => {
  console.log("Sending request to generate newsletter with payload:", payload);
  try {
    // Use the direct webhook URL instead of environment variable
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log("API Response Status:", response.status);
    
    if (!response.ok) {
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
    
    // Check if we're in development mode to use mock data
    if (import.meta.env.DEV) {
      console.log("Using sample data in development environment");
      // Simulate API delay
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
  console.log(`Starting regeneration of ${section} section with chatId: ${chatId}`);
  try {
    const payload = {
      action: `regenerate_${section}`,
      chatId,
      instructions
    };
    
    console.log(`Regenerating ${section} section with payload:`, payload);
    
    // Use the direct webhook URL instead of environment variable
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log("Regeneration API Response Status:", response.status);
    
    if (!response.ok) {
      throw new Error(`API request failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Regenerated ${section} content:`, data);
    
    // Try multiple content extraction strategies
    let sectionContent = "";
    
    if (data[section]) {
      // Direct section property
      sectionContent = data[section];
    } else if (data.content && data.content[section]) {
      // Nested content object
      sectionContent = data.content[section];
    } else if (data.sections && data.sections[section]) {
      // Nested sections object
      sectionContent = data.sections[section];
    }
    
    // If we still don't have content, return empty string
    if (!sectionContent && import.meta.env.DEV) {
      console.log("Using mock data for regenerated section");
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      const mockData = getMockData({
        action: `regenerate_${section}`,
        instructions
      });
      
      return mockData[section] || "";
    }
    
    return sectionContent || "";
  } catch (error) {
    console.error(`Error regenerating ${section} section:`, error);
    
    if (import.meta.env.DEV) {
      console.log("Using mock data for regenerated section");
      await new Promise(resolve => setTimeout(resolve, MOCK_DELAY));
      
      const mockData = getMockData({
        action: `regenerate_${section}`,
        instructions
      });
      
      return mockData[section] || "";
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
