import { createAudioControls } from '../utils/tts';


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
      
      .croc-summary-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
      }

      .croc-speaker-button {
        background: none;
        border: none;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .croc-speaker-button:hover {
        background-color: rgba(0, 0, 0, 0.1);
      }

      .croc-audio-controls {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: white;
        border-top: 1px solid #ddd;
        padding: 1rem;
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .croc-speed-controls {
        display: flex;
        gap: 8px;
      }

      .croc-speed-button {
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid #ddd;
        cursor: pointer;
      }

      .croc-speed-button.active {
        background-color: #3b82f6;
        color: white;
        border-color: #3b82f6;
      }

      .croc-audio-controls button {
    cursor: pointer;
    padding: 4px 8px;
    border-radius: 4px;
    border: 1px solid #ddd;
  }
    `
  document.head.appendChild(style)
}

// Then modify the className assignments:


// Create and inject the summary UI
const createSummaryUI = async () => {
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

      const summaryHeader = document.createElement('div')
      summaryHeader.className = 'croc-summary-header'

      const summaryTitle = document.createElement('h2')
      summaryTitle.className = 'croc-summary-title'
      summaryTitle.textContent = 'Summary'

      const speakerButton = document.createElement('button')
      speakerButton.className = 'croc-speaker-button'
      speakerButton.innerHTML = `<span>speak</span>`
      speakerButton.setAttribute('aria-label', 'Read summary aloud')

      summaryHeader.appendChild(summaryTitle)
      summaryHeader.appendChild(speakerButton)

      const summaryText = document.createElement('div')
      summaryText.innerHTML = convertMarkdownToHtml(summary)
      summaryText.className = 'croc-summary-text'

      summaryContainer.appendChild(summaryHeader)
      summaryContainer.appendChild(summaryText)

      // Add click handler for speaker button

      speakerButton.addEventListener('click', () => {
        const textToSpeak = summaryText.textContent || '';
        if (!textToSpeak.trim()) {
          console.error("No text to speak");
          return;
        }
        createAudioControls(textToSpeak);
      });
      // Insert the summary container after the first h1
      const firstH1 = document.querySelector('h1')
      if (firstH1) {
        firstH1.parentNode?.insertBefore(summaryContainer, firstH1.nextSibling)
      } else {
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

// Add this at the bottom of summarize.ts, near initializeSummarize
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'readAloud' && message.text) {
    console.log("pohocha")
    const textToSpeak = message.text;
    
    // Remove any existing audio controls
    const existingControls = document.querySelector('.croc-audio-controls');
    if (existingControls) {
      existingControls.remove();
    }

    // Create audio controls
    const audioControls = document.createElement('div');
    audioControls.className = 'croc-audio-controls';

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1; // Set default speed
    let currentSpeed = 1;
    let isPlaying = true;

    // Start speaking immediately
    speechSynthesis.speak(utterance);

    // Create play/pause button
    const playPauseButton = document.createElement('button');
    playPauseButton.innerHTML = `<span>pause</span>`;

    // Create speed controls
    const speedControls = document.createElement('div');
    speedControls.className = 'croc-speed-controls';
    
    [0.5, 0.75, 1, 1.5, 2].forEach(speed => {
      const speedButton = document.createElement('button');
      speedButton.className = `croc-speed-button ${speed === currentSpeed ? 'active' : ''}`;
      speedButton.textContent = `${speed}x`;
      speedButton.onclick = () => {
        utterance.rate = speed;
        currentSpeed = speed;
        speedControls.querySelectorAll('.croc-speed-button').forEach(btn => 
          btn.classList.toggle('active', btn === speedButton)
        );
        if (isPlaying) {
          speechSynthesis.cancel();
          utterance.rate = currentSpeed;
          speechSynthesis.speak(utterance);
        }
      };
      speedControls.appendChild(speedButton);
    });

    playPauseButton.onclick = () => {
      if (isPlaying) {
        speechSynthesis.pause();
        playPauseButton.innerHTML = `<span>play</span>`;
      } else {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
        } else {
          utterance.rate = currentSpeed;
          speechSynthesis.speak(utterance);
        }
        playPauseButton.innerHTML = `<span>pause</span>`;
      }
      isPlaying = !isPlaying;
    };

    // Create close button
    const closeButton = document.createElement('button');
    closeButton.innerHTML = `<span>close</span>`;
    closeButton.onclick = () => {
      speechSynthesis.cancel();
      audioControls.remove();
    };

    // Add event handlers for utterance
    utterance.onend = () => {
      isPlaying = false;
      playPauseButton.innerHTML = `<span>play</span>`;
    };

    // Assemble controls
    audioControls.appendChild(playPauseButton);
    audioControls.appendChild(speedControls);
    audioControls.appendChild(closeButton);
    document.body.appendChild(audioControls);
  }
});