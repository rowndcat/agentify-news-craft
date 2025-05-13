
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { Suspense } from 'react';

// Add a Suspense component to handle any loading states
createRoot(document.getElementById("root")!).render(
  <Suspense fallback={
    <div className="flex h-screen w-full items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mx-auto"></div>
        <p className="mt-6 text-lg text-gray-600">Loading application...</p>
        <p className="mt-2 text-sm text-gray-500">This may take a moment as we connect to our AI services.</p>
      </div>
    </div>
  }>
    <App />
  </Suspense>
);
