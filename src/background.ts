chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "explainText",
    title: "Explain text",
    contexts: ["selection"]
  });
  chrome.contextMenus.create({
    id: "summarizeText",
    title: "Summarize text",
    contexts: ["selection"]
  });

  chrome.contextMenus.create({
    id: 'translateSelection',
    title: 'Translate selection',
    contexts: ['selection']
  });

  chrome.contextMenus.create({
    id: "readText",
    title: "Read text aloud",
    contexts: ["selection"]
  });
});

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'setAutoTranslate') {
    chrome.storage.local.set({
      autoTranslateEnabled: message.enabled,
      targetLanguage: message.targetLanguage
    });
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  console.log("Context menu clicked:", info.menuItemId);
  if (info.menuItemId === "explainText" && info.selectionText) {
    console.log("Selected text:", info.selectionText);

    // First, open the side panel
    //@ts-ignore
    await chrome.sidePanel.open({ windowId: tab.windowId });

    // Wait a small moment for the panel to open and initialize
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "explain",
        text: info.selectionText
      });
    }, 500); // 500ms delay to ensure panel is ready
  }

  else if (info.menuItemId === "summarizeText" && info.selectionText) {
    //@ts-ignore

    await chrome.sidePanel.open({ windowId: tab.windowId });
    setTimeout(() => {
      chrome.runtime.sendMessage({
        type: "summarize",
        text: info.selectionText
      });
    }, 500);
  }


  else if (info.menuItemId === 'translateSelection' && info.selectionText) {
    const { targetLanguage } = await chrome.storage.local.get('targetLanguage');
    //@ts-ignore
    chrome.tabs.sendMessage(tab.id!, {
      type: 'translateSelection',
      text: info.selectionText,
      targetLanguage
    });
  }

  else if (info.menuItemId === "readText" && info.selectionText && tab?.id) {
    // First ensure the content script is injected
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          // This just checks if the script is already injected
          return true;
        }
      });
      
      // Now send the message
      chrome.tabs.sendMessage(tab.id, {
        type: "readAloud",
        text: info.selectionText
      });
    } catch (error) {
      console.error('Error injecting content script:', error);
    }
  }
});

chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });