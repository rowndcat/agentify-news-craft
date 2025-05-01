
import React from "react";
import { Copy, RefreshCw, BarChart2, Newspaper, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import LoadingSpinner from "@/components/LoadingSpinner";

interface NewsletterSectionProps {
  title: string;
  content: string;
  isLoading: boolean;
  onRegenerate: () => void;
  icon: "news" | "markets" | "insights";
}

const NewsletterSection: React.FC<NewsletterSectionProps> = ({
  title,
  content,
  isLoading,
  onRegenerate,
  icon,
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

  const renderIcon = () => {
    switch (icon) {
      case "news":
        return <Newspaper className="h-5 w-5 text-primary" />;
      case "markets":
        return <BarChart2 className="h-5 w-5 text-primary" />;
      case "insights":
        return <Lightbulb className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  return (
    <Card className="section-card animate-fade-in">
      <div className="section-header">
        <div className="flex items-center gap-2">
          {renderIcon()}
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={copyToClipboard}
            variant="ghost"
            size="sm"
            disabled={!content || isLoading}
            className="button-animation hover:bg-primary/20"
            title="Copy content"
          >
            <Copy size={18} />
          </Button>
          <Button
            onClick={onRegenerate}
            variant="ghost"
            size="sm"
            disabled={isLoading}
            className={`button-animation hover:bg-primary/20 ${isLoading ? 'animate-pulse-light' : ''}`}
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
      <div className="section-content wave-animation">
        {isLoading ? (
          <div className="flex flex-col gap-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-5/6"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
            <div className="h-4 bg-muted rounded w-4/5"></div>
            <div className="h-4 bg-muted rounded w-3/5"></div>
          </div>
        ) : content ? (
          <div className="whitespace-pre-line">{content}</div>
        ) : (
          <div className="text-muted-foreground italic text-center py-8">
            <p>No content generated yet.</p>
            <p className="text-sm mt-2">Click the generate button above to create content.</p>
          </div>
        )}
      </div>
    </Card>
  );
};

export default NewsletterSection;
