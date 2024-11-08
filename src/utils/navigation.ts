export async function handleNavigation(userPrompt: string): Promise<boolean> {
    try {
      //@ts-ignore
      const capabilities = await ai.languageModel.capabilities();
      
      if (capabilities.available === "no") {
        throw new Error("Language model not available");
      }
  
      //@ts-ignore
      const session = await ai.languageModel.create({
        systemPrompt: `You are a browser navigation assistant. Your ONLY job is to understand where the user wants to go and return ONLY a URL.
  
        For Chrome pages, return URLs in this format:
        chrome://PAGENAME
        (e.g., chrome://settings, chrome://bookmarks, chrome://history, chrome://downloads, chrome://extensions)
  
        For YouTube searches, return URLs in this format:
        https://www.youtube.com/results?search_query=SEARCH_TERMS_HERE
        remember that youtube searches will ALWAYS be search queries. output ONLY search_query links. Else 5 marks will be deducted.
  
        For websites:
        - Return clean URLs (include https://)
        - Add .com if no TLD specified
        - Only return the URL, nothing else
  
        If you can't understand the navigation request or it's invalid, return exactly: INVALID
  
        Examples:
        User: "open settings"
        Assistant: chrome://settings
  
        User: "i want to watch videos about cats"
        Assistant: https://www.youtube.com/results?search_query=cats
  
        User: "take me to twitter"
        Assistant: https://twitter.com`
      });
  
      const response = await session.prompt(userPrompt);
      session.destroy();
  
      const cleanResponse = response.trim();
      
      if (cleanResponse === 'INVALID') {
        return false;
      }
  
      await chrome.tabs.create({ url: cleanResponse });
      return true;
  
    } catch (error) {
      console.error('Navigation error:', error);
      return false;
    }
  }