import { FormEventHandler, useEffect, useState } from 'react';
import '../global.css';
import { listModels } from '../helpers/ollamaHelpers';
import { defaultOptions, getOptions, saveOptions } from '../helpers/storageHelpers';
import { ExtensionOptions } from '../types/schema';
import './Options.css';

export const Options = () => {
  const [beforeGet, setBeforeGet] = useState(true);
  const [options, setOptions] = useState<ExtensionOptions>(defaultOptions);
  const [saved, setSaved] = useState(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);

  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newOptions: ExtensionOptions = {
      ollamaUrl: formData.get('ollamaUrl') as string,
      model: formData.get('model') as string,
    };
    setOptions(newOptions);
    setSaved(true);
  };

  useEffect(() => {
    if (!beforeGet) return;
    listModels().then((models) => {
      setAvailableModels(models.models.map((m) => m.name));
      getOptions().then((opts) => {
        setOptions((o) => ({ ...o, ...opts }));
        setBeforeGet(false);
      });
    });
  }, [beforeGet]);

  useEffect(() => {
    if (beforeGet || !options) return;
    saveOptions(options);
  }, [beforeGet, options]);

  // Reset save status
  useEffect(() => {
    if (!saved) return;
    const timeout = setTimeout(() => setSaved(false), 3000);
    return () => clearTimeout(timeout);
  }, [saved]);

  return (
    <main className="options">
      {beforeGet ? (
        <div className="loading">Loading options...</div>
      ) : (
        <form className="options-form" onSubmit={handleSubmit}>
          <section className="options-section">
            <label className="field">
              <div className="label">Ollama API URL</div>
              <div className="field">
                <input
                  className="input"
                  type="text"
                  name="ollamaUrl"
                  defaultValue={options?.ollamaUrl}
                  required
                />
              </div>
            </label>
            <label className="field">
              <div className="label">Model</div>
              <div className="field">
                <select className="input" name="model" defaultValue={options?.model} required>
                  {availableModels.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))}
                </select>
              </div>
            </label>
          </section>
          <section className="options-section">
            <button className={`button save ${saved ? 'saved' : ''}`} type="submit">
              Save
            </button>
          </section>
        </form>
      )}
    </main>
  );
};

export default Options;
