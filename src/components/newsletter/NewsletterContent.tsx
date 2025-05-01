
import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Check, Pencil, ArrowRight } from "lucide-react";
import { NewsletterSections } from "@/services/newsletterService";
import { toast } from "sonner";

// Function to format markdown text to HTML (copied from NewsletterSection for consistency)
export const formatMarkdown = (text: string): string => {
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

interface NewsletterContentProps {
  newsletter: NewsletterSections;
  setNewsletter: React.Dispatch<React.SetStateAction<NewsletterSections>>;
  isRegenerating: {
    news: boolean;
    markets: boolean;
    copilot: boolean;
  };
  openRegenerateDialog: (section: 'news' | 'markets' | 'copilot') => void;
}

const NewsletterContent: React.FC<NewsletterContentProps> = ({
  newsletter,
  setNewsletter,
  isRegenerating,
  openRegenerateDialog
}) => {
  const [editMode, setEditMode] = useState<{
    news: boolean;
    markets: boolean;
    copilot: boolean;
  }>({
    news: false,
    markets: false,
    copilot: false,
  });
  
  const [editableContent, setEditableContent] = useState<NewsletterSections>({
    news: newsletter.news,
    markets: newsletter.markets,
    copilot: newsletter.copilot,
  });

  const toggleEditMode = (section: keyof NewsletterSections) => {
    setEditMode(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleTextChange = (section: keyof NewsletterSections, value: string) => {
    setEditableContent(prev => ({
      ...prev,
      [section]: value
    }));
  };

  const saveChanges = (section: keyof NewsletterSections) => {
    setNewsletter(prev => ({
      ...prev,
      [section]: editableContent[section]
    }));
    
    // Save to session storage
    const updatedNewsletter = {
      ...newsletter,
      [section]: editableContent[section]
    };
    
    sessionStorage.setItem('combinedNewsletter', JSON.stringify(updatedNewsletter));
    
    toggleEditMode(section);
    toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section updated!`);
  };

  // Check if we have any content at all
  const hasAnyContent = Boolean(newsletter.news || newsletter.markets || newsletter.copilot);

  return (
    <ScrollArea className="h-[60vh] pr-4">
      <div className="newsletter-full font-tiempos">
        {/* News Section */}
        {newsletter.news && (
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold mb-4 text-brand-blue border-b pb-2">AI News</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openRegenerateDialog('news')}
                  disabled={isRegenerating.news}
                  className="flex items-center gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  {isRegenerating.news ? (
                    <span>Regenerating...</span>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      <span>Regenerate</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleEditMode('news')}
                  className="flex items-center gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  {editMode.news ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {editMode.news ? (
              <div className="mt-2">
                <Textarea 
                  value={editableContent.news}
                  onChange={(e) => handleTextChange('news', e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => saveChanges('news')}
                    className="bg-brand-blue hover:bg-opacity-90"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="newsletter-content" 
                dangerouslySetInnerHTML={{ __html: formatMarkdown(newsletter.news) }}
              />
            )}
          </div>
        )}
        
        {/* Markets Section */}
        {newsletter.markets && (
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold mb-4 text-brand-blue border-b pb-2">Markets & Economy</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openRegenerateDialog('markets')}
                  disabled={isRegenerating.markets}
                  className="flex items-center gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  {isRegenerating.markets ? (
                    <span>Regenerating...</span>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      <span>Regenerate</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleEditMode('markets')}
                  className="flex items-center gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  {editMode.markets ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {editMode.markets ? (
              <div className="mt-2">
                <Textarea 
                  value={editableContent.markets}
                  onChange={(e) => handleTextChange('markets', e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => saveChanges('markets')}
                    className="bg-brand-blue hover:bg-opacity-90"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="newsletter-content" 
                dangerouslySetInnerHTML={{ __html: formatMarkdown(newsletter.markets) }}
              />
            )}
          </div>
        )}
        
        {/* Copilot Section */}
        {newsletter.copilot && (
          <div className="mb-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold mb-4 text-brand-blue border-b pb-2">Copilot Insights</h2>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openRegenerateDialog('copilot')}
                  disabled={isRegenerating.copilot}
                  className="flex items-center gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  {isRegenerating.copilot ? (
                    <span>Regenerating...</span>
                  ) : (
                    <>
                      <ArrowRight className="h-4 w-4 rotate-180" />
                      <span>Regenerate</span>
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => toggleEditMode('copilot')}
                  className="flex items-center gap-2 border-brand-blue text-brand-blue hover:bg-brand-blue hover:text-white"
                >
                  {editMode.copilot ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span>Save</span>
                    </>
                  ) : (
                    <>
                      <Pencil className="h-4 w-4" />
                      <span>Edit</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
            
            {editMode.copilot ? (
              <div className="mt-2">
                <Textarea 
                  value={editableContent.copilot}
                  onChange={(e) => handleTextChange('copilot', e.target.value)}
                  className="min-h-[200px] font-mono text-sm"
                />
                <div className="flex justify-end mt-2">
                  <Button 
                    size="sm" 
                    onClick={() => saveChanges('copilot')}
                    className="bg-brand-blue hover:bg-opacity-90"
                  >
                    Save Changes
                  </Button>
                </div>
              </div>
            ) : (
              <div 
                className="newsletter-content" 
                dangerouslySetInnerHTML={{ __html: formatMarkdown(newsletter.copilot) }}
              />
            )}
          </div>
        )}
        
        {!hasAnyContent && (
          <div className="text-center py-16">
            <p className="text-gray-500">No newsletter content is available.</p>
            <p className="text-gray-500 mt-2">
              Return to the editor to generate content first.
            </p>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};

export default NewsletterContent;
