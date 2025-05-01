
import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, FilePlus } from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface NewsletterHeaderProps {
  currentDate: string;
  hasAnyContent: boolean;
  isCreating: boolean;
  createDocument: () => Promise<void>;
  copyToClipboard: () => Promise<void>;
}

const NewsletterHeader: React.FC<NewsletterHeaderProps> = ({
  currentDate,
  hasAnyContent,
  isCreating,
  createDocument,
  copyToClipboard
}) => {
  return (
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
  );
};

export default NewsletterHeader;
