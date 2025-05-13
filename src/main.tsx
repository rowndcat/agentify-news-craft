
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Suspense } from 'react';

// Add a Suspense component to handle any loading states
createRoot(document.getElementById("root")!).render(
  <Suspense fallback={<div className="flex h-screen w-full items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading application...</p>
    </div>
  </div>}>
    <App />
  </Suspense>
);
