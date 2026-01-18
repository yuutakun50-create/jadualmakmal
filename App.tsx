import React, { useState, useEffect, useCallback } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { getData, saveData } from './services/firebase';
import BookingModal from './components/BookingModal';
import { 
  ScheduleCell, WeeklySchedule, DAYS_MAP, PERIOD_TIMES, 
  Booking, MaintenanceState 
} from './types';

dayjs.extend(isoWeek);

// Default Data Constants
const DEFAULT_CLASS_OPTIONS = ["", "1B","1C","1G", "2B","2C","2G", "3B","3C","3G", "4B","4C","4G", "5B","5C","5G", "6B","6C","6G", "Other"];
const DEFAULT_SUBJECT_OPTIONS = ["", "SJ","MT","BM","BI","RBT","TMK","PI","PJPK","PSV","MZ","Other"];

const CLASS_COLORS: Record<string, string> = {
  "1B": "#fed7d7", "1C": "#feebc8", "1G": "#cffafe",
  "2B": "#fefcbf", "2C": "#c6f6d5", "2G": "#a7f3d0",
  "3B": "#bee3f8", "3C": "#c3dafe", "3G": "#bfdbfe",
  "4B": "#e9d8fd", "4C": "#fbb6ce", "4G": "#f9a8d4",
  "5B": "#fed7d7", "5C": "#feebc8", "5G": "#facc15",
  "6B": "#fefcbf", "6C": "#c6f6d5", "6G": "#bbf7d0",
  "Other": "#e2e8f0"
};

