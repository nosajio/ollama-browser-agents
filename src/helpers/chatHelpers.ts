import type { AgentResponse, BaseAgent } from '../types/schema';
import { markdownToHtml } from './dataHelpers';
import OllamaAi, { HumanMessage, SystemMessage } from './ollamaHelpers';
import { globalSysPrompt, userPrompt } from './promptHelpers';
import { getOptions } from './storageHelpers';

let model: OllamaAi;
getOptions().then((options) => {
  model = new OllamaAi({
    model: options.model,
    ollama_url: options.ollamaUrl,
  });
});

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

export function abortPendingRequests() {
  model.abortAll();
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
      new HumanMessage(userPrompt(agent.name, agent.sysPrompt)),
    ];
  });

  const rawResponses = await Promise.all(messageThreads.map((thread) => model.chat(thread)));
  console.log('Response from LLM');
  console.log(rawResponses);

  const formattedResponses = await Promise.all(
    rawResponses.map<Promise<AgentResponse>>(async (res, i) => {
      let response = undefined;
      if (res) {
        const responseType = agents[i].opts?.expectBoolean ? 'boolean' : 'markdown';
        switch (responseType) {
          case 'boolean':
            response = res.toLowerCase().includes('yes') || false;
            break;
          default:
            response = await markdownToHtml(res);
            break;
        }
      }
      return {
        response,
        agentName: agents[i].name,
        url: context.url,
        time: new Date(),
      };
    }),
  );

  return formattedResponses;
}

function getDOM() {
  return document.documentElement.innerHTML;
}
