/**
 * Chat Screen
 * Main screen for the advisory chat interface
 */
import React, {useEffect, useState, useRef} from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import {apiClient, AnswerResponse} from '../services/ApiClient';
import {storageService, ChatMessage, ChatSession} from '../services/StorageService';

const ChatScreen = ({navigation}: {navigation: any}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const scrollViewRef = useRef<ScrollView>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Initialize session on component mount
  useEffect(() => {
    initializeSession();
    checkApiHealth();
  }, []);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }
  }, [messages]);

  /**
   * Initialize or load chat session
   */
  const initializeSession = async () => {
    try {
      const config = await storageService.getApiConfig();
      if (config?.baseURL) {
        apiClient.setBaseURL(config.baseURL);
      }

      const sessions = await storageService.getAllChatSessions();
      if (sessions.length > 0) {
        const lastSession = sessions[0];
        setSessionId(lastSession.id);
        setMessages(lastSession.messages);
      } else {
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
    }
  };

  /**
   * Check API health
   */
  const checkApiHealth = async () => {
    try {
      const health = await apiClient.checkHealth();
      setApiError(null);
    } catch (error: any) {
      setApiError('Unable to connect to backend. Check your settings.');
      console.error('API health check failed:', error);
    }
  };

  /**
   * Send question to API
   */
  const handleSendQuestion = async () => {
    if (!inputText.trim()) {
      return;
    }

    const question = inputText.trim();
    setInputText('');
    setLoading(true);
    setApiError(null);

    // Add question to chat
    const questionMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'question',
      content: question,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, questionMessage]);

    try {
      // Call API
      const response = await apiClient.askQuestion(question);

      // Add answer to chat
      const answerMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'answer',
        content: response.answer,
        timestamp: new Date().toISOString(),
        sources: response.sources,
      };

      setMessages(prev => [...prev, answerMessage]);

      // Save session
      if (sessionId) {
        await storageService.saveChatSession({
          id: sessionId,
          title: question.substring(0, 30) + '...',
          messages: [...messages, questionMessage, answerMessage],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    } catch (error: any) {
      console.error('Error sending question:', error);
      setApiError(
        error.message || 'Failed to get an answer. Please try again.',
      );

      // Add error message to chat
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'answer',
        content: `Error: ${error.message || 'Unable to process your question'}`,
        timestamp: new Date().toISOString(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render chat message
   */
  const renderMessage = (message: ChatMessage) => {
    const isQuestion = message.type === 'question';

    return (
      <View
        key={message.id}
        style={[
          styles.messageContainer,
          isQuestion ? styles.questionContainer : styles.answerContainer,
        ]}>
        <View
          style={[
            styles.messageBubble,
            isQuestion ? styles.questionBubble : styles.answerBubble,
          ]}>
          <Text
            style={[
              styles.messageText,
              isQuestion ? styles.questionText : styles.answerText,
            ]}>
            {message.content}
          </Text>
          {message.sources && message.sources.length > 0 && (
            <View style={styles.sourcesContainer}>
              <Text style={styles.sourcesLabel}>Sources:</Text>
              {message.sources.map((source, index) => (
                <Text key={index} style={styles.sourceText}>
                  • {source.title}
                </Text>
              ))}
            </View>
          )}
          <Text style={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#2d6a2d" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 25}>
        {/* API Error Banner */}
        {apiError && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{apiError}</Text>
            <TouchableOpacity
              onPress={() => {
                checkApiHealth();
              }}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}>
          {messages.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>Coconut Advisory System</Text>
              <Text style={styles.emptyText}>
                Ask me anything about coconut farming in Sri Lanka!
              </Text>
            </View>
          ) : (
            messages.map(message => renderMessage(message))
          )}

          {loading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2d6a2d" />
              <Text style={styles.loadingText}>Getting answer...</Text>
            </View>
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            placeholder="Ask a question..."
            placeholderTextColor="#999"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxHeight={100}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendButton, loading && styles.sendButtonDisabled]}
            onPress={handleSendQuestion}
            disabled={loading || !inputText.trim()}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  chatArea: {
    flex: 1,
    paddingHorizontal: 12,
  },
  chatContent: {
    paddingVertical: 16,
  },
  messageContainer: {
    marginBottom: 12,
    display: 'flex',
  },
  questionContainer: {
    alignItems: 'flex-end',
  },
  answerContainer: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    maxWidth: '85%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
  },
  questionBubble: {
    backgroundColor: '#2d6a2d',
  },
  answerBubble: {
    backgroundColor: '#e8f5e9',
    borderLeftWidth: 3,
    borderLeftColor: '#2d6a2d',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  questionText: {
    color: '#fff',
  },
  answerText: {
    color: '#333',
  },
  sourcesContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  sourcesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2d6a2d',
    marginBottom: 4,
  },
  sourceText: {
    fontSize: 11,
    color: '#555',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2d6a2d',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  inputArea: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    backgroundColor: '#f0f4f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    maxHeight: 100,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#2d6a2d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 10,
    color: '#2d6a2d',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#ffebee',
    borderBottomWidth: 1,
    borderBottomColor: '#ef5350',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#c62828',
    fontSize: 13,
    flex: 1,
  },
  retryText: {
    color: '#2d6a2d',
    fontWeight: '600',
    fontSize: 12,
  },
});

export default ChatScreen;
