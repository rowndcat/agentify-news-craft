
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import NewsletterSection from "@/components/NewsletterSection";
import { generateNewsletter, regenerateSection, NewsletterSections, generateSectionImage } from "@/services/newsletterService";
import { toast } from "sonner";
import { ChevronRight, RefreshCw, Sparkles, Files } from "lucide-react";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useNavigate } from "react-router-dom";
import Announcement from "@/components/Announcement";

const Index = () => {
  const navigate = useNavigate();
  // Generate a random chat ID for this session
  const [chatId] = useState(`chat_${Math.random().toString(36).substring(2, 10)}`);
  
  // Log webhook URL on component mount
  useEffect(() => {
    console.log("Current chat ID:", chatId);
    console.log("Webhook URL to use:", "https://agentify360.app.n8n.cloud/webhook/7dc2bc76-937c-439d-ab71-d1c2b496facb/chat");
    console.log("Image generation webhook URL:", "https://agentify360.app.n8n.cloud/webhook/76840a22-558d-4fae-9f51-aadcd7c3fb7f");
  }, [chatId]);
  
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

  // Add state for image generation loading
  const [isGeneratingImage, setIsGeneratingImage] = useState<{
    news: boolean;
    markets: boolean;
    copilot: boolean;
  }>({
    news: false,
    markets: false,
    copilot: false,
  });

  // Add a state to track when webhook processing is happening
  const [isWebhookProcessing, setIsWebhookProcessing] = useState(false);

  const handleGenerateAll = async () => {
    setIsLoading(prev => ({ ...prev, all: true, news: true, markets: true, copilot: true }));
    setIsWebhookProcessing(true);
    
    try {
      // Create the proper payload structure with chatId and message
      const payload = {
        chatId: chatId,
        message: "Generate newsletter with news, markets, and copilot sections"
      };
      
      console.log("Generate all request payload:", payload);
      
      // Show toast to indicate webhook is being called
      toast.info("Sending request to generate newsletter...");
      
      // Update with a more informative toast that explains the waiting process
      toast.loading("Processing your newsletter request. This may take up to 2 minutes...", {
        duration: 120000, // Increased from 30s to 2min
      });
      
      const result = await generateNewsletter(payload);
      
      console.log("Generate all result:", result);
      console.log("News content received:", result.news ? result.news.substring(0, 100) + "..." : "None");
      console.log("Markets content received:", result.markets ? result.markets.substring(0, 100) + "..." : "None");
      console.log("Copilot content received:", result.copilot ? result.copilot.substring(0, 100) + "..." : "None");
      
      // Check for image URLs in the response
      if (result.newsImage) console.log("News image URL received:", result.newsImage);
      if (result.marketsImage) console.log("Markets image URL received:", result.marketsImage);
      if (result.copilotImage) console.log("Copilot image URL received:", result.copilotImage);
      
      if (result) {
        // Force state update with the received sections, with fallbacks to prevent empty updates
        setContent(prev => ({
          news: result.news || prev.news,
          markets: result.markets || prev.markets,
          copilot: result.copilot || prev.copilot,
        }));
        
        // Update image URLs
        setImageUrls(prev => ({
          news: result.newsImage || prev.news,
          markets: result.marketsImage || prev.markets,
          copilot: result.copilotImage || prev.copilot,
        }));
        
        // Check if any content was actually returned
        if (result.news || result.markets || result.copilot) {
          let sections = [];
          if (result.news) sections.push("News");
          if (result.markets) sections.push("Markets");
          if (result.copilot) sections.push("Copilot");
          
          if (sections.length === 3) {
            toast.success("All newsletter sections generated successfully!");
          } else if (sections.length > 0) {
            toast.success(`Generated: ${sections.join(", ")}. Some sections may need regeneration.`);
          } else {
            toast.warning("No content was returned. Please try again.");
          }
        } else {
          toast.warning("No content was returned. Please try regenerating each section individually.");
        }
      } else {
        toast.error("Failed to get response from API. Please try again.");
      }
    } catch (error) {
      console.error("Failed to generate newsletter:", error);
      toast.error("Failed to generate newsletter. Please try again.");
    } finally {
      setIsLoading(prev => ({ ...prev, all: false, news: false, markets: false, copilot: false }));
      setIsWebhookProcessing(false);
    }
  };

  const handleRegenerateSection = async (section: keyof NewsletterSections, instructions?: string) => {
    setIsLoading(prev => ({ ...prev, [section]: true }));
    setIsWebhookProcessing(true);
    
    try {
      console.log(`Regenerating ${section} with instructions:`, instructions);
      console.log("Using chat ID:", chatId);
      
      // Display toast to indicate webhook is being called
      toast.info(`Sending ${section} regeneration request...`);
      
      // Update with a more informative toast that explains the waiting process
      toast.loading(`Processing your ${section} regeneration. This may take up to 30 seconds...`, {
        duration: 15000,
      });
      
      // Get regenerated section using the regenerateSection function
      const regeneratedContent = await regenerateSection(
        section as 'news' | 'markets' | 'copilot',
        chatId,
        instructions
      );
      
      console.log(`Regenerated ${section} content:`, regeneratedContent ? regeneratedContent.substring(0, 100) + "..." : "No content");
      
      if (regeneratedContent) {
        // Update only the specified section
        setContent(prev => ({
          ...prev,
          [section]: regeneratedContent,
        }));
        
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section regenerated!`);
      } else {
        console.error(`No content returned for ${section} section`);
        toast.warning(`No content was returned for the ${section} section. Please try again.`);
      }
    } catch (error) {
      console.error(`Failed to regenerate ${section} section:`, error);
      toast.error(`Failed to regenerate ${section} section. Please try again.`);
    } finally {
      setIsLoading(prev => ({ ...prev, [section]: false }));
      setIsWebhookProcessing(false);
    }
  };

  // Function to handle image generation for a specific section
  const handleGenerateImage = async (section: 'news' | 'markets' | 'copilot') => {
    // Check if we already have content for this section
    if (!content[section]) {
      toast.error(`No ${section} content available. Please generate content first.`);
      return;
    }

    // Check if we already have an image URL for this section
    if (imageUrls[section]) {
      toast.info(`Image URL for ${section} section already exists. Opening in new tab...`);
      window.open(imageUrls[section] as string, '_blank');
      return;
    }

    setIsGeneratingImage(prev => ({ ...prev, [section]: true }));
    
    try {
      toast.info(`Generating image URL for ${section} section...`);
      
      // Display loading toast
      const loadingToastId = toast.loading(`Processing your ${section} image request. This may take a few moments...`, {
        duration: 15000,
      });
      
      // Call the service function to generate the image
      const imageUrl = await generateSectionImage(section, content[section]);
      
      // Dismiss the loading toast
      toast.dismiss(loadingToastId);
      
      if (imageUrl) {
        console.log(`Received image URL for ${section}:`, imageUrl);
        
        // Update image URL for the specific section
        setImageUrls(prev => ({
          ...prev,
          [section]: imageUrl
        }));
        
        toast.success(`Image URL for ${section} section generated successfully!`);
        
        // Log the URL for debugging
        console.log(`${section} image URL set to:`, imageUrl);
      } else {
        toast.warning(`No image URL was returned for the ${section} section. Please try again.`);
        console.warn(`No image URL returned for ${section} section`);
      }
    } catch (error) {
      console.error(`Failed to generate image URL for ${section} section:`, error);
      toast.error(`Failed to generate image URL for ${section} section. Please try again.`);
    } finally {
      setIsGeneratingImage(prev => ({ ...prev, [section]: false }));
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
  const hasContent = !!content.news || !!content.markets || !!content.copilot;

  // Add debug useEffect to log when content changes
  useEffect(() => {
    console.log("Content state updated:", {
      news: content.news ? content.news.substring(0, 50) + "..." : "empty",
      markets: content.markets ? content.markets.substring(0, 50) + "..." : "empty",
      copilot: content.copilot ? content.copilot.substring(0, 50) + "..." : "empty",
    });
  }, [content]);

  // Add debug useEffect to log when image URLs change
  useEffect(() => {
    console.log("Image URLs updated:", imageUrls);
  }, [imageUrls]);

  return (
    <div className="min-h-screen px-4 pb-12">
      <header className="container pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          {isWebhookProcessing && (
            <Announcement 
              message="Your request is being processed. This may take up to 2 minutes. Please wait..." 
              type="info"
            />
          )}
          
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
                disabled={isLoading.all || isWebhookProcessing}
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
            isWebhookProcessing={isWebhookProcessing}
            onGenerateImage={content.news && !imageUrls.news ? () => handleGenerateImage("news") : undefined}
            isGeneratingImage={isGeneratingImage.news}
          />
          
          <NewsletterSection
            title="Markets & Economy"
            content={content.markets}
            isLoading={isLoading.markets}
            onRegenerate={(instructions) => handleRegenerateSection("markets", instructions)}
            icon="markets"
            imageUrl={imageUrls.markets}
            isWebhookProcessing={isWebhookProcessing}
            onGenerateImage={content.markets && !imageUrls.markets ? () => handleGenerateImage("markets") : undefined}
            isGeneratingImage={isGeneratingImage.markets}
          />
          
          <NewsletterSection
            title="Copilot"
            content={content.copilot}
            isLoading={isLoading.copilot}
            onRegenerate={(instructions) => handleRegenerateSection("copilot", instructions)}
            icon="insights"
            imageUrl={imageUrls.copilot}
            isWebhookProcessing={isWebhookProcessing}
            onGenerateImage={content.copilot && !imageUrls.copilot ? () => handleGenerateImage("copilot") : undefined}
            isGeneratingImage={isGeneratingImage.copilot}
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
