import { ChangeEventHandler, useState } from 'react';
import { getChatResponse } from '../helpers/chatHelpers';
import { HumanMessage } from '../helpers/ollamaHelpers';
import './SidePanel.css';

export default function SidePanel() {
  const [promptValue, setPromptValue] = useState('');
  const [response, setResponse] = useState<string>();

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setPromptValue(e.target.value);
  };

  const handleSend = () => {
    if (!promptValue) return;
    (async () => {
      console.log('sending %s', promptValue);
      const res = await getChatResponse([new HumanMessage(promptValue)]);
      console.log(res);
      setResponse(res);
    })();
  };

  return (
    <main>
      <div className="">
        <textarea
          className="input"
          placeholder="How can I help?"
          onChange={handleChange}
          value={promptValue}
        />
        <button className="" onClick={handleSend}>
          Send
        </button>
      </div>
    </main>
  );
}
