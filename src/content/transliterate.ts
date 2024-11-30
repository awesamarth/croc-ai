import { transliterate } from '../utils/transliteration';

const originalTexts = new WeakMap<Element, string>();
const transliteratedElements = new WeakSet<Element>(); // Track elements that have been transliterated


export async function transliterateElement(element: Element, targetLanguage: string) {
  try {
    if (transliteratedElements.has(element) || !element.textContent?.trim()) return;
    
    if (element.tagName === 'SCRIPT' || 
        element.tagName === 'STYLE' || 
        element.closest('.croc-transliterated')) return;

    // Store original HTML
    const originalHtml = element.innerHTML;
    originalTexts.set(element, originalHtml);

    // Function to transliterate text while preserving HTML tags
    const transliterateWithTags = async (html: string) => {
      // Split content into text and tags
      const parts = html.split(/(<[^>]*>)/);
      const transliteratedParts = await Promise.all(
        parts.map(async (part) => {
          // If it's a tag, preserve it
          if (part.startsWith('<')) return part;
          // If it's text, transliterate it
          if (part.trim()) {
            const result = await transliterate(part, targetLanguage);
            return result.transliteratedText;
          }
          return part;
        })
      );
      return transliteratedParts.join('');
    };

    const transliteratedHtml = await transliterateWithTags(originalHtml);
    
    if (transliteratedHtml !== originalHtml) {
      element.innerHTML = transliteratedHtml;
      element.classList.add('croc-transliterated');
      transliteratedElements.add(element);

      const revertButton = document.createElement('button');
      revertButton.textContent = 'Show Original';
      revertButton.className = 'croc-revert-btn';
      
      let isShowingTransliterated = true;
      revertButton.onclick = () => {
        if (isShowingTransliterated) {
          element.innerHTML = originalHtml;
          element.classList.remove('croc-transliterated');
          revertButton.textContent = 'Show Transliteration';
        } else {
          element.innerHTML = transliteratedHtml;
          element.classList.add('croc-transliterated');
          revertButton.textContent = 'Show Original';
        }
        isShowingTransliterated = !isShowingTransliterated;
      };

      element.parentNode?.insertBefore(revertButton, element.nextSibling);
    }
  } catch (error) {
    console.error('Error translating element:', error);
  }
}

export async function autotransliteratePage(targetLanguage: string) {
  const selector = 'p, h1, h2, h3, h4, h5, h6, li, span:not(.croc-wrapper *), div:not(.croc-wrapper *)';
  const elements = document.querySelectorAll(selector);
  
  for (const element of elements) {
    if (!transliteratedElements.has(element) && 
        element.childNodes.length === 1 && 
        element.childNodes[0].nodeType === Node.TEXT_NODE) {
      await transliterateElement(element, targetLanguage);
    }
  }
}


export async function handleContextMenuTransliteration(selection: string, targetLanguage: string) {
  const range = window.getSelection()?.getRangeAt(0);
  if (!range) return;

  const activeElement = document.activeElement;
  
  // Check specifically for WhatsApp's Lexical editor
  const isWhatsAppInput = activeElement?.closest('.lexical-rich-text-input');
  
  if (isWhatsAppInput) {
    try {
      const result = await transliterate(selection, targetLanguage);
      
      // Find the actual contenteditable div
      const editor = isWhatsAppInput.querySelector('[contenteditable="true"]');
      if (!editor) return;

      // Use only execCommand for insertion
      document.execCommand('insertText', false, result.transliteratedText);
      
      // Focus back on editor
      //@ts-ignore
      editor.focus();
      
    } catch (error) {
      console.error('Error in transliteration:', error);
    }
} else 
{
    // Regular element handling remains the same
    const result = await transliterate(selection, targetLanguage);

    const transliteratedSpan = document.createElement('span');
    transliteratedSpan.textContent = result.transliteratedText;
    transliteratedSpan.className = 'croc-transliterated';

    const revertButton = document.createElement('button');
    revertButton.textContent = 'Show Original';
    revertButton.className = 'croc-revert-btn';
    
    let isShowingTransliterated = true;
    revertButton.onclick = () => {
      if (isShowingTransliterated) {
        transliteratedSpan.textContent = selection;
        revertButton.textContent = 'Show Transliteration';
      } else {
        transliteratedSpan.textContent = result.transliteratedText;
        revertButton.textContent = 'Show Original';
      }
      isShowingTransliterated = !isShowingTransliterated;
    };

    range.deleteContents();
    range.insertNode(transliteratedSpan);
    range.insertNode(revertButton);
    
    // Clear selection to remove highlight
    window.getSelection()?.removeAllRanges();
  }
}
export function initializeTransliterate() {
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
      font-size: 11px;
      padding: 2px 8px;
      margin-left: 6px;
      cursor: pointer;
      background-color: #4285f4;
      color: white;
      border: none;
      border-radius: 12px;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      vertical-align: middle;
      line-height: 20px;
      font-weight: 500;
      opacity: 0.9;
    }
  
    .croc-revert-btn:hover {
      background-color: #1a73e8;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      opacity: 1;
    }
  
    .croc-revert-btn:active {
      transform: scale(0.98);
    }
  `;
  document.head.appendChild(style);

  chrome.runtime.onMessage.addListener(async (message) => {
    if (message.type === 'transliterateSelection') {

      console.log("message received transliterate")
      await handleContextMenuTransliteration(message.text, message.transliterationTargetLanguage);
    }
  });

}