import React, { useState, useEffect } from 'react';
import { 
  Users, Home, DollarSign, AlertCircle, Send, Plus, 
  Trash2, UserPlus, ShieldAlert, LogOut, CheckCircle, Clock, 
  RefreshCw, TrendingUp, AlertTriangle, Hammer
} from 'lucide-react';

const AdminDashboard = ({ token, user, onLogout }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Allocation form state
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedRoom, setSelectedRoom] = useState('');
  const [bedNumber, setBedNumber] = useState('');

  // Room creation form state
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: '',
    capacity: 2,
    type: 'Non-AC',
    rentAmount: 5000
  });

  // Automated bill generation state
  const [billingMonth, setBillingMonth] = useState('July 2026');

  // Fetch all dashboard data
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resStudents, resRooms, resBills, resComplaints] = await Promise.all([
        fetch('/api/students', { headers }),
        fetch('/api/rooms', { headers }),
        fetch('/api/bills', { headers }),
        fetch('/api/complaints', { headers })
      ]);

      const dataStudents = await resStudents.json();
      const dataRooms = await resRooms.json();
      const dataBills = await resBills.json();
      const dataComplaints = await resComplaints.json();

      if (!resStudents.ok || !resRooms.ok || !resBills.ok || !resComplaints.ok) {
        throw new Error('Failed to load dashboard data');
      }

      setStudents(dataStudents);
      setRooms(dataRooms);
      setBills(dataBills);
      setComplaints(dataComplaints);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle Room Creation
  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newRoom)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create room');
      
      setSuccessMsg(`Room ${data.roomNumber} created successfully!`);
      setShowRoomModal(false);
      setNewRoom({ roomNumber: '', capacity: 2, type: 'Non-AC', rentAmount: 5000 });
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Room Allocation
  const handleAllocate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/rooms/allocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent,
          roomId: selectedRoom,
          bedNumber
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Allocation failed');

      setSuccessMsg(data.message);
      setShowAllocateModal(false);
      setSelectedStudent('');
      setSelectedRoom('');
      setBedNumber('');
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Handle Student Deallocation
  const handleDeallocate = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this resident from their room?')) return;
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/rooms/deallocate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Deallocation failed');

      setSuccessMsg(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Generate Monthly Bills
  const handleGenerateBills = async () => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch('/api/bills/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ month: billingMonth })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Bill generation failed');

      setSuccessMsg(`${data.message} Created: ${data.billsCreated}, Skipped (already generated): ${data.billsSkipped}`);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update Bill Status
  const handleUpdateBillStatus = async (billId, newStatus) => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/bills/${billId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update bill');

      setSuccessMsg(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Send Mock Overdue Reminder
  const handleSendReminder = async (billId) => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/bills/${billId}/remind`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send reminder');

      setSuccessMsg(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Update Complaint Status & Priority
  const handleUpdateComplaintStatus = async (complaintId, updates) => {
    setError('');
    setSuccessMsg('');
    try {
      const response = await fetch(`/api/complaints/${complaintId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update complaint');

      setSuccessMsg(data.message);
      fetchData();
    } catch (err) {
      setError(err.message);
    }
  };

  // Summary Metrics Computations
  const totalStudents = students.length;
  const totalRooms = rooms.length;
  const totalBedsAvailable = rooms.reduce((acc, r) => acc + (r.capacity - r.currentOccupancy), 0);
  const pendingBillsCount = bills.filter(b => b.status === 'Unpaid').length;
  const activeComplaintsCount = complaints.filter(c => c.status !== 'Resolved').length;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans animate-fade-in">
      {/* Header bar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-700/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 glow-indigo">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-heading">Siddu Admin</h1>
            <p className="text-xs text-slate-400">Warden/Owner Dashboard Control</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-emerald-400 flex items-center justify-end gap-1 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Warden Mode
            </p>
          </div>
          
          <button
            onClick={onLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 text-slate-300 hover:text-rose-400 text-xs font-semibold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        
        {/* Alerts and messages */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex justify-between items-center animate-slide-up glow-rose">
            <span><strong>Error:</strong> {error}</span>
            <button onClick={() => setError('')} className="text-xs font-bold underline opacity-80 hover:opacity-100">Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex justify-between items-center animate-slide-up glow-emerald">
            <span><strong>Success:</strong> {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-xs font-bold underline opacity-80 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* High-Level Overview Metrics Cards */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <div className="glass-panel p-5 rounded-3xl border border-slate-700/50 flex items-center justify-between relative overflow-hidden group hover:border-slate-600/70 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Residents</span>
              <p className="text-2xl md:text-3xl font-extrabold text-white font-heading">{totalStudents}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-700/50 flex items-center justify-between relative overflow-hidden group hover:border-slate-600/70 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Beds Available</span>
              <p className="text-2xl md:text-3xl font-extrabold text-emerald-400 font-heading">{totalBedsAvailable}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
              <Home className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-700/50 flex items-center justify-between relative overflow-hidden group hover:border-slate-600/70 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Bills</span>
              <p className="text-2xl md:text-3xl font-extrabold text-rose-400 font-heading">{pendingBillsCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-rose-500/10 text-rose-400 group-hover:scale-110 transition-transform">
              <DollarSign className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-slate-700/50 flex items-center justify-between relative overflow-hidden group hover:border-slate-600/70 transition-all">
            <div className="space-y-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Complaints</span>
              <p className="text-2xl md:text-3xl font-extrabold text-amber-400 font-heading">{activeComplaintsCount}</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
          </div>
        </section>

        {/* Tab Controls and Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 w-fit self-start">
            {[
              { id: 'overview', name: 'Overview' },
              { id: 'students', name: 'Resident Directory' },
              { id: 'billing', name: 'Billing Tracker' },
              { id: 'complaints', name: 'Complaint Desk' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-xs md:text-sm font-semibold rounded-xl transition-all cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.name}
              </button>
            ))}
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchData()}
              className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white cursor-pointer transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            
            <button
              onClick={() => setShowRoomModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Room</span>
            </button>

            <button
              onClick={() => setShowAllocateModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs md:text-sm font-semibold rounded-xl flex items-center gap-2 glow-indigo cursor-pointer transition-all"
            >
              <UserPlus className="w-4 h-4" />
              <span>Allocate Bed</span>
            </button>
          </div>
        </div>

        {/* Tab Panel contents */}
        {loading ? (
          <div className="h-64 flex flex-col items-center justify-center gap-3 text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin"></div>
            <p className="text-sm font-mono font-medium">Fetching sync data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* OVERVIEW PANEL */}
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                {/* Rooms status list */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-700/50 space-y-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
                    <Home className="w-5 h-5 text-indigo-400" />
                    Room Status & Occupancy
                  </h3>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                    {rooms.map(room => {
                      const pct = Math.round((room.currentOccupancy / room.capacity) * 100);
                      return (
                        <div key={room._id} className="p-3 bg-slate-900/40 rounded-2xl border border-slate-800/80 flex items-center justify-between hover:border-slate-700/60 transition-colors">
                          <div className="space-y-1">
                            <p className="font-semibold text-white">Room {room.roomNumber}</p>
                            <span className="text-xs text-slate-400 font-mono">{room.type} • {room.capacity} Bed Capacity</span>
                          </div>
                          <div className="w-1/3 flex flex-col items-end gap-1.5">
                            <span className="text-xs font-semibold text-slate-300">{room.currentOccupancy} / {room.capacity} Occupied</span>
                            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden border border-slate-700/50">
                              <div 
                                className={`h-full rounded-full transition-all ${
                                  pct >= 100 ? 'bg-rose-500' : pct >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`} 
                                style={{ width: `${pct}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {rooms.length === 0 && (
                      <p className="text-slate-500 text-sm text-center py-6">No rooms found. Add some rooms above!</p>
                    )}
                  </div>
                </div>

                {/* Billing Summary quick action */}
                <div className="glass-panel rounded-3xl p-6 border border-slate-700/50 space-y-6">
                  <div className="space-y-2">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 font-heading">
                      <DollarSign className="w-5 h-5 text-emerald-400" />
                      Monthly Bills Operations
                    </h3>
                    <p className="text-xs text-slate-400">Generate or check monthly bill structures for all residents in allocated rooms.</p>
                  </div>
                  
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Select Target Billing Month</label>
                      <input 
                        type="text" 
                        value={billingMonth}
                        onChange={(e) => setBillingMonth(e.target.value)}
                        placeholder="e.g. July 2026"
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white font-semibold text-sm focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <button
                      onClick={handleGenerateBills}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs md:text-sm font-semibold transition-all glow-indigo cursor-pointer flex items-center justify-center gap-2"
                    >
                      <TrendingUp className="w-4 h-4" />
                      <span>Generate Month Bills for Allocated Beds</span>
                    </button>
                  </div>
                  
                  <div className="text-xs text-slate-400 leading-relaxed bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
                    <span className="font-semibold text-slate-300">Note:</span> Generating bills uses the room's base rent amount. If a bill is already generated for a student in the specified month, it will skip it automatically.
                  </div>
                </div>
              </div>
            )}

            {/* RESIDENTS DIRECTORY */}
            {activeTab === 'students' && (
              <div className="glass-panel rounded-3xl border border-slate-700/50 overflow-hidden animate-fade-in">
                <div className="p-5 border-b border-slate-700/60 bg-slate-800/20">
                  <h3 className="text-lg font-bold text-white font-heading">Resident Students Directory</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/40">
                        <th className="p-4">Resident Info</th>
                        <th className="p-4">Contact Info</th>
                        <th className="p-4">Assigned Room</th>
                        <th className="p-4">Bed / Check-In</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {students.map(student => (
                        <tr key={student._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            <p className="font-semibold text-white">{student.name}</p>
                            <span className="text-xs text-slate-400 font-mono">ID: {student._id.substring(18)}</span>
                          </td>
                          <td className="p-4">
                            <p className="text-slate-300">{student.email}</p>
                            <p className="text-xs text-slate-500 font-mono">{student.phone}</p>
                          </td>
                          <td className="p-4">
                            {student.room ? (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-mono">
                                Room {student.room.roomNumber} ({student.room.type})
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-700/30 text-slate-400 border border-slate-700/20">
                                Unallocated
                              </span>
                            )}
                          </td>
                          <td className="p-4">
                            {student.room ? (
                              <div className="space-y-0.5">
                                <p className="font-semibold text-slate-300">{student.bedNumber}</p>
                                <p className="text-xs text-slate-500 font-mono">
                                  {new Date(student.checkInDate).toLocaleDateString()}
                                </p>
                              </div>
                            ) : (
                              <span className="text-slate-500 text-xs">—</span>
                            )}
                          </td>
                          <td className="p-4 text-center">
                            {student.room ? (
                              <button
                                onClick={() => handleDeallocate(student._id)}
                                className="p-2 bg-slate-900 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 rounded-xl text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                                title="Deallocate Bed"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedStudent(student._id);
                                  setShowAllocateModal(true);
                                }}
                                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all glow-indigo cursor-pointer flex items-center gap-1.5"
                              >
                                <UserPlus className="w-3.5 h-3.5" />
                                <span>Allocate</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-500">No resident students found in records.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* BILLING TRACKER */}
            {activeTab === 'billing' && (
              <div className="glass-panel rounded-3xl border border-slate-700/50 overflow-hidden animate-fade-in font-sans">
                <div className="p-5 border-b border-slate-700/60 bg-slate-800/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <h3 className="text-lg font-bold text-white font-heading">Monthly Bills Tracker</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400">Generate bills for:</span>
                    <input 
                      type="text" 
                      value={billingMonth} 
                      onChange={(e) => setBillingMonth(e.target.value)} 
                      className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white w-24"
                    />
                    <button 
                      onClick={handleGenerateBills}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl cursor-pointer"
                    >
                      Generate Bills
                    </button>
                  </div>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/40">
                        <th className="p-4">Resident</th>
                        <th className="p-4">Bill Month</th>
                        <th className="p-4">Amount / Due</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-center font-mono">Reminders</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {bills.map(bill => (
                        <tr key={bill._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            {bill.student ? (
                              <div>
                                <p className="font-semibold text-white">{bill.student.name}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  {bill.student.room ? `Room ${bill.student.room.roomNumber}` : 'Room: Not allocated'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-rose-400 italic">Student details missing</p>
                            )}
                          </td>
                          <td className="p-4 font-semibold text-slate-300">{bill.month}</td>
                          <td className="p-4">
                            <p className="font-bold text-white font-mono">₹{bill.amount}</p>
                            <p className="text-xs text-slate-500 font-mono">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                          </td>
                          <td className="p-4 text-center">
                            {bill.status === 'Paid' ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 glow-emerald">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                                Paid
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25 glow-rose">
                                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-ping"></span>
                                Unpaid
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center font-mono font-semibold text-slate-300">
                            {bill.remindersSent}
                          </td>
                          <td className="p-4 text-right flex items-center justify-end gap-2.5">
                            {bill.status === 'Unpaid' ? (
                              <>
                                <button
                                  onClick={() => handleSendReminder(bill._id)}
                                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                                  title="Send reminder notice"
                                >
                                  <Send className="w-3.5 h-3.5 text-amber-400" />
                                  <span>Remind</span>
                                </button>
                                <button
                                  onClick={() => handleUpdateBillStatus(bill._id, 'Paid')}
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition-all glow-emerald cursor-pointer"
                                >
                                  Mark as Paid
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => handleUpdateBillStatus(bill._id, 'Unpaid')}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-rose-500/10 border border-slate-700 hover:border-rose-500/30 text-slate-400 hover:text-rose-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                              >
                                Mark as Unpaid
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                      {bills.length === 0 && (
                        <tr>
                          <td colSpan="6" className="p-8 text-center text-slate-500">No bills generated yet.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* COMPLAINTS DESK */}
            {activeTab === 'complaints' && (
              <div className="glass-panel rounded-3xl border border-slate-700/50 overflow-hidden animate-fade-in font-sans">
                <div className="p-5 border-b border-slate-700/60 bg-slate-800/20">
                  <h3 className="text-lg font-bold text-white font-heading">Complaint & Service Management Desk</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/40">
                        <th className="p-4">Student & Room</th>
                        <th className="p-4">Category / Issue</th>
                        <th className="p-4 text-center">Urgency</th>
                        <th className="p-4 text-center">Status</th>
                        <th className="p-4 text-right">Update Status / Urgency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/50">
                      {complaints.map(complaint => (
                        <tr key={complaint._id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="p-4">
                            {complaint.student ? (
                              <div>
                                <p className="font-semibold text-white">{complaint.student.name}</p>
                                <p className="text-xs text-slate-400 font-mono">
                                  {complaint.student.room ? `Room ${complaint.student.room.roomNumber} (${complaint.student.bedNumber})` : 'Unallocated'}
                                </p>
                              </div>
                            ) : (
                              <p className="text-slate-500 italic">Resident removed</p>
                            )}
                          </td>
                          <td className="p-4 max-w-xs md:max-w-md">
                            <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-xs border border-slate-700 mb-1">
                              {complaint.category}
                            </span>
                            <p className="text-slate-300 text-xs md:text-sm whitespace-pre-wrap">{complaint.description}</p>
                            <span className="text-[10px] text-slate-500 font-mono block mt-1">
                              Filed: {new Date(complaint.createdAt).toLocaleString()}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                              complaint.urgency === 'High' 
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 glow-rose' 
                                : complaint.urgency === 'Medium' 
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 glow-amber' 
                                  : 'bg-slate-700/20 text-slate-400 border border-slate-700/20'
                            }`}>
                              {complaint.urgency}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {complaint.status === 'Pending' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                <Clock className="w-3.5 h-3.5" />
                                Pending
                              </span>
                            ) : complaint.status === 'In Progress' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <Hammer className="w-3.5 h-3.5 animate-pulse" />
                                In Progress
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <CheckCircle className="w-3.5 h-3.5" />
                                Resolved
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2.5">
                              {/* Urgency Selector */}
                              <select
                                value={complaint.urgency}
                                onChange={(e) => handleUpdateComplaintStatus(complaint._id, { urgency: e.target.value })}
                                className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-300 focus:outline-none"
                              >
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                              </select>

                              {/* Status Transition buttons */}
                              {complaint.status === 'Pending' && (
                                <button
                                  onClick={() => handleUpdateComplaintStatus(complaint._id, { status: 'In Progress' })}
                                  className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  In Progress
                                </button>
                              )}
                              
                              {complaint.status !== 'Resolved' ? (
                                <button
                                  onClick={() => handleUpdateComplaintStatus(complaint._id, { status: 'Resolved' })}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Resolve
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdateComplaintStatus(complaint._id, { status: 'Pending' })}
                                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                                >
                                  Re-open
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                      {complaints.length === 0 && (
                        <tr>
                          <td colSpan="5" className="p-8 text-center text-slate-500">No student complaints logged. All clear!</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
            
          </div>
        )}
      </main>

      {/* ALLOCATE BED MODAL */}
      {showAllocateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 animate-slide-up shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-4 font-heading flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-400" />
              Allocate Bed & Room
            </h3>

            <form onSubmit={handleAllocate} className="space-y-4">
              {/* Select Student */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Resident Student</label>
                <select
                  required
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  <option value="">-- Select Resident --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id} disabled={!!s.room}>
                      {s.name} {s.room ? `(Already Allocated - Room ${s.room.roomNumber})` : `(${s.phone})`}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Room */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Select Room</label>
                <select
                  required
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none"
                >
                  <option value="">-- Select Room --</option>
                  {rooms.map(r => (
                    <option key={r._id} value={r._id} disabled={r.currentOccupancy >= r.capacity}>
                      Room {r.roomNumber} ({r.type}) — Rent: ₹{r.rentAmount} — Occupancy: {r.currentOccupancy}/{r.capacity}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bed Label */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bed Identifier</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bed A, Bed B"
                  value={bedNumber}
                  onChange={(e) => setBedNumber(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none"
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowAllocateModal(false);
                    setSelectedStudent('');
                    setSelectedRoom('');
                    setBedNumber('');
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold glow-indigo cursor-pointer"
                >
                  Allocate Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE ROOM MODAL */}
      {showRoomModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl p-6 border border-slate-700 animate-slide-up shadow-2xl relative">
            <h3 className="text-xl font-bold text-white mb-4 font-heading flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-400" />
              Add New Room Configuration
            </h3>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              {/* Room Number */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Room Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 204, 301"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Capacity */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Bed Capacity</label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  required
                  value={newRoom.capacity}
                  onChange={(e) => setNewRoom({ ...newRoom, capacity: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Room Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Room Type</label>
                <div className="grid grid-cols-2 gap-3">
                  {['AC', 'Non-AC'].map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewRoom({ ...newRoom, type: t })}
                      className={`py-2 px-4 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                        newRoom.type === t
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                          : 'border-slate-700 bg-transparent text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {t} Option
                    </button>
                  ))}
                </div>
              </div>

              {/* Rent Amount */}
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Monthly Rent Amount (₹)</label>
                <input
                  type="number"
                  min="500"
                  required
                  placeholder="e.g. 6000"
                  value={newRoom.rentAmount}
                  onChange={(e) => setNewRoom({ ...newRoom, rentAmount: parseInt(e.target.value) })}
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Modal footer */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowRoomModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold glow-indigo cursor-pointer"
                >
                  Create Room
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
