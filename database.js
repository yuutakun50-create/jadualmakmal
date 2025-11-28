// ==========================================
// database.js — Firebase Module (Stable + Chat Comments + Maintenance + Future Bookings)
// ==========================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  set,
  update
} from "https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js";

// ==============================
// FIREBASE CONFIG — MILIK CIKGU
// ==============================
// (Pastikan config ini sama macam sebelum ini)
const firebaseConfig = {
  apiKey: "AIzaSyA-IS8pSogAb9pS9EGPMngtQv9B_vNmHmw",
  authDomain: "jadual-makmal-sksa.firebaseapp.com",
  databaseURL: "https://jadual-makmal-sksa-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "jadual-makmal-sksa",
  storageBucket: "jadual-makmal-sksa.firebasestorage.app",
  messagingSenderId: "1042517445810",
  appId: "1:1042517445810:web:1c3f635069f928adf75e0f"
};

// Init
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==============================
// Lokasi Data dalam Realtime DB
// ==============================
const PATHS = {
  schedule: "currentSchedule",
  archive: "archive",
  weekStart: "weekStart",
  weekLabel: "weekLabel",
  classOptions: "classOptions",
  subjectOptions: "subjectOptions",
  lastRolloverDate: "lastRolloverDate",
  weekComments: "weekComments",     // chat minggu semasa (array)
  maintenance: "maintenance",       // slot maintenance
  futureBookings: "futureBookings"  // tempahan makmal untuk tarikh akan datang
};

// ==============================
// Helper: baca root
// ==============================
async function readRoot() {
  const snapshot = await get(ref(db, "/"));
  if (snapshot.exists()) {
    return snapshot.val();
  }
  return {};
}

// ==============================
// EXPORT: loadInitialData()
// ==============================
export async function loadInitialData() {
  const data = await readRoot();

  return {
    schedule: data[PATHS.schedule] || null,
    archive: data[PATHS.archive] || [],
    weekStart: data[PATHS.weekStart] || null,
    weekLabel: data[PATHS.weekLabel] || "",
    classOptions: data[PATHS.classOptions] || [],
    subjectOptions: data[PATHS.subjectOptions] || [],
    lastRolloverDate: data[PATHS.lastRolloverDate] || null,
    // Chat minggu semasa (array mesej)
    weekComments: data[PATHS.weekComments] || [],
    // Peta maintenance (hari -> period -> true/false)
    maintenance: data[PATHS.maintenance] || null,
    // Senarai tempahan makmal (array objek)
    futureBookings: data[PATHS.futureBookings] || []
  };
}

// ==============================
// Simpan Jadual Mingguan
// ==============================
export async function saveScheduleToDB(scheduleObj) {
  try {
    await set(ref(db, PATHS.schedule), scheduleObj || {});
  } catch (err) {
    console.error("❌ Error simpan jadual:", err);
  }
}

// ==============================
// Simpan Arkib
// ==============================
export async function saveArchiveToDB(archiveArray) {
  try {
    await set(ref(db, PATHS.archive), archiveArray || []);
  } catch (err) {
    console.error("❌ Error simpan arkib:", err);
  }
}

// ==============================
// Simpan Tarikh Mula Minggu
// ==============================
export async function saveWeekStartToDB(weekStartStr) {
  try {
    await set(ref(db, PATHS.weekStart), weekStartStr);
  } catch (err) {
    console.error("❌ Error simpan weekStart:", err);
  }
}

// ==============================
// Simpan Label Minggu
// ==============================
export async function saveWeekLabelToDB(weekLabelStr) {
  try {
    await set(ref(db, PATHS.weekLabel), weekLabelStr || "");
  } catch (err) {
    console.error("❌ Error simpan weekLabel:", err);
  }
}

// ==============================
// Simpan Pilihan Dropdown
// ==============================
export async function saveOptionsToDB(classOptionsArray, subjectOptionsArray) {
  try {
    await update(ref(db, "/"), {
      [PATHS.classOptions]: classOptionsArray || [],
      [PATHS.subjectOptions]: subjectOptionsArray || []
    });
  } catch (err) {
    console.error("❌ Error simpan options:", err);
  }
}

// ==============================
// Simpan Tarikh Rollover Terakhir
// ==============================
export async function saveLastRolloverDateToDB(dateStr) {
  try {
    await set(ref(db, PATHS.lastRolloverDate), dateStr || null);
  } catch (err) {
    console.error("❌ Error simpan lastRolloverDate:", err);
  }
}

// ==============================
// Simpan Chat Mingguan
// weekComments = [{id, name, text, time}, ...]
// ==============================
export async function saveWeekCommentsToDB(commentsArray) {
  try {
    await set(ref(db, PATHS.weekComments), commentsArray || []);
  } catch (err) {
    console.error("❌ Error simpan weekComments:", err);
  }
}

// ==============================
// Simpan Peta Maintenance Slot
// ==============================
export async function saveMaintenanceToDB(maintenanceObj) {
  try {
    await set(ref(db, PATHS.maintenance), maintenanceObj || {});
  } catch (err) {
    console.error("❌ Error simpan maintenance:", err);
  }
}

// ==============================
// Simpan Senarai Tempahan Makmal
// futureBookings = [{id, date, reason, name, status, createdAt}, ...]
// ==============================
export async function saveFutureBookingsToDB(bookingsArray) {
  try {
    await set(ref(db, PATHS.futureBookings), bookingsArray || []);
  } catch (err) {
    console.error("❌ Error simpan futureBookings:", err);
  }
}
