import { BaseAgent } from '../../types/schema';
import './Agent.css';

type AgentProps = {
  agent: BaseAgent;
  answer?: string;
  state?: 'loading' | 'idle';
};

export function Agent({
  answer,
  state = 'idle',
  agent: { active, name, sysPrompt, opts },
}: AgentProps) {
  return (
    <section className="agent">
      <header className="agent__header">
        <h2 className="agent__title">{name}</h2>
      </header>
      <div className="agent__prompt">{sysPrompt}</div>
      {answer && state === 'idle' && <div className="agent__answer">{answer}</div>}
    </section>
  );
}
