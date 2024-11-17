// src/utils/reminders.ts

export interface Reminder {
    id: string;
    content: string;
    timestamp: number;
    notified: boolean;
  }
  
  // Create a reminder
  export async function createReminder(content: string, timestring: string): Promise<boolean> {
    try {
      console.log("Creating reminder with:", { content, timestring });
  
      // Create AI session to parse the timestring
      //@ts-ignore
      const session = await ai.languageModel.create({
        systemPrompt: `You are a time parser. Convert time descriptions to components.
        Return ONLY a JSON object in this format:
        {
          "type": "relative" | "absolute",
          "value": number,
          "unit": "minutes" | "hours" | "days",  // for relative time
          "date": "YYYY-MM-DD",  // for absolute time
          "time": "HH:mm"        // for absolute time
        }
        
        Examples:
        "in 5 minutes" -> {"type": "relative", "value": 5, "unit": "minutes"}
        "tomorrow at 3pm" -> {"type": "absolute", "date": "2024-03-19", "time": "15:00"}
        "in 2 hours" -> {"type": "relative", "value": 2, "unit": "hours"}
        
        DON'T ADD ANY COMMENTS
        `

        
      });
  
      console.log("AI session created");
  
      const response = await session.prompt(`Parse this time: "${timestring}"`);
      console.log("Raw AI response:", response);
      
      session.destroy();
      console.log("AI session destroyed");
  
      const parsed = JSON.parse(response);
      console.log("Parsed response:", parsed);
  
      // Calculate the timestamp ourselves
      let timestamp: number;
      const now = Date.now();
      console.log("Current timestamp:", now);
  
      if (parsed.type === "relative") {
        console.log("Processing relative time with:", { value: parsed.value, unit: parsed.unit });
        const msMultiplier = {
          minutes: 60 * 1000,
          hours: 60 * 60 * 1000,
          days: 24 * 60 * 60 * 1000
        };
        //@ts-ignore
        timestamp = now + (parsed.value * msMultiplier[parsed.unit]);
        console.log("Calculated relative timestamp:", timestamp);
      } else {
        console.log("Processing absolute time with:", { date: parsed.date, time: parsed.time });
        timestamp = new Date(`${parsed.date}T${parsed.time}`).getTime();
        console.log("Calculated absolute timestamp:", timestamp);
      }
  
      return await saveReminder(content, timestamp);
  
    } catch (error) {
      console.error('Error creating reminder:', error);

      return false;
    }
  }
  
  // Manual reminder creation with direct date and time inputs
  export async function createReminderManual(
    content: string, 
    date: string,    // YYYY-MM-DD format
    time: string     // HH:mm format
  ): Promise<boolean> {
    try {
      console.log("Creating manual reminder with:", { content, date, time });
  
      const timestamp = new Date(`${date}T${time}`).getTime();
      console.log("Calculated timestamp:", timestamp);
  
      if (isNaN(timestamp)) {
        throw new Error('Invalid date or time format');
      }
  
      return await saveReminder(content, timestamp);
  
    } catch (error) {
      console.error('Error creating manual reminder:', error);
      
      return false;
    }
  }
  
  // Helper function to save reminder to storage and create alarm
  async function saveReminder(content: string, timestamp: number): Promise<boolean> {
    try {
      const reminder: Reminder = {
        id: crypto.randomUUID(),
        content,
        timestamp,
        notified: false
      };
      console.log("Created reminder object:", reminder);
  
      // Get existing reminders
      const { reminders = [] } = await chrome.storage.local.get('reminders');
      console.log("Current reminders count:", reminders.length);
  
      // Add new reminder
      await chrome.storage.local.set({
        reminders: [...reminders, reminder]
      });
      console.log("Reminder added to storage");
  
      // Create alarm
      await chrome.alarms.create(`reminder_${reminder.id}`, {
        when: timestamp
      });
      console.log("Alarm created for reminder");
  
      return true;
    } catch (error) {
      console.error('Error saving reminder:', error);
      throw error; // Re-throw to be caught by the calling function
    }
  }
  
  // Get all reminders
  export async function getReminders(): Promise<Reminder[]> {
    const { reminders = [] } = await chrome.storage.local.get('reminders');
    return reminders;
  }
  
  // Delete a reminder
  export async function deleteReminder(id: string): Promise<boolean> {
    try {
      const { reminders = [] } = await chrome.storage.local.get('reminders');
      const updatedReminders = reminders.filter((r: Reminder) => r.id !== id);
      
      await chrome.storage.local.set({ reminders: updatedReminders });
      await chrome.alarms.clear(`reminder_${id}`);
      
      return true;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  }
  
  // Check and show due reminders
  export async function checkReminders(): Promise<void> {
    const { reminders = [] } = await chrome.storage.local.get('reminders');
    const now = Date.now();
  
    for (const reminder of reminders) {
      if (!reminder.notified && reminder.timestamp <= now) {
        // Show notification
        chrome.notifications.create(`notification_${reminder.id}`, {
          type: 'basic',
          iconUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          title: 'Reminder',
          message: reminder.content,
          buttons: [{ title: 'Dismiss' }],
          requireInteraction: true
        });
  
        // Mark as notified
        reminder.notified = true;
      }
    }
  
    // Update storage with notified reminders
    await chrome.storage.local.set({ reminders });
  }
  
  // Listen for alarm
  chrome.alarms.onAlarm.addListener(async (alarm) => {
    if (alarm.name.startsWith('reminder_')) {
      await checkReminders();
    }
  });
  
  // Listen for notification interaction
  chrome.notifications.onButtonClicked.addListener(async (notificationId) => {
    if (notificationId.startsWith('notification_')) {
      const reminderId = notificationId.replace('notification_', '');
      await deleteReminder(reminderId);
      chrome.notifications.clear(notificationId);
    }
  });