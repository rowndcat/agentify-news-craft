
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
      const result = await generateNewsletter({
        chatId: chatId,
        message: "Generate a complete newsletter with AI news, markets, and copilot sections"
      });
      
      console.log("Generate all result:", result);
      
      // Directly update content with whatever sections were returned
      setContent(prev => ({
        news: result.news !== undefined ? result.news : prev.news,
        markets: result.markets !== undefined ? result.markets : prev.markets,
        copilot: result.copilot !== undefined ? result.copilot : prev.copilot,
      }));
      
      // Check if any content was actually returned
      if (result.news || result.markets || result.copilot) {
        toast.success("Newsletter generated successfully!");
      } else {
        toast.warning("No content was returned. Please try again.");
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
      const action = `regenerate_${section}` as 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
      const result = await generateNewsletter({ 
        chatId: chatId,
        action: action,
        instructions: instructions
      });
      
      console.log(`Regenerate ${section} result:`, result);
      
      if (result[section]) {
        setContent(prev => ({
          ...prev,
          [section]: result[section] || prev[section],
        }));
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section regenerated!`);
      } else {
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
    
    // Store the content in sessionStorage to pass to the combined page
    sessionStorage.setItem('combinedNewsletter', JSON.stringify(content));
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
          />
          
          <NewsletterSection
            title="Markets & Economy"
            content={content.markets}
            isLoading={isLoading.markets}
            onRegenerate={(instructions) => handleRegenerateSection("markets", instructions)}
            icon="markets"
          />
          
          <NewsletterSection
            title="Copilot"
            content={content.copilot}
            isLoading={isLoading.copilot}
            onRegenerate={(instructions) => handleRegenerateSection("copilot", instructions)}
            icon="insights"
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
