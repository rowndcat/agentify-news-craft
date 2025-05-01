
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import NewsletterSection from "@/components/NewsletterSection";
import { generateNewsletter, NewsletterSections } from "@/services/newsletterService";
import { toast } from "sonner";

const Index = () => {
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
      const result = await generateNewsletter({ action: "generate_all" });
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

  const handleRegenerateSection = async (section: keyof NewsletterSections) => {
    setIsLoading(prev => ({ ...prev, [section]: true }));
    
    try {
      const action = `regenerate_${section}` as 'regenerate_news' | 'regenerate_markets' | 'regenerate_copilot';
      const result = await generateNewsletter({ 
        action: action,
        current_content: content
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">NewsletterCraft</h1>
            <p className="text-muted-foreground">Generate professional newsletters with ease</p>
          </div>
          <Button 
            onClick={handleGenerateAll} 
            disabled={isLoading.all}
            className="bg-brand-purple hover:bg-brand-purple/90 button-animation"
          >
            {isLoading.all ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Generate Newsletter"
            )}
          </Button>
        </div>
      </header>

      <main className="container py-8">
        <div className="grid gap-8 md:grid-cols-1 lg:grid-cols-1">
          <NewsletterSection
            title="News Section"
            content={content.news}
            isLoading={isLoading.news}
            onRegenerate={() => handleRegenerateSection("news")}
          />
          
          <NewsletterSection
            title="Markets & Economy"
            content={content.markets}
            isLoading={isLoading.markets}
            onRegenerate={() => handleRegenerateSection("markets")}
          />
          
          <NewsletterSection
            title="Copilot Insights"
            content={content.copilot}
            isLoading={isLoading.copilot}
            onRegenerate={() => handleRegenerateSection("copilot")}
          />
        </div>
      </main>

      <footer className="border-t mt-12 py-6">
        <div className="container text-center text-muted-foreground text-sm">
          © 2025 NewsletterCraft. All rights reserved.
        </div>
      </footer>
    </div>
  );
};

export default Index;

// Import for the RefreshCw icon that's used in this file
import { RefreshCw } from "lucide-react";
