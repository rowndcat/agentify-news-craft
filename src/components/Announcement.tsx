
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface AnnouncementProps {
  message: string;
  type?: "info" | "success" | "warning";
}

const Announcement: React.FC<AnnouncementProps> = ({
  message,
  type = "info",
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const typeStyles = {
    info: "bg-blue-50 border-blue-200 text-blue-800",
    success: "bg-green-50 border-green-200 text-green-800",
    warning: "bg-amber-50 border-amber-200 text-amber-800",
  };

  if (!isVisible) return null;

  return (
    <Card className={`mb-6 border rounded-lg ${typeStyles[type]} animate-fade-in`}>
      <div className="p-4 flex items-center justify-between">
        <p className="text-sm">{message}</p>
        <Button
          variant="ghost"
          size="sm"
          className="ml-4 text-current opacity-70 hover:opacity-100"
          onClick={() => setIsVisible(false)}
        >
          <ChevronDown size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default Announcement;
