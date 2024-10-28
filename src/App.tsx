import { useEffect, useState } from 'react'
import { searchBookmarksWithAI } from './utils/bookmarks'
import { getExplanationStream } from './utils/explain'

import './App.css'

function App() {
  const [summary, setSummary] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [explanation, setExplanation] = useState<string>("")
  const [explaining, setExplaining] = useState(false)

  const [bookmarkQuery, setBookmarkQuery] = useState("")
  const [bookmarkResults, setBookmarkResults] = useState("")
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const handleExplainText = async (text: string) => {
    console.log("handleExplainText started with:", text);
    try {
      setExplaining(true);
      setExplanation('');
      
      console.log("About to call getExplanationStream");
      await getExplanationStream(text, (newChunk) => {
        console.log("Received new chunk:", newChunk);
        setExplanation(prev => prev + newChunk);
      });
  
    } catch (error) {
      console.error('Error in handleExplainText:', error);
      setExplanation('Error explaining text');
    } finally {
      console.log("handleExplainText finished");
      setExplaining(false);
    }
  }
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      console.log("Message received in App:", message);
      if (message.type === 'explain' && message.text) {
        console.log("Calling handleExplainText with:", message.text);
        handleExplainText(message.text);
      }
    });
  }, []);

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

  const handleBookmarkSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bookmarkQuery.trim()) return

    try {
      setBookmarkLoading(true)
      const results = await searchBookmarksWithAI(bookmarkQuery)
      setBookmarkResults(results)
    } catch (error) {
      console.error('Error searching bookmarks:', error)
      setBookmarkResults('Error searching bookmarks')
    } finally {
      setBookmarkLoading(false)
    }
  }




  return (
    <div className="w-96 min-h-[200px] p-4 flex flex-col gap-4">

      {explaining && <p>Generating explanation...</p>}
      {explanation && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Text Explanation</h2>
          <p className="whitespace-pre-wrap">{explanation}</p>
        </div>
      )}
      {/* Summarize section */}
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

      {/* Bookmark search section */}
      <div className="border-t pt-4 mt-4">
        <form onSubmit={handleBookmarkSearch} className="flex flex-col gap-3">
          <input
            type="text"
            value={bookmarkQuery}
            onChange={(e) => setBookmarkQuery(e.target.value)}
            placeholder="Search your bookmarks..."
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={bookmarkLoading}
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 disabled:bg-gray-400"
            disabled={bookmarkLoading}
          >
            {bookmarkLoading ? 'Searching...' : 'Search Bookmarks'}
          </button>
        </form>

        {bookmarkResults && (
          <div
            className="mt-4 p-3 bg-gray-100 rounded"
            dangerouslySetInnerHTML={{ __html: bookmarkResults }}
            onClick={(e) => {
              // Handle link clicks
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                e.preventDefault();
                const url = target.getAttribute('href');
                if (url) {
                  // Open link in new tab
                  chrome.tabs.create({ url });
                }
              }
            }}
          />
        )}
      </div>
    </div>
  )
}

export default App