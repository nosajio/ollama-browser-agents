import { BaseAgent } from '../types/schema';

/**
 * Upsert an agent into storage. Agent name must be unique
 */
export async function upsertAgent(agent: BaseAgent, returning?: boolean) {
  let persisted = await chrome.storage.local.get('agents');
  if (!Array.isArray(persisted)) {
    persisted = [];
  }
  // Ensure name is unique
  if (persisted.find((a: BaseAgent) => a.name === agent.name)) {
    return;
  }
  // Add the agent
  persisted.push(agent);
  await chrome.storage.local.set({ agents: persisted });
  if (returning) {
    return persisted as BaseAgent[];
  }
}

export async function replaceAgents(agents: BaseAgent[]) {
  await chrome.storage.local.set({ agents });
}

export async function getStoredAgents() {
  return new Promise<BaseAgent[]>((resolve) => {
    chrome.storage.local.get('agents', (persisted) => {
      resolve((persisted?.agents || []) as BaseAgent[]);
    });
  });
}
