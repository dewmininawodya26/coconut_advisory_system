/**
 * API Client Service
 * Handles communication with the backend API
 */
import axios, {AxiosInstance, AxiosError} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface QuestionRequest {
  question: string;
  context?: string;
}

export interface SourceDocument {
  title: string;
  content: string;
  metadata?: Record<string, any>;
}

export interface AnswerResponse {
  success: boolean;
  question: string;
  answer: string;
  sources: SourceDocument[];
  confidence?: number;
}

export interface HealthResponse {
  status: string;
  rag_chain_loaded: boolean;
  retriever_loaded: boolean;
}

// API Client Class
class ApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor(baseURL: string = 'http://localhost:8000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => this.handleError(error),
    );
  }

  /**
   * Set the API base URL (useful for production/staging)
   */
  setBaseURL(url: string) {
    this.baseURL = url;
    this.client.defaults.baseURL = url;
  }

  /**
   * Get current API base URL
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  /**
   * Check API health
   */
  async checkHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>('/health');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Ask a question to the advisory system
   */
  async askQuestion(question: string, context?: string): Promise<AnswerResponse> {
    try {
      const payload: QuestionRequest = {
        question,
        ...(context && {context}),
      };

      const response = await this.client.post<AnswerResponse>('/ask', payload);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get system information
   */
  async getSystemInfo() {
    try {
      const response = await this.client.get('/info');
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError | any) {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.detail || error.message || 'Unknown error';
      const statusCode = error.response?.status || 0;

      return {
        success: false,
        message,
        statusCode,
        error: error.response?.data,
      };
    }
    return {
      success: false,
      message: error.message || 'Unknown error',
    };
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
export default ApiClient;
