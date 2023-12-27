import { BaseAssistant } from '../../types/schema';
import './Assistant.module.css';

type AssistantProps = {
  assistant: BaseAssistant;
  answer?: string;
  state?: 'loading' | 'idle';
};

export function Assistant({
  answer,
  state = 'idle',
  assistant: { active, name, sysPrompt, opts },
}: AssistantProps) {
  return (
    <section className="assistant">
      <header className="assistant__header">
        <h2 className="assistant__title">{name}</h2>
      </header>
      <div className="assistant__prompt">{sysPrompt}</div>
      {answer && state === 'idle' && <div className="assistant__answer">{answer}</div>}
    </section>
  );
}
