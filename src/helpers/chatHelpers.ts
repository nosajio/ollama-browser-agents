import type { AgentResponse, BaseAgent } from '../types/schema';
import OllamaAi, { HumanMessage, Message, SystemMessage } from './ollamaHelpers';
import { globalSysPrompt } from './promptHelpers';

const model = new OllamaAi({
  // model: 'mistral',
  model: 'llama2',
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

  if (!Array.isArray(domRes) || domRes.length === 0) {
    console.error('No DOM response');
    return;
  }

  return domRes[0].result;
}

/**
 * Trigger parallel chat completions with all passed agents
 */
export async function getResponseFromAgents(
  agents: BaseAgent[],
  context: {
    markdown: string;
    url: string;
  },
): Promise<AgentResponse[]> {
  if (!agents.length) {
    console.warn('No agents passed to getResponseFromAgents');
    return [];
  }
  const messageThreads = agents.map((agent) => {
    return [
      new SystemMessage(globalSysPrompt(context.markdown, context.url)),
      new HumanMessage(agent.sysPrompt),
    ];
  });
  const rawResponses = await Promise.all(messageThreads.map((thread) => model.chat(thread)));
  console.log(rawResponses);
  const responses = rawResponses.map<AgentResponse>((res, i) => ({
    agentName: agents[i].name,
    url: context.url,
    response: res,
    time: new Date(),
  }));
  return responses;
}

function getDOM() {
  return document.documentElement.innerHTML;
}
