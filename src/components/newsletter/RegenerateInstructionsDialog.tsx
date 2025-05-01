
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RegenerateInstructionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  instructions: string;
  onInstructionsChange: (value: string) => void;
  onRegenerateWithInstructions: () => void;
  onRegenerateWithoutInstructions: () => void;
}

const RegenerateInstructionsDialog: React.FC<RegenerateInstructionsDialogProps> = ({
  isOpen,
  onClose,
  instructions,
  onInstructionsChange,
  onRegenerateWithInstructions,
  onRegenerateWithoutInstructions,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md glass-card">
        <DialogHeader>
          <DialogTitle>Regenerate Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="instructions">Custom Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              placeholder="Add specific instructions for this section, or leave blank for default generation"
              value={instructions}
              onChange={(e) => onInstructionsChange(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
        </div>
        <DialogFooter className="flex sm:justify-between flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={onRegenerateWithoutInstructions}
            className="w-full sm:w-auto"
          >
            No Instructions
          </Button>
          <Button 
            type="submit" 
            onClick={onRegenerateWithInstructions}
            className="w-full sm:w-auto"
          >
            Regenerate with Instructions
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RegenerateInstructionsDialog;
