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

export  async function adjustFontSize(increase: boolean): Promise<boolean> {
  try {
    // Get current default font size
    const { pixelSize } = await chrome.fontSettings.getDefaultFontSize();
    
    // Calculate new size (increase/decrease by 2 pixels)
    const newSize = increase ? pixelSize + 1 : pixelSize - 1;
    
    // Clamp between 6 and 72 pixels (Chrome's limits)
    const clampedSize = Math.min(Math.max(newSize, 6), 72);
    
    // Set the new default font size
    await chrome.fontSettings.setDefaultFontSize({ pixelSize: clampedSize });
    
    return true;
  } catch (error) {
    console.error('Error adjusting font size:', error);
    return false;
  }
}

export async function resetFontSize(): Promise<boolean> {
  try {
    // Chrome's default is typically 16px
    await chrome.fontSettings.setDefaultFontSize({ pixelSize: 16 });
    return true;
  } catch (error) {
    console.error('Error resetting font size:', error);
    return false;
  }
}

