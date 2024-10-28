// Selectors for different sites' article content
const SELECTORS = {
  'medium.com': 'article',
  'nytimes.com': 'article[data-testid="block-stream"]',
  'theguardian.com': 'article',
  'hindustantimes.com': 'p',
  'timesofindia.indiatimes.com': 'div[data-articlebody="1"].js_tbl_article'  // More specific selector

}

console.log('Content script loaded for:', window.location.href);
const waitForElement = (selector: string, maxWait = 5000): Promise<Element | null> => {
  return new Promise((resolve) => {
    if (document.querySelector(selector)) {
      return resolve(document.querySelector(selector));
    }

    const observer = new MutationObserver(() => {
      if (document.querySelector(selector)) {
        observer.disconnect();
        resolve(document.querySelector(selector));
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Timeout after maxWait milliseconds
    setTimeout(() => {
      observer.disconnect();
      resolve(document.querySelector(selector));
    }, maxWait);
  });
};

// Get the appropriate selector for current site
const getSelector = (hostname: string): string => {
  for (const [domain, selector] of Object.entries(SELECTORS)) {
    if (hostname.includes(domain)) return selector
  }
  return 'article'  // fallback
}

// Extract article text based on site
const extractArticleText = (): string => {
  const hostname = window.location.hostname

  // Special handling for Hindustan Times
  if (hostname.includes('hindustantimes.com')) {
    console.log("hindustan times detected")
    // Get all paragraphs, filter out unwanted ones
    const paragraphs = Array.from(document.querySelectorAll('p'))
      .map(p => p.textContent?.trim())
      .join('\n')

    console.log("paragraphs are")
    console.log(paragraphs)
    return paragraphs
  }

  const selector = getSelector(hostname)
  console.log("selector for this site is: ", selector)
  const article = document.querySelector(selector)
  console.log("article is: ", article)

  if (!article) return ''

  if (hostname.includes('timesofindia.indiatimes.com')) {
    // Get the text content and split it by <br> tags
    const text = article.textContent?.trim() || ''
    return text
  }

  // Get all paragraphs, filter out empty ones, join with newlines
  const paragraphs = Array.from(article.querySelectorAll('p'))
    .map(p => p.textContent?.trim())
    .filter(text => text)
    .join('\n')

  return paragraphs
}

// Create and inject styles
const injectStyles = () => {
  const style = document.createElement('style')
  style.textContent = `
      .croc-button-container {
        position: fixed;
        bottom: 1rem;
        right: 1rem;
        z-index: 9999;
      }
      
      .croc-button {
        background-color: #3b82f6;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
        border: none;
      }
      
      .croc-button:hover {
        background-color: #2563eb;
      }
      
      .croc-button:disabled {
        background-color: #9ca3af;
        cursor: not-allowed;
      }
      
      .croc-summary-container {
        background-color: #f3f4f6;
        padding: 1rem;
        border-radius: 0.25rem;
        margin: 1rem 0;
      }

      .croc-summary-text {  /* Add this new class */
        font-size: 18px;
        line-height: 1.5;
      }
      
      .croc-summary-title {
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
    `
  document.head.appendChild(style)
}

// Then modify the className assignments:


// Create and inject the summary UI
const createSummaryUI = async() => {
  console.log("Hostname:", window.location.hostname);
  const selector = getSelector(window.location.hostname);
  console.log("Using selector:", selector);
  
  // Wait for the element
  const article = await waitForElement(selector);
  console.log("Found article:", article);

  if (!article) {
    console.log("Article element not found after waiting");
    return;
  }

  // Create button container
  const buttonContainer = document.createElement('div')

  // Create summarize button
  const button = document.createElement('button')
  button.textContent = 'Summarize Article'

  buttonContainer.appendChild(button)
  document.body.appendChild(buttonContainer)
  buttonContainer.className = 'croc-button-container'
  button.className = 'croc-button'

  // Add this function to handle basic Markdown conversion
  const convertMarkdownToHtml = (markdown: string): string => {
    return markdown
      // Convert **bold** to <strong>
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert *italic* to <em>
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Convert bullet points
      .replace(/^\* (.*)$/gm, '<li>$1</li>')
      // Wrap lists in <ul>
      .replace(/(<li>.*<\/li>)\n/g, '<ul>$1</ul>')
  }

  // Handle click
  // In the click handler where you create the summary:
  // In the click handler where you create the summary:
  button.addEventListener('click', async () => {
    try {
      button.disabled = true
      button.textContent = 'Summarizing...'

      const text = extractArticleText()
      console.log('here is the text')
      console.log(text)
      const summarizer = await ai.summarizer.create()
      const summary = await summarizer.summarize(text)
      summarizer.destroy()

      // Create and inject summary
      const summaryContainer = document.createElement('div')
      summaryContainer.className = 'croc-summary-container'
      const summaryTitle = document.createElement('h2')
      summaryTitle.className = 'croc-summary-title'
      summaryTitle.textContent = 'Summary'


      // Then in your click handler, modify the summary insertion:
      const summaryText = document.createElement('div') // Change to div instead of p
      summaryText.innerHTML = convertMarkdownToHtml(summary) // Use innerHTML instead of textContent
      summaryText.className = 'croc-summary-text'


      summaryContainer.appendChild(summaryTitle)
      summaryContainer.appendChild(summaryText)

      // Find the first h1 and insert after it
      const firstH1 = document.querySelector('h1')
      if (firstH1) {
        firstH1.parentNode?.insertBefore(summaryContainer, firstH1.nextSibling)
      } else {
        // Fallback - just append to body if no h1 found
        document.body.appendChild(summaryContainer)
      }

      // Reset button
      button.disabled = false
      button.textContent = 'Summarize Article'
    } catch (error) {
      console.error('Summarization failed:', error)
      button.textContent = 'Error - Try Again'
      button.disabled = false
    }
  })
}

export const initializeSummarize = () => {
  // Wait for page to be fully loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      console.log("content has been loaded completely")
      injectStyles()
      createSummaryUI()
    })
  } else {
    injectStyles()
    createSummaryUI()
  }
}