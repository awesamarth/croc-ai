// src/content/bionicreading.ts

interface BionicWord {
  bold: string;
  rest: string;
}

function bionicifyWord(word: string): BionicWord {
  const length = word.length;
  let boldLength: number;

  if (length <= 3) boldLength = 1;
  else if (length <= 6) boldLength = 2;
  else if (length <= 9) boldLength = 3;
  else boldLength = 4;

  return {
    bold: word.slice(0, boldLength),
    rest: word.slice(boldLength)
  };
}

function processTextNode(node: Text) {
  const words = node.textContent!.split(/(\s+)/);
  const span = document.createElement('span');

  words.forEach(word => {
    if (word.trim()) {
      const { bold, rest } = bionicifyWord(word);
      const boldSpan = document.createElement('span');
      boldSpan.className = 'bionic-bold';
      boldSpan.textContent = bold;
      span.appendChild(boldSpan);
      span.appendChild(document.createTextNode(rest));
    } else {
      span.appendChild(document.createTextNode(word));
    }
  });

  node.parentNode!.replaceChild(span, node);
}
function handlePDFViewer() {
  // First, we need to wait for the PDF to fully render
  const observer = new MutationObserver((_mutations, obs) => {
    const pdfContainer = document.querySelector('.pdf-viewer');
    if (!pdfContainer) return;

    // Look for text layers
    const textLayers = document.querySelectorAll('.textLayer');
    if (textLayers.length > 0) {
      textLayers.forEach(layer => {
        // Process each text span in the PDF
        const spans = layer.querySelectorAll('span');
        spans.forEach(span => {
          if (span.textContent?.trim()) {
            const { bold, rest } = bionicifyWord(span.textContent);
            span.innerHTML = `<strong>${bold}</strong>${rest}`;
          }
        });
      });

      // Optional: Disconnect observer after processing
      obs.disconnect();
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function injectPDFStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .textLayer {
      opacity: 1 !important;
    }
    .textLayer strong {
      color: inherit !important;
      font-weight: 700 !important;
    }
  `;
  document.head.appendChild(style);
}
function walkTextNodes(element: Node) {

  if (document.body.classList.contains('pdf-viewer')) {
    handlePDFViewer();
    return;
  }

  // Skip if element is an input, textarea, or other form elements
  if (
    element.nodeType === Node.ELEMENT_NODE && 
    (
      (element as Element).tagName === 'INPUT' ||
      (element as Element).tagName === 'TEXTAREA' ||
      (element as Element).tagName === 'SELECT' ||
      (element as Element).tagName === 'OPTION'
    )
  ) {
    return;
  }

  if (element.nodeType === Node.TEXT_NODE && element.textContent!.trim()) {
    processTextNode(element as Text);
    return;
  }

  const children = Array.from(element.childNodes);
  children.forEach(child => {
    // Skip script tags, style tags, and already processed nodes
    if (
      child.nodeType === Node.ELEMENT_NODE &&
      (
        (child as Element).tagName === 'SCRIPT' ||
        (child as Element).tagName === 'STYLE' ||
        (child as Element).classList.contains('bionic-bold')
      )
    ) {
      return;
    }
    walkTextNodes(child);
  });
}
function applyBionicReading() {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@400;700&display=swap');
    
    /* More specific selectors, excluding UI elements */
    article, 
    p, 
    div:not([class*="icon"]):not([class*="logo"]):not([class*="button"]):not([class*="menu"]):not([class*="nav"]) {
      font-family: 'Lexend', sans-serif !important;
    }
    .bionic-bold { 
      font-weight: 700 !important; 
    }
  `;
  document.head.appendChild(style);
  walkTextNodes(document.body);
}

function revertBionicReading() {
  // Remove the style
  const styles = document.querySelectorAll('style');
  styles.forEach(style => {
    if (style.textContent?.includes('bionic-bold') || style.textContent?.includes('Lexend')) {
      style.remove();
    }
  });
  
  // Fix the text reversion
  document.querySelectorAll('.bionic-bold').forEach(element => {
    // Get the parent span that contains both bold and normal text
    const parentSpan = element.parentElement;
    if (parentSpan) {
      // Get the original text (combining bold and non-bold parts)
      const originalText = parentSpan.textContent || '';
      // Create a text node with the original text
      const textNode = document.createTextNode(originalText);
      // Replace the parent span with the text node
      parentSpan.parentNode?.replaceChild(textNode, parentSpan);
    }
  });
}


export function toggleBionicReading(enable: boolean) {
  console.log('Toggle received in content script:', enable);
  
  // Add PDF-specific check
  const isPDF = document.body.classList.contains('pdf-viewer');
  if (isPDF) {
    if (enable) {
      injectPDFStyles();
      handlePDFViewer();
    } else {
      // Reload the PDF viewer to reset it
      location.reload();
    }
    return;
  }

  // Regular webpage handling
  if (enable) {
    console.log('Applying bionic reading');
    applyBionicReading();  // Changed this line from walkTextNodes()
  } else {
    console.log('Removing bionic reading');
    revertBionicReading();
  }
}
export function initializeBionicReading() {
  chrome.storage.local.get('bionicReadingEnabled', ({ bionicReadingEnabled }) => {
    if (bionicReadingEnabled) {
      toggleBionicReading(true);
    }
  });

  // Add listener here
  chrome.runtime.onMessage.addListener((message, _, sendResponse) => {
    if (message.type === 'toggleBionicReading') {
      toggleBionicReading(message.enable);
      sendResponse({ success: true });
    }
    return true;
  });
}