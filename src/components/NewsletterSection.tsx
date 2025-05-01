
import React, { useState } from "react";
import { Copy, RefreshCw, BarChart2, Newspaper, Lightbulb } from "lucide-react";
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
  
  // Replace markdown headers
  let formattedText = text
    // Headers
    .replace(/### (.*?)\n/g, '<h3 class="text-lg font-medium mb-2">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="text-xl font-medium mb-3">$1</h2>')
    .replace(/# (.*?)\n/g, '<h1 class="text-2xl font-medium mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Lists
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
    // Links
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-skyblue hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Paragraphs (add space after)
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph if not already wrapped
  if (!formattedText.startsWith('<h') && !formattedText.startsWith('<p')) {
    formattedText = `<p class="mb-3">${formattedText}</p>`;
  }
  
  // Clean up any empty paragraphs and dangling tags
  formattedText = formattedText
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br \/><\/p>/g, '');
    
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
    onRegenerate(instructions === "N/A" ? undefined : instructions);
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
        <div className="section-content wave-animation font-tiempos">
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
              className="newsletter-content" 
              dangerouslySetInnerHTML={{ __html: formatMarkdown(content) }}
            />
          ) : (
            <div className="text-muted-foreground italic text-center py-8">
              <p>No content generated yet.</p>
              <p className="text-sm mt-2">Click the generate button above to create content.</p>
            </div>
          )}
        </div>
      </Card>

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
