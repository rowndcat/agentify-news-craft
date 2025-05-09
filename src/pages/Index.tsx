
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import NewsletterSection from "@/components/NewsletterSection";
import { generateNewsletter, NewsletterSections } from "@/services/newsletterService";
import { toast } from "sonner";
import { ChevronRight, RefreshCw, Sparkles, Files } from "lucide-react";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();
  // Generate a random chat ID for this session
  const [chatId] = useState(`chat_${Math.random().toString(36).substring(2, 10)}`);
  const [content, setContent] = useState<NewsletterSections>({
    news: "",
    markets: "",
    copilot: "",
  });
  
  // State for image URLs
  const [imageUrls, setImageUrls] = useState<{
    news: string | null;
    markets: string | null;
    copilot: string | null;
  }>({
    news: null,
    markets: null,
    copilot: null,
  });
  
  const [isLoading, setIsLoading] = useState<{
    all: boolean;
    news: boolean;
    markets: boolean;
    copilot: boolean;
  }>({
    all: false,
    news: false,
    markets: false,
    copilot: false,
  });

  const handleGenerateAll = async () => {
    setIsLoading(prev => ({ ...prev, all: true, news: true, markets: true, copilot: true }));
    
    try {
      const payload = {
        chatId: chatId,
        message: "Generate a complete newsletter with AI news, markets, and copilot sections"
      };
      
      console.log("Generate all request payload:", payload);
      const result = await generateNewsletter(payload);
      
      console.log("Generate all result:", result);
      console.log("Result type:", typeof result);
      console.log("Result keys:", Object.keys(result));
      
      // Debug the actual content received
      if (result.news) console.log("News content received:", result.news.substring(0, 100) + "...");
      if (result.markets) console.log("Markets content received:", result.markets.substring(0, 100) + "...");
      if (result.copilot) console.log("Copilot content received:", result.copilot.substring(0, 100) + "...");
      
      // Check for image URLs in the response
      if (result.newsImage) console.log("News image URL received:", result.newsImage);
      if (result.marketsImage) console.log("Markets image URL received:", result.marketsImage);
      if (result.copilotImage) console.log("Copilot image URL received:", result.copilotImage);
      
      if (result) {
        // Force state update with the received sections, with fallbacks to prevent empty updates
        setContent({
          news: result.news || "",
          markets: result.markets || "",
          copilot: result.copilot || "",
        });
        
        // Update image URLs
        setImageUrls({
          news: result.newsImage || null,
          markets: result.marketsImage || null,
          copilot: result.copilotImage || null,
        });
        
        // Check if any content was actually returned
        if (result.news || result.markets || result.copilot) {
          toast.success("Newsletter generated successfully!");
        } else {
          toast.warning("No content was returned. Please try again.");
        }
      } else {
        toast.error("Failed to get response from API. Please try again.");
      }
    } catch (error) {
      console.error("Failed to generate newsletter:", error);
      toast.error("Failed to generate newsletter. Please try again.");
    } finally {
      setIsLoading(prev => ({ ...prev, all: false, news: false, markets: false, copilot: false }));
    }
  };

  const handleRegenerateSection = async (section: keyof NewsletterSections, instructions?: string) => {
    setIsLoading(prev => ({ ...prev, [section]: true }));
    
    try {
      // Include current content of the section being regenerated
      const payload = {
        chatId: chatId,
        action: `regenerate_${section}` as 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot',
        instructions,
        current_content: content[section] // Include the current section content
      };
      
      console.log(`Regenerating ${section} with payload:`, payload);
      const result = await generateNewsletter(payload);
      
      console.log(`Regenerate ${section} result:`, result);
      console.log(`${section} result type:`, typeof result);
      console.log(`${section} received content:`, result[section] ? result[section].substring(0, 100) + "..." : "No content");
      
      // Check for image URL in the response
      if (result[`${section}Image`]) {
        console.log(`${section} image URL received:`, result[`${section}Image`]);
      }
      
      if (result && result[section]) {
        // Force state update with only the specified section
        setContent(prev => ({
          ...prev,
          [section]: result[section],
        }));
        
        // Update image URL for this section if provided
        if (result[`${section}Image`]) {
          setImageUrls(prev => ({
            ...prev,
            [section]: result[`${section}Image`],
          }));
        }
        
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section regenerated!`);
      } else {
        console.error(`No content returned for ${section} section:`, result);
        toast.warning(`No content was returned for the ${section} section. Please try again.`);
      }
    } catch (error) {
      console.error(`Failed to regenerate ${section} section:`, error);
      toast.error(`Failed to regenerate ${section} section. Please try again.`);
    } finally {
      setIsLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  const handleCombineAll = () => {
    // Check if at least one section has content
    if (!content.news && !content.markets && !content.copilot) {
      toast.error("Please generate at least one section before combining");
      return;
    }
    
    // Store the content and image URLs in sessionStorage to pass to the combined page
    sessionStorage.setItem('combinedNewsletter', JSON.stringify({
      content,
      imageUrls
    }));
    
    navigate('/combined');
  };

  // Check if any sections have content
  const hasContent = content.news || content.markets || content.copilot;

  return (
    <div className="min-h-screen px-4 pb-12">
      <header className="container pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-3 items-center text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              NewsletterCraft
            </h1>
            <p className="text-lg text-brand-blue max-w-lg font-medium">
              Create engaging newsletters in seconds with AI-powered content generation.
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <Card className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between animate-float">
              <div>
                <h2 className="text-xl font-semibold mb-2 text-brand-blue">Generate Complete Newsletter</h2>
                <p className="text-gray-600">
                  Create all three sections with a single click
                </p>
              </div>
              <Button 
                onClick={handleGenerateAll} 
                disabled={isLoading.all}
                className="button-animation glow min-w-[180px] bg-brand-blue hover:bg-opacity-90 text-white py-6"
                size="lg"
              >
                {isLoading.all ? (
                  <div className="flex items-center gap-2">
                    <LoadingSpinner size="sm" />
                    <span>Generating...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" />
                    <span>Generate All</span>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}
              </Button>
            </Card>

            {hasContent && (
              <Card className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2 text-brand-blue">Combine All Sections</h2>
                  <p className="text-gray-600">
                    View and export your complete newsletter
                  </p>
                </div>
                <Button 
                  onClick={handleCombineAll}
                  className="button-animation min-w-[180px] bg-[#44c285] hover:bg-opacity-90 text-white py-6"
                  size="lg"
                >
                  <div className="flex items-center gap-2">
                    <Files className="h-5 w-5" />
                    <span>Combine All</span>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                </Button>
              </Card>
            )}
          </div>
        </div>
      </header>

      <main className="container">
        <div className="max-w-4xl mx-auto flex flex-col gap-6">
          <NewsletterSection
            title="AI News"
            content={content.news}
            isLoading={isLoading.news}
            onRegenerate={(instructions) => handleRegenerateSection("news", instructions)}
            icon="news"
            imageUrl={imageUrls.news}
          />
          
          <NewsletterSection
            title="Markets & Economy"
            content={content.markets}
            isLoading={isLoading.markets}
            onRegenerate={(instructions) => handleRegenerateSection("markets", instructions)}
            icon="markets"
            imageUrl={imageUrls.markets}
          />
          
          <NewsletterSection
            title="Copilot"
            content={content.copilot}
            isLoading={isLoading.copilot}
            onRegenerate={(instructions) => handleRegenerateSection("copilot", instructions)}
            icon="insights"
            imageUrl={imageUrls.copilot}
          />
        </div>
      </main>

      <footer className="container mt-16">
        <div className="max-w-4xl mx-auto text-center text-sm text-brand-blue">
          <p>© 2025 NewsletterCraft. Powered by Agentify360.</p>
          <a href="https://www.agentify360.com" className="text-brand-blue hover:text-brand-skyblue mt-1 inline-block">
            www.agentify360.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
