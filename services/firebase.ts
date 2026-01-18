import { initializeApp } from "firebase/app";
import { getDatabase, ref, get, set, child } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAJ-eGCASGs7ZWoHtFgzcfcc2Y30jt_CWo",
  authDomain: "jadual-makmal-sksa.firebaseapp.com",
  databaseURL: "https://jadual-makmal-sksa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jadual-makmal-sksa",
  storageBucket: "jadual-makmal-sksa.firebasestorage.app",
  messagingSenderId: "660473497546",
  appId: "1:660473497546:web:97fc1bf2b25e6e6b583133"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export const dbRef = ref(db);

export const getData = async (path: string) => {
  try {
    const snapshot = await get(child(dbRef, path));
    if (snapshot.exists()) {
      return snapshot.val();
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error getting data", error);
    return null;
  }
};

export const saveData = async (path: string, data: any) => {
  try {
    await set(ref(db, path), data);
  } catch (error) {
    console.error("Error saving data", error);
    throw error;
  }
};
