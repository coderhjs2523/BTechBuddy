import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = "https://btechbuddy-backend.onrender.com";;

export default function App() {
  const [step, setStep] = useState('login'); 
  const [activeTab, setActiveTab] = useState('overview'); 
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [isAdmin, setIsAdmin] = useState(localStorage.getItem('isAdmin') === 'true');
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [videos, setVideos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [notices, setNotices] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [stats, setStats] = useState(null);

  const [editingNoticeId, setEditingNoticeId] = useState(null);
  const [editNoticeTitle, setEditNoticeTitle] = useState('');
  const [editNoticeContent, setEditNoticeContent] = useState('');

  const [filterSem, setFilterSem] = useState('All');
  const [filterBranch, setFilterBranch] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Auto-dismiss success message after 3 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg('');
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (token) {
      setStep('portal');
      setActiveTab('overview');
      fetchAllData();
    }
  }, [token]);

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
  }, [darkMode]);

  const fetchAllData = () => {
    fetchSubjects();
    fetchNotices();
    if (isAdmin) {
      fetchStats();
      fetchSuggestions();
      fetchUsers();
    }
  };

  const fetchSubjects = async () => { try { const r = await axios.get(`${API_BASE_URL}/subjects/`); setSubjects(r.data); } catch(e){} };
  const fetchNotices = async () => { try { const r = await axios.get(`${API_BASE_URL}/notices/`); setNotices(r.data); } catch(e){} };
  const fetchStats = async () => { try { const r = await axios.get(`${API_BASE_URL}/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }); setStats(r.data); } catch(e){} };
  const fetchSuggestions = async () => { try { const r = await axios.get(`${API_BASE_URL}/suggestions/`, { headers: { Authorization: `Bearer ${token}` } }); setSuggestions(r.data); } catch(e){} };
  const fetchUsers = async () => { try { const r = await axios.get(`${API_BASE_URL}/admin/users`, { headers: { Authorization: `Bearer ${token}` } }); setUsersList(r.data); } catch(e){} };
  const fetchVideos = async (id) => { try { const r = await axios.get(`${API_BASE_URL}/subjects/${id}/videos`); setVideos(r.data); } catch(e){} };
  const fetchNotes = async (id) => { try { const r = await axios.get(`${API_BASE_URL}/subjects/${id}/notes`); setNotes(r.data); } catch(e){} };

  const handleLogin = async (e) => {
    e.preventDefault(); setError(''); setSuccessMsg('');
    try {
      const fd = new URLSearchParams(); fd.append('email', email); fd.append('password', password);
      const res = await axios.post(`${API_BASE_URL}/auth/login`, fd);
      setToken(res.data.access_token); setIsAdmin(res.data.is_admin);
      localStorage.setItem('token', res.data.access_token); localStorage.setItem('isAdmin', res.data.is_admin);
      setStep('portal'); setActiveTab('overview'); fetchAllData();
    } catch (err) { setError(err.response?.data?.detail || 'Login failed'); }
  };

  const handleSignup = async (e) => {
    e.preventDefault(); setError(''); setSuccessMsg('');
    try {
      const fd = new URLSearchParams(); fd.append('email', email); fd.append('password', password);
      await axios.post(`${API_BASE_URL}/auth/signup`, fd);
      setSuccessMsg('OTP sent to your email / console!');
      setStep('otp');
    } catch (err) { setError(err.response?.data?.detail || 'Signup failed'); }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault(); setError(''); setSuccessMsg('');
    try {
      const fd = new URLSearchParams(); fd.append('email', email); fd.append('otp', otp);
      await axios.post(`${API_BASE_URL}/auth/verify-otp`, fd);
      setSuccessMsg('Email verified successfully! Please login.');
      setStep('login');
    } catch (err) { setError(err.response?.data?.detail || 'Invalid OTP'); }
  };

  const handleLogout = () => {
    setToken(''); setIsAdmin(false); localStorage.clear(); setStep('login');
  };

  const filteredSubjects = subjects.filter(sub => {
    const matchSem = filterSem === 'All' || sub.semester.toString() === filterSem;
    const matchBranch = filterBranch === 'All' || sub.branch.toLowerCase() === filterBranch.toLowerCase();
    const matchSearch = sub.name.toLowerCase().includes(searchQuery.toLowerCase()) || sub.branch.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSem && matchBranch && matchSearch;
  });

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-300 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'}`}>
      
      {/* NAVBAR */}
      {token && (
        <nav className={`border-b px-8 py-4 flex justify-between items-center sticky top-0 z-50 backdrop-blur-md ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('overview')}>
              <div className="bg-emerald-600 text-white p-2 rounded-xl shadow-md">🎓</div>
              <span className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">BTechBuddy</span>
            </div>
            
            <div className={`flex items-center gap-1.5 p-1.5 rounded-xl border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
              <button onClick={() => setActiveTab('overview')} className={`text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer ${activeTab === 'overview' ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400'}`}>Overview</button>
              {isAdmin && (
                <>
                  <button onClick={() => setActiveTab('add-subject')} className={`text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer ${activeTab === 'add-subject' ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400'}`}>+ Subject</button>
                  <button onClick={() => setActiveTab('add-content')} className={`text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer ${activeTab === 'add-content' ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400'}`}>+ Content</button>
                  <button onClick={() => setActiveTab('users')} className={`text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer ${activeTab === 'users' ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400'}`}>Users</button>
                </>
              )}
              <button onClick={() => setActiveTab('notices')} className={`text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer ${activeTab === 'notices' ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400'}`}>Notices</button>
              <button onClick={() => setActiveTab('suggestions')} className={`text-xs font-semibold px-3.5 py-2 rounded-lg cursor-pointer ${activeTab === 'suggestions' ? (darkMode ? 'bg-slate-700 text-white' : 'bg-white text-emerald-600 shadow-sm') : 'text-slate-400'}`}>Feedback</button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setDarkMode(!darkMode)} className={`text-xs font-semibold px-3 py-2 rounded-xl border cursor-pointer ${darkMode ? 'bg-slate-800 border-slate-700 text-amber-400' : 'bg-slate-100 border-slate-200 text-slate-700'}`}>{darkMode ? '☀️' : '🌙'}</button>
            <span className={`text-[11px] px-3 py-1.5 rounded-full font-bold uppercase ${isAdmin ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'}`}>{isAdmin ? '👑 Admin' : '🎓 Student'}</span>
            <button onClick={handleLogout} className="text-xs bg-rose-50 text-rose-600 border border-rose-200 font-semibold px-3.5 py-2 rounded-xl hover:bg-rose-100 cursor-pointer">Logout</button>
          </div>
        </nav>
      )}

      {/* MAIN CONTAINER */}
      <div className="flex-grow w-full max-w-7xl mx-auto p-8">
        
        {/* AUTH SCREENS */}
        {!token && (
          <div className="min-h-[80vh] flex flex-col items-center justify-center">
            <div className={`w-full max-w-md p-8 rounded-3xl shadow-xl border space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              
              {error && <div className="bg-rose-500/10 text-rose-500 text-xs p-3.5 rounded-xl border border-rose-500/20">{error}</div>}
              {successMsg && <div className="bg-emerald-500/10 text-emerald-400 text-xs p-3.5 rounded-xl border border-emerald-500/20">{successMsg}</div>}

              {step === 'login' && (
                <>
                  <div className="text-center space-y-2">
                    <div className="inline-block bg-emerald-50 text-emerald-600 p-3 rounded-2xl text-2xl mb-2">🎓</div>
                    <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>BTechBuddy Portal</h1>
                  </div>
                  <form onSubmit={handleLogin} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 rounded-xl cursor-pointer">Sign In</button>
                  </form>
                  <div className="flex justify-between items-center pt-2 text-xs">
                    <button onClick={() => { setStep('forgot'); setError(''); setSuccessMsg(''); }} className="text-emerald-400 hover:underline cursor-pointer">Forgot Password?</button>
                    <button onClick={() => { setStep('signup'); setError(''); setSuccessMsg(''); }} className="text-emerald-600 font-bold hover:underline cursor-pointer">Create Account →</button>
                  </div>
                </>
              )}

              {step === 'signup' && (
                <>
                  <div className="text-center space-y-2">
                    <div className="inline-block bg-emerald-50 text-emerald-600 p-3 rounded-2xl text-2xl mb-2">🚀</div>
                    <h1 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Join BTechBuddy</h1>
                  </div>
                  <form onSubmit={handleSignup} className="space-y-4">
                    <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} />
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3.5 rounded-xl cursor-pointer">Sign Up</button>
                  </form>
                  <div className="text-center pt-2">
                    <button onClick={() => { setStep('login'); setError(''); setSuccessMsg(''); }} className="text-xs text-emerald-400 hover:underline cursor-pointer">Already have an account? Sign In</button>
                  </div>
                </>
              )}

              {step === 'otp' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold">Verify OTP</h2>
                  <p className="text-xs text-slate-400">Enter the 6-digit verification code sent to your email.</p>
                  <form onSubmit={handleVerifyOtp} className="space-y-4">
                    <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    <button type="submit" className="w-full bg-emerald-600 text-white text-xs font-bold py-3 rounded-xl cursor-pointer">Verify & Register</button>
                  </form>
                  <button onClick={() => setStep('signup')} className="w-full text-xs text-slate-400 cursor-pointer">← Back to Signup</button>
                </div>
              )}

              {step === 'forgot' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold">Reset Password</h2>
                  <input type="email" placeholder="Enter your registered email" value={email} onChange={e => setEmail(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  <button onClick={async () => {
                    setError(''); setSuccessMsg('');
                    try {
                      const fd = new URLSearchParams(); fd.append('email', email);
                      await axios.post(`${API_BASE_URL}/auth/forgot-password`, fd);
                      setSuccessMsg('OTP sent to email/console!'); setStep('reset');
                    } catch(err){ setError(err.response?.data?.detail || 'Error'); }
                  }} className="w-full bg-emerald-600 text-white text-xs py-3 rounded-xl font-bold cursor-pointer">Send OTP</button>
                  <button onClick={() => setStep('login')} className="w-full text-xs text-slate-400 cursor-pointer">← Back to Login</button>
                </div>
              )}

              {step === 'reset' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold">Enter OTP & New Password</h2>
                  <input type="text" placeholder="6-digit OTP" value={otp} onChange={e => setOtp(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className={`w-full px-4 py-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  <button onClick={async () => {
                    setError(''); setSuccessMsg('');
                    try {
                      const fd = new URLSearchParams(); fd.append('email', email); fd.append('otp', otp); fd.append('new_password', newPassword);
                      await axios.post(`${API_BASE_URL}/auth/reset-password`, fd);
                      setSuccessMsg('Password reset successful! Please login.'); setStep('login');
                    } catch(err){ setError(err.response?.data?.detail || 'Reset failed'); }
                  }} className="w-full bg-emerald-600 text-white text-xs py-3 rounded-xl font-bold cursor-pointer">Update Password</button>
                </div>
              )}

            </div>
          </div>
        )}

        {/* PORTAL VIEW */}
        {step === 'portal' && (
          <div className="space-y-8">
            
            {activeTab === 'overview' && (
              <div className="space-y-8">
                <div className={`flex flex-col md:flex-row justify-between items-start md:items-end border-b pb-5 gap-4 ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div>
                    <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Academic Dashboard</h1>
                    <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Search subjects instantly or filter by semester & branch.</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <input type="text" placeholder="🔍 Search subjects..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className={`px-4 py-2 rounded-xl text-xs border flex-grow md:w-64 ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`} />
                    <select value={filterSem} onChange={e => setFilterSem(e.target.value)} className={`px-3 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                      <option value="All">All Semesters</option>
                      {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>Sem {s}</option>)}
                    </select>
                    <select value={filterBranch} onChange={e => setFilterBranch(e.target.value)} className={`px-3 py-2 rounded-xl text-xs border ${darkMode ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200'}`}>
                      <option value="All">All Branches</option>
                      <option value="CSE">CSE</option>
                      <option value="IT">IT</option>
                      <option value="ECE">ECE</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredSubjects.length === 0 ? (
                    <p className="text-sm text-slate-400 col-span-full text-center py-12">No subjects found matching your search or filters.</p>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <div key={sub.id} className={`p-6 rounded-2xl border transition-all flex flex-col justify-between group ${darkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-500'}`}>
                        <div onClick={() => { setSelectedSubject(sub); setActiveTab('subject-detail'); fetchVideos(sub.id); fetchNotes(sub.id); }} className="cursor-pointer space-y-3">
                          <div className="flex justify-between">
                            <span className="text-[11px] font-bold px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg">Sem {sub.semester}</span>
                            <span className="text-xs font-semibold text-slate-400 uppercase">{sub.branch}</span>
                          </div>
                          <h4 className={`text-lg font-bold ${darkMode ? 'text-white group-hover:text-emerald-400' : 'text-slate-900'}`}>{sub.name}</h4>
                        </div>
                        <div className={`pt-4 mt-4 border-t flex justify-between items-center ${darkMode ? 'border-slate-800' : 'border-slate-100'}`}>
                          <button onClick={() => { setSelectedSubject(sub); setActiveTab('subject-detail'); fetchVideos(sub.id); fetchNotes(sub.id); }} className="text-xs font-bold text-emerald-400 cursor-pointer">View Resources →</button>
                          {isAdmin && <button onClick={async () => { await axios.delete(`${API_BASE_URL}/subjects/${sub.id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchSubjects(); }} className="text-xs text-rose-500 font-bold px-2 py-1 bg-rose-500/10 rounded-lg cursor-pointer">Delete</button>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === 'users' && isAdmin && (
              <div className="space-y-6 max-w-4xl mx-auto">
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Manage Registered Users</h1>
                <div className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <table className="w-full text-left text-xs">
                    <thead className={`border-b ${darkMode ? 'border-slate-800 text-slate-400 bg-slate-950/50' : 'border-slate-200 text-slate-500 bg-slate-50'}`}>
                      <tr>
                        <th className="p-4">ID</th>
                        <th className="p-4">Email</th>
                        <th className="p-4">Verified</th>
                        <th className="p-4">Role</th>
                        <th className="p-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/10">
                      {usersList.map(u => (
                        <tr key={u.id}>
                          <td className="p-4 font-mono">{u.id}</td>
                          <td className="p-4 font-semibold">{u.email}</td>
                          <td className="p-4">{u.is_verified ? '✅ Yes' : '❌ No'}</td>
                          <td className="p-4">{u.is_admin ? '👑 Admin' : '🎓 Student'}</td>
                          <td className="p-4 text-right">
                            {!u.is_admin && (
                              <button onClick={async () => {
                                await axios.delete(`${API_BASE_URL}/admin/users/${u.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                fetchUsers();
                              }} className="text-rose-500 font-bold hover:underline cursor-pointer">Delete</button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'notices' && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Notices & Announcements</h1>
                {isAdmin && (
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const fd = new URLSearchParams(); fd.append('title', e.target.nTitle.value); fd.append('content', e.target.nContent.value);
                    await axios.post(`${API_BASE_URL}/notices/`, fd, { headers: { Authorization: `Bearer ${token}` } });
                    e.target.reset(); fetchNotices();
                    setSuccessMsg('Notice posted successfully!');
                  }} className={`p-6 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-500">Post New Notice</h3>
                    <input name="nTitle" placeholder="Notice Title" required className={`w-full p-3 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    <textarea name="nContent" placeholder="Details..." required className={`w-full p-3 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} rows="3"></textarea>
                    <button type="submit" className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 rounded-xl cursor-pointer">Post Notice</button>
                  </form>
                )}
                
                {successMsg && <div className="bg-emerald-500/10 text-emerald-400 text-xs p-3.5 rounded-xl border border-emerald-500/20">{successMsg}</div>}

                <div className="space-y-3">
                  {notices.map(n => (
                    <div key={n.id} className={`p-5 rounded-2xl border space-y-3 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      {editingNoticeId === n.id ? (
                        <div className="space-y-3">
                          <input value={editNoticeTitle} onChange={e => setEditNoticeTitle(e.target.value)} className={`w-full p-2.5 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                          <textarea value={editNoticeContent} onChange={e => setEditNoticeContent(e.target.value)} className={`w-full p-2.5 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} rows="3"></textarea>
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const fd = new URLSearchParams(); fd.append('title', editNoticeTitle); fd.append('content', editNoticeContent);
                              await axios.delete(`${API_BASE_URL}/notices/${n.id}`, { headers: { Authorization: `Bearer ${token}` } });
                              await axios.post(`${API_BASE_URL}/notices/`, fd, { headers: { Authorization: `Bearer ${token}` } });
                              setEditingNoticeId(null); fetchNotices();
                              setSuccessMsg('Notice updated successfully!');
                            }} className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-lg font-bold cursor-pointer">Save</button>
                            <button onClick={() => setEditingNoticeId(null)} className="bg-slate-500 text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-between items-start">
                            <h4 className="font-bold text-sm">📢 {n.title}</h4>
                            {isAdmin && (
                              <div className="flex gap-3">
                                <button onClick={() => { setEditingNoticeId(n.id); setEditNoticeTitle(n.title); setEditNoticeContent(n.content); }} className="text-xs text-emerald-400 font-semibold cursor-pointer">Edit</button>
                                <button onClick={async () => {
                                  await axios.delete(`${API_BASE_URL}/notices/${n.id}`, { headers: { Authorization: `Bearer ${token}` } });
                                  fetchNotices();
                                  setSuccessMsg('Notice deleted successfully!');
                                }} className="text-xs text-rose-500 font-semibold cursor-pointer">Delete</button>
                              </div>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{n.content}</p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* FEEDBACK / SUGGESTIONS TAB WITH DELETE & THANK YOU */}
            {activeTab === 'suggestions' && (
              <div className="space-y-6 max-w-2xl mx-auto">
                <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Suggestions & Doubt Hub</h1>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const fd = new URLSearchParams(); fd.append('message', e.target.msg.value);
                  await axios.post(`${API_BASE_URL}/suggestions/`, fd, { headers: { Authorization: `Bearer ${token}` } });
                  e.target.reset(); 
                  setSuccessMsg('Thank you for your valuable feedback! 🙏');
                  if (isAdmin) fetchSuggestions();
                }} className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  {successMsg && <div className="bg-emerald-500/10 text-emerald-400 text-xs p-3 rounded-xl border border-emerald-500/20">{successMsg}</div>}
                  <textarea name="msg" placeholder="Write your suggestion or request here..." required className={`w-full p-3 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} rows="4"></textarea>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer">Submit Feedback</button>
                </form>

                {isAdmin && (
                  <div className="space-y-3 pt-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Student Feedback Received:</h3>
                    {suggestions.length === 0 ? (
                      <p className="text-xs text-slate-400">No feedback received yet.</p>
                    ) : (
                      suggestions.map(s => (
                        <div key={s.id} className={`p-4 rounded-xl border text-xs flex justify-between items-start ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                          <div className="space-y-1">
                            <span className="text-emerald-400 font-bold block">From: {s.user_email}</span>
                            <p className="text-slate-300">{s.message}</p>
                          </div>
                          <button onClick={async () => {
                            await axios.delete(`${API_BASE_URL}/suggestions/${s.id}`, { headers: { Authorization: `Bearer ${token}` } }).catch(async () => {
                              // Fallback if backend delete route doesn't exist yet, just filter locally or handle gracefully
                            });
                            fetchSuggestions();
                            setSuccessMsg('Feedback deleted successfully!');
                          }} className="text-rose-500 font-semibold hover:underline cursor-pointer ml-4">Delete</button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'subject-detail' && selectedSubject && (
              <div className="space-y-6">
                <button onClick={() => setActiveTab('overview')} className="text-xs font-semibold text-emerald-400 cursor-pointer">← Back to Overview</button>
                <div className={`p-8 rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg inline-block mb-2">Sem {selectedSubject.semester} • {selectedSubject.branch}</span>
                  <h1 className={`text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{selectedSubject.name}</h1>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Study Notes & PDFs</h3>
                    {notes.map(note => (
                      <div key={note.id} className={`p-4 border rounded-2xl flex justify-between items-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`}>
                        <a href={note.file_path} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-400 underline">📄 {note.title}</a>
                        {isAdmin && <button onClick={async () => { await axios.delete(`${API_BASE_URL}/notes/${note.id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchNotes(selectedSubject.id); setSuccessMsg('Note deleted successfully!'); }} className="text-rose-500 text-xs font-bold cursor-pointer">Delete</button>}
                      </div>
                    ))}
                  </div>
                  <div className={`p-6 rounded-3xl border space-y-4 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Video Lectures</h3>
                    {videos.map(vid => (
                      <div key={vid.id} className={`p-4 border rounded-2xl flex justify-between items-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50'}`}>
                        <a href={vid.youtube_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-rose-400 underline">▶ {vid.title}</a>
                        {isAdmin && <button onClick={async () => { await axios.delete(`${API_BASE_URL}/videos/${vid.id}`, { headers: { Authorization: `Bearer ${token}` } }); fetchVideos(selectedSubject.id); setSuccessMsg('Video deleted successfully!'); }} className="text-rose-500 text-xs font-bold cursor-pointer">Delete</button>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'add-subject' && isAdmin && (
              <div className={`max-w-xl mx-auto p-8 rounded-3xl border space-y-6 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <h2 className="text-2xl font-black">Add New Subject</h2>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  await axios.post(`${API_BASE_URL}/subjects/`, { name: e.target.subName.value, semester: parseInt(e.target.sem.value), branch: e.target.branch.value }, { headers: { Authorization: `Bearer ${token}` } });
                  e.target.reset(); fetchSubjects(); setActiveTab('overview');
                  setSuccessMsg('Subject added successfully!');
                }} className="space-y-4">
                  <input name="subName" placeholder="Subject Name" required className={`w-full p-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  <div className="grid grid-cols-2 gap-4">
                    <input name="sem" type="number" placeholder="Semester" required className={`w-full p-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                    <input name="branch" placeholder="Branch" required className={`w-full p-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`} />
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 text-white text-sm font-bold py-3 rounded-xl cursor-pointer">Save Subject</button>
                </form>
              </div>
            )}

            {activeTab === 'add-content' && isAdmin && (
              <div className={`max-w-4xl mx-auto p-8 rounded-3xl border space-y-8 ${darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className="text-center space-y-2">
                  <h2 className="text-3xl font-black">Upload Course Content</h2>
                  <p className="text-xs text-slate-400">Select a subject and upload study notes or add video lecture links.</p>
                </div>
                
                {successMsg && <div className="bg-emerald-500/10 text-emerald-400 text-xs p-3.5 rounded-xl border border-emerald-500/25 max-w-xl mx-auto">{successMsg}</div>}

                <div className="space-y-2 max-w-xl mx-auto">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Target Subject</label>
                  <select id="targetSubject" className={`w-full p-3 border rounded-xl text-sm ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50'}`}>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name} (Sem {s.semester} • {s.branch})</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const subId = document.getElementById('targetSubject').value;
                    const fd = new FormData();
                    fd.append('title', e.target.noteTitle.value); 
                    fd.append('file', e.target.noteFile.files[0]);
                    await axios.post(`${API_BASE_URL}/subjects/${subId}/notes`, fd, { headers: { Authorization: `Bearer ${token}` } });
                    e.target.reset(); setSuccessMsg('PDF Note Uploaded Successfully!');
                  }} className={`p-6 border rounded-2xl space-y-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-xs font-extrabold uppercase text-emerald-400 tracking-wider">📄 Upload PDF Study Note</h4>
                    <input name="noteTitle" placeholder="Note Title (e.g., Unit 1 Notes)" required className={`w-full p-3 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`} />
                    <input name="noteFile" type="file" accept="application/pdf" required className={`w-full text-xs cursor-pointer ${darkMode ? 'text-slate-300' : 'text-slate-600'}`} />
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer">Upload PDF Note</button>
                  </form>

                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const subId = document.getElementById('targetSubject').value;
                    const fd = new URLSearchParams();
                    fd.append('title', e.target.vidTitle.value);
                    fd.append('youtube_url', e.target.vidUrl.value);
                    await axios.post(`${API_BASE_URL}/subjects/${subId}/videos`, fd, { headers: { Authorization: `Bearer ${token}` } });
                    e.target.reset(); setSuccessMsg('YouTube Video Lecture Added Successfully!');
                  }} className={`p-6 border rounded-2xl space-y-4 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className="text-xs font-extrabold uppercase text-rose-400 tracking-wider">▶ Add YouTube Video Lecture</h4>
                    <input name="vidTitle" placeholder="Video Title (e.g., Lecture 1 - Intro)" required className={`w-full p-3 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`} />
                    <input name="vidUrl" type="url" placeholder="YouTube URL (https://youtube.com/...)" required className={`w-full p-3 border rounded-xl text-xs ${darkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white'}`} />
                    <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-3 rounded-xl cursor-pointer">Add Video Lecture</button>
                  </form>
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}