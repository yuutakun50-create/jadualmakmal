// ==========================================
// database.js — Firebase Module
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
// FIREBASE CONFIG — ISI DENGAN CONFIG CIKGU
// (ambil daripada projek Firebase sedia ada)
// ==============================
const firebaseConfig = {
  // CONTOH SAHAJA:
  // apiKey: "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  // authDomain: "xxxxxxxxxx.firebaseapp.com",
  // databaseURL: "https://xxxxxxxxxx-default-rtdb.asia-southeast1.firebasedatabase.app",
  // projectId: "xxxxxxxxxx",
  // storageBucket: "xxxxxxxxxx.appspot.com",
  // messagingSenderId: "xxxxxxxxxxxx",
  // appId: "1:xxxxxxxxxxxx:web:xxxxxxxxxxxxxxxx"
};

// >>> JANGAN LUPA: tampal nilai sebenar config di atas sebelum guna <<<

// Init Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ==============================
// Laluan (path) dalam Realtime DB
// ==============================
const PATHS = {
  schedule: "currentSchedule",
  archive: "archive",
  weekStart: "weekStart",
  weekLabel: "weekLabel",
  classOptions: "classOptions",
  subjectOptions: "subjectOptions",
  lastRolloverDate: "lastRolloverDate",
  weekComments: "weekComments",
  maintenance: "maintenance",
  futureBookings: "futureBookings"
};

// ==============================
// Helper: Baca root database
// ==============================
async function readRoot() {
  try {
    const rootRef = ref(db, "/");
    const snap = await get(rootRef);
    return snap.exists() ? snap.val() : {};
  } catch (err) {
    console.error("❌ Firebase readRoot error:", err);
    return {};
  }
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
    weekComments: data[PATHS.weekComments] || [],
    maintenance: data[PATHS.maintenance] || null,
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
// Simpan Arkib Mingguan
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
export async function saveWeekStartToDB(weekStartString) {
  try {
    await set(ref(db, PATHS.weekStart), weekStartString || null);
  } catch (err) {
    console.error("❌ Error simpan weekStart:", err);
  }
}

// ==============================
// Simpan Label Minggu
// ==============================
export async function saveWeekLabelToDB(weekLabel) {
  try {
    await set(ref(db, PATHS.weekLabel), weekLabel || "");
  } catch (err) {
    console.error("❌ Error simpan weekLabel:", err);
  }
}

// ==============================
// Simpan Pilihan Dropdown (kelas & subjek)
// ==============================
export async function saveOptionsToDB(classOptions, subjectOptions) {
  try {
    await update(ref(db, "/"), {
      [PATHS.classOptions]: classOptions || [],
      [PATHS.subjectOptions]: subjectOptions || []
    });
  } catch (err) {
    console.error("❌ Error simpan options:", err);
  }
}

// ==============================
// Simpan Tarikh Auto-Rollover
// ==============================
export async function saveLastRolloverDateToDB(dateString) {
  try {
    await set(ref(db, PATHS.lastRolloverDate), dateString || null);
  } catch (err) {
    console.error("❌ Error simpan lastRolloverDate:", err);
  }
}

// ==============================
// Simpan Komen Minggu Semasa
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
// Simpan Senarai Tempahan Masa Depan
// ==============================
export async function saveFutureBookingsToDB(bookingsArray) {
  try {
    await set(ref(db, PATHS.futureBookings), bookingsArray || []);
  } catch (err) {
    console.error("❌ Error simpan futureBookings:", err);
  }
}
