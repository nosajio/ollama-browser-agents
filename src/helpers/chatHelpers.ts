import { BaseAgent } from '../types/schema';
import OllamaAi, { Message } from './ollamaHelpers';

const model = new OllamaAi({
  model: 'mistral',
  ollama_url: 'http://localhost:11434',
});

export async function getChatResponse(messages: Message[]) {
  const response = model.chat(messages);
  return response;
}

export async function getTabHTML(tabId: number) {
  const domRes = await chrome.scripting.executeScript({
    target: { tabId, allFrames: true },
    func: getDOM,
  });

  if (chrome.runtime.lastError) {
    console.error(chrome.runtime.lastError.message);
    return;
  }

  return domRes[0].result;
}

export async function getResponseFromAgents(agents: BaseAgent[], context: string) {}

function getDOM() {
  return document.documentElement.innerHTML;
}
