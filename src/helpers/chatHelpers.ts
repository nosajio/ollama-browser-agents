import OllamaAi, { Message } from './ollamaHelpers';

const model = new OllamaAi({
  model: 'mistral',
  ollama_url: 'http://localhost:11434',
});

export async function getChatResponse(messages: Message[]) {
  const response = model.chat(messages);
  return response;
}
