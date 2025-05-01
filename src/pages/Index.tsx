
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import NewsletterSection from "@/components/NewsletterSection";
import { generateNewsletter, NewsletterSections } from "@/services/newsletterService";
import { toast } from "sonner";
import { ChevronRight, RefreshCw, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import LoadingSpinner from "@/components/LoadingSpinner";

const Index = () => {
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
        "{{ $json.chatId }}": chatId,
        message: "Generate a complete newsletter with AI news, markets, and copilot sections"
      });
      
      setContent(prev => ({
        news: result.news || prev.news,
        markets: result.markets || prev.markets,
        copilot: result.copilot || prev.copilot,
      }));
      
      toast.success("Newsletter generated successfully!");
    } catch (error) {
      console.error("Failed to generate newsletter:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, all: false, news: false, markets: false, copilot: false }));
    }
  };

  const handleRegenerateSection = async (section: keyof NewsletterSections, instructions?: string) => {
    setIsLoading(prev => ({ ...prev, [section]: true }));
    
    try {
      const action = `regenerate_${section}` as 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
      const result = await generateNewsletter({ 
        "{{ $json.chatId }}": chatId,
        action: action,
        current_content: content,
        instructions: instructions
      });
      
      if (result[section]) {
        setContent(prev => ({
          ...prev,
          [section]: result[section],
        }));
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section regenerated!`);
      }
    } catch (error) {
      console.error(`Failed to regenerate ${section} section:`, error);
    } finally {
      setIsLoading(prev => ({ ...prev, [section]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-12">
      <header className="container pt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col gap-3 items-center text-center mb-8">
            <h1 className="text-4xl md:text-5xl font-bold text-gradient">
              NewsletterCraft
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg">
              Create engaging newsletters in seconds with AI-powered content generation.
            </p>
          </div>

          <Card className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between animate-float">
            <div>
              <h2 className="text-xl font-semibold mb-2">Generate Complete Newsletter</h2>
              <p className="text-muted-foreground">
                Create all three sections with a single click
              </p>
            </div>
            <Button 
              onClick={handleGenerateAll} 
              disabled={isLoading.all}
              className="button-animation glow min-w-[180px] bg-primary hover:bg-primary/90 text-white py-6"
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
        <div className="max-w-4xl mx-auto text-center text-sm text-muted-foreground">
          <p>© 2025 NewsletterCraft. Powered by Agentify360.</p>
          <a href="https://www.agentify360.com" className="text-primary hover:text-primary/80 mt-1 inline-block">
            www.agentify360.com
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
