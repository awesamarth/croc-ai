// src/utils/functions/registry.ts

interface FunctionParameter {
  name: string;
  type: 'string' | 'boolean' | 'number';
  description: string;
  required: boolean;
}

interface FunctionDefinition {
  name: string;
  description: string;
  parameters: FunctionParameter[];
  examples: string[];  // Example natural language commands
  handler: string;     // Name of the actual function to call
}

export const functionRegistry: FunctionDefinition[] = [
  {
    name: "searchHistory",
    description: "Search browser history",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true
      }
    ],
    examples: [
      "find videos I watched yesterday",
      "search history for javascript"
    ],
    handler: "searchHistoryWithAI"
  },

  {
    name: "searchBookmarks",
    description: "Search bookmarked pages",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true
      }
    ],
    examples: [
      "find my bookmarked recipes",
      "search bookmarks for tutorial"
    ],
    handler: "searchBookmarksWithAI"
  },

  {
    name: "searchTabs",
    description: "Search open tabs",
    parameters: [
      {
        name: "query",
        type: "string",
        description: "Search query",
        required: true
      }
    ],
    examples: [
      "find tab with gmail",
      "search tabs for youtube"
    ],
    handler: "searchTabsWithAI"
  },

  {
    name: "navigate",
    description: "Open webpage or chrome page, go to youtube search page",
    parameters: [
      {
        name: "command",
        type: "string",
        description: "Navigation command",
        required: true
      }
    ],
    examples: [
      "open settings",
      "go to twitter",
      "open chrome downloads",
      "i want to watch a video about cats",
      "i want to watch cat videos"
    ],
    handler: "handleNavigation"
  },

  {
    name: "addToReadingList",
    description: "Save current page to reading list",
    parameters: [],
    examples: [
      "save for later",
      "add to reading list",
      "can you add this to my reading list"
    ],
    handler: "addToReadingList"
  },

  {
    name: "toggleHighContrast",
    description: "Set high contrast on or off",
    parameters: [
      {
        name: "enable",
        type: "boolean",
        description: "true for on and false for off",
        required: true
      }
    ],
    examples: [
      "turn on high contrast theme",
      "turn off high contrast theme",
      "enable high contrast"
    ],
    handler: "toggleHighContrast"
  },

  {
    name: "clearHistory",
    description: "Clear browser history",
    parameters: [
      {
        name: "time",
        type: "string",
        description: "possible values are 'last 24 hours' and 'allTime'",
        required: true
      }
    ],
    examples: [
      "clear history",
      "delete all history",
      "clear today's history (for clearing last 24 hours' history)",
      "clear history for the last 24 hours"
    ],
    handler: "clearHistory"
  },

  {
    name: "createReminder",
    description: "Create a reminder for a future time",
    parameters: [
      {
        name: "content",
        type: "string",
        description: "What to be reminded about",
        required: true
      },
      {
        name: "timestring",
        type: "string",
        description: "When to be reminded (e.g. 'tomorrow at 3pm', 'in 15 minutes')",
        required: true
      }
    ],
    examples: [
      "remind me to buy groceries tomorrow at 5pm",
      "set reminder for meeting on December 12 at 2:30pm",
      "remind me to call mom in 30 minutes"
    ],
    handler: "createReminder"
  },

  {
    name: "adjustFontSize",
    description: "Increase or decrease browser font size",
    parameters: [
      {
        name: "increase",
        type: "boolean",
        description: "true to increase, false to decrease",
        required: true
      }
    ],
    examples: [
      "increase font size",
      "make text bigger",
      "decrease font size",
      "make text smaller"
    ],
    handler: "adjustFontSize"
  },
  {
    name: "resetFontSize",
    description: "Reset font size to default",
    parameters: [],
    examples: [
      "reset font size",
      "restore default text size"
    ],
    handler: "resetFontSize"
  },

  {
    name: "toggleBionicReading",
    description: "Toggle ez-read mode for better readability",
    parameters: [
      {
        name: "enable",
        type: "boolean",
        description: "true to turn on, false to turn off",
        required: true
      }
    ],
    examples: [
      "turn on easy read mode",
      "enable easy read mode",
      "disable easy read mode",
      "turn off easy read mode" 
    ],
    handler: "toggleBionicReading"
  },

  {
    name: "addToReadingList",
    description: "Save current page to reading list",
    parameters: [],
    examples: [
      "save to reading list",
      "add page to reading list",
      "save this for later",
    ],
    handler: "addToReadingList"
  },

  {
    name: "captureScreenshot",
    description: "Take a screenshot of current page",
    parameters: [],
    examples: [
      "take screenshot",
      "capture screen",
      "screenshot this page",
      "save screenshot"
    ],
    handler: "captureAndSaveScreenshot"
  },

  {
    name: "reopenLastTab",
    description: "Reopen the most recently closed tab",
    parameters: [],
    examples: [
      "reopen last tab",
      "restore closed tabs",
      "bring back closed tab",
      "bring back my last tab"
    ],
    handler: "reopenLastClosedTab"
  }
];
