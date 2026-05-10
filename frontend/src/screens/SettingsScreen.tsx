/**
 * Settings Screen
 * Configure API endpoint, app preferences, etc.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {apiClient} from '../services/ApiClient';
import {storageService} from '../services/StorageService';

const SettingsScreen = () => {
  const [apiUrl, setApiUrl] = useState('http://localhost:8000');
  const [loading, setLoading] = useState(false);
  const [testingApi, setTestingApi] = useState(false);
  const [apiStatus, setApiStatus] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const config = await storageService.getApiConfig();
      if (config?.baseURL) {
        setApiUrl(config.baseURL);
      }

      const settings = await storageService.getSettings();
      if (settings.darkMode !== undefined) {
        setDarkMode(settings.darkMode);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleTestApi = async () => {
    setTestingApi(true);
    setApiStatus(null);

    try {
      apiClient.setBaseURL(apiUrl);
      const health = await apiClient.checkHealth();
      if (health.status) {
        setApiStatus('✓ Connected successfully');
      }
    } catch (error: any) {
      setApiStatus('✗ Connection failed: ' + error.message);
    } finally {
      setTestingApi(false);
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      await storageService.saveApiConfig({baseURL: apiUrl});
      await storageService.saveSettings({darkMode});
      apiClient.setBaseURL(apiUrl);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    } finally {
      setLoading(false);
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all chat history and reset settings. This cannot be undone.',
      [
        {text: 'Cancel', onPress: () => {}},
        {
          text: 'Clear',
          onPress: async () => {
            try {
              await storageService.clearAll();
              await loadSettings();
              Alert.alert('Success', 'All data cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
          style: 'destructive',
        },
      ],
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* API Configuration */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>API Configuration</Text>

        <Text style={styles.label}>Backend URL</Text>
        <TextInput
          style={styles.input}
          placeholder="http://localhost:8000"
          value={apiUrl}
          onChangeText={setApiUrl}
          placeholderTextColor="#999"
        />

        <TouchableOpacity
          style={[styles.button, testingApi && styles.buttonDisabled]}
          onPress={handleTestApi}
          disabled={testingApi}>
          {testingApi ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Test Connection</Text>
          )}
        </TouchableOpacity>

        {apiStatus && (
          <Text
            style={[
              styles.statusText,
              apiStatus.includes('✓')
                ? styles.statusSuccess
                : styles.statusError,
            ]}>
            {apiStatus}
          </Text>
        )}
      </View>

      {/* Preferences */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>

        <View style={styles.switchRow}>
          <Text style={styles.label}>Dark Mode</Text>
          <Switch
            value={darkMode}
            onValueChange={setDarkMode}
            trackColor={{false: '#767577', true: '#81c784'}}
            thumbColor={darkMode ? '#2d6a2d' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Data Management */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>

        <TouchableOpacity
          style={[styles.button, styles.buttonDanger]}
          onPress={handleClearData}>
          <Text style={styles.buttonText}>Clear All Data</Text>
        </TouchableOpacity>

        <Text style={styles.helperText}>
          This will delete all chat history and reset settings.
        </Text>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>App Version</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>

        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>API Endpoint</Text>
          <Text style={styles.infoValue} numberOfLines={1}>
            {apiUrl}
          </Text>
        </View>
      </View>

      {/* Save Button */}
      <TouchableOpacity
        style={[styles.button, styles.buttonPrimary, loading && styles.buttonDisabled]}
        onPress={handleSaveSettings}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Save Settings</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f0',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2d6a2d',
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  button: {
    backgroundColor: '#2d6a2d',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  buttonPrimary: {
    backgroundColor: '#2d6a2d',
    marginTop: 16,
  },
  buttonDanger: {
    backgroundColor: '#d32f2f',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusText: {
    marginTop: 12,
    fontSize: 13,
    fontWeight: '500',
  },
  statusSuccess: {
    color: '#388e3c',
  },
  statusError: {
    color: '#d32f2f',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  infoLabel: {
    fontSize: 13,
    color: '#666',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    maxWidth: '50%',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default SettingsScreen;
