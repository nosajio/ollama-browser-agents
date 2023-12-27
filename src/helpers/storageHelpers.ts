import { BaseAgent } from '../types/schema';

/**
 * Upsert an agent into storage. Agent name must be unique
 */
export async function upsertAgent(agent: BaseAgent, returning?: boolean) {
  return new Promise<void | BaseAgent[]>((resolve) => {
    chrome.storage.local.get('agents', (persisted) => {
      console.log(persisted);
      if (!Array.isArray(persisted)) {
        persisted = [];
      }
      // Ensure name is unique
      if (persisted.find((a: BaseAgent) => a.name === agent.name)) {
        resolve();
        return;
      }
      persisted.push(agent);
      chrome.storage.local.set({ agents: persisted }, () => {
        if (returning) {
          resolve((persisted || []) as BaseAgent[]);
        } else {
          resolve();
        }
      });
    });
  });
}

export async function getStoredAgents() {
  return new Promise<BaseAgent[]>((resolve) => {
    chrome.storage.local.get('agents', (persisted) => {
      resolve((persisted?.agents || []) as BaseAgent[]);
    });
  });
}
