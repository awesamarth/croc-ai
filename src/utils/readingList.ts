export async function addToReadingList(): Promise<string> {
    try {
      // Get the current active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id || !tab.url || !tab.title) {
        throw new Error('No valid active tab found');
      }
  
      // Add to reading list
      //@ts-ignore
      await chrome.readingList.addEntry({
        url: tab.url,
        title: tab.title,
        hasBeenRead: false
      });
      
      return 'Added to reading list';
    } catch (error) {
      console.error('Error adding to reading list:', error);
      //@ts-ignore
      console.log(error.message)
      return error instanceof Error? error.message=="Duplicate URL."?"Already added!":error.message:"Unknown error"
      
    }
  }