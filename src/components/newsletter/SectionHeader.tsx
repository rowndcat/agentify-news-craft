
import React from "react";
import { Button } from "@/components/ui/button";
import { Copy, RefreshCw, Expand } from "lucide-react";
import { Newspaper, BarChart2, Lightbulb } from "lucide-react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface SectionHeaderProps {
  title: string;
  icon: "news" | "markets" | "insights";
  isLoading: boolean;
  hasContent: boolean;
  onRegenerate: () => void;
  onCopy: () => void;
  onFullScreen: () => void;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon,
  isLoading,
  hasContent,
  onRegenerate,
  onCopy,
  onFullScreen,
}) => {
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

  return (
    <div className="section-header">
      <div className="flex items-center gap-2">
        {renderIcon()}
        <h2 className="text-lg font-semibold text-white">{title}</h2>
      </div>
      <div className="flex gap-2">
        <Button
          onClick={onFullScreen}
          variant="ghost"
          size="sm"
          disabled={!hasContent || isLoading}
          className="button-animation hover:bg-white/20 text-white"
          title="View fullscreen"
        >
          <Expand size={18} />
        </Button>
        <Button
          onClick={onCopy}
          variant="ghost"
          size="sm"
          disabled={!hasContent || isLoading}
          className="button-animation hover:bg-white/20 text-white"
          title="Copy content"
        >
          <Copy size={18} />
        </Button>
        <Button
          onClick={onRegenerate}
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
  );
};

export default SectionHeader;
