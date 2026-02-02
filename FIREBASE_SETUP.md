# Firebase Setup Guide

This project is now connected to Firebase for real-time database operations. Follow these steps to get your project up and running:

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a new project" or select an existing one
3. Follow the setup wizard to create your project
4. Select your region and accept the terms

## Step 2: Set Up Realtime Database

1. In the Firebase Console, go to **Build** → **Realtime Database**
2. Click **Create Database**
3. Choose your location (e.g., United States)
4. Start in **Test Mode** (for development)
5. Click **Enable**

## Step 3: Get Your Firebase Configuration

1. In the Firebase Console, click the **Project Settings** (gear icon)
2. Select the **General** tab
3. Scroll down to **Your apps** section
4. Click on the web app icon `</>`
5. You'll see your Firebase configuration object

## Step 4: Update Your Configuration

1. Open `script.js` in your project
2. Find this section at the top:
```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

3. Replace the `YOUR_*` placeholders with your actual Firebase configuration values

## Step 5: Set Database Rules (Important!)

For development/testing, set these rules in Firebase Console → Realtime Database → Rules:

```json
{
  "rules": {
    ".read": true,
    ".write": true
  }
}
```

⚠️ **WARNING**: These rules allow anyone to read/write. In production, use proper authentication:

```json
{
  "rules": {
    ".read": "auth != null",
    ".write": "auth != null"
  }
}
```

## Firebase Functions Used

### Saving Data
- `saveTransaction(transaction)` - Saves a payment transaction
- `addCard(cardData)` - Adds a new card
- `updateCard(cardNumber, cardData)` - Updates card information
- `saveUser(userId, userData)` - Saves user login info

### Retrieving Data
- `fetchTransactions()` - Gets all transactions
- `fetchCards()` - Gets all cards
- `fetchUser(userId)` - Gets a specific user

### Real-time Listening
- `listenToTransactions(callback)` - Listens for transaction updates in real-time

### Deleting Data
- `deleteTransaction(transactionId)` - Deletes a transaction

## Database Structure

Your Firebase Realtime Database will have this structure:

```
firebase-project/
├── users/
│   ├── cust_001/
│   │   ├── username
│   │   ├── name
│   │   ├── role
│   │   └── lastLogin
│   └── ...
├── transactions/
│   ├── TXN-000001/
│   │   ├── id
│   │   ├── customerId
│   │   ├── amount
│   │   ├── status
│   │   ├── date
│   │   └── description
│   └── ...
└── cards/
    ├── 4532123456789012/
    │   ├── cardNumber
    │   ├── holder
    │   ├── status
    │   ├── balance
    │   └── expiry
    └── ...
```

## Testing

1. Use the demo credentials:
   - **Customer**: username: `customer1`, password: `demo123`
   - **Merchant**: username: `merchant1`, password: `demo123`
   - **Admin**: username: `admin1`, password: `demo123`

2. When you log in or make a payment, data will be saved to Firebase
3. You can view the data in Firebase Console → Realtime Database

## Troubleshooting

- **Firebase not initializing**: Check your Firebase config values
- **Database write failed**: Ensure your database rules are set correctly
- **404 errors on CDN**: Check your internet connection or try clearing cache
- **No data appears**: Verify the database rules allow read/write access

## Next Steps

1. Add user authentication instead of demo login
2. Implement proper security rules
3. Add data validation
4. Set up Firebase Cloud Functions for backend logic
5. Migrate to Firebase Firestore for better scalability

For more information, visit [Firebase Documentation](https://firebase.google.com/docs/database)
