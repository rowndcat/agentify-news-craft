
import { createRoot } from 'react-dom/client'
import { useState, useEffect } from 'react'
import App from './App.tsx'
import './index.css'

// Simple loading component
const LoadingApp = () => {
  const [dots, setDots] = useState('.');
  
  // Animate the loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-indigo-600 mb-4">NewsletterCraft</h1>
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mr-3"></div>
            <p className="text-xl text-gray-700">
              Loading{dots}
            </p>
          </div>
          <p className="mt-4 text-gray-600">
            Please wait while we initialize the application...
          </p>
        </div>
      </div>
    </div>
  );
};

// Render the loading screen first, then the app
const root = createRoot(document.getElementById("root")!);
root.render(<LoadingApp />);

// Simulate waiting for resources/data to load
setTimeout(() => {
  root.render(<App />);
}, 1000);
