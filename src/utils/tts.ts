import { createAudioControls } from './audioControls';

// Export the function so it can be used by summarize.ts too
export function initializeTTS() {
  console.log('TTS initialized');
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'readAloud' && message.text) {
      console.log('Creating audio controls for:', message.text);
      createAudioControls(message.text);
    }
  });
}

// Re-export createAudioControls for other files to use
export { createAudioControls };