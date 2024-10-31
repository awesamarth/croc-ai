// src/components/AudioControls.tsx
import { useState, useRef, useEffect } from 'react';

interface AudioControlsProps {
  text: string;
  onClose?: () => void;
}

export function AudioControls({ text, onClose }: AudioControlsProps) {
  const [isPlaying, setIsPlaying] = useState(true); // Changed to true by default
  const [speed, setSpeed] = useState(1);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const speeds = [0.5, 0.75, 1, 1.5, 2];

  useEffect(() => {
    // Create and configure utterance
    utteranceRef.current = new SpeechSynthesisUtterance(text);
    utteranceRef.current.rate = speed;
    
    utteranceRef.current.onend = () => {
      setIsPlaying(false);
    };

    // Start speaking immediately
    window.speechSynthesis.speak(utteranceRef.current);

    return () => {
      if (utteranceRef.current) {
        window.speechSynthesis.cancel();
      }
    };
  }, [text]); // Only depend on text to avoid recreating on speed changes

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

  // Rest of the component remains the same...
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={togglePlay}
          className="p-2 rounded-full hover:bg-gray-100"
        >
          {isPlaying ? (
            <PauseIcon className="w-6 h-6" />
          ) : (
            <PlayIcon className="w-6 h-6" />
          )}
        </button>

        <div className="flex items-center gap-2">
          {speeds.map((s) => (
            <button
              key={s}
              onClick={() => handleSpeedChange(s)}
              className={`px-2 py-1 rounded ${
                speed === s ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
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
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <XIcon className="w-6 h-6" />
          </button>
        )}
      </div>
    </div>
  );
}

// Icon components remain the same...
// Simple icon components
const PlayIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const PauseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);