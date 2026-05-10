# Frontend React Native App

React Native mobile application for CocoCastAI.

## Setup

### Prerequisites

- Node.js 16+
- React Native CLI
- Android SDK or Xcode (for iOS)
- Cocoa Pods (for iOS dependencies)

### Installation

1. **Install dependencies:**

```bash
npm install
# or
yarn install
```

2. **Configure API Endpoint:**

Edit the API URL in the Settings screen or configure it in the app:

```typescript
// Default: http://localhost:8000
// For remote server: http://your-server-ip:8000
```

## Development

### Android

```bash
npm run android
# or
npx react-native run-android
```

### iOS

```bash
npm run ios
# or
npx react-native run-ios
```

### Start Metro Bundler

```bash
npm start
```

## Project Structure

```
frontend/
├── src/
│   ├── screens/
│   │   ├── ChatScreen.tsx       # Main chat interface
│   │   └── SettingsScreen.tsx   # Settings and configuration
│   ├── services/
│   │   ├── ApiClient.ts         # API communication
│   │   └── StorageService.ts    # Local storage management
│   └── constants/
├── App.tsx                       # Main app component
├── package.json
├── tsconfig.json
└── jest.config.js
```

## Features

- **Real-time Chat**: Ask questions about coconut farming
- **Chat History**: Persistent local storage of conversations
- **Source Attribution**: Shows document sources used for answers
- **API Configuration**: Set custom backend endpoint
- **Offline Support**: Chat history available offline
- **Responsive UI**: Mobile-optimized interface

## API Integration

The app communicates with the FastAPI backend using REST endpoints:

- `GET /health` - Check API health
- `POST /ask` - Submit a question and get an answer

## Configuration

### API Endpoint

Default: `http://localhost:8000`

Change in Settings screen or directly in code:

```typescript
import { apiClient } from './src/services/ApiClient';

apiClient.setBaseURL('http://your-server:8000');
```

## Testing

```bash
npm test
```

## Build Production

### Android

```bash
npm run build-android
```

### iOS

```bash
npm run build-ios
```

## Troubleshooting

### Connection Issues

1. Verify backend is running
2. Check API endpoint in Settings
3. Ensure firewall allows connections
4. For Android on emulator: use `10.0.2.2` instead of `localhost`

### Performance Issues

- Clear app cache
- Reinstall dependencies
- Check device storage

## License

MIT
