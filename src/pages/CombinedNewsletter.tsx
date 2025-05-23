import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowRight, Copy, Pencil, Check, FilePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NewsletterSections, regenerateSection } from "@/services/newsletterService";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";

// Function to format markdown text to HTML (copied from NewsletterSection for consistency)
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

const CombinedNewsletter = () => {
  const [newsletter, setNewsletter] = useState<NewsletterSections>({
    news: "",
    markets: "",
    copilot: "",
  });
  
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
    news: "",
    markets: "",
    copilot: "",
  });
  
  const [currentDate] = useState(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // State for regeneration loading
  const [isRegenerating, setIsRegenerating] = useState<{
    news: boolean;
    markets: boolean;
    copilot: boolean;
  }>({
    news: false,
    markets: false,
    copilot: false,
  });

  // State for regenerate instructions dialog
  const [regenerateDialog, setRegenerateDialog] = useState<{
    isOpen: boolean;
    section: 'news' | 'markets' | 'copilot' | null;
    instructions: string;
  }>({
    isOpen: false,
    section: null,
    instructions: '',
  });

  // State for chat ID
  const [chatId] = useState(() => {
    // Generate a random chat ID if none exists
    return localStorage.getItem('chatId') || `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  });

  // State for document creation
  const [isCreating, setIsCreating] = useState(false);
  
  // State for document link
  const [documentLink, setDocumentLink] = useState<string | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);

  useEffect(() => {
    // Store the chat ID in localStorage for persistence
    if (!localStorage.getItem('chatId')) {
      localStorage.setItem('chatId', chatId);
    }
    
    const storedNewsletter = sessionStorage.getItem('combinedNewsletter');
    
    if (storedNewsletter) {
      try {
        const parsed = JSON.parse(storedNewsletter);
        setNewsletter(parsed);
        setEditableContent(parsed); // Initialize editable content with the same values
      } catch (error) {
        console.error("Error parsing newsletter data:", error);
        toast.error("Failed to load newsletter content");
      }
    }
  }, [chatId]);

  const copyToClipboard = async () => {
    try {
      // Create a plain text version for copying
      let textContent = `# NEWSLETTER: ${currentDate}\n\n`;
      
      if (newsletter.news) {
        textContent += "## AI NEWS\n" + stripHtml(newsletter.news) + "\n\n";
      }
      
      if (newsletter.markets) {
        textContent += "## MARKETS & ECONOMY\n" + stripHtml(newsletter.markets) + "\n\n";
      }
      
      if (newsletter.copilot) {
        textContent += "## COPILOT INSIGHTS\n" + stripHtml(newsletter.copilot) + "\n\n";
      }
      
      await navigator.clipboard.writeText(textContent);
      toast.success("Newsletter copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy content:", error);
      toast.error("Failed to copy content to clipboard");
    }
  };

  // Helper function to strip HTML for plain text copying
  const stripHtml = (html: string) => {
    const tempElement = document.createElement('div');
    tempElement.innerHTML = formatMarkdown(html);
    return tempElement.textContent || tempElement.innerText || html;
  };

  // Function to extract URL from text that contains markdown links
  const extractLinkFromResponse = (text: string): string | null => {
    // Look for markdown link pattern [title](url)
    const markdownLinkRegex = /\[.*?\]\((.*?)\)/;
    const markdownMatch = text.match(markdownLinkRegex);
    
    if (markdownMatch && markdownMatch[1]) {
      return markdownMatch[1];
    }
    
    // If no markdown link, look for a regular URL
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urlMatch = text.match(urlRegex);
    
    return urlMatch ? urlMatch[0] : null;
  };

  // Function to handle document creation
  const createDocument = async () => {
    setIsCreating(true);
    
    try {
      // Default title based on date
      const title = `NewsletterCraft - ${currentDate}`;
      
      // Create a plain text version of the newsletter content
      let textContent = `# ${title}\n\n`;
      textContent += `Date: ${currentDate}\n\n`;
      
      if (newsletter.news) {
        textContent += "## AI NEWS\n" + stripHtml(newsletter.news) + "\n\n";
      }
      
      if (newsletter.markets) {
        textContent += "## MARKETS & ECONOMY\n" + stripHtml(newsletter.markets) + "\n\n";
      }
      
      if (newsletter.copilot) {
        textContent += "## COPILOT INSIGHTS\n" + stripHtml(newsletter.copilot) + "\n\n";
      }

      // Send to webhook as a message
      const response = await fetch("https://agentify360.app.n8n.cloud/webhook/dbcfd9ed-a84b-44db-a493-da8f368974f1/chat", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: "create newsletter document",
          chatId: chatId,
          title: title,
          content: textContent,
          date: currentDate,
          sections: {
            news: newsletter.news || "",
            markets: newsletter.markets || "",
            copilot: newsletter.copilot || ""
          }
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to create document: ${response.status}`);
      }

      const result = await response.json();
      console.log("Document created:", result);
      
      // Check for documentLink in result
      if (result) {
        let link = null;
        
        // Check various possible locations for the link
        if (result.documentLink) {
          // Direct property
          link = result.documentLink;
        } else if (result.output) {
          // Embedded in output text
          link = extractLinkFromResponse(result.output);
        } else if (result.content) {
          // Embedded in content
          link = extractLinkFromResponse(result.content);
        } else if (typeof result === 'string') {
          // Directly in result as string
          link = extractLinkFromResponse(result);
        }
        
        if (link) {
          // Set document link and show dialog
          setDocumentLink(link);
          setShowDocumentDialog(true);
          toast.success("Newsletter document created successfully!");
        } else {
          // Handle case where link extraction failed
          console.error("Document created but couldn't extract link from response:", result);
          toast.error("Document created but link extraction failed. Please check the console logs.");
        }
      } else {
        // Handle case where result is missing
        console.error("Document created but response is empty:", result);
        toast.error("Document created but response is missing. Please check your console logs.");
      }
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create newsletter document. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Functions for editing
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

  // New function to open regenerate dialog
  const openRegenerateDialog = (section: 'news' | 'markets' | 'copilot') => {
    setRegenerateDialog({
      isOpen: true,
      section,
      instructions: '',
    });
  };

  // Function to handle regeneration
  const handleRegenerate = async (instructions?: string) => {
    const section = regenerateDialog.section;
    
    if (!section) return;
    
    setRegenerateDialog(prev => ({ ...prev, isOpen: false }));
    
    setIsRegenerating(prev => ({
      ...prev,
      [section]: true
    }));
    
    try {
      const regeneratedContent = await regenerateSection(
        section,
        chatId,
        instructions
      );
      
      if (regeneratedContent) {
        // Update only the specific section
        setNewsletter(prev => ({
          ...prev,
          [section]: regeneratedContent
        }));
        
        // Update editable content as well
        setEditableContent(prev => ({
          ...prev,
          [section]: regeneratedContent
        }));
        
        // Save to session storage
        const updatedNewsletter = {
          ...newsletter,
          [section]: regeneratedContent
        };
        
        sessionStorage.setItem('combinedNewsletter', JSON.stringify(updatedNewsletter));
        
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} section regenerated successfully!`);
      }
    } catch (error) {
      console.error(`Error regenerating ${section}:`, error);
      toast.error(`Failed to regenerate ${section}. Please try again.`);
    } finally {
      setIsRegenerating(prev => ({
        ...prev,
        [section]: false
      }));
    }
  };

  // Check if we have any content at all
  const hasAnyContent = Boolean(newsletter.news || newsletter.markets || newsletter.copilot);

  return (
    <div className="min-h-screen px-4 pb-12 bg-[#f5f1e9]">
      <header className="container pt-8 pb-8">
        <div className="flex justify-between items-center max-w-4xl mx-auto">
          <Link 
            to="/"
            className="flex items-center gap-2 text-brand-blue hover:text-brand-skyblue transition-colors"
          >
            <ArrowRight className="h-5 w-5 rotate-180" />
            <span>Back to Editor</span>
          </Link>
          
          <div className="flex gap-2">
            <Button
              onClick={createDocument}
              className="bg-brand-blue hover:bg-opacity-90"
              disabled={!hasAnyContent || isCreating}
            >
              <FilePlus className="h-4 w-4 mr-2" />
              {isCreating ? "Creating..." : "Create Document"}
            </Button>
            <Button
              onClick={copyToClipboard}
              className="bg-brand-blue hover:bg-opacity-90"
              disabled={!hasAnyContent}
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy All Content
            </Button>
          </div>
        </div>
      </header>

      <main className="container">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-8 bg-white shadow-lg">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-brand-blue">Combined Newsletter</h1>
              <p className="text-gray-500">{currentDate}</p>
            </div>

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
          </Card>
        </div>
      </main>

      {/* Regenerate Dialog */}
      <Dialog open={regenerateDialog.isOpen} onOpenChange={(open) => setRegenerateDialog(prev => ({ ...prev, isOpen: open }))}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              Regenerate {regenerateDialog.section === 'news' ? 'AI News' : 
                         regenerateDialog.section === 'markets' ? 'Markets & Economy' : 
                         'Copilot Insights'}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="space-y-2">
              <Textarea
                placeholder="Add specific instructions for regeneration (optional)"
                value={regenerateDialog.instructions}
                onChange={(e) => setRegenerateDialog(prev => ({ ...prev, instructions: e.target.value }))}
                className="min-h-[120px]"
              />
            </div>
          </div>
          <DialogFooter className="flex sm:justify-between flex-col sm:flex-row gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleRegenerate()}
              className="w-full sm:w-auto"
            >
              Regenerate (No Instructions)
            </Button>
            <Button 
              onClick={() => handleRegenerate(regenerateDialog.instructions)}
              className="w-full sm:w-auto bg-brand-blue hover:bg-opacity-90"
            >
              Regenerate with Instructions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Link Dialog */}
      <Dialog open={showDocumentDialog} onOpenChange={setShowDocumentDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Newsletter Document Created</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="mb-4">Your newsletter document has been created successfully!</p>
            {documentLink ? (
              <div className="flex flex-col gap-4">
                <p>You can access it at:</p>
                <a 
                  href={documentLink}
                  target="_blank"
                  rel="noopener noreferrer" 
                  className="text-brand-blue hover:underline break-all"
                >
                  {documentLink}
                </a>
                <Button 
                  onClick={() => {
                    navigator.clipboard.writeText(documentLink);
                    toast.success("Link copied to clipboard!");
                  }}
                  className="bg-brand-blue hover:bg-opacity-90"
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Link
                </Button>
              </div>
            ) : (
              <p className="text-amber-600">No document link was received. Please try again or check the console for details.</p>
            )}
          </div>
          <DialogFooter>
            <Button 
              onClick={() => setShowDocumentDialog(false)}
              className="bg-brand-blue hover:bg-opacity-90"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

export default CombinedNewsletter;
