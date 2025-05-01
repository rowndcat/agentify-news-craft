
import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import SectionHeader from "@/components/newsletter/SectionHeader";
import SectionContent from "@/components/newsletter/SectionContent";
import FullscreenView from "@/components/newsletter/FullscreenView";
import RegenerateInstructionsDialog from "@/components/newsletter/RegenerateInstructionsDialog";
import formatMarkdown from "@/components/newsletter/formatMarkdown";
import { stripHtml } from "@/utils/markdownUtils";

interface NewsletterSectionProps {
  title: string;
  content: string;
  isLoading: boolean;
  onRegenerate: (instructions?: string) => void;
  icon: "news" | "markets" | "insights";
}

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
      const formattedContent = formatMarkdown(content);
      const textContent = stripHtml(formattedContent);
      
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

  // Determine if there's actual content to display
  const hasContent = content && content.trim().length > 0;
  const formattedContent = formatMarkdown(content);

  return (
    <>
      <Card className="section-card animate-fade-in">
        <SectionHeader
          title={title}
          icon={icon}
          isLoading={isLoading}
          hasContent={hasContent}
          onRegenerate={handleRegenerateClick}
          onCopy={copyToClipboard}
          onFullScreen={() => setFullscreenView(true)}
        />
        <SectionContent
          content={content}
          isLoading={isLoading}
          hasContent={hasContent}
          formattedContent={formattedContent}
        />
      </Card>

      <FullscreenView
        isOpen={fullscreenView}
        title={title}
        content={content}
        formattedContent={formattedContent}
        onClose={() => setFullscreenView(false)}
      />

      <RegenerateInstructionsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        instructions={instructions}
        onInstructionsChange={setInstructions}
        onRegenerateWithInstructions={handleRegenerateSubmit}
        onRegenerateWithoutInstructions={handleRegenerateWithNoInstructions}
      />
    </>
  );
};

export default NewsletterSection;
