
import React from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

interface DocumentLinkDialogProps {
  open: boolean;
  documentLink: string | null;
  onOpenChange: (open: boolean) => void;
}

const DocumentLinkDialog: React.FC<DocumentLinkDialogProps> = ({
  open,
  documentLink,
  onOpenChange
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Newsletter Document Created</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">Your newsletter document has been created successfully!</p>
          {documentLink && (
            <div className="flex flex-col gap-4">
              <p>You can access it at:</p>
              <a 
                href={documentLink}
                target="_blank"
                rel="noopener noreferrer" 
                className="text-brand-blue hover:underline break-all"
              >
                {documentLink}
              </a>
              <Button 
                onClick={() => {
                  navigator.clipboard.writeText(documentLink);
                  toast.success("Link copied to clipboard!");
                }}
                className="bg-brand-blue hover:bg-opacity-90"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Link
              </Button>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            onClick={() => onOpenChange(false)}
            className="bg-brand-blue hover:bg-opacity-90"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentLinkDialog;
