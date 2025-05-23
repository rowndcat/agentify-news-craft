
import React from "react";

interface LoadingSpinnerProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = "md", 
  className = "" 
}) => {
  const sizeClasses = {
    xs: "h-3 w-3", // Added xs size
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin"></div>
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-primary/40 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s' }}></div>
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-r-transparent border-b-primary/20 border-l-transparent animate-spin" style={{ animationDuration: '2s' }}></div>
    </div>
  );
};

export default LoadingSpinner;
