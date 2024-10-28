interface Bookmark {
    id: string;
    title: string;
    url?: string;
    children?: Bookmark[];
  }
  
  async function getAllBookmarks(): Promise<Bookmark[]> {
    return new Promise((resolve) => {
      chrome.bookmarks.getTree((bookmarkTreeNodes) => {
        resolve(bookmarkTreeNodes);
      });
    });
  }
  
  // Flatten the bookmark tree into a list of bookmarks with URLs
  function flattenBookmarks(nodes: Bookmark[]): Bookmark[] {
    let bookmarks: Bookmark[] = [];
    
    for (const node of nodes) {
      if (node.url) {
        bookmarks.push(node);
      }
      if (node.children) {
        bookmarks = bookmarks.concat(flattenBookmarks(node.children));
      }
    }
    
    return bookmarks;
  }
  
  export async function searchBookmarksWithAI(query: string) {
    try {
      // Get all bookmarks first
      const bookmarkTree = await getAllBookmarks();
      const flatBookmarks = flattenBookmarks(bookmarkTree);
  
      // Create the bookmark list for AI to process
      const bookmarkList = flatBookmarks
        .map(b => `Title: ${b.title}\nURL: ${b.url}`)
        .join('\n\n');
  
      // Check if language model is available
      //@ts-ignore
      const capabilities = await ai.languageModel.capabilities();
      
      if (capabilities.available === "no") {
        throw new Error("Language model not available");
      }
      //@ts-ignore
      // Create a session with specific instructions
      const session = await ai.languageModel.create({
        systemPrompt: `You are a helpful assistant that finds relevant bookmarks based on user queries.
        You will be given a list of bookmarks with their titles and URLs, and a user query.
        Please identify the most relevant bookmarks that match the query.
        If no bookmarks match, say "No matching bookmarks found."
        If bookmarks are found, format your response as:
          <div class="matches">
          <div class="match"><a href="[URL]">[Title]</a> </div>
          <div class="match">........</div>
        etc.`
      });
  
      // Combine bookmarks and query for the AI
      const prompt = `Here are all the bookmarks:\n\n${bookmarkList}\n\nUser query: "${query}"\n\nPlease find relevant bookmarks:`;
      
      const response = await session.prompt(prompt);
      session.destroy();
  
      return response;
  
    } catch (error) {
      console.error('Error in AI bookmark search:', error);
      throw error;
    }
  }
  
  // Example usage:
  // const results = await searchBookmarksWithAI("cute panda videos");
  // This would return something like:
  // MATCHED BOOKMARKS:
  // 1. Baby Panda Playing - https://youtube.com/...
  // 2. Cute Zoo Animals Compilation - https://videos.com/...