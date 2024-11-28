// src/content/highcontrast.ts

export function toggleHighContrast(enable: boolean) {
  if (enable) {
    document.documentElement.style.setProperty('--page-background', '#1a1a1a');
    document.documentElement.style.setProperty('--text-color', '#ffffff');
    document.documentElement.style.filter = 'contrast(150%)';
    document.body.style.backgroundColor = 'var(--page-background)';
    document.body.style.color = 'var(--text-color)';
  } else {
    document.documentElement.style.removeProperty('--page-background');
    document.documentElement.style.removeProperty('--text-color');
    document.documentElement.style.filter = '';
    document.body.style.backgroundColor = '';
    document.body.style.color = '';
  }
}

export function initializeHighContrast() {
  // Check stored setting on page load
  chrome.storage.local.get('highContrastEnabled', ({ highContrastEnabled }) => {
    if (highContrastEnabled) {
      toggleHighContrast(false);  // Initialize with false
    }
  });

  // Listen for toggle commands from the extension
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === 'toggleHighContrast') {
      toggleHighContrast(message.enable);
      sendResponse({ success: true });
    }
    return true;
  });
}