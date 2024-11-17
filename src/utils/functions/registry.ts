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
      description: "Open webpage or chrome page",
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
        "open chrome downloads"
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
      name: "reopenLastTab",
      description: "Restore recently closed tab",
      parameters: [],
      examples: [
        "reopen last tab",
        "restore closed tab"
      ],
      handler: "reopenLastClosedTab"
    },
  
    {
      name: "clearHistory",
      description: "Clear browser history",
      parameters: [
        {
          name: "option",
          type: "string",
          description: "'last24h' or 'allTime'",
          required: true
        }
      ],
      examples: [
        "clear history",
        "delete all history",
        "clear today's history"
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
    }
  ];
  