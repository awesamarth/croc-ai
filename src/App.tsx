import { useEffect, useState } from 'react'
import { searchBookmarksWithAI } from './utils/bookmarks'
import { getExplanationStream } from './utils/explain'
import { captureAndSaveScreenshot } from './utils/screenshot';
import './App.css'
import { handleSummarizeArbitrary } from './utils/summarize_arbitrary'
import { AudioControls } from './components/AudioControls';
import { searchTabsWithAI } from './utils/tabs';
import { searchHistoryWithAI, clearHistory, type HistoryClearOption } from './utils/history'
import { addToReadingList } from './utils/readingList';
import { handleNavigation } from './utils/navigation'
import { adjustFontSize, reopenLastClosedTab, resetFontSize, toggleBionicReading } from './utils/miscellaneous';





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
  const [tabQuery, setTabQuery] = useState("")
  const [tabResults, setTabResults] = useState("")
  const [tabLoading, setTabLoading] = useState(false)
  const [textToRead, setTextToRead] = useState<string | null>(null);
  const [bookmarkQuery, setBookmarkQuery] = useState("")
  const [bookmarkResults, setBookmarkResults] = useState("")
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [historyQuery, setHistoryQuery] = useState("")
  const [historyResults, setHistoryResults] = useState("")
  const [historyLoading, setHistoryLoading] = useState(false)
  const [clearingHistory, setClearingHistory] = useState(false);
  const [clearHistoryMessage, setClearHistoryMessage] = useState("");
  const [addingToReadingList, setAddingToReadingList] = useState(false);
  const [readingListMessage, setReadingListMessage] = useState("");
  const [navigationInput, setNavigationInput] = useState("")
  const [navigationLoading, setNavigationLoading] = useState(false)
  const [reopeningTab, setReopeningTab] = useState(false);
  const [bionicReadingEnabled, setBionicReadingEnabled] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [highContrastEnabled, setHighContrastEnabled] = useState(false);
  const [togglingContrast, setTogglingContrast] = useState(false);
  const [adjustingFontSize, setAdjustingFontSize] = useState(false);


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
    chrome.storage.local.get('bionicReadingEnabled').then(({ bionicReadingEnabled }) => {
      setBionicReadingEnabled(!!bionicReadingEnabled);
    });
    chrome.storage.local.get('highContrastEnabled', ({ highContrastEnabled }) => {
      setHighContrastEnabled(!!highContrastEnabled);
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
  const handleTabSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tabQuery.trim()) return

    try {
      setTabLoading(true)
      const results = await searchTabsWithAI(tabQuery)
      setTabResults(results)
    } catch (error) {
      console.error('Error searching tabs:', error)
      setTabResults('Error searching tabs')
    } finally {
      setTabLoading(false)
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
  const handleHistorySearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!historyQuery.trim()) return

    try {
      setHistoryLoading(true)
      const results = await searchHistoryWithAI(historyQuery)
      setHistoryResults(results)
    } catch (error) {
      console.error('Error searching history:', error)
      setHistoryResults('Error searching history')
    } finally {
      setHistoryLoading(false)
    }
  }
  const handleClearHistory = async (option: HistoryClearOption) => {
    try {
      setClearingHistory(true);
      const result = await clearHistory(option);
      setClearHistoryMessage(result);

      // Clear the message after 3 seconds
      setTimeout(() => {
        setClearHistoryMessage("");
      }, 3000);

    } catch (error) {
      console.error('Error clearing history:', error);
      setClearHistoryMessage(`Error clearing history: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setClearingHistory(false);
    }
  };

  const handleAddToReadingList = async () => {
    try {
      setAddingToReadingList(true);
      const result = await addToReadingList();
      setReadingListMessage(result);

      // Clear the message after 3 seconds
      setTimeout(() => {
        setReadingListMessage("");
      }, 3000);
    } catch (error) {
      console.error('Error adding to reading list:', error);
      setReadingListMessage(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setAddingToReadingList(false);
    }
  }
  const handleNavigationCommand = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!navigationInput.trim()) return

    try {
      setNavigationLoading(true)
      const success = await handleNavigation(navigationInput)
      if (!success) {
        // Optionally show some feedback that the command wasn't understood
        console.log("Navigation command not understood")
      }
      // Clear the input on success
      setNavigationInput("")
    } catch (error) {
      console.error('Navigation error:', error)
    } finally {
      setNavigationLoading(false)
    }
  }
  const handleReopenLastTab = async () => {
    try {
      setReopeningTab(true);
      const success = await reopenLastClosedTab();
      if (!success) {
        // Optionally show a message that there's no tab to reopen
        console.log("No recently closed tabs found");
      }
    } catch (error) {
      console.error('Error reopening tab:', error);
    } finally {
      setReopeningTab(false);
    }
  };
  const handleToggleBionicReading = async () => {
    try {
      setToggling(true);
      const success = await toggleBionicReading(!bionicReadingEnabled);
      if (success) {
        setBionicReadingEnabled(!bionicReadingEnabled);
      }
    } catch (error) {
      console.error('Error toggling bionic reading:', error);
    } finally {
      setToggling(false);
    }
  };
  const handleToggleHighContrast = async () => {
    try {
      setTogglingContrast(true);

      // Get all tabs
      const tabs = await chrome.tabs.query({});

      // Send message to all tabs except chrome:// urls
      await Promise.all(tabs.map(async (tab) => {
        if (tab.id && !tab.url?.startsWith('chrome://')) {
          await chrome.tabs.sendMessage(tab.id, {
            type: 'toggleHighContrast',
            enable: !highContrastEnabled
          });
        }
      }));

      // Update storage
      await chrome.storage.local.set({
        highContrastEnabled: !highContrastEnabled
      });

      setHighContrastEnabled(!highContrastEnabled);
    } catch (error) {
      console.error('Error toggling high contrast:', error);
    } finally {
      setTogglingContrast(false);
    }
  };
  const handleIncreaseFontSize = async () => {
    try {
      setAdjustingFontSize(true);
      await adjustFontSize(true);
    } catch (error) {
      console.error('Error increasing font size:', error);
    } finally {
      setAdjustingFontSize(false);
    }
  };

  const handleDecreaseFontSize = async () => {
    try {
      setAdjustingFontSize(true);
      await adjustFontSize(false);
    } catch (error) {
      console.error('Error decreasing font size:', error);
    } finally {
      setAdjustingFontSize(false);
    }
  };

  // Optional: Reset handler
  const handleResetFontSize = async () => {
    try {
      setAdjustingFontSize(true);
      await resetFontSize();
    } catch (error) {
      console.error('Error resetting font size:', error);
    } finally {
      setAdjustingFontSize(false);
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

      {/* Tab search section */}
      <div className="border-t pt-4 mt-4">
        <form onSubmit={handleTabSearch} className="flex flex-col gap-3">
          <input
            type="text"
            value={tabQuery}
            onChange={(e) => setTabQuery(e.target.value)}
            placeholder="Search your open tabs..."
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={tabLoading}
          />
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            disabled={tabLoading}
          >
            {tabLoading ? 'Searching...' : 'Search Tabs'}
          </button>
        </form>

        {tabResults && (
          <div
            className="mt-4 p-3 bg-gray-100 rounded"
            dangerouslySetInnerHTML={{ __html: tabResults }}
            onClick={async (e) => {
              // Handle link clicks
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                e.preventDefault();
                const tabId = target.getAttribute('data-tab-id');
                if (tabId) {
                  try {
                    // Switch to the clicked tab
                    await chrome.tabs.update(parseInt(tabId), { active: true });
                    // Optionally, focus the window containing the tab
                    const tab = await chrome.tabs.get(parseInt(tabId));
                    if (tab.windowId) {
                      await chrome.windows.update(tab.windowId, { focused: true });
                    }
                  } catch (error) {
                    console.error('Error switching to tab:', error);
                    alert('Could not switch to the selected tab. It may have been closed.');
                  }
                }
              }
            }}
          />
        )}
      </div>

      {/* /history search section*  */}
      <div className="border-t pt-4 mt-4">
        <form onSubmit={handleHistorySearch} className="flex flex-col gap-3">
          <input
            type="text"
            value={historyQuery}
            onChange={(e) => setHistoryQuery(e.target.value)}
            placeholder="Search your history..."
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={historyLoading}
          />
          <button
            type="submit"
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
            disabled={historyLoading}
          >
            {historyLoading ? 'Searching...' : 'Search History'}
          </button>
        </form>

        {historyResults && (
          <div
            className="mt-4 p-3 bg-gray-100 rounded"
            dangerouslySetInnerHTML={{ __html: historyResults }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === 'A') {
                e.preventDefault();
                const url = target.getAttribute('href');
                if (url) {
                  chrome.tabs.create({ url });
                }
              }
            }}
          />
        )}
      </div>

      {/* clear history section */}
      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold mb-2">Clear Browser History</h3>
        <div className="flex gap-2">
          <button
            onClick={() => handleClearHistory('last24h')}
            disabled={clearingHistory}
            className="flex-1 bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 disabled:bg-gray-400"
          >
            {clearingHistory ? 'Clearing...' : 'Clear Last 24 Hours'}
          </button>
          <button
            onClick={() => handleClearHistory('allTime')}
            disabled={clearingHistory}
            className="flex-1 bg-red-700 text-white px-4 py-2 rounded hover:bg-red-800 disabled:bg-gray-400"
          >
            {clearingHistory ? 'Clearing...' : 'Clear All History'}
          </button>
        </div>
        {clearHistoryMessage && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
            {clearHistoryMessage}
          </div>
        )}
      </div>

      {/* add to reading list  */}
      <div className="border-t pt-4">
        <button
          onClick={handleAddToReadingList}
          disabled={addingToReadingList}
          className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {addingToReadingList ? (
            <>
              <span className="animate-spin">↻</span>
              Adding to Reading List...
            </>
          ) : (
            <>
              <span>📚</span>
              Add to Reading List
            </>
          )}
        </button>
        {readingListMessage && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
            {readingListMessage}
          </div>
        )}
      </div>

      {/*navigation section */}
      <div className="border-b pb-4">
        <form onSubmit={handleNavigationCommand} className="flex flex-col gap-3">
          <input
            type="text"
            value={navigationInput}
            onChange={(e) => setNavigationInput(e.target.value)}
            placeholder="Type a navigation command (e.g., 'open settings', 'watch cat videos')"
            className="p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={navigationLoading}
          />
          <button
            type="submit"
            className="bg-indigo-500 text-white px-4 py-2 rounded hover:bg-indigo-600 disabled:bg-gray-400"
            disabled={navigationLoading}
          >
            {navigationLoading ? 'Processing...' : 'Navigate'}
          </button>
        </form>
      </div>

      {/* reopen last tab */}
      <div className="border-t pt-4">
        <button
          onClick={handleReopenLastTab}
          disabled={reopeningTab}
          className="w-full bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-400 flex items-center justify-center gap-2"
        >
          {reopeningTab ? (
            <>
              <span className="animate-spin">↻</span>
              Reopening Last Tab...
            </>
          ) : (
            <>
              <span>↩️</span>
              Reopen Last Closed Tab
            </>
          )}
        </button>
      </div>

      {/* Bionic Reading */}
      <div className="border-t pt-4">
        <button
          onClick={handleToggleBionicReading}
          disabled={toggling}
          className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 
      ${bionicReadingEnabled
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'} 
      text-white disabled:bg-gray-400`}
        >
          {toggling ? (
            <>
              <span className="animate-spin">↻</span>
              Updating Bionic Reading...
            </>
          ) : (
            <>
              <span>👀</span>
              {bionicReadingEnabled ? 'Disable Bionic Reading' : 'Enable Bionic Reading'}
            </>
          )}
        </button>
      </div>

      {/* high contrast theme */}
      <div className="border-t pt-4">
        <button
          onClick={handleToggleHighContrast}
          disabled={togglingContrast}
          className={`w-full px-4 py-2 rounded flex items-center justify-center gap-2 
      ${highContrastEnabled
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-blue-500 hover:bg-blue-600'} 
      text-white disabled:bg-gray-400`}
        >
          {togglingContrast ? (
            <>
              <span className="animate-spin">↻</span>
              Updating High Contrast...
            </>
          ) : (
            <>
              <span>🎨</span>
              {highContrastEnabled ? 'Disable High Contrast' : 'Enable High Contrast'}
            </>
          )}
        </button>
      </div>

      {/* Font size adjustment */}
      <div className="border-t pt-4">
        <div className="flex justify-between gap-2">
          <button
            onClick={handleDecreaseFontSize}
            disabled={adjustingFontSize}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            A-
          </button>
          <button
            onClick={handleResetFontSize}
            disabled={adjustingFontSize}
            className="flex-1 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 disabled:bg-gray-400"
          >
            Reset
          </button>
          <button
            onClick={handleIncreaseFontSize}
            disabled={adjustingFontSize}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            A+
          </button>
        </div>
      </div>

      {/* tts section bottom*/}
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