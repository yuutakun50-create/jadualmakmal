// database.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.13.1/firebase-database.js";

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

async function safeGet(path, defaultValue) {
  try {
    const snap = await get(ref(db, path));
    if (snap.exists()) return snap.val();
    return defaultValue;
  } catch (err) {
    console.error("safeGet error:", path, err);
    return defaultValue;
  }
}

async function safeSet(path, value) {
  try {
    await set(ref(db, path), value);
  } catch (err) {
    console.error("safeSet error:", path, err);
    throw err;
  }
}

export async function loadInitialData() {
  const [
    schedule,
    archive,
    weekStart,
    weekLabel,
    classOptions,
    subjectOptions,
    lastRolloverDate,
    weekComments,
    maintenance,
    futureBookings
  ] = await Promise.all([
    safeGet("schedule", null),
    safeGet("archive", []),
    safeGet("weekStart", null),
    safeGet("weekLabel", ""),
    safeGet("classOptions", null),
    safeGet("subjectOptions", null),
    safeGet("lastRolloverDate", null),
    safeGet("weekComments", []),
    safeGet("maintenance", {}),
    safeGet("futureBookings", [])
  ]);

  return {
    schedule,
    archive,
    weekStart,
    weekLabel,
    classOptions,
    subjectOptions,
    lastRolloverDate,
    weekComments,
    maintenance,
    futureBookings
  };
}

export async function saveScheduleToDB(schedule) {
  await safeSet("schedule", schedule);
}

export async function saveArchiveToDB(archive) {
  await safeSet("archive", archive);
}

export async function saveWeekStartToDB(weekStartISO) {
  await safeSet("weekStart", weekStartISO);
}

export async function saveWeekLabelToDB(label) {
  await safeSet("weekLabel", label);
}

export async function saveOptionsToDB(classOptions, subjectOptions) {
  await Promise.all([
    safeSet("classOptions", classOptions),
    safeSet("subjectOptions", subjectOptions)
  ]);
}

export async function saveLastRolloverDateToDB(dateISO) {
  await safeSet("lastRolloverDate", dateISO);
}

export async function saveWeekCommentsToDB(comments) {
  await safeSet("weekComments", comments);
}

export async function saveMaintenanceToDB(maintenance) {
  await safeSet("maintenance", maintenance);
}

export async function saveFutureBookingsToDB(bookings) {
  await safeSet("futureBookings", bookings);
}
