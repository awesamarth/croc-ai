interface Tab {
    id?: number;
    title?: string;
    url?: string;
  }
  
  async function getAllTabs(): Promise<Tab[]> {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        resolve(tabs);
      });
    });
  }
  
  export async function searchTabsWithAI(query: string) {
    try {
      // Get all tabs first
      const tabs = await getAllTabs();
  
      // Create the tab list for AI to process, now including tab IDs
      const tabList = tabs
        .map(t => `Tab ID: ${t.id}\nTitle: ${t.title}\nURL: ${t.url}`)
        .join('\n\n');
  
      // Check if language model is available
      //@ts-ignore
      const capabilities = await ai.languageModel.capabilities();
      
      if (capabilities.available === "no") {
        throw new Error("Language model not available");
      }
  
      //@ts-ignore
      const session = await ai.languageModel.create({
        systemPrompt: `You are a helpful assistant that finds relevant browser tabs based on user queries.
        You will be given a list of open tabs with their tab IDs, titles and URLs, and a user query.
        Please identify the most relevant tabs that match the query.
        If no tabs match, say "No matching tabs found."
        If tabs are found, you MUST format your response EXACTLY as follows, including the tab ID from the input:
          <div class="matches">
          <div class="match"><a href="#" data-tab-id="[TAB_ID]">[Title]</a></div>
          </div>
        Make sure to use the exact Tab ID provided in the input for each tab in the data-tab-id attribute.
        The href should always be "#" since we'll handle navigation via the tab ID.`
      });
  
      const prompt = `Here are all the open tabs:\n\n${tabList}\n\nUser query: "${query}"\n\nPlease find relevant tabs:`;
      
      const response = await session.prompt(prompt);
      session.destroy();
  
      return response;
  
    } catch (error) {
      console.error('Error in AI tab search:', error);
      throw error;
    }
  }