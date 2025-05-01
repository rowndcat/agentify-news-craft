
// Function to format markdown text to HTML
const formatMarkdown = (text: string): string => {
  if (!text) return "";
  
  // First, remove any headers that might be part of section titles
  // to avoid duplicate section headers in the UI
  let formattedText = text
    .replace(/^###?\s*(\*\*)?News Section(\*\*)?/i, "")
    .replace(/^###?\s*(\*\*)?Economy & Markets Section(\*\*)?/i, "")
    .replace(/^###?\s*(\*\*)?Copilot(\*\*)?/i, "")
    .replace(/^###?\s*(\*\*)?AI Copilot(\*\*)?/i, "");
  
  // Remove asterisks from title that might appear
  formattedText = formattedText
    .replace(/^\*\*News Section.*?\*\*/i, "")
    .replace(/^\*\*Economy & Markets Section.*?\*\*/i, "")
    .replace(/^\*\*Copilot.*?\*\*/i, "")
    .replace(/^\*\*AI Copilot.*?\*\*/i, "");
    
  // Replace markdown headers
  formattedText = formattedText
    // Headers
    .replace(/### (.*?)\n/g, '<h3 class="text-lg font-medium mb-2 mt-4">$1</h3>')
    .replace(/## (.*?)\n/g, '<h2 class="text-xl font-medium mb-3 mt-4">$2</h2>')
    .replace(/# (.*?)\n/g, '<h1 class="text-2xl font-medium mb-4 mt-5">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Bullet lists - handle multiple formats
    .replace(/^\- (.*?)$/gm, '<li>$1</li>')
    .replace(/^\• (.*?)$/gm, '<li>$1</li>')
    // Numbered lists
    .replace(/^\d+\. (.*?)$/gm, '<li>$1</li>')
    // Links - using a neutral dark color instead of sky blue
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" class="text-brand-dark hover:underline" target="_blank" rel="noopener noreferrer">$1</a>')
    // Paragraphs (add space after)
    .replace(/\n\n/g, '</p><p class="mb-3">')
    // Line breaks
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph if not already wrapped
  if (!formattedText.startsWith('<h') && !formattedText.startsWith('<p')) {
    formattedText = `<p class="mb-3">${formattedText}</p>`;
  }
  
  // Fix list items by wrapping them in ul tags
  if (formattedText.includes('<li>')) {
    let tempHtml = formattedText;
    const listItemPattern = /(<li>.*?<\/li>)+/g;
    const matches = tempHtml.match(listItemPattern);
    
    if (matches) {
      matches.forEach(match => {
        // Replace consecutive list items with a properly wrapped ul
        tempHtml = tempHtml.replace(match, `<ul class="list-disc pl-5 mb-4 mt-2">${match}</ul>`);
      });
      formattedText = tempHtml;
    }
  }
  
  // Clean up any empty paragraphs and dangling tags
  formattedText = formattedText
    .replace(/<p><\/p>/g, '')
    .replace(/<p><br \/><\/p>/g, '');
    
  // Clean up any markdown dividers
  formattedText = formattedText.replace(/---/g, '<hr class="my-4" />');
    
  return formattedText;
};

export default formatMarkdown;
