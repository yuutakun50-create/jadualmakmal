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

export interface ArchiveEntry {
  id: string;
  label: string;
  weekLabel: string;
  startDate: string;
  schedule: WeeklySchedule;
  comments: any[];
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
  mo: { label: "Mo", bg: "bg-yellow-300" },
  tu: { label: "Tu", bg: "bg-green-300" },
  we: { label: "We", bg: "bg-blue-300" },
  th: { label: "Th", bg: "bg-orange-300" },
  fr: { label: "Fr", bg: "bg-pink-300" }
};

export const PERIOD_TIMES = [
  "7.40-8.10", "8.10-8.40", "8.40-9.10", "9.10-9.40",
  "9.40-10.10", "10.10-10.40", "10.40-11.10", "11.10-11.40",
  "11.40-12.10", "12.10-12.40", "12.40-1.10", "1.10-1.40"
];
