//@ts-nocheck
import { useState, useCallback } from 'react';
import { AudioFeedback } from '../utils/audio';

declare global {
  interface Window {
    webkitSpeechRecognition: any;
  }
}

export const useVoiceCommand = (onCommand: (command: string) => void) => {
    const [isListening, setIsListening] = useState(false);
    const audioFeedback = new AudioFeedback();
  
    const startListening = useCallback(async () => {
      try {
        // Explicitly request microphone permission first
        await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'en-US';
        recognition.continuous = false;
        recognition.interimResults = false;
  
        recognition.onstart = async () => {
          setIsListening(true);
          await audioFeedback.playStartSound();
        };
  
        recognition.onresult = async (event) => {
          const transcript = event.results[0][0].transcript;
          await audioFeedback.playEndSound();
          onCommand(transcript);
        };
  
        recognition.onend = () => {
          setIsListening(false);
        };
  
        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          if (event.error === 'not-allowed') {
            alert('Please allow microphone access in your browser settings');
          }
        };
  
        recognition.start();
      } catch (error) {
        console.error('Error starting voice input: ', error);
        setIsListening(false);
        if (error instanceof DOMException && error.name === 'NotAllowedError') {
          alert('Please allow microphone access in your browser settings by going to extension, clicking details under Croc AI, going to site settings, and enabling microphone access');
        }
      }
    }, [onCommand]);
  
    return {
      isListening,
      startListening
    };
  };