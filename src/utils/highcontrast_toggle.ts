export async function toggleHighContrast(enable: boolean): Promise<boolean> {
    try {
      // Get all tabs
      const tabs = await chrome.tabs.query({});
  
      // Send message to all tabs except chrome:// urls
      await Promise.all(tabs.map(async (tab) => {
        if (tab.id && !tab.url?.startsWith('chrome://')) {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'toggleHighContrast',
            enable: enable
          });
        }
      }));
  
      // Update storage
      await chrome.storage.local.set({
        highContrastEnabled: enable
      });
  
      return true;
    } catch (error) {
      console.error('Error toggling high contrast:', error);
      return false;
    }
  }