// src/content/highcontrast.ts

export function toggleHighContrast(enable: boolean) {
  if (enable) {
    const style = document.createElement('style');
    style.id = 'croc-high-contrast';
    style.textContent = `
      /* Base styles */
      :root {
        --high-contrast-bg: #000000;
        --high-contrast-text: #ffffff;
        --high-contrast-link: #40a9ff;
        --high-contrast-border: #ffffff;
      }

      /* Force text contrast */
      * {
        background-color: var(--high-contrast-bg) !important;
        color: var(--high-contrast-text) !important;
        border-color: var(--high-contrast-border) !important;
        text-shadow: none !important;
      }

      /* Handle text inside containers */
      [class*="text"],
      [class*="title"],
      [class*="heading"],
      [class*="label"],
      [class*="value"],
      [class*="amount"],
      [class*="price"],
      [class*="count"],
      [class*="number"] {
        color: var(--high-contrast-text) !important;
        background-color: var(--high-contrast-bg) !important;
      }

      /* Handle specific numeric displays */
      [class*="participants"],
      [class*="prize"],
      [class*="money"],
      [class*="currency"] {
        color: var(--high-contrast-text) !important;
      }

      /* Icons and SVGs */
      svg, svg * {
        fill: var(--high-contrast-text) !important;
        stroke: var(--high-contrast-text) !important;
      }

      /* Images */
      img {
        opacity: 0.9;
        filter: brightness(1.2) contrast(1.2);
      }

      /* Links */
      a, a:visited {
        color: var(--high-contrast-link) !important;
        text-decoration: underline !important;
        background-color: transparent !important;
      }

      a:hover, a:focus {
        color: var(--high-contrast-text) !important;
        background-color: var(--high-contrast-link) !important;
      }

      /* Ensure text remains visible during transition */
      * {
        transition: none !important;
      }

      /* Force visibility of specific containers */
      [class*="container"],
      [class*="wrapper"],
      [class*="content"] {
        background-color: var(--high-contrast-bg) !important;
      }

      /* Handle transparent backgrounds */
      [style*="background: transparent"],
      [style*="background-color: transparent"] {
        background-color: var(--high-contrast-bg) !important;
      }
    `;
    document.head.appendChild(style);

    // Add a class to the body
    document.body.classList.add('high-contrast-enabled');

  } else {
    // Remove high contrast styles
    const highContrastStyle = document.getElementById('croc-high-contrast');
    if (highContrastStyle) {
      highContrastStyle.remove();
    }
    document.body.classList.remove('high-contrast-enabled');
    
    // Clean up any inline styles
    document.body.style.removeProperty('background-color');
    document.body.style.removeProperty('color');
    document.documentElement.style.removeProperty('--page-background');
    document.documentElement.style.removeProperty('--text-color');
  }

}

export function initializeHighContrast() {
  // Check stored setting on page load
  chrome.storage.local.get('highContrastEnabled', ({ highContrastEnabled }) => {
    if (highContrastEnabled) {
      toggleHighContrast(true);
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