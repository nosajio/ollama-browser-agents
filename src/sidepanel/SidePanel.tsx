import { ChangeEventHandler, useState } from 'react';
import { Assistant } from '../components/assistant/Assistant';
import { getChatResponse } from '../helpers/chatHelpers';
import { HumanMessage } from '../helpers/ollamaHelpers';
import { type BaseAssistant } from '../types/schema';
import './SidePanel.css';

type SidePanelModes = 'new-assistant' | 'all';

export default function SidePanel() {
  const [uiMode, setUIMode] = useState<SidePanelModes>('all');

  const handleSaveAssistant = (assistant: BaseAssistant) => {
    console.log('save assistant', assistant);
  };

  return (
    <main className="panel">
      {uiMode === 'all' && <MainView onModeChange={setUIMode} assistants={[]} />}
      {uiMode === 'new-assistant' && (
        <NewAssistantView onModeChange={setUIMode} onSave={handleSaveAssistant} />
      )}
    </main>
  );
}

type ViewProps = {
  onModeChange: (mode: SidePanelModes) => void;
};

type MainViewProps = ViewProps & {
  assistants: BaseAssistant[];
};

function MainView({ onModeChange, assistants }: MainViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  return (
    <>
      <header className="panel__header">
        <h1 className="panel__title">Assistants</h1>
        <button className="panel__header-button" onClick={handleModeChange('new-assistant')}>
          +
        </button>
      </header>
      <section className="panel__main">
        {assistants.map((a) => (
          <Assistant assistant={a} />
        ))}
      </section>
    </>
  );
}

type NewAssistantViewProps = ViewProps & {
  onSave: (assistant: BaseAssistant) => void;
};

function NewAssistantView({ onModeChange }: NewAssistantViewProps) {
  const handleModeChange = (mode: SidePanelModes) => () => {
    onModeChange(mode);
  };

  return (
    <>
      <header className="panel__header">
        <h1 className="panel__title">New Assistant</h1>
        <button className="panel__header-button" onClick={handleModeChange('all')}>
          Cancel
        </button>
      </header>
      <section className="panel__main"></section>
    </>
  );
}
