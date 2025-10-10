# Dashboard Environment Variables

Create a `.env.local` file in the `/pre-dashboard` directory:

```bash
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef
```

You should already have these configured for your Firebase project.

## No Translation API Key Needed

The dashboard doesn't need a Google Cloud Translation API key because:
- Admins manually enter both English and Arabic text using `BilingualInput` components
- This ensures accurate, high-quality translations
- No API costs
- Better control over translations

## Next Steps

1. Ensure Firebase env vars are set
2. Install dependencies: `npm install`
3. Start the dashboard: `npm start`
4. Use `BilingualInput` components in your forms
5. Use `BilingualDisplay` to show bilingual data

