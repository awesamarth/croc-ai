// Selectors for different sites' article content
const SELECTORS = {
    'medium.com': 'article',
    'nytimes.com': 'article[data-testid="block-stream"]',
    'theguardian.com': 'article',
    'hindustantimes.com': 'p',
    'indiatimes.com': '.normal_txt_content'
  }
  
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
        .filter(text => text && 
          !text.includes('READ MORE') && 
          !text.includes('Also Read') &&
          text.length > 50)  // filter out very short paragraphs that might be buttons/labels
        .join('\n')
      return paragraphs
    }
    const selector = getSelector(hostname)
    const article = document.querySelector(selector)
    
    if (!article) return ''
  
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
      
      .croc-summary-title {
        font-weight: bold;
        margin-bottom: 0.5rem;
      }
    `
    document.head.appendChild(style)
  }
  
  // Then modify the className assignments:

  
  // Create and inject the summary UI
  const createSummaryUI = () => {
    const article = document.querySelector(getSelector(window.location.hostname))
    if (!article) return
  
    // Create button container
    const buttonContainer = document.createElement('div')
    
    // Create summarize button
    const button = document.createElement('button')
    button.textContent = 'Summarize Article'
    
    buttonContainer.appendChild(button)
    document.body.appendChild(buttonContainer)
    buttonContainer.className = 'croc-button-container'
    button.className = 'croc-button'

    
    // Handle click
    button.addEventListener('click', async () => {
      try {
        button.disabled = true
        button.textContent = 'Summarizing...'
        
        const text = extractArticleText()
        const summarizer = await ai.summarizer.create()
        const summary = await summarizer.summarize(text)
        summarizer.destroy()
  
        // Create and inject summary
        const summaryContainer = document.createElement('div')
        summaryContainer.className = 'croc-summary-container'
        const summaryTitle = document.createElement('h2')
        summaryTitle.className = 'croc-summary-title'        
        summaryTitle.textContent = 'Summary'
        
        const summaryText = document.createElement('p')
        summaryText.textContent = summary
        
        summaryContainer.appendChild(summaryTitle)
        summaryContainer.appendChild(summaryText)
        
        // Insert at top of article
        article.insertBefore(summaryContainer, article.firstChild)
        
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
        injectStyles()
        createSummaryUI()
      })
    } else {
      injectStyles()
      createSummaryUI()
    }
  }