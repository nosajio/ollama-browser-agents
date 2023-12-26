import Ollama, { Message } from './ollamaHelpers';

const model = new Ollama({
  model: 'mistral',
  ollama_url: 'http://localhost:11434',
});

export async function getChatResponse(messages: Message[]) {
  const response = model.chat(messages);
  return response;
}
