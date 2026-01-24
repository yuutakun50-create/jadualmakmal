export interface ScheduleCell {
  class: string;
  subject: string;
}

export interface DaySchedule {
  [period: number]: ScheduleCell;
}

export interface WeeklySchedule {
  [day: string]: DaySchedule;
}

export interface Booking {
  id: string;
  applicant: string;
  date: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  createdAt: string;
}

export interface MaintenanceState {
  [day: string]: {
    [period: number]: boolean;
  };
}

export const DAYS_MAP: Record<string, { label: string; bg: string }> = {
  mo: { label: "ISNIN", bg: "bg-yellow-300" },
  tu: { label: "SELASA", bg: "bg-green-300" },
  we: { label: "RABU", bg: "bg-blue-300" },
  th: { label: "KHAMIS", bg: "bg-orange-300" },
  fr: { label: "JUMAAT", bg: "bg-pink-300" }
};

export const PERIOD_TIMES = [
  "7.40-8.10", "8.10-8.40", "8.40-9.10", "9.10-9.40",
  "9.40-10.10", "10.10-10.40", "10.40-11.10", "11.10-11.40",
  "11.40-12.10", "12.10-12.40", "12.40-1.10", "1.10-1.40"
];
