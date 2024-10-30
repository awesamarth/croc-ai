import { detectAndTranslate } from '../utils/translation';

const originalTexts = new WeakMap<Element, string>();
const translatedElements = new WeakSet<Element>(); // Track elements that have been translated


export async function translateElement(element: Element, targetLanguage: string) {
  try {
    if (translatedElements.has(element) || !element.textContent?.trim()) return;
    
    if (element.tagName === 'SCRIPT' || 
        element.tagName === 'STYLE' || 
        element.closest('.croc-translated')) return;

    // Store original HTML
    const originalHtml = element.innerHTML;
    originalTexts.set(element, originalHtml);

    // Function to translate text while preserving HTML tags
    const translateWithTags = async (html: string) => {
      // Split content into text and tags
      const parts = html.split(/(<[^>]*>)/);
      const translatedParts = await Promise.all(
        parts.map(async (part) => {
          // If it's a tag, preserve it
          if (part.startsWith('<')) return part;
          // If it's text, translate it
          if (part.trim()) {
            const result = await detectAndTranslate(part, targetLanguage);
            return result.sourceLanguage !== targetLanguage && result.confidence >= 0.4
              ? result.translatedText
              : part;
          }
          return part;
        })
      );
      return translatedParts.join('');
    };

    const translatedHtml = await translateWithTags(originalHtml);
    
    if (translatedHtml !== originalHtml) {
      element.innerHTML = translatedHtml;
      element.classList.add('croc-translated');
      translatedElements.add(element);

      const revertButton = document.createElement('button');
      revertButton.textContent = 'Show Original';
      revertButton.className = 'croc-revert-btn';
      
      revertButton.onclick = () => {
        if (element.classList.contains('croc-translated')) {
          element.innerHTML = originalHtml;
          element.classList.remove('croc-translated');
          revertButton.textContent = 'Show Translation';
        } else {
          element.innerHTML = translatedHtml;
          element.classList.add('croc-translated');
          revertButton.textContent = 'Show Original';
        }
      };

      element.parentNode?.insertBefore(revertButton, element.nextSibling);
    }
  } catch (error) {
    console.error('Error translating element:', error);
  }
}

export async function autoTranslatePage(targetLanguage: string) {
  const selector = 'p, h1, h2, h3, h4, h5, h6, li, span:not(.croc-wrapper *), div:not(.croc-wrapper *)';
  const elements = document.querySelectorAll(selector);
  
  for (const element of elements) {
    if (!translatedElements.has(element) && 
        element.childNodes.length === 1 && 
        element.childNodes[0].nodeType === Node.TEXT_NODE) {
      await translateElement(element, targetLanguage);
    }
  }
}


export async function handleContextMenuTranslation(selection: string, targetLanguage: string) {
  const range = window.getSelection()?.getRangeAt(0);
  if (!range) return;

  const result = await detectAndTranslate(selection, targetLanguage);

  const translatedSpan = document.createElement('span');
  translatedSpan.textContent = result.translatedText;
  translatedSpan.className = 'croc-translated';

  originalTexts.set(translatedSpan, selection);

  const revertButton = document.createElement('button');
  revertButton.textContent = 'Show Original';
  revertButton.className = 'croc-revert-btn';
  revertButton.onclick = () => {
    translatedSpan.textContent = selection;
    revertButton.textContent = 'Show Translation';
    revertButton.onclick = () => {
      translatedSpan.textContent = result.translatedText;
      revertButton.textContent = 'Show Original';
    };
  };

  range.deleteContents();
  range.insertNode(revertButton);
  range.insertNode(translatedSpan);
}

export function initializeTranslate() {
  const style = document.createElement('style');
style.textContent = `
  .croc-wrapper {
    display: inline;
    margin: 0;
    padding: 0;
  }
  .croc-translated {
    display: inline;
    margin: 0;
    padding: 0;
  }
  .croc-revert-btn {
    font-size: 12px;
    padding: 2px 6px;
    background: #f0f0f0;
    border: 1px solid #ccc;
    border-radius: 3px;
    margin-left: 4px;
    cursor: pointer;
    vertical-align: middle;
  }
`;
  document.head.appendChild(style);

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'translateSelection') {
      await handleContextMenuTranslation(message.text, message.targetLanguage);
    }
  });

  chrome.storage.local.get(['autoTranslateEnabled', 'targetLanguage']).then((result) => {
    if (result.autoTranslateEnabled) {
      autoTranslatePage(result.targetLanguage);
    }
  });
}