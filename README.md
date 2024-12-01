# ![Croc AI Icon](https://github.com/user-attachments/assets/d0667f83-1e02-49dc-a9c7-a74a40415930) Croc AI
*Your friendly neighbourhood browser assistant* 

## What is Croc AI?
Croc AI is a sidebar-by-default extension that uses in-browser Gemini Nano to transform Chrome into an intelligent companion with an input bar where you can either use text or your voice to enter what you want to do in natural language. 

## How to install
To install this extension, check the Releases section on this page. Click on the latest release and then click on dist.zip to download it. Once that is done, unzip the folder, go to `chrome://extensions`, enable developer mode, click on load unpacked and select the unzipped folder. Croc AI should now show up in your extensions.

This extension can currently work on the latest Chrome Dev and Chrome Canary builds. It makes use of on-device, in-browser AI (Gemini Nano). For ensuring all features work, follow these steps:
1. go to `chrome://flags/#optimization-guide-on-device-model` and set it to "Enabled BypassPerfRequirement"
2. go to `chrome://flags/#text-safety-classifier` and disable it.
3. enable `chrome://flags/#prompt-api-for-gemini-nano`,  `chrome://flags/#summarization-api-for-gemini-nano`, `chrome://flags/#rewriter-api-for-gemini-nano`, `chrome://flags/#writer-api-for-gemini-nano`, `chrome://flags/#language-detection-api`
4. go to `chrome://flags/#translation-api` and set it to "Enabled without language pack limit"
5. go to `chrome://on-device-translation-internals/` and download all language packs you require. Navigate to chrome://components and look for TranslateKit components to monitor progress if you want. 
6. To enable voice input, go to `chrome://extensions`, click on "Details" under Croc AI, go to site settings, allow Microphone

<br />

<img align="center" src="https://github.com/user-attachments/assets/0f80bf36-dab0-480e-9494-8aba1b3c02c4" />

## How to use
Use the main command input box to specify what you want Croc to do. You can use natural language, either via text or via voice. You can also enable manual controls to pick specific functions and execute them directly. Read on to find out what's possible
   

## What can you do using the command box?
- **Smart search:** You can search your bookmarks, history and tabs using natural language. Eg. search my history for cat videos, search my tabs for Devpost etc.

- **Navigation:** You can ask Croc to take you to URLs, including the browser's internal URLs. Eg. "take me to Amazon" will open Amazon, "open my settings" will go to chrome://settings, "i want to watch cat videos" will open up Youtube with the results (using the search_query parameter).

- **Add to Reading List:** You can use Croc to add pages to Chrome's Reading List. Eg "add this page to my reading list" will add the page you're on to the Reading List.

- **History Deletion:** Clear either the last 24 hours' history or your all-time history. Eg. "delete my history" will wipe the browser history.

- **Tab Recovery:** Reopen the tab(s) you closed. Functionally equivalent to pressing Ctrl+Shift+T. Eg. "bring back my last tab".

- **Screenshot:** Capture and save a screenshot of your current tab. The screenshot is automatically saved and copied to clipboard. Eg. "take a screenshot".

- **EZ Read Mode:** Enable EZ read mode which highlights the first few letters of each word. This feature was introduced as X (formerly Twitter) users reported that this method increased their reading speed. Eg. "turn on easy read mode".

- **High Contrast:** Toggle high contrast mode for better visibility. Eg. "enable high contrast mode".

- **Font Size:** Adjust the browser's font size easily. Eg. "increase font size", "decrease font size", or "reset font size".

- **Reminders:** Set time-based reminders that show up as browser notifications. Eg. "remind me to do my laundry in 5 minutes".

## Other features
- **Summarization:** Croc AI will inject a button on sites like Medium that will allow you to summarize the article on that page. This summary will be generated right below the heading of the article. You can also summarize an arbitrary piece of text by selecting it, right clicking it and then selecting Croc AI->Summarize text. This summary will be generated Croc's UI.

- **Croc Writer:** When in an input box or content-editable div, right click and select Croc Writer. This will bring up a popup which will let you ask Croc to generate text. It can do both- write new text with options like tone and length, and rewrite existing text. It auto-fills the text that is already present in the input box/div where it was brought up.

- **Explanation:** Select an arbitrary piece of text and ask Croc to explain it. The explanation will be generated in Croc's UI

- **Translation:** Croc supports auto-translation. Just flip the toggle in the sidebar and select your language. After that, when you browse the web, Croc will detect if there are any portions of text that are in a language which is different from the one you had selected and will translate it. You can also translate arbitrary pieces of text (when auto-translation is off) by selecting them, right clicking and choosing Croc AI->Translate Selection.

- **Text to speech:** Select any text on a webpage, right click and choose Croc AI->Read text aloud. This will bring up audio controls at the bottom of the page that let you pause/play the text being read, adjust reading speed, and close the reader. Generated summaries and explanations have a speaker icon which, on clicking, brings up the audio controls and reads the generated text out loud.

- **Transliteration:** Right click on any text in an input box (including WhatsApp web's editor) and select Croc AI->Transliterate selection. This will convert the text to the script of your chosen language while keeping the pronunciation the same. For example, "namaste" can be transliterated to "नमस्ते" in Hindi (Devanagari) script.

## Contributions and suggestions
Contributions and suggestions are welcome! You can either:
1. Fork this repo, make the changes you want and create a pull request
2. Open a new issue
3. Contact me via Telegram [here](https://t.me/awesamarth)

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details
