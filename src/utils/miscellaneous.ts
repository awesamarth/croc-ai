// src/utils/miscellaneous.ts

export async function reopenLastClosedTab(): Promise<boolean> {
  try {
    // Get all recently closed sessions
    const sessions = await chrome.sessions.getRecentlyClosed();

    // Check if there are any closed sessions
    if (sessions.length === 0) {
      return false;
    }

    // Get the last session (will automatically be most recently closed due to API behavior)
    const lastSession = sessions[0];

    // If it's a tab, restore it
    if (lastSession.tab) {
      await chrome.sessions.restore(lastSession.tab.sessionId);
      return true;
    }

    // If it's a window, restore it
    if (lastSession.window) {
      await chrome.sessions.restore(lastSession.window.sessionId);
      return true;
    }

    return false;

  } catch (error) {
    console.error('Error reopening last tab:', error);
    return false;
  }
}



export async function toggleBionicReading(enable: boolean): Promise<boolean> {
  try {
    console.log('Toggle called with:', enable);
    await chrome.storage.local.set({ bionicReadingEnabled: enable });

    const tabs = await chrome.tabs.query({});
    console.log('Found tabs:', tabs.length);

    await Promise.all(tabs.map(async (tab) => {
      if (tab.id && !tab.url?.startsWith('chrome://')) {
        console.log('Sending message to tab:', tab.id);
        try {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'toggleBionicReading',
            enable
          });
          console.log('Message sent successfully to tab:', tab.id);
        } catch (error) {
          console.error(`Error applying to tab ${tab.id}:`, error);
        }
      }
    }));

    return true;
  } catch (error) {
    console.error('Error toggling bionic reading:', error);
    return false;
  }
}