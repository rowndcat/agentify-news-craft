
import React, { useState } from "react";
import { Copy, RefreshCw, BarChart2, Newspaper, Lightbulb, Expand, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { generateNewsletter } from "@/services/newsletterService";

interface NewsletterSectionProps {
  title: string;
  content: string;
  isLoading: boolean;
  onRegenerate: (instructions?: string) => void;
  icon: "news" | "markets" | "insights";
}

// Function to format markdown text to HTML
const formatMarkdown = (text: string): string => {
  if (!text) return "";
  
  // First, remove any headers that might be part of section titles
  // to avoid duplicate section headers in the UI
  let formattedText = text
    .replace(/^###?\s*(\*\*)?News Section(\*\*)?/i, "")
    .replace(/^###?\s*(\*\*)?Economy & Markets Section(\*\*)?/i, "")
    .replace(/^###?\s*(\*\*)?Copilot(\*\*)?/i, "")
    .replace(/^###?\s*(\*\*)?AI Copilot(\*\*)?/i, "");
  
  // Remove asterisks from title that might appear
  formattedText = formattedText
    .replace(/^\*\*News Section.*?\*\*/i, "")
    .replace(/^\*\*Economy & Markets Section.*?\*\*/i, "")
    .replace(/^\*\*Copilot.*?\*\*/i, "")
    .replace(/^\*\*AI Copilot.*?\*\*/i, "");
    
  // Replace markdown headers
  formattedText = formattedText
    // Headers
    .replace(/### (.*?)\n/g, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="text-xl font-medium mb-3 mt-4">$2</h2>')
    .replace(/# (.*?)\n/g, '<h1 class="text-2xl font-medium mb-4 mt-5">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists - handle multiple formats
    .replace(/^\- (.*?)$/gm, '<li>$1</li>')
    .replace(/^\• (.*?)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
    // Links - using a neutral dark color instead of sky blue
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-dark hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Paragraphs (add space after)
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph if not already wrapped
  if (!formattedText.startsWith('<h') && !formattedText.startsWith('<p')) {
    formattedText = `<p class="mb-3">${formattedText}</p>`;
  }
  
  // Fix list items by wrapping them in ul tags
  if (formattedText.includes('<li>')) {
    let tempHtml = formattedText;
    const listItemPattern = /(<li>.*?<\/li>)+/g;
    const matches = tempHtml.match(listItemPattern);
    
    if (matches) {
      matches.forEach(match => {
        // Replace consecutive list items with a properly wrapped ul
        tempHtml = tempHtml.replace(match, `<ul class="list-disc pl-5 mb-4 mt-2">${match}</ul>`);
      });
      formattedText = tempHtml;
    }
  }
  
  // Clean up any empty paragraphs and dangling tags
  formattedText = formattedText
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br \/><\/p>/g, '');
    
  // Clean up any markdown dividers
  formattedText = formattedText.replace(/---/g, '<hr class="my-4" />');
    
  return formattedText;
};

const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title,
  content,
  isLoading,
  onRegenerate,
  icon,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [fullscreenView, setFullscreenView] = useState(false);

  const copyToClipboard = async () => {
    try {
      // Strip HTML when copying to clipboard
      const tempElement = document.createElement('div');
      tempElement.innerHTML = formatMarkdown(content);
      const textContent = tempElement.textContent || tempElement.innerText || content;
      
      await navigator.clipboard.writeText(textContent);
      toast.success(`${title} content copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy content:", error);
      toast.error("Failed to copy content to clipboard.");
    }
  };

  const handleRegenerateClick = () => {
    if (isLoading) return;
    setIsDialogOpen(true);
  };

  const handleRegenerateSubmit = () => {
    onRegenerate(instructions);
    setIsDialogOpen(false);
    setInstructions("");
  };

  const handleRegenerateWithNoInstructions = () => {
    onRegenerate(undefined);
    setIsDialogOpen(false);
    setInstructions("");
  };

  const renderIcon = () => {
    switch (icon) {
      case "news":
        return <Newspaper className="h-5 w-5 text-[#29adff]" />;
      case "markets":
        return <BarChart2 className="h-5 w-5 text-[#29adff]" />;
      case "insights":
        return <Lightbulb className="h-5 w-5 text-[#29adff]" />;
      default:
        return null;
    }
  };

  // Determine if there's actual content to display
  const hasContent = content && content.trim().length > 0;

  return (
    <>
      <Card className="section-card animate-fade-in">
        <div className="section-header">
          <div className="flex items-center gap-2">
            {renderIcon()}
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFullscreenView(true)}
              variant="ghost"
              size="sm"
              disabled={!hasContent || isLoading}
              className="button-animation hover:bg-white/20 text-white"
              title="View fullscreen"
            >
              <Expand size={18} />
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="ghost"
              size="sm"
              disabled={!hasContent || isLoading}
              className="button-animation hover:bg-white/20 text-white"
              title="Copy content"
            >
              <Copy size={18} />
            </Button>
            <Button
              onClick={handleRegenerateClick}
              variant="ghost"
              size="sm"
              disabled={isLoading}
              className={`button-animation hover:bg-white/20 text-white ${isLoading ? 'animate-pulse-light' : ''}`}
              title="Regenerate section"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw size={18} />
              )}
            </Button>
          </div>
        </div>
        <ScrollArea className="section-content font-tiempos h-[300px]">
          {isLoading ? (
            <div className="flex flex-col gap-3">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-5/6"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="h-4 bg-muted rounded w-4/5"></div>
              <div className="h-4 bg-muted rounded w-3/5"></div>
            </div>
          ) : hasContent ? (
            <div 
              className="newsletter-content font-tiempos text-gray-800 pr-4" 
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          ) : (
            <div className="text-muted-foreground italic text-center py-8">
              <p>No content generated yet.</p>
              <p className="text-sm mt-2">Click the generate button above to create content.</p>
            </div>
          )}
        </ScrollArea>
      </Card>

      {/* Fullscreen content dialog */}
      <Dialog open={fullscreenView} onOpenChange={setFullscreenView}>
        <DialogContent className="max-w-full w-full h-screen p-0 m-0 border-none bg-[#f5f1e9]">
          <div className="bg-[#001f47] p-4 text-white flex justify-between items-center sticky top-0 z-10">
            <h2 className="text-xl font-semibold">{title} - Full Content</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-white/20"
              onClick={() => setFullscreenView(false)}
            >
              <X size={18} />
            </Button>
          </div>
          <ScrollArea className="h-[calc(100vh-4rem)] p-6 md:p-8 lg:p-12 font-tiempos">
            <div className="max-w-4xl mx-auto">
              <div 
                className="newsletter-content text-lg" 
                dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
              />
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Regenerate dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle>Regenerate {title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
              <Textarea
                id="instructions"
                placeholder="Add specific instructions for this section, or leave blank for default generation"
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={handleRegenerateWithNoInstructions}
              className="w-full sm:w-auto"
            >
              No Instructions
            </Button>
            <Button 
              type="submit" 
              onClick={handleRegenerateSubmit}
              className="w-full sm:w-auto"
            >
              Regenerate with Instructions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NewsletterSection;
