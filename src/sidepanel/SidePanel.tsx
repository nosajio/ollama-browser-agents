import { ChangeEventHandler, useState } from 'react'
import './SidePanel.css'

export default function SidePanel() {
  const [promptValue, setPromptValue] = useState('')

  const handleChange: ChangeEventHandler<HTMLTextAreaElement> = (e) => {
    setPromptValue(e.target.value)
  }

  return (
    <main>
      <div className="">
        <textarea
          className="input"
          placeholder="How can I help?"
          onChange={handleChange}
          value={promptValue}
        />
      </div>
    </main>
  )
}
