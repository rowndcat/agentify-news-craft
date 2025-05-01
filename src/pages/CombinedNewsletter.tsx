
import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { NewsletterSections } from "@/services/newsletterService";
import NewsletterHeader from "@/components/newsletter/NewsletterHeader";
import NewsletterContent from "@/components/newsletter/NewsletterContent";
import NewsletterFooter from "@/components/newsletter/NewsletterFooter";
import RegenerateDialog from "@/components/newsletter/RegenerateDialog";
import DocumentLinkDialog from "@/components/newsletter/DocumentLinkDialog";
import { formatMarkdown } from "@/components/newsletter/NewsletterContent";
import { stripHtml } from "@/utils/markdownUtils";

const CombinedNewsletter = () => {
  const [newsletter, setNewsletter] = useState<NewsletterSections>({
    news: "",
    markets: "",
    copilot: "",
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
  
  // New state for document link
  const [documentLink, setDocumentLink] = useState<string | null>(null);
  const [showDocumentDialog, setShowDocumentDialog] = useState(false);
  
  const [currentDate] = useState(() => {
    const date = new Date();
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

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
      } catch (error) {
        console.error("Error parsing newsletter data:", error);
        toast.error("Failed to load newsletter content");
      }
    }
  }, [chatId]);

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
      // Let's adapt to send a webhook message directly
      const messageEndpoint = "https://agentify360.app.n8n.cloud/webhook/dbcfd9ed-a84b-44db-a493-da8f368974f1/chat";
      
      // Prepare the message with different content based on section
      let messageContent = "";
      switch(section) {
        case 'news':
          messageContent = instructions 
            ? `regenerate AI news section with these instructions: ${instructions}` 
            : `create a new AI news section`;
          break;
        case 'markets':
          messageContent = instructions 
            ? `regenerate markets and economy section with these instructions: ${instructions}` 
            : `create a new markets and economy section`;
          break;
        case 'copilot':
          messageContent = instructions 
            ? `regenerate copilot insights section with these instructions: ${instructions}` 
            : `create a new copilot insights section`;
          break;
      }
      
      // Send the message to the webhook
      const response = await fetch(messageEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: messageContent,
          chatId: chatId,
          section: section
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to regenerate section: ${response.status}`);
      }

      const result = await response.json();
      
      if (result && result[section]) {
        // Update only the specific section
        setNewsletter(prev => ({
          ...prev,
          [section]: result[section]
        }));
        
        // Save to session storage
        const updatedNewsletter = {
          ...newsletter,
          [section]: result[section]
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

  const copyToClipboard = async () => {
    try {
      // Create a plain text version for copying
      let textContent = `# NEWSLETTER: ${currentDate}\n\n`;
      
      if (newsletter.news) {
        textContent += "## AI NEWS\n" + stripHtml(formatMarkdown(newsletter.news)) + "\n\n";
      }
      
      if (newsletter.markets) {
        textContent += "## MARKETS & ECONOMY\n" + stripHtml(formatMarkdown(newsletter.markets)) + "\n\n";
      }
      
      if (newsletter.copilot) {
        textContent += "## COPILOT INSIGHTS\n" + stripHtml(formatMarkdown(newsletter.copilot)) + "\n\n";
      }
      
      await navigator.clipboard.writeText(textContent);
      toast.success("Newsletter copied to clipboard!");
    } catch (error) {
      console.error("Failed to copy content:", error);
      toast.error("Failed to copy content to clipboard");
    }
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
        textContent += "## AI NEWS\n" + stripHtml(formatMarkdown(newsletter.news)) + "\n\n";
      }
      
      if (newsletter.markets) {
        textContent += "## MARKETS & ECONOMY\n" + stripHtml(formatMarkdown(newsletter.markets)) + "\n\n";
      }
      
      if (newsletter.copilot) {
        textContent += "## COPILOT INSIGHTS\n" + stripHtml(formatMarkdown(newsletter.copilot)) + "\n\n";
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
      
      if (result.documentLink) {
        setDocumentLink(result.documentLink);
        setShowDocumentDialog(true);
      }
      
      toast.success("Newsletter document created successfully!");
    } catch (error) {
      console.error("Error creating document:", error);
      toast.error("Failed to create newsletter document. Please try again.");
    } finally {
      setIsCreating(false);
    }
  };

  // Check if we have any content at all
  const hasAnyContent = Boolean(newsletter.news || newsletter.markets || newsletter.copilot);

  return (
    <div className="min-h-screen px-4 pb-12 bg-[#f5f1e9]">
      <NewsletterHeader 
        currentDate={currentDate}
        hasAnyContent={hasAnyContent}
        isCreating={isCreating}
        createDocument={createDocument}
        copyToClipboard={copyToClipboard}
      />

      <main className="container">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8 mb-8 bg-white shadow-lg">
            <div className="mb-6">
              <h1 className="text-3xl font-bold text-brand-blue">Combined Newsletter</h1>
              <p className="text-gray-500">{currentDate}</p>
            </div>

            <NewsletterContent 
              newsletter={newsletter}
              setNewsletter={setNewsletter}
              isRegenerating={isRegenerating}
              openRegenerateDialog={openRegenerateDialog}
            />
          </Card>
        </div>
      </main>

      {/* Regenerate Dialog */}
      <RegenerateDialog 
        isOpen={regenerateDialog.isOpen}
        section={regenerateDialog.section}
        instructions={regenerateDialog.instructions}
        setInstructions={(instructions) => 
          setRegenerateDialog(prev => ({ ...prev, instructions }))}
        onOpenChange={(open) => 
          setRegenerateDialog(prev => ({ ...prev, isOpen: open }))}
        onRegenerate={handleRegenerate}
      />

      {/* Document Link Dialog */}
      <DocumentLinkDialog 
        open={showDocumentDialog}
        documentLink={documentLink}
        onOpenChange={setShowDocumentDialog}
      />

      <NewsletterFooter />
    </div>
  );
};

export default CombinedNewsletter;
