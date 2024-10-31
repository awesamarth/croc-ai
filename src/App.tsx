import { useEffect, useState } from 'react'
import { searchBookmarksWithAI } from './utils/bookmarks'
import { getExplanationStream } from './utils/explain'
import { captureAndSaveScreenshot } from './utils/screenshot';




import './App.css'
import { handleSummarizeArbitrary } from './utils/summarize_arbitrary'
import { AudioControls } from './components/AudioControls';

type SupportedLanguage = {
  code: string;
  name: string;
}

// Add supported languages from the docs
const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'ja', name: 'Japanese' },
  { code: 'de', name: 'German' },
  { code: 'fr', name: 'French' },
  // Add other supported languages as needed
];

function App() {
  const [summaryArbitrary, setSummaryArbitrary] = useState<string>("")
  const [autoTranslateEnabled, setAutoTranslateEnabled] = useState(false);
  const [targetLanguage, setTargetLanguage] = useState(SUPPORTED_LANGUAGES[0].code);
  const [explanation, setExplanation] = useState<string>("")
  const [explaining, setExplaining] = useState(false)
  const [summarizingArbitrary, setSummarizingArbitrary] = useState(false)
  const [takingScreenshot, setTakingScreenshot] = useState(false);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false)

  const [textToRead, setTextToRead] = useState<string | null>(null);

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
    chrome.storage.local.set({
      autoTranslateEnabled,
      targetLanguage
    });
  }, [autoTranslateEnabled, targetLanguage]);
  useEffect(() => {
    chrome.runtime.onMessage.addListener((message) => {
      console.log("Message received in App:", message);
      if (message.type === 'explain' && message.text) {
        console.log("Calling handleExplainText with:", message.text);
        handleExplainText(message.text);
      }
      else if (message.type === 'summarize' && message.text) {
        handleSummarizeArbitrary(
          message.text,
          () => setSummarizingArbitrary(true),
          (summary) => setSummaryArbitrary(summary),
          (error) => setSummaryArbitrary(error),
          () => setSummarizingArbitrary(false)
        );

      }
    });
  }, []);


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
  const handleScreenshot = async () => {
    try {
      setTakingScreenshot(true);
      await captureAndSaveScreenshot();

      // Show "Copied!" message
      setShowCopiedMessage(true);

      // Hide message after 2 seconds
      setTimeout(() => {
        setShowCopiedMessage(false);
      }, 2000);

    } catch (error) {
      console.error('Screenshot error in component:', error);
      alert(`Failed to take screenshot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTakingScreenshot(false);
    }
  };

  return (
    <div className="w-96 min-h-[200px] p-4 flex flex-col gap-4">
      <div className="flex items-center justify-between p-2 border rounded">
        <div className="flex items-center gap-2">
          <span>Auto-translate</span>
          <span className='ml-2'>to</span>
          <select
            className="ml-2 p-1 border rounded"
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            disabled={!autoTranslateEnabled}
          >
            {SUPPORTED_LANGUAGES.map(lang => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={autoTranslateEnabled}
            onChange={(e) => setAutoTranslateEnabled(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
        </label>
      </div>
      {explaining && <p>Generating explanation...</p>}
      {explanation && (
        <div className="mt-4 p-3 bg-gray-100 rounded">
          <h2 className="font-bold mb-2">Text Explanation</h2>
          <p className="whitespace-pre-wrap">{explanation}</p>
        </div>
      )}


      {/* Summarize section */}
      {summarizingArbitrary && <p>Generating summary...</p>}

      {summaryArbitrary && (
        <div className="mt-4 p-3 bg-gray-100 rounded relative">
          <p>{summaryArbitrary}</p>
          <button
            onClick={() => setTextToRead(summaryArbitrary)}
            className="absolute top-2 right-2 p-2 rounded-full hover:bg-gray-200"
          >
            <div className="w-6 h-6" >speak</div>
          </button>
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

      {/* screenshot section temp */}
      <div className="relative">
        <button
          onClick={handleScreenshot}
          disabled={takingScreenshot}
          className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 w-full"
        >
          {takingScreenshot ? 'Taking Screenshot...' : 'Take Screenshot'}
        </button>
        {showCopiedMessage && (
          <div className="absolute top-[-24px] left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-2 py-1 rounded text-sm">
            Copied to clipboard!
          </div>
        )}
      </div>

      {textToRead && (
        <AudioControls
          text={textToRead}
          onClose={() => setTextToRead(null)}
        />
      )}
    </div>
  )
}

export default App