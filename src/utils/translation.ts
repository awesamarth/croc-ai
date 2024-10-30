interface TranslationResult {
    originalText: string;
    translatedText: string;
    sourceLanguage: string;
    confidence: number;
  }
  
  export async function detectAndTranslate(
    text: string,
    targetLanguage: string,
    confidenceThreshold: number = 0.4
  ): Promise<TranslationResult> {
    try {
      // Create language detector
      //@ts-ignore
      const canDetect = await translation.canDetect();
      if (canDetect === 'no') {
        console.log("language detection not available")
        throw new Error('Language detection not available');
      }
      //@ts-ignore
      const detector = await translation.createDetector();
      
      // Detect language
      const detectionResults = await detector.detect(text);
      const detectedLanguage = detectionResults[0].detectedLanguage;

      console.log(detectedLanguage)
      const confidence = detectionResults[0].confidence;
      
      console.log(confidence)
      // If text is already in target language or confidence is too low, return original
      if (detectedLanguage === targetLanguage || confidence < confidenceThreshold) {
        return {
          originalText: text,
          translatedText: text,
          sourceLanguage: detectedLanguage || 'unknown',
          confidence
        };
      }
  
      // Check if translation is available
      //@ts-ignore
      const canTranslate = await translation.canTranslate({
        sourceLanguage: detectedLanguage!,
        targetLanguage
      });

      console.log(await canTranslate)
  
      if (canTranslate === 'no') {
        throw new Error('Translation not available for this language pair');
      }

      console.log("it can indeed translate")
  
      // Create translator and translate
      //@ts-ignore
      const translator = await translation.createTranslator({
        sourceLanguage: detectedLanguage!,
        targetLanguage
      });

      console.log("translator console")
      console.log(translator)
  
      const translatedText = await translator.translate(text);

      console.log("translated text is: ")
      console.log(translatedText)
  
      return {
        originalText: text,
        translatedText,
        sourceLanguage: detectedLanguage!,
        confidence
      };
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }