// src/utils/audioControls.ts
export function createAudioControls(textToSpeak: string) {
    // Remove any existing controls
    const existingControls = document.querySelector('.croc-audio-controls');
    if (existingControls) {
        existingControls.remove();
    }

    const container = document.createElement('div');
    container.className = 'fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg p-4 text-gray-100';
    container.style.cssText = `
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgb(31 41 55);
      border-top: 1px solid rgb(55 65 81);
      padding: 1rem;
      color: rgb(243 244 246);
      box-shadow: 0 -4px 6px -1px rgb(0 0 0 / 0.1);
      z-index: 10000;
    `;

    const controls = document.createElement('div');
    controls.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    `;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1;
    let isPlaying = true;

    // Start speaking immediately
    speechSynthesis.speak(utterance);

    // Play/Pause button
    const playPauseButton = document.createElement('button');
    playPauseButton.style.cssText = `
      padding: 0.5rem;
      border-radius: 9999px;
      background: transparent;
      border: none;
      color: rgb(243 244 246);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    playPauseButton.innerHTML = `
    <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  `;

    // Speed controls
    const speedControls = document.createElement('div');
    speedControls.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;

    [0.5, 0.75, 1, 1.5, 2].forEach(speed => {
        const speedButton = document.createElement('button');
        speedButton.textContent = `${speed}x`;
        speedButton.style.cssText = `
        padding: 0.25rem 0.5rem;
        border-radius: 0.375rem;
        background: ${speed === 1 ? 'rgb(37 99 235)' : 'transparent'};
        border: none;
        color: rgb(243 244 246);
        cursor: pointer;
        transition: background-color 0.2s;
      `;

        speedButton.addEventListener('mouseover', () => {
            if (utterance.rate !== speed) {
                speedButton.style.background = 'rgb(55 65 81)';
            }
        });

        speedButton.addEventListener('mouseout', () => {
            if (utterance.rate !== speed) {
                speedButton.style.background = 'transparent';
            }
        });

        speedButton.onclick = () => {
            utterance.rate = speed;
            speedControls.querySelectorAll('button').forEach(btn => {
                btn.style.background = 'transparent';
            });
            speedButton.style.background = 'rgb(37 99 235)';
            if (isPlaying) {
                speechSynthesis.cancel();
                speechSynthesis.speak(utterance);
            }
        };

        speedControls.appendChild(speedButton);
    });

    // Close button
    const closeButton = document.createElement('button');
    closeButton.style.cssText = `
      padding: 0.5rem;
      border-radius: 9999px;
      background: transparent;
      border: none;
      color: rgb(243 244 246);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    closeButton.innerHTML = `
    <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;

    playPauseButton.onclick = () => {
        if (isPlaying) {
            speechSynthesis.pause();
            playPauseButton.innerHTML = `
        <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
        } else {
            if (speechSynthesis.paused) {
                speechSynthesis.resume();
            } else {
                speechSynthesis.speak(utterance);
            }
            playPauseButton.innerHTML = `
        <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      `;
        }
        isPlaying = !isPlaying;
    };

    closeButton.onclick = () => {
        speechSynthesis.cancel();
        container.remove();
    };

    utterance.onend = () => {
        isPlaying = false;
        playPauseButton.innerHTML = `
          <svg style="width: 24px; height: 24px;" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
    };

    controls.appendChild(playPauseButton);
    controls.appendChild(speedControls);
    controls.appendChild(closeButton);
    container.appendChild(controls);
    document.body.appendChild(container);
}