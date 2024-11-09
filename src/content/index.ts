// src/content/index.ts
import { initializeTTS } from '../utils/tts';
import { initializeSummarize } from './summarize';
import { initializeTranslate } from './translate';
import { initializeBionicReading } from './bionicreading';

console.log("Content script loaded"); // Add this for debugging

// Initialize features
initializeSummarize();
initializeTTS();
initializeTranslate();
initializeBionicReading();
