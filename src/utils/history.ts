interface HistoryItem {
    id: string;
    title?: string;
    url: string;
  }
  
  async function getRecentHistory(): Promise<HistoryItem[]> {
    return new Promise((resolve) => {
      chrome.history.search({
        text: '',
        maxResults: 20,
        startTime: 0
      }, (historyItems) => {
        //@ts-ignore
        resolve(historyItems);
      });
    });
  }
  
  export async function searchHistoryWithAI(query: string) {
    try {
      const historyItems = await getRecentHistory();
      console.log("Full history items:", historyItems);
      
      // Create a simple map of index to actual history item for later
      const historyMap = new Map(historyItems.map((item, index) => [index + 1, item]));

      
      // Only send titles and indices to the model
      const historyList = historyItems
      .map((item, index) => `${index + 1}. ${item.title || 'Untitled'}`)
      .join('\n');
      console.log(historyList)
  
      //@ts-ignore
      const session = await ai.languageModel.create({
        systemPrompt: `IMPORTANT: You MUST ONLY respond in English.
        You will see a numbered list of browser history titles.
        When matching items, use ONLY their numbers in your response.
        Format your response as:
        <div class="matches">
        <div class="match">[NUMBER]</div>
        <div class="match">....</div>
        </div>
        
        If no matches found, respond EXACTLY:
        "No matching history items found."
        `
      });
  
      const prompt = `Find relevant items from this list matching: "${query}"\nList:\n${historyList}`;
      
      const response = await session.prompt(prompt);

      console.log("response is: ")
      console.log(response)
      
      // Parse the response to extract numbers and create final formatted output
      const matches = response.match(/<div class="match">(\d+)<\/div>/g);
      console.log(matches)
      if (matches) {
        console.log("yes matches are there")
        //@ts-ignore
        const formattedMatches = matches.map(match => {
          const number = match.match(/\d+/)?.[0];
          if (number) {
            const item = historyMap.get(parseInt(number));
            if (item) {
              return `<div class="match"><a href="${item.url}">${item.title || 'Untitled'}</a></div>`;
            }
          }
          return '';
        }).filter(Boolean);
  
        return `<div class="matches">${formattedMatches.join('\n')}</div>`;
      }



  
      session.destroy();
      return response;
  
    } catch (error) {
      console.error('Detailed history search error:', error);
      return "Error searching history. Please try again.";
    }
  }