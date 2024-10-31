// tts.ts

export function createAudioControls(textToSpeak: string) {
    // Remove any existing audio controls
    const existingControls = document.querySelector('.croc-audio-controls');
    if (existingControls) {
      existingControls.remove();
    }
  
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
  
  // Add message listener for context menu action
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'readAloud' && message.text) {
      createAudioControls(message.text);
    }
  });
  
  // Export the function so it can be used by summarize.ts too
  export function initializeTTS() {
    console.log('TTS initialized');
    chrome.runtime.onMessage.addListener((message) => {
      console.log('TTS received message:', message);
      if (message.type === 'readAloud' && message.text) {
        console.log('Creating audio controls for:', message.text);
        createAudioControls(message.text);
      }
    });
  }