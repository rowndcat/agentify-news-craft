
import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, AlertCircle, Info, CheckCircle } from "lucide-react";

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
    info: "bg-blue-900/30 border-blue-600/30 text-blue-100",
    success: "bg-green-900/30 border-green-600/30 text-green-100",
    warning: "bg-amber-900/30 border-amber-600/30 text-amber-100",
  };

  const icons = {
    info: <Info size={18} className="text-primary flex-shrink-0" />,
    success: <CheckCircle size={18} className="text-green-400 flex-shrink-0" />,
    warning: <AlertCircle size={18} className="text-amber-400 flex-shrink-0" />,
  };

  if (!isVisible) return null;

  return (
    <Card className={`mb-6 border rounded-xl ${typeStyles[type]} animate-fade-in glass-card`}>
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icons[type]}
          <p className="text-sm">{message}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="ml-4 text-current opacity-70 hover:opacity-100 hover:bg-white/10"
          onClick={() => setIsVisible(false)}
        >
          <ChevronDown size={16} />
        </Button>
      </div>
    </Card>
  );
};

export default Announcement;
