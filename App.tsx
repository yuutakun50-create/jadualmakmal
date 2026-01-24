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
  const [schedule, setSchedule] = useState<WeeklySchedule>({});
  const [weekStart, setWeekStart] = useState<string>('');
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [adminPass, setAdminPass] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [futureBookings, setFutureBookings] = useState<Booking[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceState>({});
  const [loading, setLoading] = useState(true);

  // LOGIK AUTO ROLL: Sabtu & Ahad akan tunjuk minggu depan
  const calculateActiveWeekMonday = () => {
    const today = dayjs();
    const dayOfWeek = today.day(); // 0: Ahad, 6: Sabtu
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      return today.add(1, 'week').isoWeekday(1).format('YYYY-MM-DD');
    }
    return today.isoWeekday(1).format('YYYY-MM-DD');
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const activeMonday = calculateActiveWeekMonday();
      setWeekStart(activeMonday);

      const [schedData, bookingData, maintData] = await Promise.all([
        getData(`schedules/${activeMonday}`),
        getData('futureBookings'),
        getData('maintenance')
      ]);

      if (schedData) {
        setSchedule(schedData);
      } else {
        const empty: WeeklySchedule = {};
        Object.keys(DAYS_MAP).forEach(d => {
          empty[d] = {};
          for(let i=1; i<=12; i++) empty[d][i] = { class: '', subject: '' };
        });
        setSchedule(empty);
      }

      if (bookingData) setFutureBookings(bookingData);
      if (maintData) setMaintenance(maintData);
      
      setLoading(false);
    };
    fetchData();
  }, []);

  const handleCellChange = (day: string, period: number, field: 'class' | 'subject', value: string) => {
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) newSchedule[day] = {};
    if (!newSchedule[day][period]) newSchedule[day][period] = { class: '', subject: '' };
    
    newSchedule[day][period] = {
      ...newSchedule[day][period],
      [field]: value
    };
    
    setSchedule(newSchedule);
    saveData(`schedules/${weekStart}`, newSchedule);
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
      setAdminPass('');
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

  const isSlotBooked = (dayKey: string) => {
    if (!weekStart) return null;
    const dayIndexMap: Record<string, number> = { mo: 1, tu: 2, we: 3, th: 4, fr: 5 };
    const dayIdx = dayIndexMap[dayKey];
    if (!dayIdx) return null;
    const dateOfSlot = dayjs(weekStart).isoWeekday(dayIdx).format('YYYY-MM-DD');
    return futureBookings.find(b => b.status === 'approved' && b.date === dateOfSlot);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold text-teal-600">Memuatkan Jadual...</div>;

  const isNextWeekArrival = dayjs().day() === 6 || dayjs().day() === 0;

  return (
    <div className="max-w-full mx-auto bg-white min-h-screen p-4 sm:p-6">
      <header className="flex flex-col sm:flex-row items-center justify-between mb-6 pb-4 border-b-2 border-gray-200">
        <div className="flex items-center mb-3 sm:mb-0">
          <div className="relative group no-print">
            <img 
              src="https://i.imgur.com/wpfWEN4.jpeg" 
              alt="Logo SKSA" 
              onClick={() => setIsAdminOpen(true)}
              className="h-16 w-16 sm:h-20 sm:w-20 mr-4 rounded-md border-2 border-gray-300 object-contain bg-white cursor-pointer hover:scale-105 transition-transform active:scale-95" 
              title="Klik untuk Log Masuk Admin"
            />
            {futureBookings.some(b => b.status === 'pending') && (
              <span className="absolute -top-1 right-3 w-4 h-4 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            )}
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-tight">
              JADUAL MAKMAL KOMPUTER SKSA 2025
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-sm sm:text-lg text-gray-600 font-semibold bg-gray-100 px-3 py-1 rounded-full">
                📅 {dayjs(weekStart).format('DD/MM')} - {dayjs(weekStart).add(4, 'day').format('DD/MM/YYYY')}
              </p>
              {isNextWeekArrival && (
                <span className="text-[10px] sm:text-xs bg-amber-500 text-white px-2 py-1 rounded-md font-black uppercase tracking-wider no-print">
                  Minggu Ini
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 no-print w-full sm:w-auto">
          <button 
            onClick={() => setIsBookingOpen(true)}
            className="bg-emerald-600 text-white px-6 py-3 rounded-xl shadow-md hover:bg-emerald-700 font-black transition-all text-sm uppercase tracking-wide"
          >
            Borang Tempahan
          </button>
        </div>
      </header>

      <div className="overflow-x-auto w-full rounded-xl shadow-lg border border-gray-300">
        <table className="min-w-full border-collapse border-separate border-spacing-0">
          <thead>
            <tr className="bg-teal-800 text-white">
              <th className="sticky left-0 z-20 w-20 p-3 text-sm font-black border-2 border-black bg-teal-900 shadow-[2px_0_5px_rgba(0,0,0,0.3)]">
                HARI
              </th>
              {PERIOD_TIMES.map((t, i) => (
                <th key={i} className="p-1 border-2 border-black min-w-[85px] text-center">
                  <div className="text-[10px] font-black opacity-80">W{i+1}</div>
                  <div className="text-[9px] font-bold">{t}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(DAYS_MAP).map(([dayKey, dayInfo]) => {
              const bookedEvent = isSlotBooked(dayKey);
              return (
                <tr key={dayKey} className={`${dayInfo.bg} hover:brightness-95 transition-all`}>
                  <td className={`sticky left-0 z-10 p-2 text-base font-black border-2 border-black text-gray-900 text-center shadow-[2px_0_5px_rgba(0,0,0,0.1)] ${dayInfo.bg}`}>
                    {dayInfo.label}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((period) => {
                    const cell = schedule[dayKey]?.[period] || { class: '', subject: '' };
                    const isMaintenance = maintenance[dayKey]?.[period];

                    if (bookedEvent) {
                       return (
                         <td key={period} className="p-1 border-2 border-black bg-purple-200 text-center align-middle h-20">
                           <span className="text-[10px] font-black text-purple-900 leading-tight uppercase">
                             {bookedEvent.reason || "TEMPAHAN KHAS"}
                           </span>
                         </td>
                       );
                    }

                    if (isMaintenance) {
                      return (
                        <td key={period} className="p-1 border-2 border-black bg-gray-500 text-white opacity-80 text-center h-20">
                          <span className="text-[10px] font-black tracking-tighter">PENYELENGGARAAN</span>
                        </td>
                      );
                    }

                    return (
                      <td key={period} className="p-1 border-2 border-black bg-white h-20 min-w-[85px] transition-colors">
                        <select 
                          value={cell.class}
                          onChange={(e) => handleCellChange(dayKey, period, 'class', e.target.value)}
                          className="w-full text-[11px] font-bold p-1 mb-1 border rounded-md focus:ring-2 focus:ring-teal-500 outline-none appearance-none text-center cursor-pointer shadow-sm"
                          style={{ backgroundColor: CLASS_COLORS[cell.class] || 'white' }}
                        >
                          {DEFAULT_CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || "-"}</option>)}
                        </select>
                        <select 
                          value={cell.subject}
                          onChange={(e) => handleCellChange(dayKey, period, 'subject', e.target.value)}
                          className="w-full text-[10px] font-semibold p-1 border rounded-md focus:ring-2 focus:ring-teal-500 outline-none appearance-none text-center cursor-pointer bg-gray-50 shadow-sm"
                        >
                          {DEFAULT_SUBJECT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || "-"}</option>)}
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

      <div className="mt-8 p-5 bg-gradient-to-r from-yellow-50 to-orange-50 border-l-8 border-yellow-500 rounded-xl shadow-md no-print">
        <h3 className="text-xl font-black text-yellow-900 mb-3 flex items-center gap-2">
          ⚠️ TATACARA PENGGUNAAN LAPTOP
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 list-none text-sm font-semibold text-gray-800">
          <li className="flex items-start gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
            Guru meminta murid mengambil laptop di rak besi dengan tertib.
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
            Pastikan murid mencabut wayar "charger" dengan berhati-hati.
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
            Password laptop: <strong className="text-red-700 bg-red-100 px-2 rounded">123456</strong>.
          </li>
          <li className="flex items-start gap-2">
            <span className="bg-yellow-500 text-white rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
            Kembalikan laptop ke rak dan sambung semula "charger" selepas guna.
          </li>
        </ul>
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        onSubmit={handleBookingSubmit}
      />

      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {!isAuthenticated ? (
              <div className="text-center py-4">
                <h2 className="text-2xl font-black text-gray-800 mb-6">Log Masuk Pentadbir</h2>
                <div className="max-w-xs mx-auto">
                  <input 
                    type="password" 
                    className="border-2 border-gray-200 p-3 w-full rounded-xl mb-4 focus:border-blue-500 outline-none text-center text-lg tracking-widest" 
                    placeholder="KATA LALUAN"
                    value={adminPass}
                    onChange={e => setAdminPass(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                  />
                  <div className="flex gap-3">
                    <button onClick={() => setIsAdminOpen(false)} className="flex-1 px-4 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-colors">Batal</button>
                    <button onClick={handleAdminLogin} className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-colors">Masuk</button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-black text-gray-800">Panel Kawalan Pentadbir</h2>
                  <button onClick={() => setIsAdminOpen(false)} className="text-gray-400 hover:text-gray-600 font-black">TUTUP</button>
                </div>
                
                <div className="space-y-6">
                  <div className="border-2 border-gray-100 p-5 rounded-2xl bg-gray-50/50">
                    <h3 className="text-lg font-black text-teal-800 mb-4 flex items-center gap-2">
                      📋 Senarai Permohonan Tempahan
                    </h3>
                    {futureBookings.length === 0 ? (
                      <p className="text-sm text-gray-500 italic py-4 text-center bg-white rounded-xl border border-dashed border-gray-300">Tiada permohonan aktif buat masa ini.</p>
                    ) : (
                      <div className="space-y-3">
                        {futureBookings.map(b => (
                          <div key={b.id} className="bg-white p-4 border border-gray-200 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-sm">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-black text-teal-700 text-base">{b.applicant}</span>
                                <span className="text-[10px] bg-gray-100 px-2 py-0.5 rounded text-gray-500 font-bold">{dayjs(b.date).format('DD/MM/YYYY')}</span>
                              </div>
                              <p className="text-xs text-gray-600 font-medium italic mb-2">" {b.reason} "</p>
                              <span className={`text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-wider ${
                                b.status === 'approved' ? 'bg-green-100 text-green-700' :
                                b.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                'bg-yellow-100 text-yellow-700'
                              }`}>{b.status}</span>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                              {b.status === 'pending' && (
                                <>
                                  <button onClick={() => handleBookingAction(b.id, 'approved')} className="flex-1 sm:flex-none bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-green-700 shadow-md shadow-green-100">Lulus</button>
                                  <button onClick={() => handleBookingAction(b.id, 'rejected')} className="flex-1 sm:flex-none bg-orange-500 text-white px-4 py-2 rounded-lg text-xs font-black hover:bg-orange-600 shadow-md shadow-orange-100">Tolak</button>
                                </>
                              )}
                              <button onClick={() => handleBookingAction(b.id, 'delete')} className="flex-1 sm:flex-none bg-red-50 text-red-600 px-4 py-2 rounded-lg text-xs font-black hover:bg-red-100 transition-colors border border-red-100">Hapus</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-blue-50 border-2 border-blue-100 p-5 rounded-2xl">
                    <p className="text-xs text-blue-700 font-bold leading-relaxed">
                      💡 Nota: Maklumat jadual disimpan secara automatik sebaik sahaja anda menukar pilihan di dalam kotak jadual.
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                  <button onClick={() => setIsAdminOpen(false)} className="px-8 py-3 bg-gray-800 text-white rounded-xl font-black hover:bg-black transition-all shadow-xl">SELESAI</button>
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
