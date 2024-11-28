interface TranslationResult {
    originalText: string;
    transliteratedText: string;
  }
  
  export async function transliterate(
    text: string,
    targetLanguage: string,
  ): Promise<TranslationResult> {
    try {
      //@ts-ignore
      const detectedLanguage = 'en'
      console.log("target language is:", targetLanguage)

      // Create translator and translate
      //@ts-ignore
      const translator = await translation.createTranslator({
        sourceLanguage: detectedLanguage!,
        targetLanguage
      });

      console.log("translator console")
      console.log(translator)
  
      const transliteratedText = await translator.translate(text);

      console.log("transliterated text is: ")
      console.log(transliteratedText)
  
      return {
        originalText: text,
        transliteratedText,
      };
    } catch (error) {
      console.error('Transliteration error:', error);
      throw error;
    }
  }