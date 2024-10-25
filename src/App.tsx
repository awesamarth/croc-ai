import { useState } from 'react'
import './App.css'

function App() {
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const handleSummarize = async () => {
    try {
      setLoading(true)

      
      const canSummarize = await ai.summarizer.capabilities();
      console.log(canSummarize)
      
      // Get current tab's content
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      const result = await chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        func: () => document.body.innerText
      })
      
      const pageText = result[0].result
      console.log(pageText)

      // Use the summarization API
      const summarizer = await ai.summarizer.create()
      const summaryResult = await summarizer.summarize(pageText as string)
      setSummary(summaryResult)
      
      // Clean up
      summarizer.destroy()
    } catch (error) {
      console.error('Error:', error)
      setSummary('Error summarizing page')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-96 min-h-[200px] p-4 flex flex-col gap-4">
      <button 
        onClick={handleSummarize}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
        disabled={loading}
      >
        {loading ? 'Summarizing...' : 'Summarize Page'}
      </button>
      
      {summary && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <p>{summary}</p>
        </div>
      )}
    </div>
  )
}

export default App