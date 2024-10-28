chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });

chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: "explainText",
      title: "Explain text",
      contexts: ["selection"]
    });
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
  });
  
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });