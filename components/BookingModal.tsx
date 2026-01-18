import React, { useState } from 'react';
import { Booking } from '../types';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (booking: Omit<Booking, 'id' | 'status' | 'createdAt'>) => void;
}

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !date || !reason) {
      alert("Sila isi semua maklumat.");
      return;
    }
    onSubmit({ applicant: name, date, reason });
    setName('');
    setDate('');
    setReason('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Borang Tempahan Makmal</h2>
        
        {/* Requested Change: Specific Warning Text */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-3 mb-4 rounded-r">
          <p className="text-xs sm:text-sm text-amber-900 font-medium">
            Perhatian: Ini adalah tempahan untuk <strong>minggu akan datang</strong> (bukan minggu ini). 
            Tempahan ini juga adalah untuk <strong>tempahan khas satu hari penuh</strong>, bukan untuk satu waktu kelas sahaja.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nama Pemohon</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Cikgu Sufian"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tarikh Tempahan</label>
            <input 
              type="date" 
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tujuan / Sebab</label>
            <textarea 
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
              placeholder="Contoh: Pertandingan Robotik, Bengkel"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 text-sm font-medium">
              Batal
            </button>
            <button type="submit" className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 text-sm font-medium">
              Hantar Permohonan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;