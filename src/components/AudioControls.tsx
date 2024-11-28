// src/components/AudioControls.tsx
import { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';

interface AudioControlsProps {
  text: string;
  onClose?: () => void;
}

// src/components/AudioControls.tsx
export function AudioControls({ text, onClose }: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const speeds = [0.5, 0.75, 1, 1.5, 2];

  useEffect(() => {
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = speed;
    
    utteranceRef.current.onend = () => {
      setIsPlaying(false);
    };

    window.speechSynthesis.speak(utteranceRef.current);

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]);

  const togglePlay = () => {
    if (isPlaying) {
      window.speechSynthesis.pause();
      setIsPlaying(false);
    } else {
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      } else if (utteranceRef.current) {
        utteranceRef.current.rate = speed;
        window.speechSynthesis.speak(utteranceRef.current);
      }
      setIsPlaying(true);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (utteranceRef.current) {
      const wasPlaying = isPlaying;
      window.speechSynthesis.cancel();
      utteranceRef.current.rate = newSpeed;
      if (wasPlaying) {
        window.speechSynthesis.speak(utteranceRef.current);
        setIsPlaying(true);
      }
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 shadow-lg p-4 text-gray-100">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full hover:bg-gray-700 text-gray-100"
        >
          {isPlaying ? (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </button>

        <div className="flex items-center gap-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-2 py-1 rounded ${
                speed === s 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-100 hover:bg-gray-700'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>

        {onClose && (
          <button
            onClick={() => {
              window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-2 rounded-full hover:bg-gray-700 text-gray-100"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}


export function mountAudioControls(text: string) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  
  const root = createRoot(container);
  root.render(
    <AudioControls 
      text={text} 
      onClose={() => {
        root.unmount();
        container.remove();
      }} 
    />
  );
}