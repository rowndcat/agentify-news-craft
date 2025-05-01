
import React from "react";
import { 
  Dialog, 
  DialogContent
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface FullscreenViewProps {
  isOpen: boolean;
  title: string;
  content: string;
  formattedContent: string;
  onClose: () => void;
}

const FullscreenView: React.FC<FullscreenViewProps> = ({
  isOpen,
  title,
  content,
  formattedContent,
  onClose
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-full w-full h-screen p-0 m-0 border-none bg-[#f5f1e9]">
        <div className="bg-[#001f47] p-4 text-white flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-semibold">{title} - Full Content</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            className="hover:bg-white/20"
            onClick={onClose}
          >
            <X size={18} />
          </Button>
        </div>
        <ScrollArea className="h-[calc(100vh-4rem)] p-6 md:p-8 lg:p-12 font-tiempos">
          <div className="max-w-4xl mx-auto">
            <div 
              className="newsletter-content text-lg" 
              dangerouslySetInnerHTML={{ __html: formattedContent }}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default FullscreenView;
