interface Summarizer {
    capabilities(): unknown;
    create: () => Promise<{
      summarize: (text: string) => Promise<string>;
      destroy: () => void;
    }>;
  }
  
  interface AI {
    summarizer: Summarizer;
  }
  
  declare const ai: AI;