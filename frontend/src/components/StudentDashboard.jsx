import React, { useState, useEffect } from 'react';
import { 
  Home, User, Calendar, CreditCard, AlertTriangle, 
  Send, List, Clock, CheckCircle, Flame, Hammer, ShieldAlert, LogOut
} from 'lucide-react';

const StudentDashboard = ({ token, user, onLogout, onRefreshUserContext }) => {
  const [bills, setBills] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Complaint form state
  const [complaintForm, setComplaintForm] = useState({
    category: 'Plumbing',
    description: '',
    urgency: 'Low'
  });
  const [submittingComplaint, setSubmittingComplaint] = useState(false);

  // Payment mock state
  const [processingPayment, setProcessingPayment] = useState(false);
  const [selectedBillForPayment, setSelectedBillForPayment] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [resBills, resComplaints] = await Promise.all([
        fetch('/api/bills', { headers }),
        fetch('/api/complaints', { headers })
      ]);

      const dataBills = await resBills.json();
      const dataComplaints = await resComplaints.json();

      if (!resBills.ok || !resComplaints.ok) {
        throw new Error('Failed to load dashboard data');
      }

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

  // Handle Mock Pay Now Action
  const handlePayNow = async (bill) => {
    setSelectedBillForPayment(bill);
    setProcessingPayment(true);
    setError('');
    setSuccessMsg('');

    // Simulate standard payment gateway processing
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/bills/${bill._id}/status`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status: 'Paid' })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Payment failed');

        setSuccessMsg(`Payment of ₹${bill.amount} for ${bill.month} processed successfully!`);
        fetchData();
      } catch (err) {
        setError(err.message);
      } finally {
        setProcessingPayment(false);
        setSelectedBillForPayment(null);
      }
    }, 2000); // 2 second mock delay
  };

  // Handle File New Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setSubmittingComplaint(true);

    try {
      const response = await fetch('/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(complaintForm)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit complaint');

      setSuccessMsg('Complaint registered successfully! The warden has been notified.');
      setComplaintForm({ category: 'Plumbing', description: '', urgency: 'Low' });
      fetchData();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmittingComplaint(false);
    }
  };

  // Helper: check if a bill is 5+ days overdue
  const checkBillOverdueDays = (dueDate) => {
    const today = new Date();
    const due = new Date(dueDate);
    
    // Clear time portions for accurate day count
    today.setHours(0,0,0,0);
    due.setHours(0,0,0,0);
    
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Find if there is an active overdue bill (>= 5 days overdue)
  const overdueBill = bills.find(b => {
    if (b.status !== 'Unpaid') return false;
    const overdueDays = checkBillOverdueDays(b.dueDate);
    return overdueDays >= 5;
  });

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col font-sans animate-fade-in relative">
      
      {/* Overdue Notification Banner */}
      {overdueBill && (
        <div className="bg-rose-950/70 border-b border-rose-500/30 text-rose-300 px-6 py-3 text-xs md:text-sm font-semibold flex items-center justify-center gap-3 glow-rose animate-slide-up">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-bounce" />
          <span className="leading-relaxed">
            <strong>Warning:</strong> Your rent bill of <strong>₹{overdueBill.amount}</strong> for <strong>{overdueBill.month}</strong> was due on {new Date(overdueBill.dueDate).toLocaleDateString()} and is now <strong>{checkBillOverdueDays(overdueBill.dueDate)} days overdue</strong>. Please complete payment immediately to avoid a late fee.
          </span>
          <button 
            onClick={() => handlePayNow(overdueBill)}
            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md"
          >
            Pay Now
          </button>
        </div>
      )}

      {/* Header bar */}
      <header className="glass-panel sticky top-0 z-40 border-b border-slate-700/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 glow-indigo">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white font-heading">Siddu Premium Hostels and PGs</h1>
            <p className="text-xs text-slate-400">Student Dashboard Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Quick Refresh Context */}
          <button
            onClick={() => { fetchData(); onRefreshUserContext(); }}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-white rounded-xl cursor-pointer"
            title="Refresh Account Data"
          >
            <Clock className="w-4 h-4" />
          </button>

          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">{user.name}</p>
            <p className="text-xs text-indigo-400 font-mono">Resident Member</p>
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
        
        {/* Alerts */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex justify-between items-center glow-rose">
            <span><strong>Error:</strong> {error}</span>
            <button onClick={() => setError('')} className="text-xs font-bold underline opacity-85 hover:opacity-100">Dismiss</button>
          </div>
        )}
        {successMsg && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex justify-between items-center glow-emerald">
            <span><strong>Success:</strong> {successMsg}</span>
            <button onClick={() => setSuccessMsg('')} className="text-xs font-bold underline opacity-85 hover:opacity-100">Dismiss</button>
          </div>
        )}

        {/* Dashboard Grid split */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* COLUMN 1: Profile & Room Details */}
          <div className="space-y-6 lg:col-span-1">
            {/* Room details card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/50 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-slate-400 font-heading">
                My Profile & Bed Details
              </h3>
              
              {user.room ? (
                <div className="space-y-3">
                  <div className="p-4 bg-indigo-950/20 border border-indigo-500/20 rounded-2xl flex items-center gap-4">
                    <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                      <Home className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-indigo-300 font-semibold uppercase">Allocated Room</p>
                      <h4 className="text-xl font-bold text-white">Room {user.room.roomNumber}</h4>
                      <p className="text-xs text-slate-400">{user.room.type} Option</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Bed Number</span>
                      <p className="text-sm font-bold text-slate-200 mt-1">{user.bedNumber}</p>
                    </div>
                    <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] uppercase font-semibold text-slate-500">Monthly Rent</span>
                      <p className="text-sm font-bold text-slate-200 mt-1">₹{user.room.rentAmount}</p>
                    </div>
                  </div>

                  <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 flex justify-between items-center text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                      Check-In Date
                    </span>
                    <span className="font-semibold text-slate-200 font-mono">
                      {user.checkInDate ? new Date(user.checkInDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl space-y-3">
                  <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto animate-pulse" />
                  <div>
                    <h4 className="font-semibold text-white">Room Allocation Pending</h4>
                    <p className="text-xs text-slate-400 mt-1">The warden has not allocated a room to your profile yet. Please check in with management.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Billing summary card */}
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/50 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-slate-400 font-heading">
                Billing Summary
              </h3>
              
              <div className="space-y-3">
                {bills.slice(0, 2).map(bill => (
                  <div 
                    key={bill._id} 
                    className="p-4 bg-slate-900/40 rounded-2xl border border-slate-800/80 flex flex-col justify-between gap-3 hover:border-slate-700/60 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-white">{bill.month}</p>
                        <p className="text-xs text-slate-500 font-mono">Due: {new Date(bill.dueDate).toLocaleDateString()}</p>
                      </div>
                      <span className="font-extrabold text-slate-200 font-mono text-base">₹{bill.amount}</span>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-slate-800/50">
                      {bill.status === 'Paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Paid
                        </span>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/25">
                            <Clock className="w-3.5 h-3.5" />
                            Unpaid
                          </span>

                          <button
                            onClick={() => handlePayNow(bill)}
                            className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                          >
                            Pay Now
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {bills.length === 0 && (
                  <p className="text-slate-500 text-xs text-center py-4 bg-slate-900/40 rounded-2xl">No billing statements available.</p>
                )}
              </div>
            </div>
          </div>

          {/* COLUMN 2 & 3: Complaint Box Form */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-3xl border border-slate-700/50 space-y-4">
              <h3 className="text-base font-bold text-white uppercase tracking-wider text-slate-400 font-heading flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                Lodge Service Complaint
              </h3>

              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Problem Category</label>
                    <select
                      value={complaintForm.category}
                      onChange={(e) => setComplaintForm({ ...complaintForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Plumbing">Plumbing (Water leakage, Taps)</option>
                      <option value="Electrical">Electrical (Lights, Fans, Sockets)</option>
                      <option value="Wi-Fi">Wi-Fi & Internet Connectivity</option>
                      <option value="Food">Food / Mess issues</option>
                      <option value="Housekeeping">Housekeeping (Cleaning, Waste removal)</option>
                    </select>
                  </div>

                  {/* Urgency */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Urgency Level</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Low', 'Medium', 'High'].map(level => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setComplaintForm({ ...complaintForm, urgency: level })}
                          className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                            complaintForm.urgency === level
                              ? level === 'High' 
                                ? 'border-rose-500 bg-rose-500/10 text-rose-400 font-bold'
                                : level === 'Medium'
                                  ? 'border-amber-500 bg-amber-500/10 text-amber-400 font-bold'
                                  : 'border-indigo-500 bg-indigo-500/10 text-indigo-400 font-bold'
                              : 'border-slate-700 bg-transparent text-slate-400 hover:border-slate-600'
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Description of Issue</label>
                  <textarea
                    required
                    rows="3"
                    placeholder="Describe the complaint in detail (e.g. Room 101, bathroom water tap leaking continuously)..."
                    value={complaintForm.description}
                    onChange={(e) => setComplaintForm({ ...complaintForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500"
                  ></textarea>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs md:text-sm font-semibold transition-all glow-indigo cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submittingComplaint ? 'Submitting...' : 'File Service Request'}</span>
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* BOTTOM: My Complaints History */}
        <div className="glass-panel rounded-3xl border border-slate-700/50 overflow-hidden">
          <div className="p-5 border-b border-slate-700/60 bg-slate-800/20 flex items-center justify-between">
            <h3 className="text-base font-bold text-white uppercase tracking-wider text-slate-400 font-heading flex items-center gap-2">
              <List className="w-4 h-4 text-indigo-400" />
              My Complaints History
            </h3>
            <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              Total: {complaints.length}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold bg-slate-900/40">
                  <th className="p-4">Reference ID</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4 text-center">Urgency</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-right">Filed Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {complaints.map(comp => (
                  <tr key={comp._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-mono text-xs text-indigo-300">
                      #{comp._id.substring(18)}
                    </td>
                    <td className="p-4 font-semibold text-slate-300">
                      {comp.category}
                    </td>
                    <td className="p-4 max-w-sm">
                      <p className="text-slate-300 text-xs md:text-sm whitespace-pre-wrap">{comp.description}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold ${
                        comp.urgency === 'High' 
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/25 glow-rose' 
                          : comp.urgency === 'Medium' 
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/25 glow-amber' 
                            : 'bg-slate-700/20 text-slate-400 border border-slate-700/20'
                      }`}>
                        {comp.urgency}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {comp.status === 'Pending' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25 glow-amber">
                          <Clock className="w-3.5 h-3.5" />
                          Pending
                        </span>
                      ) : comp.status === 'In Progress' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 glow-indigo">
                          <Hammer className="w-3.5 h-3.5 animate-pulse" />
                          In Progress
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 glow-emerald">
                          <CheckCircle className="w-3.5 h-3.5" />
                          Resolved
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-right text-xs text-slate-500 font-mono">
                      {new Date(comp.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {complaints.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-slate-500">You haven't filed any complaints. Your stay looks smooth!</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* SECURE PAYMENT PORTAL MOCK LOADER */}
      {processingPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-sm p-6 bg-slate-900/60 rounded-3xl border border-slate-800">
            <CreditCard className="w-12 h-12 text-indigo-400 mx-auto animate-bounce glow-indigo" />
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white font-heading">Processing Transaction</h4>
              <p className="text-xs text-slate-400 font-mono">Securing payment gateway links...</p>
            </div>
            
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500 rounded-full animate-[loading_2s_ease-in-out_infinite]" style={{ width: '60%' }}></div>
            </div>
            
            <p className="text-[10px] text-slate-500">Bill: {selectedBillForPayment?.month} • Amount: ₹{selectedBillForPayment?.amount}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
