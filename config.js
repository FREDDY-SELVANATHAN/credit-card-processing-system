// ============ FIREBASE CONFIGURATION ============
// Replace with your Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyAU0bh5ZSHtwKdM62wjSywikcD-JXVl4Rg",
  authDomain: "ccps-4277f.firebaseapp.com",
  projectId: "ccps-4277f",
  storageBucket: "ccps-4277f.firebasestorage.app",
  messagingSenderId: "187400720437",
  appId: "1:187400720437:web:1750d9dc8000bb5c7fa17c",
  measurementId: "G-NY0GL5XN4W"
};

// Initialize Firebase
let db;
let auth;
let firebaseUI = null; // Global FirebaseUI instance
try {
    firebase.initializeApp(firebaseConfig);
    db = firebase.database();
    auth = firebase.auth();
    console.log('Firebase initialized successfully');
} catch (error) {
    console.warn('Firebase initialization skipped or failed:', error);
}
