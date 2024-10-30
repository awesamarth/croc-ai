export async function handleSummarizeArbitrary(
    text: string,
    onStart: () => void,
    onComplete: (summary: string) => void,
    onError: (error: string) => void,
    onFinally: () => void
  ) {
    try {
      onStart();
      const summarizer = await ai.summarizer.create();
      const summary = await summarizer.summarize(text);
      onComplete(summary);
      summarizer.destroy();
    } catch (error) {
      console.error('Error in handleSummarizeArbitrary:', error);
      onError('Error summarizing arbitrary text');
    } finally {
      onFinally();
    }
  }