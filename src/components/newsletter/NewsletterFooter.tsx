
import React from "react";

const NewsletterFooter: React.FC = () => {
  return (
    <footer className="container mt-16">
      <div className="max-w-4xl mx-auto text-center text-sm text-brand-blue">
        <p>© 2025 NewsletterCraft. Powered by Agentify360.</p>
        <a href="https://www.agentify360.com" className="text-brand-blue hover:text-brand-skyblue mt-1 inline-block">
          www.agentify360.com
        </a>
      </div>
    </footer>
  );
};

export default NewsletterFooter;
