/**
 * Storage Service
 * Handles local storage operations for chat history, settings, etc.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface ChatMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: string;
  sources?: any[];
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEYS = {
  CHAT_HISTORY: 'chat_history',
  SETTINGS: 'settings',
  API_CONFIG: 'api_config',
  LAST_SESSION: 'last_session',
};

class StorageService {
  /**
   * Save chat session
   */
  async saveChatSession(session: ChatSession): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${STORAGE_KEYS.CHAT_HISTORY}:${session.id}`,
        JSON.stringify(session),
      );
    } catch (error) {
      console.error('Error saving chat session:', error);
      throw error;
    }
  }

  /**
   * Get chat session
   */
  async getChatSession(sessionId: string): Promise<ChatSession | null> {
    try {
      const data = await AsyncStorage.getItem(
        `${STORAGE_KEYS.CHAT_HISTORY}:${sessionId}`,
      );
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting chat session:', error);
      throw error;
    }
  }

  /**
   * Get all chat sessions
   */
  async getAllChatSessions(): Promise<ChatSession[]> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const chatKeys = keys.filter(key =>
        key.startsWith(STORAGE_KEYS.CHAT_HISTORY),
      );

      const sessions: ChatSession[] = [];
      for (const key of chatKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          sessions.push(JSON.parse(data));
        }
      }

      return sessions.sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
    } catch (error) {
      console.error('Error getting chat sessions:', error);
      throw error;
    }
  }

  /**
   * Delete chat session
   */
  async deleteChatSession(sessionId: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(
        `${STORAGE_KEYS.CHAT_HISTORY}:${sessionId}`,
      );
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  /**
   * Save settings
   */
  async saveSettings(settings: Record<string, any>): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.SETTINGS,
        JSON.stringify(settings),
      );
    } catch (error) {
      console.error('Error saving settings:', error);
      throw error;
    }
  }

  /**
   * Get settings
   */
  async getSettings(): Promise<Record<string, any>> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Save API configuration
   */
  async saveApiConfig(config: {baseURL: string}): Promise<void> {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.API_CONFIG,
        JSON.stringify(config),
      );
    } catch (error) {
      console.error('Error saving API config:', error);
      throw error;
    }
  }

  /**
   * Get API configuration
   */
  async getApiConfig(): Promise<{baseURL: string} | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.API_CONFIG);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting API config:', error);
      throw error;
    }
  }

  /**
   * Clear all data
   */
  async clearAll(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      await AsyncStorage.multiRemove(keys);
    } catch (error) {
      console.error('Error clearing storage:', error);
      throw error;
    }
  }
}

export const storageService = new StorageService();
export default StorageService;
