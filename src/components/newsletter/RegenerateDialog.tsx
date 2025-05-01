
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RegenerateDialogProps {
  isOpen: boolean;
  section: 'news' | 'markets' | 'copilot' | null;
  instructions: string;
  setInstructions: (instructions: string) => void;
  onOpenChange: (open: boolean) => void;
  onRegenerate: (instructions?: string) => void;
}

const RegenerateDialog: React.FC<RegenerateDialogProps> = ({
  isOpen,
  section,
  instructions,
  setInstructions,
  onOpenChange,
  onRegenerate
}) => {
  const getSectionTitle = () => {
    return section === 'news' ? 'AI News' : 
           section === 'markets' ? 'Markets & Economy' : 
           'Copilot Insights';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Regenerate {section && getSectionTitle()}
          </DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <div className="space-y-2">
            <Textarea
              placeholder="Add specific instructions for regeneration (optional)"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onRegenerate()}
            className="w-full sm:w-auto"
          >
            Regenerate (No Instructions)
          </Button>
          <Button 
            onClick={() => onRegenerate(instructions)}
            className="w-full sm:w-auto bg-brand-blue hover:bg-opacity-90"
          >
            Regenerate with Instructions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateDialog;
