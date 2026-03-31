import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Import the Firebase configuration
import firebaseConfig from '../firebase-applet-config.json';

// Initialize Firebase SDK
console.log("Initializing Firebase with project:", firebaseConfig.projectId);
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

const dbId = firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== '(default)' 
  ? firebaseConfig.firestoreDatabaseId 
  : '(default)';

console.log("Using Firestore database:", dbId);
export const db = dbId !== '(default)' 
  ? getFirestore(app, dbId) 
  : getFirestore(app);

export const auth = getAuth(app);

// Initialize Analytics conditionally (it only works in the browser)
export const analytics = typeof window !== 'undefined' ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;
