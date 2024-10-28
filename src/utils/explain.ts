export async function getExplanationStream(text: string, 
    onChunk: (chunk: string) => void) {
    console.log("getExplanationStream started with:", text);
    try {
        //@ts-ignore
      const capabilities = await ai.languageModel.capabilities();
      console.log("Language model capabilities:", capabilities);
      
      if (capabilities.available === "no") {
        throw new Error("Language model not available");
      }
      console.log("Creating language model session");
      //@ts-ignore
      const session = await ai.languageModel.create({
        systemPrompt: `You are a helpful assistant that explains text in a clear and concise way. 
        Break down complex ideas into simpler terms and highlight key points.`
      });
  
      console.log("Starting stream");
      const prompt = `Please explain this text in a clear and helpful way: "${text}"`;
      const stream = session.promptStreaming(prompt);
      
      let previousLength = 0;
      
      for await (const chunk of stream) {
        console.log("Raw chunk:", chunk);
        const newContent = chunk.slice(previousLength);
        console.log("Processed chunk:", newContent);
        previousLength = chunk.length;
        onChunk(newContent);
      }
  
      console.log("Stream completed");
      session.destroy();
      return session;
  
    } catch (error) {
      console.error('Error in getExplanationStream:', error);
      throw error;
    }
  }