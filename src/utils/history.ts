interface HistoryItem {
  id: string;
  title?: string;
  url: string;
}
export type HistoryClearOption = 'last24h' | 'allTime';


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
      systemPrompt: `You are a browser history search assistant. You will see a numbered list of browser history titles.
      Return indices of relevant matches based on the following criteria:
    
      1. Direct word matches (eg: "hackathon" matches "HackOff", "Hackathon 2024")
      2. Related terms (eg: "coding" matches "programming", "developer")
      3. Partial matches (eg: "git" matches "GitHub", "GitLab")
      4. Common variations (eg: "ai" matches "artificial intelligence", "ML")
    
      RULES:
      - Return 0-3 most relevant matches only
      - Use ONLY numbers from the given list
      - Order by relevance
      - Consider substrings (eg: "hack" matches "hackathon")
      - If no matches are found, return only: "No matching history items found."
      
      Format:
      <div class="matches">
      <div class="match">[NUMBER]</div>
      </div>
    
      Examples:
      Input: "1. GitHub Issues
      2. HackOff Registration
      3. Gmail"
      
      Query: "hackathon"
      Output: <div class="matches"><div class="match">2</div></div>
    
      Query: "email"
      Output: <div class="matches"><div class="match">3</div></div>
    
      Query: "python"
      Output: No matching history items found.

      If no matches are found, return only: "No matching history items found."
      
      Now find matches for the user's query in the given list.`
    });
    const prompt = `Find relevant items matching: "${query}"\nList:\n${historyList}`;

    console.log("given prompt is: ")
    console.log(prompt)

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



export async function clearHistory(option: HistoryClearOption): Promise<string> {
  try {
    const now = Date.now();
    const startTime = option === 'last24h'
      ? now - (24 * 60 * 60 * 1000) // 24 hours ago
      : 0; // Beginning of time for 'allTime'

    return new Promise((resolve) => {
      chrome.history.deleteRange({
        startTime,
        endTime: now
      }, () => {
        if (chrome.runtime.lastError) {
          resolve(`Error clearing history: ${chrome.runtime.lastError.message}`);
        } else {
          const message = option === 'last24h'
            ? 'Successfully cleared last 24 hours of history'
            : 'Successfully cleared all browsing history';
          resolve(message);
        }
      });
    });
  } catch (error) {
    console.error('Error clearing history:', error);
    return `Error clearing history: ${error instanceof Error ? error.message : 'Unknown error'}`;
  }
}