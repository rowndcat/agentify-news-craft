
import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SectionContentProps {
  content: string;
  isLoading: boolean;
  hasContent: boolean;
  formattedContent: string;
}

const SectionContent: React.FC<SectionContentProps> = ({
  content,
  isLoading,
  hasContent,
  formattedContent
}) => {
  return (
    <ScrollArea className="section-content font-tiempos h-[300px]">
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
          className="newsletter-content font-tiempos text-gray-800 pr-4" 
          dangerouslySetInnerHTML={{ __html: formattedContent }}
        />
      ) : (
        <div className="text-muted-foreground italic text-center py-8">
          <p>No content generated yet.</p>
          <p className="text-sm mt-2">Click the generate button above to create content.</p>
        </div>
      )}
    </ScrollArea>
  );
};

export default SectionContent;
