
export const asList = (content: any): string[] => {
  if (!content) return [];
  if (Array.isArray(content)) return content;
  const textStr = String(content);
  return textStr.split(/\n|•|- /).map(s => s.trim()).filter(s => s.length > 0);
};

export const getLines = asList;

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy: ', err);
    return false;
  }
};

export const formatDate = (dateStr?: string) => {
  if (!dateStr) return new Date().toLocaleDateString('no-NO');
  return dateStr;
};

export const generateUUID = () => crypto.randomUUID();
