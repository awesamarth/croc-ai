// src/utils/functions/parser.ts

import { searchHistoryWithAI, clearHistory } from '../history';
import { searchBookmarksWithAI } from '../bookmarks';
import { searchTabsWithAI } from '../tabs';
import { handleNavigation } from '../navigation';
import { addToReadingList } from '../readingList';
import { reopenLastClosedTab } from '../miscellaneous';
import { functionRegistry } from './registry';
import { createReminder } from '../reminders';
import { adjustFontSize, resetFontSize } from '../miscellaneous';
import { toggleHighContrast } from '../highcontrast_toggle';



interface ParsedFunction {
    functionName: string;
    parameters: Record<string, any>;
    confidence: number;
}

const functionHandlers: Record<string, Function> = {
    searchHistory: searchHistoryWithAI,
    searchBookmarks: searchBookmarksWithAI,
    searchTabs: searchTabsWithAI,
    navigate: handleNavigation,
    addToReadingList: addToReadingList,
    reopenLastTab: reopenLastClosedTab,
    clearHistory: clearHistory,
    createReminder: createReminder,
    adjustFontSize:adjustFontSize,
    resetFontSize:resetFontSize,
    toggleHighContrast:toggleHighContrast

};

export async function parseCommand(userInput: string): Promise<ParsedFunction | null> {
    try {
        // Check if language model is available
        //@ts-ignore
        const capabilities = await ai.languageModel.capabilities();

        if (capabilities.available === "no") {
            throw new Error("Language model not available");
        }



        // Create a session with specific instructions
        //@ts-ignore
        const session = await ai.languageModel.create({
            systemPrompt: `You are a function parser that matches user commands to available functions.
      Available functions:
      ${functionRegistry.map(func => `
        ${func.name}: ${func.description}
        Parameters: ${func.parameters.map(p => `${p.name} (${p.type}${p.required ? ', required' : ''})`).join(', ')}
        Examples: ${func.examples.join(', ')}
      `).join('\n')}

      Your job is to:
      1. Identify which function best matches the user's intent
      2. Extract any required parameters
      3. Return ONLY a JSON object in this format:
      {
        "functionName": "nameOfFunction",
        "parameters": {
          "paramName": "value"
        },
        "confidence": 0.8  // How confident you are in this match (0-1)
      }

      If no function matches well, return:
      { "functionName": null, "parameters": {}, "confidence": 0 }

      DO NOT ADD ANY COMMENTS

      `
        });

        // Send the user input to the model

        const prompt = `Parse this command: "${userInput}"`;
        const response = await session.prompt(prompt);

        console.log("the response received is: ")
        console.log(response)
        session.destroy();

        // Parse the JSON response
        try {
            const parsed = JSON.parse(response) as ParsedFunction;

            // Validate the parsed response
            if (parsed.functionName && !functionRegistry.find(f => f.name === parsed.functionName)) {
                throw new Error(`Invalid function name: ${parsed.functionName}`);
            }

            return parsed;
        } catch (e) {
            console.error('Error parsing model response:', e);
            return null;
        }

    } catch (error) {
        console.error('Error in command parsing:', error);
        return null;
    }
}


// Executor function to actually run the matched function
export async function executeCommand(parsed: ParsedFunction): Promise<string> {
    try {
        // Find the function in registry
        console.log(parsed)
        const funcDef = functionRegistry.find(f => f.name === parsed.functionName);
        if (!funcDef) {
            throw new Error(`Function ${parsed.functionName} not found`);
        }

        console.log("func def is here: ")
        console.log(funcDef)

        // Get the handler from our map instead of window scope
        const handler = functionHandlers[funcDef.name];
        if (!handler) {
            throw new Error(`Handler for ${funcDef.name} not found`);
        }



        // Execute the function with parsed parameters
        const result = await handler(...Object.values(parsed.parameters));

        console.log("result is here")
        console.log(result)
        if (result===true){
            return "done!";

        }

        return result

    } catch (error) {
        console.error('Error executing command:', error);
        throw error;
    }
}
