import React, { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import 'dayjs/locale/ms'; 
import { getData, saveData } from './services/firebase';
import BookingModal from './components/BookingModal';
import { 
  WeeklySchedule, DAYS_MAP, PERIOD_TIMES, 
  Booking, MaintenanceState 
} from './types';

dayjs.extend(isoWeek);
dayjs.locale('ms'); 

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
  const [persistentSlots, setPersistentSlots] = useState<WeeklySchedule>({});
  const [loading, setLoading] = useState(true);
  const [adminView, setAdminView] = useState('bookings'); 
  const [isLockMode, setIsLockMode] = useState(false);
  const [archivesList, setArchivesList] = useState<any>(null);
  const [viewingPath, setViewingPath] = useState<string | null>(null);

  const getArchivePath = (mondayDate: string) => {
    const m = dayjs(mondayDate);
    const weekOfMonth = Math.ceil(m.date() / 7);
    return `archives/${m.format('YYYY')}/${m.format('MMMM')}/Minggu ${weekOfMonth} (${m.format('D')}-${m.add(4, 'day').format('D MMM YYYY')})`;
  };

  const calculateActiveWeekMonday = () => {
    const today = dayjs();
    const dayOfWeek = today.day(); 
    if (dayOfWeek === 6 || dayOfWeek === 0) {
      return today.add(1, 'week').isoWeekday(1).format('YYYY-MM-DD');
    }
    return today.isoWeekday(1).format('YYYY-MM-DD');
  };

  const fetchData = async (customPath?: string) => {
    setLoading(true);
    const activeMonday = calculateActiveWeekMonday();
    if (!customPath) setWeekStart(activeMonday);

    const path = customPath || getArchivePath(activeMonday);
    setViewingPath(path);
    
    const [schedData, bookingData, maintData, persistData, allArchives] = await Promise.all([
      getData(path),
      getData('futureBookings'),
      getData('maintenance'),
      getData('persistentSlots'),
      getData('archives')
    ]);

    setArchivesList(allArchives);
    setPersistentSlots(persistData || {});

    if (schedData) {
      setSchedule(schedData);
    } else {
      const newSched: WeeklySchedule = {};
      Object.keys(DAYS_MAP).forEach(d => {
        newSched[d] = {};
        for(let i=1; i<=12; i++) {
          newSched[d][i] = persistData?.[d]?.[i] || { class: '', subject: '' };
        }
      });
      setSchedule(newSched);
      if (!customPath) saveData(path, newSched);
    }

    if (bookingData) setFutureBookings(bookingData);
    if (maintData) setMaintenance(maintData);
    
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCellChange = (day: string, period: number, field: 'class' | 'subject', value: string) => {
    if (viewingPath !== getArchivePath(weekStart) && !isAuthenticated) return;
    
    const newSchedule = { ...schedule };
    if (!newSchedule[day]) newSchedule[day] = {};
    if (!newSchedule[day][period]) newSchedule[day][period] = { class: '', subject: '' };
    
    newSchedule[day][period] = { ...newSchedule[day][period], [field]: value };
    setSchedule(newSchedule);
    
    if (viewingPath) saveData(viewingPath, newSchedule);
  };

  const togglePersistentSlot = async (day: string, period: number) => {
    if (!isAuthenticated || !isLockMode) return;
    
    const newPersist = { ...persistentSlots };
    if (!newPersist[day]) newPersist[day] = {};
    
    const currentCell = schedule[day]?.[period];
    
    if (newPersist[day][period]) {
      delete newPersist[day][period];
    } else if (currentCell && (currentCell.class || currentCell.subject)) {
      newPersist[day][period] = { ...currentCell };
    } else {
      alert("Sila isi Kelas/Subjek sebelum Lock.");
      return;
    }

    setPersistentSlots(newPersist);
    await saveData('persistentSlots', newPersist);
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
      alert("Salah!");
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

  const toggleMaintenance = async (day: string, period: number) => {
    const newMaint = { ...maintenance };
    if (!newMaint[day]) newMaint[day] = {};
    newMaint[day][period] = !newMaint[day][period];
    setMaintenance(newMaint);
    await saveData('maintenance', newMaint);
  };

  const isSlotBooked = (dayKey: string) => {
    if (!weekStart || viewingPath !== getArchivePath(weekStart)) return null;
    const dayIndexMap: Record<string, number> = { mo: 1, tu: 2, we: 3, th: 4, fr: 5 };
    const dayIdx = dayIndexMap[dayKey];
    const dateOfSlot = dayjs(weekStart).isoWeekday(dayIdx).format('YYYY-MM-DD');
    return futureBookings.find(b => b.status === 'approved' && b.date === dateOfSlot);
  };

  if (loading) return <div className="flex h-screen items-center justify-center font-bold">Memuatkan...</div>;

  const isCurrentWeek = viewingPath === getArchivePath(calculateActiveWeekMonday());

  return (
    <div className="max-w-4xl mx-auto bg-white min-h-screen p-4">
      {/* Header Visual Asal */}
      <header className="flex items-center gap-4 mb-4">
        <img 
          src="https://i.imgur.com/wpfWEN4.jpeg" 
          alt="Logo SKSA" 
          onClick={() => setIsAdminOpen(true)}
          className="h-16 w-16 cursor-pointer border-2 border-gray-200 rounded p-1" 
        />
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 uppercase leading-tight">
            JADUAL MAKMAL KOMPUTER SKSA 2025
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-gray-100 px-2 py-1 rounded text-xs font-semibold text-gray-600 border flex items-center gap-1">
              📅 {viewingPath?.split('/').pop()}
            </span>
            {isCurrentWeek && (
              <span className="bg-amber-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">Minggu Ini</span>
            )}
            {!isCurrentWeek && (
               <button onClick={() => fetchData()} className="bg-teal-600 text-white px-2 py-1 rounded text-[10px] font-bold uppercase no-print">Balik Semasa</button>
            )}
          </div>
        </div>
      </header>

      {/* Button Visual Asal */}
      <div className="mb-6 no-print">
        <button 
          onClick={() => setIsBookingOpen(true)}
          className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-lg uppercase shadow-md hover:bg-emerald-700 transition-colors"
        >
          BORANG TEMPAHAN
        </button>
      </div>

      {isLockMode && isAuthenticated && (
        <div className="mb-4 bg-red-600 text-white p-2 rounded text-xs font-bold flex justify-between items-center animate-pulse">
          <span>🔒 MOD LOCK AKTIF: Klik pada slot jadual untuk mengunci.</span>
          <button onClick={() => setIsLockMode(false)} className="bg-white text-red-600 px-2 py-1 rounded">Tutup</button>
        </div>
      )}

      {/* Table Visual Asal */}
      <div className="overflow-x-auto border-2 border-black rounded shadow-sm">
        <table className="min-w-full border-collapse">
          <thead>
            <tr className="bg-[#004d40] text-white">
              <th className="border-2 border-black p-2 text-sm font-bold w-20">HARI</th>
              {PERIOD_TIMES.map((t, i) => (
                <th key={i} className="border-2 border-black p-1 text-[10px] min-w-[80px]">
                  <div>W{i+1}</div>
                  <div className="font-normal opacity-80">{t}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(DAYS_MAP).map(([dayKey, dayInfo]) => {
              const bookedEvent = isSlotBooked(dayKey);
              return (
                <tr key={dayKey}>
                  <td className={`border-2 border-black p-2 text-center font-bold text-lg ${dayInfo.bg}`}>
                    {dayInfo.label.substring(0,2)}
                  </td>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((period) => {
                    const cell = schedule[dayKey]?.[period] || { class: '', subject: '' };
                    const isMaint = maintenance[dayKey]?.[period];
                    const isPersistent = persistentSlots[dayKey]?.[period];

                    if (bookedEvent) {
                       return (
                         <td key={period} className="border-2 border-black bg-purple-100 p-1 text-center h-20 align-middle">
                           <div className="text-[10px] font-bold text-purple-900 leading-tight line-clamp-2">
                             {bookedEvent.applicant}
                           </div>
                           <div className="text-[8px] opacity-75">{bookedEvent.reason}</div>
                         </td>
                       );
                    }

                    if (isMaint) {
                      return <td key={period} className="border-2 border-black bg-gray-500 text-white text-[8px] text-center p-1 h-20 opacity-50">LOCK</td>;
                    }

                    return (
                      <td 
                        key={period} 
                        onClick={() => togglePersistentSlot(dayKey, period)}
                        className={`border-2 border-black p-1 h-20 min-w-[80px] transition-colors relative ${isPersistent ? 'ring-2 ring-inset ring-blue-500' : ''} ${isLockMode ? 'cursor-pointer hover:bg-red-50' : ''}`}
                      >
                        {isPersistent && <span className="absolute top-0 right-0 text-[8px] bg-blue-600 text-white px-0.5 rounded-bl">🔒</span>}
                        <select 
                          value={cell.class}
                          disabled={!isCurrentWeek && !isAuthenticated}
                          onChange={(e) => handleCellChange(dayKey, period, 'class', e.target.value)}
                          className="w-full text-[11px] font-bold p-1 mb-1 border rounded bg-white text-center appearance-none shadow-sm"
                          style={{ backgroundColor: CLASS_COLORS[cell.class] || 'white' }}
                        >
                          {DEFAULT_CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt || "-"}</option>)}
                        </select>
                        <select 
                          value={cell.subject}
                          disabled={!isCurrentWeek && !isAuthenticated}
                          onChange={(e) => handleCellChange(dayKey, period, 'subject', e.target.value)}
                          className="w-full text-[10px] font-semibold p-0.5 border rounded bg-gray-50 text-center appearance-none shadow-sm"
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

      {/* Warning Visual Asal */}
      <div className="mt-8 p-4 bg-yellow-50 border-l-4 border-yellow-500 rounded no-print">
        <h3 className="text-lg font-bold text-yellow-900 mb-2 flex items-center gap-2">
          ⚠️ TATACARA PENGGUNAAN LAPTOP
        </h3>
        <ol className="list-decimal list-inside text-sm font-semibold text-gray-800 space-y-2">
          <li>Guru meminta murid mengambil laptop di rak dengan tertib.</li>
          <li>Pastikan laptop diletakkan semula ke rak asal selepas guna.</li>
          <li>Sambung semula wayar pengecas (charger) selepas simpan.</li>
        </ol>
      </div>

      <BookingModal 
        isOpen={isBookingOpen} 
        onClose={() => setIsBookingOpen(false)} 
        onSubmit={handleBookingSubmit}
      />

      {/* Admin Modal Visual Asal dengan Dropdown */}
      {isAdminOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            {!isAuthenticated ? (
              <div className="py-4">
                <h2 className="text-xl font-bold mb-4 text-center">LOGIN ADMIN</h2>
                <input 
                  type="password" 
                  className="border-2 p-3 w-full rounded mb-4 text-center font-bold" 
                  placeholder="KATA LALUAN"
                  value={adminPass}
                  onChange={e => setAdminPass(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                />
                <div className="flex gap-2">
                  <button onClick={() => setIsAdminOpen(false)} className="flex-1 bg-gray-200 p-2 rounded font-bold">Batal</button>
                  <button onClick={handleAdminLogin} className="flex-1 bg-emerald-600 text-white p-2 rounded font-bold">Masuk</button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center mb-4 pb-2 border-b">
                  <h2 className="font-bold uppercase tracking-tight">⚙️ PENTADBIR</h2>
                  <button onClick={() => setIsAdminOpen(false)} className="text-red-500 font-bold">✕</button>
                </div>

                <div className="mb-4">
                  <select 
                    value={adminView}
                    onChange={(e) => setAdminView(e.target.value)}
                    className="w-full p-3 border-2 rounded font-bold bg-gray-50"
                  >
                    <option value="bookings">📅 Kelulusan Tempahan</option>
                    <option value="lock_slots">🔒 Urus Slot Lock (Auto-Carry)</option>
                    <option value="archives">📂 Lihat Arkib Sejarah</option>
                    <option value="maintenance">🔧 Maintenance (Lock Slot)</option>
                  </select>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3">
                  {adminView === 'bookings' && (
                    <div className="space-y-2">
                      {futureBookings.length === 0 ? <p className="text-center text-xs text-gray-400 py-4 italic">Tiada tempahan baru.</p> :
                        futureBookings.map(b => (
                          <div key={b.id} className="p-3 border rounded-lg bg-gray-50 text-xs">
                            <div className="flex justify-between font-bold text-emerald-800">
                               <span>{b.applicant}</span>
                               <span>{b.date}</span>
                            </div>
                            <p className="mt-1 font-medium">"{b.reason}"</p>
                            <div className="mt-2 flex gap-1">
                              {b.status === 'pending' && (
                                <>
                                  <button onClick={() => handleBookingAction(b.id, 'approved')} className="bg-green-600 text-white px-2 py-1 rounded">Lulus</button>
                                  <button onClick={() => handleBookingAction(b.id, 'rejected')} className="bg-red-500 text-white px-2 py-1 rounded">Tolak</button>
                                </>
                              )}
                              <button onClick={() => handleBookingAction(b.id, 'delete')} className="bg-gray-200 px-2 py-1 rounded text-gray-500 ml-auto">Padam</button>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  )}

                  {adminView === 'lock_slots' && (
                    <div className="p-4 bg-blue-50 rounded border text-center">
                      <p className="text-xs font-bold mb-3">Tekan butang di bawah dan pilih slot yang ingin dibawa ke minggu depan di jadual utama.</p>
                      <button 
                        onClick={() => { setIsLockMode(true); setIsAdminOpen(false); }}
                        className="bg-blue-600 text-white px-4 py-2 rounded font-bold text-xs uppercase"
                      >
                        AKTIFKAN MOD LOCK
                      </button>
                    </div>
                  )}

                  {adminView === 'archives' && (
                    <div className="space-y-4">
                      {archivesList ? (
                        Object.entries(archivesList).sort((a,b) => b[0].localeCompare(a[0])).map(([year, months]: [string, any]) => (
                          <div key={year} className="mb-2">
                            <div className="text-xs font-black bg-gray-100 p-1 rounded mb-2">{year}</div>
                            {Object.entries(months).map(([month, weeks]: [string, any]) => (
                              <div key={month} className="ml-2 mb-3">
                                <div className="text-[10px] font-bold text-teal-700 uppercase mb-1">{month}</div>
                                {Object.entries(weeks).map(([weekName, data]: [string, any]) => (
                                  <button
                                    key={weekName}
                                    onClick={() => { fetchData(`archives/${year}/${month}/${weekName}`); setIsAdminOpen(false); }}
                                    className="w-full text-left p-2 border-b text-[10px] hover:bg-gray-50 flex justify-between"
                                  >
                                    <span>📄 {weekName}</span>
                                    <span className="text-blue-500 font-bold uppercase">Buka</span>
                                  </button>
                                ))}
                              </div>
                            ))}
                          </div>
                        ))
                      ) : <p className="text-center text-xs py-10 opacity-40 italic">Arkib Kosong.</p>}
                    </div>
                  )}

                  {adminView === 'maintenance' && (
                    <div className="overflow-x-auto">
                      <div className="grid grid-cols-[30px_repeat(12,minmax(25px,1fr))] gap-1 min-w-[350px]">
                        {/* Header */}
                        <div className="p-1"></div>
                        {PERIOD_TIMES.map((_, i) => (
                           <div key={i} className="bg-gray-800 text-white text-[8px] flex items-center justify-center rounded">W{i+1}</div>
                        ))}

                        {/* Body */}
                        {Object.entries(DAYS_MAP).map(([dk, di]) => (
                          <React.Fragment key={dk}>
                             <div className={`flex items-center justify-center rounded text-[8px] font-bold ${di.bg}`}>{di.label.substring(0,2)}</div>
                             {Array.from({ length: 12 }, (_, i) => i + 1).map(p => (
                                <button 
                                  key={p} 
                                  onClick={() => toggleMaintenance(dk, p)}
                                  className={`h-8 rounded border text-[8px] font-bold hover:bg-gray-100 flex items-center justify-center ${maintenance[dk]?.[p] ? 'bg-red-500 border-red-700 text-white' : 'bg-white'}`}
                                >
                                  {maintenance[dk]?.[p] ? 'X' : ''}
                                </button>
                             ))}
                          </React.Fragment>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 italic mt-2 text-center">X = Slot Ditutup (Maintenance)</p>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t flex justify-end">
                  <button onClick={() => setIsAdminOpen(false)} className="px-6 py-2 bg-black text-white rounded font-bold text-xs uppercase">Selesai</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
