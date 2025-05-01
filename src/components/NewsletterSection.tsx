
import React from "react";
import { Copy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface NewsletterSectionProps {
  title: string;
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
}

const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title,
  content,
  isLoading,
  onRegenerate,
}) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success(`${title} content copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy content:", error);
      toast.error("Failed to copy content to clipboard.");
    }
  };

  return (
    <Card className="section-card animate-fade-in">
      <div className="section-header">
        <h2 className="text-lg font-semibold">{title}</h2>
        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="icon"
            disabled={!content || isLoading}
            className="button-animation"
          >
            <Copy size={18} />
          </Button>
          <Button
            onClick={onRegenerate}
            variant="ghost"
            size="icon"
            disabled={isLoading}
            className={`button-animation ${isLoading ? 'animate-pulse-light' : ''}`}
          >
            <RefreshCw size={18} className={isLoading ? 'animate-spin' : ''} />
          </Button>
        </div>
      </div>
      <div className="section-content">
        {isLoading ? (
          <div className="flex flex-col gap-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
          </div>
        ) : content ? (
          <div className="whitespace-pre-line">{content}</div>
        ) : (
          <div className="text-muted-foreground italic">No content generated yet.</div>
        )}
      </div>
    </Card>
  );
};

export default NewsletterSection;
