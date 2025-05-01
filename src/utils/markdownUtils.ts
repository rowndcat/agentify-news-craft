
// Helper function to strip HTML for plain text copying
export const stripHtml = (html: string): string => {
  const tempElement = document.createElement('div');
  tempElement.innerHTML = html;
  return tempElement.textContent || tempElement.innerText || html;
};

export const formatSectionName = (section: string): string => {
  return section.charAt(0).toUpperCase() + section.slice(1);
};
