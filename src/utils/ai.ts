// utils/ai.ts
//@ts-nocheck

let aiSession: ReturnType<typeof ai.languageModel.create> | null = null;

export async function getAISession(): Promise<ReturnType<typeof ai.languageModel.create>> {
  if (aiSession) {
    return aiSession;
  }

  console.log('Creating new AI session');
  aiSession = await ai.languageModel.create({
    systemPrompt: `You are a helpful AI assistant.`
  });

  return aiSession;
}

export async function destroyAISession() {
  if (aiSession) {
    console.log('Destroying AI session');
    await aiSession.destroy();
    aiSession = null;
  }
}