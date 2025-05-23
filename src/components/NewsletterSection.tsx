
import React, { useState, useEffect } from "react";
import { Copy, RefreshCw, BarChart2, Newspaper, Lightbulb, Expand, X, Image, Download, ExternalLink } from "lucide-react";
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

interface NewsletterSectionProps {
  title: string;
  content: string;
  isLoading: boolean;
  onRegenerate: (instructions?: string) => void;
  icon: "news" | "markets" | "insights";
  imageUrl?: string | null;
  isWebhookProcessing?: boolean;
  onGenerateImage?: () => void;
  isGeneratingImage?: boolean;
}

// Function to format markdown text to HTML
const formatMarkdown = (text: string): string => {
  if (!text) return "";
  
  console.log("Formatting markdown for text starting with:", text.substring(0, 50));
  
  // Pre-processing for special cases
  let formattedText = text;

  // Process News Section
  if (formattedText.includes("**News Section**") || 
      formattedText.includes("### **News Section**") ||
      formattedText.includes("**Title:") ||
      formattedText.includes("*AI News piece*:")) {
    
    // Make section header stand out
    formattedText = formattedText
      .replace(/\*\*News Section\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">News Section</h2>')
      .replace(/### \*\*News Section\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">News Section</h2>')
      .replace(/\*AI News piece\*:/g, '<strong class="block mb-2 text-brand-blue">AI News piece:</strong>');
      
    // Format title and TL;DR
    formattedText = formattedText
      .replace(/\*\*Title:(.*?)\*\*/g, '<h3 class="text-lg font-medium mb-2">$1</h3>')
      .replace(/TL;DR:/g, '<strong>TL;DR:</strong>');
      
    // Format bullet points and sections
    formattedText = formattedText
      .replace(/BULLET POINTS:/g, '<p class="font-semibold mt-3 mb-1">BULLET POINTS:</p>')
      .replace(/KEY TAKEAWAY:/g, '<p class="font-semibold mt-3 mb-1">KEY TAKEAWAY:</p>')
      .replace(/\*\*Why this matters\*\*:/g, '<p class="font-semibold mt-3 mb-1">Why this matters:</p>');
      
    // Format additional links section
    formattedText = formattedText
      .replace(/\*\*7 Additional News Links\*\*:/g, '<h4 class="text-base font-medium mt-4 mb-2">7 Additional News Links:</h4>')
      .replace(/\*\*Top article:\*\*/g, '<strong class="block mb-1">Top article:</strong>')
      .replace(/\*7 additional article links\*:/g, '<h4 class="text-base font-medium mt-4 mb-2">Additional Article Links:</h4>');
  }
  
  // For Markets section with emoji headers
  if (formattedText.includes("**Economy & Markets Section**") ||
      formattedText.includes("### **Economy & Markets Section**") ||
      formattedText.includes("🌍 Big Picture") || 
      formattedText.includes("📈 What to Watch") ||
      formattedText.includes("🔑 Key Takeaway")) {
      
    // Make section header stand out
    formattedText = formattedText
      .replace(/\*\*Economy & Markets Section\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">Economy & Markets Section</h2>')
      .replace(/### \*\*Economy & Markets Section\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">Economy & Markets Section</h2>');
      
    // Handle emoji headers
    formattedText = formattedText
      .replace(/###\s*🌍 Big Picture/g, '<h3 class="text-lg font-medium mb-2 mt-4">🌍 Big Picture</h3>')
      .replace(/###\s*📈 What to Watch/g, '<h3 class="text-lg font-medium mb-2 mt-4">📈 What to Watch</h3>')
      .replace(/###\s*🔑 Key Takeaway/g, '<h3 class="text-lg font-medium mb-2 mt-4">🔑 Key Takeaway</h3>')
      .replace(/🌍 Big Picture/g, '<h3 class="text-lg font-medium mb-2 mt-4">🌍 Big Picture</h3>')
      .replace(/📈 What to Watch/g, '<h3 class="text-lg font-medium mb-2 mt-4">📈 What to Watch</h3>')
      .replace(/🔑 Key Takeaway/g, '<h3 class="text-lg font-medium mb-2 mt-4">🔑 Key Takeaway</h3>');
  }
  
  // For Copilot section
  if (formattedText.includes("**Copilot**") || 
      formattedText.includes("**AI Copilot**") || 
      formattedText.includes("**Copilot Section**") ||
      formattedText.includes("### **Copilot Section**")) {
    // Make section header stand out
    formattedText = formattedText
      .replace(/\*\*Copilot\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">Copilot</h2>')
      .replace(/\*\*AI Copilot\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">AI Copilot</h2>')
      .replace(/\*\*Copilot Section\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">Copilot</h2>')
      .replace(/### \*\*Copilot Section\*\*/g, '<h2 class="text-xl font-semibold mb-3 mt-2 text-brand-blue">Copilot</h2>');
      
    // Format sections for Copilot
    formattedText = formattedText
      .replace(/\*\*Purpose:\*\*/g, '<p class="font-semibold mt-3 mb-1">Purpose:</p>')
      .replace(/\*\*Objective:\*\*/g, '<p class="font-semibold mt-3 mb-1">Objective:</p>')
      .replace(/\*\*SMB Relevance:\*\*/g, '<p class="font-semibold mt-3 mb-1">SMB Relevance:</p>')
      .replace(/\*\*Timeliness\/Context.*?\*\*/g, '<p class="font-semibold mt-3 mb-1">Timeliness/Context:</p>')
      .replace(/\*\*Core Functionality:\*\*/g, '<p class="font-semibold mt-3 mb-1">Core Functionality:</p>')
      .replace(/\*\*Copilot Actions:\*\*/g, '<p class="font-semibold mt-2 mb-1">Copilot Actions:</p>')
      .replace(/\*\*Key Capabilities to Leverage:\*\*/g, '<p class="font-semibold mt-3 mb-1">Key Capabilities:</p>')
      .replace(/\*\*Interaction Style:\*\*/g, '<p class="font-semibold mt-3 mb-1">Interaction Style:</p>')
      .replace(/\*\*Copilot Persona\/Tone:\*\*/g, '<p class="font-medium mt-2 mb-1">Copilot Persona/Tone:</p>')
      .replace(/\*\*Guidance Level:\*\*/g, '<p class="font-medium mt-2 mb-1">Guidance Level:</p>')
      .replace(/\*\*Typical User Inputs:\*\*/g, '<p class="font-semibold mt-3 mb-1">Typical User Inputs:</p>')
      .replace(/\*\*Information Required:\*\*/g, '<p class="font-medium mt-2 mb-1">Information Required:</p>')
      .replace(/\*\*Format of Input.*?\*\*/g, '<p class="font-medium mt-2 mb-1">Format of Input:</p>')
      .replace(/\*\*Expected Outputs:\*\*/g, '<p class="font-semibold mt-3 mb-1">Expected Outputs:</p>')
      .replace(/\*\*Deliverables:\*\*/g, '<p class="font-medium mt-2 mb-1">Deliverables:</p>')
      .replace(/\*\*Format\/Structure of Output:\*\*/g, '<p class="font-medium mt-2 mb-1">Format/Structure of Output:</p>')
      .replace(/\*\*Success Criteria:\*\*/g, '<p class="font-semibold mt-3 mb-1">Success Criteria:</p>')
      .replace(/\*\*TIME – Reclaim Your Hours\*\*/g, '<h3 class="text-lg font-medium mb-2 mt-4">TIME – Reclaim Your Hours</h3>')
      .replace(/\*\*ATTENTION – Amplify Your Voice\*\*/g, '<h3 class="text-lg font-medium mb-2 mt-4">ATTENTION – Amplify Your Voice</h3>')
      .replace(/\*\*PROFIT\/PROGRESS – Scale Your Impact\*\*/g, '<h3 class="text-lg font-medium mb-2 mt-4">PROFIT/PROGRESS – Scale Your Impact</h3>');
  }
  
  // Replace markdown headers (that haven't been processed already)
  formattedText = formattedText
    // Headers
    .replace(/### (.*?)\n/g, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="text-xl font-medium mb-3 mt-4">$1</h2>')
    .replace(/# (.*?)\n/g, '<h1 class="text-2xl font-medium mb-4 mt-5">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists - handle multiple formats
    .replace(/^\- (.*?)$/gm, '<li>$1</li>')
    .replace(/^- (.*?)$/gm, '<li>$1</li>')
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
  
  // Handle parenthetical references like (Reuters, Bloomberg)
  formattedText = formattedText.replace(/\((Reuters|Bloomberg|NYT|CNN|AP|Financial Times)(?:,\s*(Reuters|Bloomberg|NYT|CNN|AP|Financial Times))*\)/g, 
    '<span class="text-gray-500 text-sm">$&</span>');
    
  return formattedText;
};

const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title,
  content,
  isLoading,
  onRegenerate,
  icon,
  imageUrl = null,
  isWebhookProcessing = false,
  onGenerateImage,
  isGeneratingImage = false,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [instructions, setInstructions] = useState("");
  const [fullscreenView, setFullscreenView] = useState(false);

  // Add effect to log image URL changes
  useEffect(() => {
    if (imageUrl) {
      console.log(`${title} image URL updated:`, imageUrl);
    }
  }, [imageUrl, title]);

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

  // Add function to copy image URL to clipboard
  const copyImageUrl = async () => {
    if (!imageUrl) {
      toast.error(`No ${title} image URL available`);
      return;
    }

    try {
      await navigator.clipboard.writeText(imageUrl);
      toast.success(`${title} image URL copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy image URL:", error);
      toast.error("Failed to copy image URL to clipboard.");
    }
  };

  const handleRegenerateClick = () => {
    if (isLoading || isWebhookProcessing) return;
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

  // Function to handle image view
  const handleViewImage = () => {
    if (!imageUrl) {
      toast.error(`No ${title} image URL available yet`);
      return;
    }
    
    console.log(`Opening image URL: ${imageUrl}`);
    
    // Open the webView link in a new tab
    window.open(imageUrl, '_blank');
    
    toast.success(`${title} image URL opened in new tab!`);
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
  
  // Debug content
  console.log(`${title} content available:`, hasContent);
  if (hasContent) {
    console.log(`${title} content preview:`, content.substring(0, 100) + "...");
  }
  
  // Debug image URL
  console.log(`${title} image URL:`, imageUrl);

  return (
    <>
      <Card className="section-card animate-fade-in">
        <div className="section-header">
          <div className="flex items-center gap-2">
            {renderIcon()}
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            {isWebhookProcessing && !isLoading && (
              <div className="flex items-center gap-1 ml-2">
                <LoadingSpinner size="xs" />
                <span className="text-xs text-white/80">Processing...</span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setFullscreenView(true)}
              variant="ghost"
              size="sm"
              disabled={!hasContent || isLoading || isWebhookProcessing}
              className="button-animation hover:bg-white/20 text-white"
              title="View fullscreen"
            >
              <Expand size={18} />
            </Button>
            <Button
              onClick={copyToClipboard}
              variant="ghost"
              size="sm"
              disabled={!hasContent || isLoading || isWebhookProcessing}
              className="button-animation hover:bg-white/20 text-white"
              title="Copy content"
            >
              <Copy size={18} />
            </Button>
            <Button
              onClick={handleRegenerateClick}
              variant="ghost"
              size="sm"
              disabled={isLoading || isWebhookProcessing}
              className={`button-animation hover:bg-white/20 text-white ${(isLoading || isWebhookProcessing) ? 'animate-pulse-light' : ''}`}
              title={isWebhookProcessing ? "Waiting for webhook response..." : "Regenerate section"}
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <RefreshCw size={18} className={isWebhookProcessing ? "animate-spin opacity-50" : ""} />
              )}
            </Button>
          </div>
        </div>

        {/* Image URL section - Updated for better visibility and interaction */}
        <div className="px-6 pt-4">
          <div className="bg-gray-50 rounded-md border border-gray-200 p-3 mb-4">
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-1 text-sm font-medium text-gray-700">
                <Image size={16} />
                <span>Section Image URL</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Generate Image Button - only show when content is available and not already generating */}
                {hasContent && onGenerateImage && (
                  <Button
                    onClick={onGenerateImage}
                    variant="outline"
                    size="sm"
                    disabled={isGeneratingImage || isWebhookProcessing || Boolean(imageUrl)}
                    className="h-8 px-2 flex items-center gap-1 text-xs"
                  >
                    {isGeneratingImage ? (
                      <>
                        <LoadingSpinner size="xs" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Image size={16} />
                        <span>Generate</span>
                      </>
                    )}
                  </Button>
                )}
                {/* Copy URL Button - only enable when there's an image URL */}
                {imageUrl && (
                  <Button
                    onClick={copyImageUrl}
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                    title="Copy image URL to clipboard"
                  >
                    <Copy size={16} />
                    <span>Copy URL</span>
                  </Button>
                )}
                {/* View Image Button - only enable when there's an image URL */}
                <Button 
                  onClick={handleViewImage} 
                  variant="ghost" 
                  size="sm"
                  disabled={!imageUrl || isWebhookProcessing}
                  className={`h-8 px-2 flex items-center gap-1 text-xs ${imageUrl ? 'text-blue-600 hover:text-blue-800' : ''}`}
                  title="Open image URL in new tab"
                >
                  <ExternalLink size={16} />
                  <span>View</span>
                </Button>
              </div>
            </div>

            {/* Image URL display area - enhanced to make URLs more prominent */}
            <div className="min-h-[80px] bg-white rounded border border-gray-100 p-3 flex items-center justify-center overflow-hidden relative">
              {imageUrl ? (
                <div className="flex flex-col items-center justify-center w-full">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <ExternalLink size={18} strokeWidth={1.5} />
                    <span className="font-medium">Image URL Available</span>
                  </div>
                  <div className="max-w-full overflow-hidden px-4">
                    <a 
                      href={imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-blue-600 hover:underline text-sm block truncate max-w-[90%] mx-auto text-center"
                    >
                      {imageUrl}
                    </a>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 py-0"
                      onClick={handleViewImage}
                    >
                      Open in new tab
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs px-2 py-0"
                      onClick={copyImageUrl}
                    >
                      Copy URL
                    </Button>
                  </div>
                </div>
              ) : isGeneratingImage ? (
                <div className="text-gray-500 flex flex-col items-center">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs mt-2">Generating image URL...</span>
                  <span className="text-xs mt-1 text-gray-400">This may take a few moments</span>
                </div>
              ) : isWebhookProcessing ? (
                <div className="text-gray-500 flex flex-col items-center">
                  <LoadingSpinner size="sm" />
                  <span className="text-xs mt-1">Processing...</span>
                </div>
              ) : (
                <div className="text-gray-500 flex flex-col items-center">
                  <Image size={24} strokeWidth={1.5} className="text-gray-400" />
                  <span className="text-xs mt-1">No image URL available</span>
                  {hasContent && onGenerateImage && (
                    <span className="text-xs mt-1 text-blue-500">
                      Click "Generate" to create an image URL
                    </span>
                  )}
                </div>
              )}
            </div>
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
          ) : isWebhookProcessing && !hasContent ? (
            <div className="flex flex-col items-center justify-center h-full py-8">
              <LoadingSpinner size="md" />
              <p className="text-gray-600 mt-4 text-center">
                Waiting for webhook response...
                <br />
                <span className="text-sm text-gray-500 mt-1">This may take up to 30 seconds</span>
              </p>
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
              {imageUrl && (
                <div className="mb-8 text-center">
                  <a 
                    href={imageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block"
                  >
                    <Button className="bg-white/80 hover:bg-white text-gray-800 shadow-md">
                      <ExternalLink size={16} className="mr-2" />
                      Open Image URL
                    </Button>
                  </a>
                  <div className="mt-2 text-sm text-gray-600 break-all">
                    {imageUrl}
                  </div>
                </div>
              )}
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
