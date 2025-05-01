
import { toast } from "sonner";

const WEBHOOK_URL = "https://agentify360.app.n8n.cloud/webhook/928b63bf-48cb-4511-a02d-bb3819fe512f";

export interface NewsletterSections {
  news: string;
  markets: string;
  copilot: string;
}

export interface NewsletterRequest {
  action: 'generate_all' | 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
  current_content?: Partial<NewsletterSections>;
}

export const generateNewsletter = async (request: NewsletterRequest): Promise<Partial<NewsletterSections>> => {
  try {
    console.log(`Sending request to webhook: ${JSON.stringify(request)}`);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to generate newsletter: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log("Newsletter data received:", data);
    
    // Return the section data from the response
    return {
      news: data.news || "",
      markets: data.markets || "",
      copilot: data.copilot || "",
    };
  } catch (error) {
    console.error("Error generating newsletter:", error);
    toast.error("Failed to generate newsletter content. Please try again.");
    throw error;
  }
};
