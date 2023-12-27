import { FormEventHandler, useEffect, useState } from 'react';
import { Agent } from '../components/agent/Agent';
import { getTabHTML } from '../helpers/chatHelpers';
import { getStoredAgents, upsertAgent } from '../helpers/storageHelpers';
import { AgentResponse, type BaseAgent } from '../types/schema';
import './SidePanel.css';
import { htmlToMarkdown } from '../helpers/dataHelpers';
import { ErrorBoundary } from 'react-error-boundary';

type SidePanelModes = 'new-agent' | 'all';

export default function SidePanel() {
  const [uiMode, setUIMode] = useState<SidePanelModes>('all');
  const [allAgents, setAllAgents] = useState<BaseAgent[]>([]);
  const [agentResponses, setAgentResponses] = useState<AgentResponse[]>();

  const handleSaveAgent = async (agent: BaseAgent) => {
    console.log('save agent', agent);
    const updatedAgents = await upsertAgent(agent, true);
    if (!updatedAgents) return;
    setAllAgents(updatedAgents);
  };

  const handleUpdateAgents = async (tabId: number) => {
    const pageHTML = await getTabHTML(tabId);
    if (typeof pageHTML !== 'string') {
      console.error('No page HTML');
      return;
    }
    const pageMarkdown = htmlToMarkdown(pageHTML);
    console.log(pageMarkdown);
  };

  useEffect(() => {
    const handleTabChanged = (
      tabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
      tab: chrome.tabs.Tab,
    ) => {
      if (changeInfo.status === 'complete') {
        handleUpdateAgents(tabId);
      }
    };
    chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
      if (info.status === 'complete') {
        handleTabChanged(tabId, info, tab);
      }
    });
    return () => {
      chrome.tabs.onUpdated.removeListener(handleTabChanged);
    };
  }, []);

  // Get all agents in state on load
  useEffect(() => {
    (async () => {
      const agents = await getStoredAgents();
      setAllAgents(agents);
    })();
  }, []);

  return (
    <main className="panel">
      <ErrorBoundary fallback={<div>Error</div>}>
        {uiMode === 'all' && <MainView onModeChange={setUIMode} agents={allAgents} />}
        {uiMode === 'new-agent' && (
          <NewAgentView onModeChange={setUIMode} onSave={handleSaveAgent} />
        )}
      </ErrorBoundary>
    </main>
  );
}

type ViewProps = {
  onModeChange: (mode: SidePanelModes) => void;
};

type MainViewProps = ViewProps & {
  agents: BaseAgent[];
};

function MainView({ onModeChange, agents }: MainViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  return (
    <>
      <header className="panel__header panel__section">
        <h1 className="title">Agents</h1>
        <button className="button" onClick={handleModeChange('new-agent')}>
          +
        </button>
      </header>
      <section className="panel__main panel__section">
        {agents.map((a, i) => (
          <Agent agent={a} key={i} />
        ))}
      </section>
    </>
  );
}

type NewAgentViewProps = ViewProps & {
  onSave: (agent: BaseAgent) => void;
};

function NewAgentView({ onSave, onModeChange }: NewAgentViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  const handleSave: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const name = form.get('name') as string;
    const sysPrompt = form.get('sysPrompt') as string;
    const expectBoolean = form.get('expectBoolean') === 'true';
    const includeSearchEngines = form.get('includeSearchEngines') === 'true';
    const useLLMChat = form.get('useLLMChat') === 'true';

    const agent: BaseAgent = {
      active: true,
      name,
      sysPrompt,
      opts: {
        expectBoolean,
        includeSearchEngines,
        useLLMChat,
      },
    };
    onSave(agent);
  };

  return (
    <form onSubmit={handleSave}>
      <header className="panel__header">
        <h1 className="panel__title">New Agent</h1>
        <button className="panel__header-button" onClick={handleModeChange('all')}>
          Cancel
        </button>

        <button className="panel__header-button bg-green">Save</button>
      </header>
      <section className="panel__main">
        <label className="form-row">
          <div className="form-row__label">Name</div>
          <input className="form-row__input" placeholder="Agent name..." type="text" name="name" />
        </label>
        <label className="form-row">
          <div className="form-row__label">Instruct</div>
          <textarea
            className="form-row__input"
            name="sysPrompt"
            placeholder="What should it do?.."
          />
        </label>
        <label className="form-row">
          <div className="form-row__label">Settings</div>
          <label className="form-row__input">
            <input type="checkbox" name="expectBoolean" />
            <span>Expect Boolean</span>
          </label>
          <label className="form-row__input">
            <input type="checkbox" name="includeSearchEngines" />
            <span>Include Search Engines</span>
          </label>
          <label className="form-row__input">
            <input type="checkbox" name="useLLMChat" />
            <span>Use LLM Chat</span>
          </label>
        </label>
      </section>
    </form>
  );
}
