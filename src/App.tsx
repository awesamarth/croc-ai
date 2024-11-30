import React, { useEffect, useState } from 'react'
import { searchBookmarksWithAI } from './utils/bookmarks'
import { getExplanationStream } from './utils/explain'
import { captureAndSaveScreenshot } from './utils/screenshot';
import './App.css'
import { handleSummarizeArbitrary } from './utils/summarize_arbitrary'
import { parseCommand, executeCommand } from './utils/functions/parser'
import { AudioControls } from './components/AudioControls';
import { searchTabsWithAI } from './utils/tabs';
import { searchHistoryWithAI, clearHistory, type HistoryClearOption } from './utils/history'
import { addToReadingList } from './utils/readingList';
import { handleNavigation } from './utils/navigation'
import { adjustFontSize, reopenLastClosedTab, resetFontSize, toggleBionicReading } from './utils/miscellaneous';
import { getReminders, deleteReminder, type Reminder, createReminderManual } from './utils/reminders';
import crocLogo from '/icons/croc256.png'
import { useVoiceCommand } from './hooks/useVoiceCommand';
import ReactMarkdown from 'react-markdown';





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
  { code: 'ru', name: 'Russian' }
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
  //@ts-ignore
  const [togglingContrast, setTogglingContrast] = useState(false);
  const [adjustingFontSize, setAdjustingFontSize] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [reminderContent, setReminderContent] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [creatingReminder, setCreatingReminder] = useState(false);
  const [command, setCommand] = useState('');
  const [commandResult, setCommandResult] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showManualControls, setShowManualControls] = useState(false);
  const [transliterationEnabled, setTransliterationEnabled] = useState(false);
  const [transliterationTargetLanguage, setTransliterationTargetLanguage] = useState('hi');

  const { isListening, startListening } = useVoiceCommand((transcript) => {
    setCommand(transcript);
  });

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

  const handleAutoTranslateToggle = (checked: boolean) => {
    setAutoTranslateEnabled(checked);
    chrome.storage.local.set({
      autoTranslateEnabled: checked,
      targetLanguage: targetLanguage // Save current language too
    });
    // chrome.runtime.sendMessage({
    //   type: 'setAutoTranslate',
    //   enabled: checked,
    //   targetLanguage
    // });
  };

  const handleTargetLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newLanguage = event.target.value;
    setTargetLanguage(newLanguage);
    chrome.storage.local.set({ targetLanguage: newLanguage });
  };

  const handleTransliterationToggle = (checked: boolean) => {
    setTransliterationEnabled(checked);
    chrome.storage.local.set({
      transliterationEnabled: checked,
      transliterationTargetLanguage // Only save transliteration language
    });
  };

  const handleTransliterationTargetChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newTarget = event.target.value;
    setTransliterationTargetLanguage(newTarget);
    chrome.storage.local.set({
      transliterationTargetLanguage: newTarget,
      transliterationEnabled // Make sure to persist the toggle state
    });
  };

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
    const loadReminders = async () => {
      const existingReminders = await getReminders();
      setReminders(existingReminders);
    };
    loadReminders();
    chrome.storage.local.get(
      ['autoTranslateEnabled', 'targetLanguage', 'transliterationTargetLanguage', 'transliterationEnabled'],
      (result) => {
        if (result.autoTranslateEnabled !== undefined) {
          setAutoTranslateEnabled(result.autoTranslateEnabled);
        }
        if (result.targetLanguage) {
          setTargetLanguage(result.targetLanguage);
        }
        if (result.transliterationTargetLanguage) {
          setTransliterationTargetLanguage(result.transliterationTargetLanguage);
        }
        if (result.transliterationEnabled !== undefined) {
          setTransliterationEnabled(result.transliterationEnabled);
        }
      }
    );

  }, []);

  useEffect(() => {
    chrome.storage.local.set({
      autoTranslateEnabled,
      targetLanguage
    });
  }, [autoTranslateEnabled, targetLanguage]);
  useEffect(() => {
    chrome.storage.local.set({
      transliterationEnabled,
      transliterationTargetLanguage
    });
    console.log("language changed to ", transliterationTargetLanguage)
  }, [transliterationEnabled, transliterationTargetLanguage]);

  useEffect(() => {
    // Only submit if command exists and came from voice input
    if (command && isListening) {
      handleCommandSubmit();
    }
  }, [command, isListening]);



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
      setShowCopiedMessage(true);
      setTimeout(() => {
        setShowCopiedMessage(false);
      }, 2000);
    } catch (error) {
      console.error('Screenshot error:', error);
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
      console.error('Error toggling ezRead mode:', error);
    } finally {
      setToggling(false);
    }
  };


  //@ts-ignore
  const handleToggleHighContrast = async () => {
    try {
      setTogglingContrast(true);
      await chrome.storage.local.set({ highContrastEnabled: !highContrastEnabled });
      
      const tabs = await chrome.tabs.query({});
      
      // Try to send message to all tabs, but don't wait for responses
      await Promise.all(tabs.map(async (tab) => {
        if (tab.id && !tab.url?.startsWith('chrome://')) {
          try {
            await chrome.tabs.sendMessage(tab.id, {
              type: 'toggleHighContrast',
              enable: !highContrastEnabled
            });
          } catch (error) {
            // Ignore connection errors for tabs without content script
            console.error(`Error applying to tab ${tab.id}:`, error);
          }
        }
      }));
  
      // Update UI state regardless of tab messages
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
  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreatingReminder(true);
      const success = await createReminderManual(reminderContent, reminderDate, reminderTime);

      if (success) {
        // Clear form
        setReminderContent('');
        setReminderDate('');
        setReminderTime('');

        // Refresh reminders list
        const updatedReminders = await getReminders();
        setReminders(updatedReminders);
      }
    } catch (error) {
      console.error('Error creating reminder:', error);
    } finally {
      setCreatingReminder(false);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    const success = await deleteReminder(id);
    if (success) {
      setReminders(reminders.filter(r => r.id !== id));
    }
  };
  const handleCommandSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!command.trim()) return;

    try {
      setIsProcessing(true);
      setCommandResult(null);

      const parsed = await parseCommand(command);

      if (!parsed || parsed.confidence < 0.7) {
        setCommandResult("I'm not sure what you want to do. Try rephrasing or use manual controls.");
        return;
      }

      console.log("parsed is: ")
      console.log(parsed)

      const result = await executeCommand(parsed);
      console.log(result)
      setCommandResult(result);
      setCommand(''); // Clear input on success

      // Add timeout to clear the result after 2 seconds if it's "done!"
      if (result === "done!"|| result === "copied to clipboard!") {
        setTimeout(() => {
          setCommandResult(null);
        }, 2000);
      }


    } catch (error) {
      console.error('Command execution error:', error);
      setCommandResult(`Error: ${error instanceof Error ? error.message : 'Something went wrong'}`);
    } finally {
      setIsProcessing(false);
    }
  };



  return (
    <div className="min-h-screen bg-gray-900 flex justify-center">

      <div className="w-full max-w-lg p-4 flex flex-col gap-4 bg-gray-900 text-gray-100">

        {/* Header and logo */}
        <div className="flex items-center justify-center pb-2 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <img src={crocLogo} alt="Croc AI" className="w-16 h-16" />
            <h1 className="text-4xl font-semibold bg-gradient-to-r from-[#4285F4] via-[#EA4335] to-[#FBBC05] bg-clip-text text-transparent">
              Croc AI
            </h1>
          </div>
        </div>

        {/* command input main */}
        <div className="bg-gray-800 rounded-lg shadow-sm border border-gray-700 p-4">
          <form onSubmit={handleCommandSubmit} className="flex flex-col gap-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="What do you want to do? eg. search my history, watch cat videos..."
                className="flex-1 p-3 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] bg-gray-700 text-gray-100"
                disabled={isProcessing}
              />
              <button
                type="button"
                onClick={startListening}
                disabled={isProcessing || isListening}
                className={`px-3 py-1 rounded-lg transition-colors ${isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-[#6752e0] hover:bg-[#5443b5]/90'
                  } disabled:bg-gray-600`}
                title={isListening ? 'Listening...' : 'Click to use voice command'}
              >
                <svg
                  className={`w-5 h-5 text-white ${isListening ? 'animate-pulse' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              </button>
            </div>
            <button
              type="submit"
              className="bg-chrome-blue hover:bg-opacity-90 text-white px-4 py-2 rounded-lg disabled:bg-gray-600 transition-colors"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Go!'}
            </button>
          </form>
          {commandResult && (
            <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 shadow-sm text-gray-100"
              dangerouslySetInnerHTML={{ __html: commandResult }} />
          )}
        </div>
        {/* arbitrary explanation, summarization */}
        {explaining && (
          <div className="mt-4 flex items-center gap-2 text-gray-300">
            <div className="animate-spin ml-2">↻</div>
            <p>Generating explanation...</p>
          </div>
        )}


        {summarizingArbitrary && (
          <div className="mt-4 flex items-center gap-2 text-gray-300">
            <div className="animate-spin">↻</div>
            <p>Generating summary...</p>
          </div>
        )}

        {explanation && (
          <div className="mt-2 p-4 bg-gray-800 rounded-lg border border-gray-700 relative">
            <div className="flex justify-end gap-2 absolute top-3 right-3">
              <button
                onClick={() => setTextToRead(explanation)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
              <button
                onClick={() => setExplanation('')}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 pr-16">
              <ReactMarkdown>{explanation}</ReactMarkdown>
              </p>
          </div>
        )}

        {summaryArbitrary && (
          <div className="mt-2 p-4 bg-gray-800 rounded-lg border border-gray-700 relative">
            <div className="flex justify-end gap-2 absolute top-3 right-3">
              <button
                onClick={() => setTextToRead(summaryArbitrary)}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="feather feather-volume-2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
              </button>
              <button
                onClick={() => setSummaryArbitrary('')}
                className="p-2 rounded-full hover:bg-gray-700 transition-colors text-gray-400 hover:text-gray-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-gray-300 pr-16"><ReactMarkdown>{summaryArbitrary}</ReactMarkdown></p>
          </div>
        )}

        <div className="flex flex-col gap-6 bg-gray-800 rounded-lg p-4">
          {/* Auto-translate row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-200 text-sm font-medium">Auto-translate pages</span>
              <span className="text-gray-200 text-sm">to</span>
              <select
                className="bg-gray-700 text-gray-200 text-sm rounded-md border border-gray-600 py-1 px-2 outline-none focus:ring-1 focus:ring-chrome-blue"
                value={targetLanguage}
                onChange={handleTargetLanguageChange}
                disabled={!autoTranslateEnabled}
              >
                {SUPPORTED_LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code} className="bg-gray-700">
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
                onChange={(e) => handleAutoTranslateToggle(e.target.checked)}
              />
              <div className="w-10 h-5 bg-gray-600 rounded-full peer peer-checked:bg-chrome-blue peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all hover:bg-gray-500 peer-checked:hover:bg-chrome-blue/90" />
            </label>
          </div>

          {/* Transliteration row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-gray-200 text-sm font-medium">Transliterate to</span>
              <select
                className="bg-gray-700 text-gray-200 text-sm rounded-md border border-gray-600 py-1 px-2 outline-none focus:ring-1 focus:ring-chrome-blue"
                value={transliterationTargetLanguage}
                onChange={handleTransliterationTargetChange}
                disabled={!transliterationEnabled}
              >
                <option value="hi">हिंदी</option>
                <option value="ru">Русский</option>
              </select>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={transliterationEnabled}
                onChange={(e) => handleTransliterationToggle(e.target.checked)}
              />
              <div className="w-10 h-5 bg-gray-600 rounded-full peer peer-checked:bg-chrome-blue peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all hover:bg-gray-500 peer-checked:hover:bg-chrome-blue/90" />
            </label>
          </div>
        </div>







        {/* switch to manual controls toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
          <span className="text-gray-200 text-sm font-medium">Switch to Manual Controls</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showManualControls}
              onChange={(e) => setShowManualControls(e.target.checked)}
            />
            <div className="w-10 h-5 bg-gray-600 rounded-full peer 
                    peer-checked:bg-chrome-blue 
                    peer-checked:after:translate-x-full 
                    after:content-[''] 
                    after:absolute 
                    after:top-[2px] 
                    after:left-[2px] 
                    after:bg-white 
                    after:rounded-full 
                    after:h-4 
                    after:w-4 
                    after:transition-all 
                    hover:bg-gray-500 
                    peer-checked:hover:bg-chrome-blue/90">
            </div>
          </label>
        </div>

        {showManualControls && (


          <div >
            <div className="border-t  pt-4 mt-2">
              <div className='text-lg font-bold mb-2'>Quick Commands</div>
              {/* grid with 4 options */}
              <div className="pt-2">
                <div className="grid grid-cols-2 gap-3 max-w-[350px] mx-auto">


                  {/* ezRead Mode */}
                  <button
                    onClick={handleToggleBionicReading}
                    disabled={toggling}
                    className={`px-3 py-4 rounded-lg flex flex-col items-center justify-center gap-2 
    ${bionicReadingEnabled
                        ? 'bg-[#34A853] hover:bg-[#2E8B47]'
                        : 'bg-[#6752e0] hover:bg-[#5443b5]'}
    text-white disabled:bg-gray-400 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.1)] `}
                  >
                    {toggling ? (
                      <>
                        <span className="animate-spin text-lg">↻</span>
                        <span className="text-xs">Updating...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">👀</span>
                        <span className="text-xs font-medium">
                          {bionicReadingEnabled ? 'Disable ez-Read' : 'Enable ez-Read'}
                        </span>
                      </>
                    )}
                  </button>

                  {/* Reading List */}
                  <div className="relative">  {/* Added wrapper div */}
                    <button
                      onClick={handleAddToReadingList}
                      disabled={addingToReadingList}
                      className={`px-3 py-4 rounded-lg flex flex-col items-center justify-center gap-2 
          bg-[#6752e0] hover:bg-[#5443b5]
          text-white disabled:bg-gray-400 transition-colors
          border border-[#4285f4]/20 shadow-lg w-full`}
                    >
                      {addingToReadingList ? (
                        <>
                          <span className="animate-spin text-lg">↻</span>
                          <span className="text-xs">Adding...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">📚</span>
                          <span className="text-xs font-medium">Add to Reading List</span>
                        </>
                      )}
                    </button>
                    {readingListMessage && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                    bg-[#34A853] text-white px-3 py-2 rounded-md text-sm
                    shadow-lg transition-all duration-200 ease-in-out
                    whitespace-nowrap">
                        Added to reading list!
                      </div>
                    )}
                  </div>

                  {/* screenshot */}
                  <div className="relative">  {/* Added wrapper div */}
                    <button
                      onClick={handleScreenshot}
                      disabled={takingScreenshot}
                      className={`px-3 py-4 rounded-lg flex flex-col items-center justify-center gap-2 
          bg-[#6752e0] hover:bg-[#5443b5]
          text-white disabled:bg-gray-400 transition-colors
          border border-[#4285f4]/20 shadow-lg w-full`}
                    >
                      {takingScreenshot ? (
                        <>
                          <span className="animate-spin text-lg">↻</span>
                          <span className="text-xs">Capturing...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">📸</span>
                          <span className="text-xs font-medium">Screenshot</span>
                        </>
                      )}
                    </button>
                    {showCopiedMessage && (
                      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 
                    bg-[#34A853] text-white px-3 py-2 rounded-md text-sm
                    shadow-lg transition-all duration-200 ease-in-out
                    whitespace-nowrap">
                        Copied to clipboard!
                      </div>
                    )}
                  </div>

                  {/* Reopen Last Tab */}
                  <button
                    onClick={handleReopenLastTab}
                    disabled={reopeningTab}
                    className={`px-3 py-4 rounded-lg flex flex-col items-center justify-center gap-2 
        bg-[#6752e0] hover:bg-[#5443b5]
        text-white disabled:bg-gray-400 transition-colors
        border border-[#4285f4]/20 shadow-lg`}
                  >
                    {reopeningTab ? (
                      <>
                        <span className="animate-spin text-lg">↻</span>
                        <span className="text-xs">Reopening...</span>
                      </>
                    ) : (
                      <>
                        <span className="text-xl">↩️</span>
                        <span className="text-xs font-medium">Reopen Last Tab</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>


            {/* Navigation section */}
            <div className="border-t  pt-4 mt-4 border-gray-700">
              <div className='text-lg font-bold mb-2'>Navigation</div>
              <form onSubmit={handleNavigationCommand} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={navigationInput}
                  onChange={(e) => setNavigationInput(e.target.value)}
                  placeholder="Type a navigation command (e.g., 'open settings', 'watch cat videos')"
                  className="p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] 
                placeholder-gray-400"
                  disabled={navigationLoading}
                />
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-4 py-2 rounded-lg hover:bg-[#4285F4]/90 
                disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  disabled={navigationLoading}
                >
                  {navigationLoading ? 'Processing...' : 'Navigate'}
                </button>
              </form>
            </div>


            {/* Bookmark search section */}
            <div className="border-t  border-gray-700 pt-2 mt-4">
              <div className='text-lg font-bold mb-2'>Bookmarks</div>
              <form onSubmit={handleBookmarkSearch} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={bookmarkQuery}
                  onChange={(e) => setBookmarkQuery(e.target.value)}
                  placeholder="Search your bookmarks..."
                  className="p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-[#6752e0] focus:border-[#5443b5] 
                 placeholder-gray-400"
                  disabled={bookmarkLoading}
                />
                <button
                  type="submit"
                  className=" text-white px-4 py-2 rounded-lg bg-[#6752e0] hover:bg-[#5443b5] 
                 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  disabled={bookmarkLoading}
                >
                  {bookmarkLoading ? 'Searching...' : 'Search Bookmarks'}
                </button>
              </form>

              {bookmarkResults && (
                <div
                  className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-100"
                  dangerouslySetInnerHTML={{ __html: bookmarkResults }}
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


            {/* Tab search section */}
            <div className="border-t border-gray-700 pt-2 mt-4">
              <div className='text-lg font-bold mb-2'>Tabs</div>
              <form onSubmit={handleTabSearch} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={tabQuery}
                  onChange={(e) => setTabQuery(e.target.value)}
                  placeholder="Search your open tabs..."
                  className="p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                 focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] 
                 placeholder-gray-400"
                  disabled={tabLoading}
                />
                <button
                  type="submit"
                  className="bg-[#4285F4] text-white px-4 py-2 rounded-lg hover:bg-[#4285F4]/90 
                 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  disabled={tabLoading}
                >
                  {tabLoading ? 'Searching...' : 'Search Tabs'}
                </button>
              </form>

              {tabResults && (
                <div
                  className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-100"
                  dangerouslySetInnerHTML={{ __html: tabResults }}
                  onClick={async (e) => {
                    const target = e.target as HTMLElement;
                    if (target.tagName === 'A') {
                      e.preventDefault();
                      const tabId = target.getAttribute('data-tab-id');
                      if (tabId) {
                        try {
                          await chrome.tabs.update(parseInt(tabId), { active: true });
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
            <div className="border-t border-gray-700 pt-2 mt-4">
              <div className='text-lg font-bold mb-2'>History</div>
              <form onSubmit={handleHistorySearch} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={historyQuery}
                  onChange={(e) => setHistoryQuery(e.target.value)}
                  placeholder="Search your history..."
                  className="p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-[#6752e0] focus:border-[#5443b5] 
                placeholder-gray-400"
                  disabled={historyLoading}
                />
                <button
                  type="submit"
                  className="text-white px-4 py-2 rounded-lg bg-[#6752e0] hover:bg-[#5443b5] 
                disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                  disabled={historyLoading}
                >
                  {historyLoading ? 'Searching...' : 'Search History'}
                </button>
              </form>

              {historyResults && (
                <div
                  className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-100"
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
              {/* clear history section */}
              <div className="mt-2">
                <div className="text-gray-400 text-sm font-medium mb-2">Clear History</div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleClearHistory('last 24 hours')}
                    disabled={clearingHistory}
                    className="flex-1 bg-[#EA4335]/20 text-[#EA4335] px-4 py-2 rounded-lg hover:bg-[#EA4335]/15 
                    border border-[#EA4335]/10 disabled:bg-gray-800 disabled:text-gray-500 transition-all duration-200"
                  >
                    {clearingHistory ? 'Clearing...' : 'Last 24 Hours'}
                  </button>
                  <button
                    onClick={() => handleClearHistory('allTime')}
                    disabled={clearingHistory}
                    className="flex-1 bg-[#EA4335]/20 text-[#EA4335] px-4 py-2 rounded-lg
                 hover:bg-[#EA4335]/15
                 border border-[#EA4335]/30
                 disabled:bg-gray-800 disabled:text-gray-500
                 transition-all duration-200"
                  >
                    {clearingHistory ? 'Clearing...' : 'All History'}
                  </button>
                </div>
                {clearHistoryMessage && (
                  <div className="mt-2 p-3 bg-gray-800 rounded-lg border border-gray-700 text-gray-300 text-sm">
                    {clearHistoryMessage}
                  </div>
                )}
              </div>
            </div>


            {/* High Contrast section */}
            <div className="border-t border-gray-700 pt-2 mt-4">
              <div className='text-lg font-bold mb-2'>High Contrast</div>
              <button
                onClick={handleToggleHighContrast}
                disabled={togglingContrast}
                className={`w-full ${highContrastEnabled ? 'bg-[#34A853]' : 'bg-[#4285F4]'} 
                text-white px-4 py-3 rounded-lg 
                ${highContrastEnabled ? 'hover:bg-[#34A853]/90' : 'hover:bg-[#4285F4]/90'}
                disabled:bg-gray-600 disabled:cursor-not-allowed 
                transition-colors
                flex items-center justify-center gap-2`}
              >
                {togglingContrast ? (
                  <>
                    <span className="animate-spin">↻</span>
                    Updating...
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
            <div className="border-t border-gray-700 pt-2 mt-4">
              <div className='text-lg font-bold mb-2'>Font Size</div>
              <div className="flex justify-between gap-2">
                <button
                  onClick={handleDecreaseFontSize}
                  disabled={adjustingFontSize}
                  className="flex-1  text-white px-4 py-3 rounded-lg 
                bg-[#6752e0] hover:bg-[#5443b5] 
                disabled:bg-gray-600 disabled:cursor-not-allowed 
                transition-colors
                flex items-center justify-center"
                >
                  A-
                </button>
                <button
                  onClick={handleResetFontSize}
                  disabled={adjustingFontSize}
                  className="flex-1 bg-gray-700 text-gray-200 px-4 py-3 rounded-lg 
                hover:bg-gray-600
                disabled:bg-gray-800 disabled:text-gray-500
                transition-colors
                flex items-center justify-center"
                >
                  Reset
                </button>
                <button
                  onClick={handleIncreaseFontSize}
                  disabled={adjustingFontSize}
                  className="flex-1  text-white px-4 py-3 rounded-lg 
                bg-[#6752e0] hover:bg-[#5443b5] 
                disabled:bg-gray-600 disabled:cursor-not-allowed 
                transition-colors
                flex items-center justify-center"
                >
                  A+
                </button>
              </div>
            </div>

            {/* Reminders */}
            <div className="border-t border-gray-700 pt-2 mt-4">
              <div className='text-lg font-bold mb-2'>Reminders</div>

              <form onSubmit={handleCreateReminder} className="flex flex-col gap-3">
                <input
                  type="text"
                  value={reminderContent}
                  onChange={(e) => setReminderContent(e.target.value)}
                  placeholder="What do you want to be reminded about?"
                  className="p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4] 
                placeholder-gray-400"
                  required
                />

                <div className="flex gap-2">
                  <input
                    type="date"
                    value={reminderDate}
                    onChange={(e) => setReminderDate(e.target.value)}
                    className="flex-1 p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4]
                  [color-scheme:dark]"
                    required
                  />
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="flex-1 p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded-lg 
                  focus:outline-none focus:ring-2 focus:ring-[#4285F4] focus:border-[#4285F4]
                  [color-scheme:dark]"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingReminder}
                  className="bg-[#4285F4] text-white px-4 py-3 rounded-lg hover:bg-[#4285F4]/90 
                disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  {creatingReminder ? 'Creating...' : 'Set Reminder'}
                </button>
              </form>

              {/* List of reminders */}
              <div className="mt-4">
                {reminders.length === 0 ? (
                  <p className="text-gray-400 text-center">No reminders set</p>
                ) : (
                  <div className="space-y-2">
                    {reminders.map(reminder => (
                      <div
                        key={reminder.id}
                        className={`p-3 rounded-lg border border-gray-700 flex justify-between items-center
                      ${reminder.notified ? 'bg-gray-800' : 'bg-gray-700'}`}
                      >
                        <div>
                          <p className="font-medium text-gray-100">{reminder.content}</p>
                          <p className="text-sm text-gray-400">
                            {new Date(reminder.timestamp).toLocaleString()}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="text-[#EA4335] hover:text-[#EA4335]/80 transition-colors
                        px-2 py-1 rounded-md hover:bg-[#EA4335]/20"
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>





          </div>
        )}


        {/* tts section bottom*/}
        {textToRead && (
          <AudioControls
            text={textToRead}
            onClose={() => setTextToRead(null)}
          />
        )}
      </div>
    </div>






  )
}

export default App