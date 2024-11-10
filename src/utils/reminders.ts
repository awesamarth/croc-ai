// src/utils/reminders.ts

export interface Reminder {
    id: string;
    content: string;
    timestamp: number;
    notified: boolean;
  }
  
  // Create a reminder
  export async function createReminder(content: string, date: string, time: string): Promise<boolean> {
    try {
      // Combine date and time into a timestamp
      const dateTimeString = `${date}T${time}`;
      const timestamp = new Date(dateTimeString).getTime();
      
      if (isNaN(timestamp)) {
        throw new Error('Invalid date or time format');
      }
  
      const reminder: Reminder = {
        id: crypto.randomUUID(),
        content,
        timestamp,
        notified: false
      };
  
      // Get existing reminders
      const { reminders = [] } = await chrome.storage.local.get('reminders');
      
      // Add new reminder
      await chrome.storage.local.set({
        reminders: [...reminders, reminder]
      });
  
      // Create an alarm for this reminder
      await chrome.alarms.create(`reminder_${reminder.id}`, {
        when: timestamp
      });
  
      return true;
    } catch (error) {
      console.error('Error creating reminder:', error);
      return false;
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