const App: React.FC = () => {
  // State
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [weekStart, setWeekStart] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceState>({});
  const [loading, setLoading] = useState(true);

  // Initialize Data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [schedData, weekData, bookingData, maintData] = await Promise.all([
        getData('schedule'),
        getData('weekStart'),
        getData('futureBookings'),
        getData('maintenance')
      ]);

      if (schedData) setSchedule(schedData);
      else {
        // Init empty schedule
        const empty: WeeklySchedule = {};
        Object.keys(DAYS_MAP).forEach(d => {
          empty[d] = {};
          for(let i=1; i<=12; i++) empty[d][i] = { class: '', subject: '' };
        });
        setSchedule(empty);
      }

      if (weekData) setWeekStart(weekData);
      else setWeekStart(dayjs().isoWeekday(1).format('YYYY-MM-DD'));

      if (bookingData) setFutureBookings(bookingData);
      if (maintData) setMaintenance(maintData);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  // Save Schedule Handler
  const handleCellChange = (day: string, period: number, field: 'class' | 'subject', value: string) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) newSchedule[day] = {};
    if (!newSchedule[day][period]) newSchedule[day][period] = { class: '', subject: '' };
    
    newSchedule[day][period] = {
      ...newSchedule[day][period],
      [field]: value
    };
    
    setSchedule(newSchedule);
    // Debounced save could go here, for now saving directly
    saveData('schedule', newSchedule);
  };

  const handleBookingSubmit = async (data: Omit<Booking, 'id' | 'status' | 'createdAt'>) => {
    const newBooking: Booking = {
      ...data,
      id: Date.now().toString(),
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    const updatedBookings = [...futureBookings, newBooking];
    setFutureBookings(updatedBookings);
    await saveData('futureBookings', updatedBookings);
    alert("Permohonan dihantar!");
  };

  const handleAdminLogin = () => {
    if (adminPass === 'admin123') {
      setIsAuthenticated(true);
    } else {
      alert("Kata laluan salah!");
    }
  };

  const handleBookingAction = async (id: string, action: 'approved' | 'rejected' | 'delete') => {
    let updated = [...futureBookings];
    if (action === 'delete') {
      updated = updated.filter(b => b.id !== id);
    } else {
      const idx = updated.findIndex(b => b.id === id);
      if (idx !== -1) updated[idx].status = action;
    }
    setFutureBookings(updated);
    await saveData('futureBookings', updated);
  };

  // Helper to check if a slot is locked by an approved booking
  const isSlotBooked = (dayKey: string) => {
    if (!weekStart) return null;
    
    // Map dayKey (mo, tu...) to actual date of current week
    const dayIndexMap: Record<string, number> = { mo: 1, tu: 2, we: 3, th: 4, fr: 5 };
    const dayIdx = dayIndexMap[dayKey];
    if (!dayIdx) return null;

    const dateOfSlot = dayjs(weekStart).isoWeekday(dayIdx).format('YYYY-MM-DD');

    const booking = futureBookings.find(b => 
      b.status === 'approved' && b.date === dateOfSlot
    );
    
    return booking;
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <div className="max-w-full mx-auto bg-white min-h-screen p-4 sm:p-6">
      
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center mb-3 sm:mb-0">
          {/* LOGO CHANGE HERE */}
          <img 
            src="https://i.imgur.com/wpfWEN4.jpeg" 
            alt="Logo SKSA" 
            className="h-16 w-16 sm:h-20 sm:w-20 mr-4 rounded-md border-2 border-gray-300 no-print object-contain bg-white" 
          />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800">
              JADUAL MAKMAL KOMPUTER SK SRI AMAN 2025
            </h1>
            <p className="text-base sm:text-lg text-gray-600 font-medium">
              TARIKH: {dayjs(weekStart).format('DD/MM/YYYY')} - {dayjs(weekStart).add(4, 'day').format('DD/MM/YYYY')}
            </p>
          </div>
        </div>
        <div className="flex flex-col gap-2 no-print">
          <button 
            onClick={() => setIsAdminOpen(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg shadow hover:bg-blue-700 font-medium relative"
          >
            Panel Admin
            {futureBookings.some(b => b.status === 'pending') && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="bg-emerald-600 text-white px-4 py-2 rounded-lg shadow hover:bg-emerald-700 font-medium"
          >
            Tempahan
          </button>
        </div>
      </header>

      {/* SCHEDULE TABLE */}
      <div className="overflow-x-auto w-full rounded-xl shadow-inner border border-gray-200">
        <table className="min-w-full border-2 border-black border-collapse">
          <thead className="bg-teal-700 text-teal-50">
            <tr>
              <th className="w-24 p-2 text-sm font-bold border-2 border-black uppercase bg-teal-800 text-white">HARI</th>
              {PERIOD_TIMES.map((t, i) => (
                <th key={i} className="p-1 border-2 border-black min-w-[80px]">
                  <div className="text-xs font-bold text-white">W{i+1}</div>
                  <div className="text-[10px] text-teal-100">{t}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(DAYS_MAP).map(([dayKey, dayInfo]) => {
              const bookedEvent = isSlotBooked(dayKey);
              
              return (
                <tr key={dayKey} className={dayInfo.bg}>
                  <td className="p-2 text-lg font-bold border-2 border-black text-gray-800 text-center">
                    {dayInfo.label}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((period) => {
                    const cell = schedule[dayKey]?.[period] || { class: '', subject: '' };
                    const isMaintenance = maintenance[dayKey]?.[period];

                    // Determine Render Content
                    if (bookedEvent) {
                       return (
                         <td key={period} className="p-1 border-2 border-black bg-purple-100 text-center align-middle h-20">
                           <span className="text-xs font-bold text-purple-900 block leading-tight">
                             {bookedEvent.reason || "Tempahan Khas"}
                           </span>
                         </td>
                       );
                    }

                    if (isMaintenance) {
                      return (
                        <td key={period} className="p-1 border-2 border-black bg-gray-400 opacity-50 text-center h-20">
                          <span className="text-[10px] font-bold">MAINTENANCE</span>
                        </td>
                      );
                    }

                    // Standard Cell
                    return (
                      <td key={period} className="p-1 border-2 border-black bg-white h-20 min-w-[80px]">
                        <select 
                          value={cell.class}
                          onChange={(e) => handleCellChange(dayKey, period, 'class', e.target.value)}
                          className="w-full text-xs p-1 mb-1 border rounded"
                          style={{ backgroundColor: CLASS_COLORS[cell.class] || 'white' }}
                        >
                          {DEFAULT_CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                        <select 
                          value={cell.subject}
                          onChange={(e) => handleCellChange(dayKey, period, 'subject', e.target.value)}
                          className="w-full text-xs p-1 border rounded"
                        >
                          {DEFAULT_SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* FOOTER INFO */}
      <div className="mt-8 p-4 bg-yellow-100 border-l-4 border-yellow-500 rounded-lg no-print">
        <h3 className="text-lg font-bold text-yellow-800 mb-2">TATACARA PENGGUNAAN LAPTOP</h3>
        <ul className="list-decimal list-inside text-sm text-gray-700 space-y-1">
          <li>Guru meminta murid mengambil laptop di rak besi.</li>
          <li>Pastikan murid mencabut wayar "charger" dengan tertib.</li>
          <li>Password laptop: <strong className="text-red-600">123456</strong>.</li>
          <li>Kembalikan laptop ke rak dengan kemas selepas digunakan.</li>
        </ul>
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        onSubmit={handleBookingSubmit}
      />

      {/* ADMIN MODAL (Simplified for React Demo) */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {!isAuthenticated ? (
              <div>
                <h2 className="text-xl font-bold mb-4">Admin Login</h2>
                <input 
                  type="password" 
                  className="border p-2 w-full rounded mb-4" 
                  placeholder="Password"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setIsAdminOpen(false)} className="px-4 py-2 bg-gray-300 rounded">Batal</button>
                  <button onClick={handleAdminLogin} className="px-4 py-2 bg-blue-600 text-white rounded">Masuk</button>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-xl font-bold mb-4">Panel Admin</h2>
                
                <div className="mb-6 border p-4 rounded bg-gray-50">
                   <h3 className="font-bold mb-2">Permohonan Tempahan</h3>
                   {futureBookings.length === 0 && <p className="text-sm text-gray-500">Tiada permohonan.</p>}
                   <ul className="space-y-2">
                     {futureBookings.map(b => (
                       <li key={b.id} className="bg-white p-2 border rounded flex justify-between items-center text-sm">
                         <div>
                           <span className="font-bold text-emerald-700">{b.applicant}</span>
                           <span className="text-gray-500 mx-2">|</span>
                           <span>{b.date}</span>
                           <br/>
                           <span className="text-gray-600 text-xs">{b.reason}</span>
                           <div className="mt-1">
                             <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                               b.status === 'approved' ? 'bg-green-100 text-green-800' :
                               b.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                               'bg-yellow-100 text-yellow-800'
                             }`}>{b.status.toUpperCase()}</span>
                           </div>
                         </div>
                         <div className="flex gap-1">
                           {b.status === 'pending' && (
                             <>
                               <button onClick={() => handleBookingAction(b.id, 'approved')} className="bg-green-500 text-white px-2 py-1 rounded text-xs">Lulus</button>
                               <button onClick={() => handleBookingAction(b.id, 'rejected')} className="bg-orange-500 text-white px-2 py-1 rounded text-xs">Tolak</button>
                             </>
                           )}
                           <button onClick={() => handleBookingAction(b.id, 'delete')} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Hapus</button>
                         </div>
                       </li>
                     ))}
                   </ul>
                </div>

                <div className="flex justify-end mt-4">
                  <button onClick={() => setIsAdminOpen(false)} className="px-4 py-2 bg-gray-500 text-white rounded">Tutup</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default App;