
import React, { useState, useEffect } from 'react';
import { User, WithdrawalRequest } from '../types';
import { marketStore } from '../store';
import { userService } from '../services/userService';
import { translations } from '../translations';
import { logEmail } from '../services/emailService';
import { resolveLocationName } from '../services/flashlineService';
import { Check, X, Shield, Users, Banknote, LayoutDashboard, Search, Database, Filter, Globe } from 'lucide-react'; // Added Globe icon
import { useToast } from '../components/ToastProvider';
import { MOCK_USERS } from '../lib/mockData'; // Import seed data to compare

interface AdminUser extends User {
  isMock: boolean;
  source?: 'SEED' | 'LOCAL' | 'CLOUD'; // Refined source tracking
}

export const AdminView: React.FC = () => {
  const lang = document.documentElement.dir === 'ltr' ? 'en' : 'ar';
  const t = translations[lang];
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'treasury'>('users');
  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null); // Track ID being acted on
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'APPROVED' | 'PENDING'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setLoading(true);
    try {
      // 1. Get Local Storage Users (Includes Seed + New Registrations)
      const storedUsers = marketStore.getUsers();
      
      // Identify seed IDs
      const seedIds = new Set(MOCK_USERS.map(u => u.id));

      const localUsers: AdminUser[] = storedUsers.map(u => ({
        ...u,
        isMock: seedIds.has(u.id), // Only flag as mock if it's from the original seed file
        source: seedIds.has(u.id) ? 'SEED' : 'LOCAL'
      }));
      
      // 2. Fetch Real Users from Cloud (Supabase)
      let cloudUsers: AdminUser[] = [];
      try {
        const fetched = await userService.getAll();
        cloudUsers = fetched.map(u => ({ ...u, isMock: false, source: 'CLOUD' }));
      } catch (e) {
        console.error("Failed to fetch real users", e);
      }

      // 3. Merge Lists
      // We prioritize Cloud, then Local (Registered), then Seed.
      const mergedMap = new Map<string, AdminUser>();
      
      // Add cloud users first (Truth)
      cloudUsers.forEach(u => mergedMap.set(u.id, u));
      
      // Add local users (if not already present from cloud)
      localUsers.forEach(u => {
        if (!mergedMap.has(u.id)) {
          mergedMap.set(u.id, u);
        }
      });

      setAllUsers(Array.from(mergedMap.values()));
      setWithdrawals([...marketStore.getWithdrawals()]);
    } catch (e) {
      showToast(t.common.error, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, status: 'APPROVED' | 'REJECTED') => {
    setActionLoading(userId);
    const user = allUsers.find(u => u.id === userId);
    if (!user) return;

    try {
      const response = await userService.updateUserStatus(userId, status);
      
      if (response.success) {
        // Update local state immediately for better UX
        const updatedUsers = allUsers.map(u => {
          if (u.id === userId) {
            return { 
              ...u, 
              status, 
              isApproved: status === 'APPROVED',
              approved_at: status === 'APPROVED' ? new Date().toISOString() : undefined 
            };
          }
          return u;
        });
        setAllUsers(updatedUsers);

        // Send Email Notification
        const subject = status === 'APPROVED' ? 'Account Approved' : 'Account Update';
        const message = status === 'APPROVED' 
          ? `Congratulations! Your merchant account for "${user.companyName || user.name}" has been approved. You can now log in and start selling.` 
          : `We regret to inform you that your account application has been rejected.`;
        
        logEmail(user.email, subject, message);
        
        showToast(`${user.name} has been ${status.toLowerCase()}`, status === 'APPROVED' ? 'success' : 'info');
      } else {
        showToast(response.error || 'Update failed', 'error');
      }
    } catch (e) {
      showToast('An error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleWithdrawal = (id: string, status: 'APPROVED' | 'REJECTED') => {
    marketStore.updateWithdrawalStatus(id, status);
    const w = withdrawals.find(x => x.id === id);
    if (w) {
      const u = allUsers.find(user => user.id === w.userId);
      if (u) logEmail(u.email, `Withdrawal Update: ${status}`, `Your withdrawal request for ${w.amount} ILS has been ${status}.`);
      showToast(`Withdrawal request ${status.toLowerCase()}`, status === 'APPROVED' ? 'success' : 'info');
    }
    // Update local withdrawal state
    setWithdrawals(prev => prev.map(wd => wd.id === id ? { ...wd, status } : wd));
  };

  const getUserLocation = (user: User) => {
    if (user.cityId) {
      return resolveLocationName(user.cityId, 'city', lang);
    }
    return user.city || '-';
  };

  const getFilteredUsers = () => {
    let result = allUsers.filter(u => u.role !== 'ADMIN'); // Exclude admins from list
    
    // Status Filter
    if (filterStatus === 'APPROVED') {
      result = result.filter(u => u.status === 'APPROVED' || u.isApproved);
    } else if (filterStatus === 'PENDING') {
      result = result.filter(u => u.status === 'PENDING' && !u.isApproved);
    }

    // Search Filter
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(u => 
        u.name.toLowerCase().includes(lower) || 
        u.email.toLowerCase().includes(lower) ||
        u.phone.includes(lower)
      );
    }

    return result;
  };

  const filteredUsers = getFilteredUsers();
  const pendingCount = allUsers.filter(u => u.status === 'PENDING' && u.role !== 'ADMIN').length;
  const pendingWithdrawals = withdrawals.filter(w => w.status === 'PENDING');

  const getSourceLabel = (user: AdminUser) => {
    if (user.source === 'SEED') return { label: t.common.mockData, icon: <Database className="w-3 h-3" />, color: 'bg-slate-100 text-slate-500' };
    if (user.source === 'CLOUD') return { label: 'Database', icon: <Globe className="w-3 h-3" />, color: 'bg-indigo-50 text-indigo-600' };
    return { label: 'Registered', icon: <Check className="w-3 h-3" />, color: 'bg-palma-primary/10 text-palma-primary' };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
         <div className="flex items-center gap-4">
            <div className="p-4 bg-palma-navy rounded-3xl text-white shadow-lg shadow-palma-navy/20"><Shield className="w-8 h-8" /></div>
            <div>
              <h2 className="text-4xl font-black text-palma-navy tracking-tight">{t.common.adminConsole}</h2>
              <p className="text-sm font-medium text-palma-muted">{t.common.platformOversight}</p>
            </div>
         </div>
         <div className="flex bg-white p-2 rounded-2xl shadow-soft border border-slate-100">
            <button onClick={() => setActiveTab('users')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'users' ? 'bg-palma-navy text-white shadow-lg' : 'text-palma-muted hover:bg-slate-50'}`}>
               <Users className="w-4 h-4" /> {t.common.users}
               {pendingCount > 0 && <span className="bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] ml-1">{pendingCount}</span>}
            </button>
            <button onClick={() => setActiveTab('treasury')} className={`px-8 py-3 rounded-xl text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all ${activeTab === 'treasury' ? 'bg-palma-navy text-white shadow-lg' : 'text-palma-muted hover:bg-slate-50'}`}>
               <Banknote className="w-4 h-4" /> {t.common.withdrawals}
               {pendingWithdrawals.length > 0 && <span className="bg-red-500 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] ml-1">{pendingWithdrawals.length}</span>}
            </button>
         </div>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
          
          {/* Filters Bar */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-soft flex flex-col lg:flex-row justify-between items-center gap-6">
             <h3 className="font-black text-palma-muted uppercase tracking-[0.15em] text-xs flex items-center gap-3">
               <span className="w-2.5 h-2.5 rounded-full bg-palma-primary animate-pulse"></span> 
               {t.common.activeUsersDB} ({filteredUsers.length})
             </h3>

             <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                <div className="relative flex-1 sm:w-64">
                   <Search className="w-4 h-4 text-palma-muted absolute left-3 top-1/2 -translate-y-1/2 rtl:left-auto rtl:right-3" />
                   <input 
                     type="text" 
                     placeholder={t.common.searchUsers} 
                     className="w-full pl-9 rtl:pr-9 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-palma-primary focus:bg-white transition-all"
                     value={searchTerm}
                     onChange={(e) => setSearchTerm(e.target.value)}
                   />
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                   <button onClick={() => setFilterStatus('ALL')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === 'ALL' ? 'bg-white text-palma-navy shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t.common.showAll}</button>
                   <button onClick={() => setFilterStatus('APPROVED')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t.common.approvedOnly}</button>
                   <button onClick={() => setFilterStatus('PENDING')} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${filterStatus === 'PENDING' ? 'bg-amber-100 text-amber-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{t.common.pendingOnly}</button>
                </div>
             </div>
          </div>

          {/* User List */}
          {loading ? (
             <div className="text-center py-20">
                <div className="w-10 h-10 border-4 border-slate-200 border-t-palma-primary rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-black uppercase text-slate-400 tracking-widest">{t.common.loading}</p>
             </div>
          ) : filteredUsers.length === 0 ? (
             <div className="bg-white p-20 rounded-[3rem] text-center border-2 border-dashed border-slate-100">
                <span className="text-5xl block mb-6 grayscale opacity-50">👥</span>
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">{t.common.noData}</p>
             </div>
          ) : (
             <div className="bg-white rounded-[2.5rem] shadow-card border border-slate-100 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="min-w-full text-left rtl:text-right">
                   <thead className="bg-slate-50 border-b border-slate-100">
                     <tr>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest w-64">{t.auth.name} / {t.auth.email}</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.auth.role}</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.status}</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Source</th>
                       <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.actions}</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-bold">
                     {filteredUsers.map(user => {
                       const isApproved = user.status === 'APPROVED' || user.isApproved;
                       const statusLabel = isApproved ? t.common.approved : t.common.pending;
                       const statusColor = isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100';
                       const sourceMeta = getSourceLabel(user);
                       const isProcessing = actionLoading === user.id;

                       return (
                         <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                           <td className="px-8 py-5">
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shadow-md ${user.source === 'SEED' ? 'bg-slate-400' : 'bg-palma-navy'}`}>
                                   {user.name.charAt(0)}
                                </div>
                                <div>
                                   <div className="text-sm font-black text-slate-900 leading-tight">{user.name}</div>
                                   <div className="text-[10px] text-slate-400 font-mono mt-0.5">{user.email}</div>
                                </div>
                             </div>
                           </td>
                           <td className="px-8 py-5">
                             <span className="bg-white border border-slate-100 px-3 py-1.5 rounded-lg text-[10px] font-black text-slate-600 uppercase tracking-wide shadow-sm">
                               {t.roles[user.role as keyof typeof t.roles] || user.role}
                             </span>
                           </td>
                           <td className="px-8 py-5">
                             <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${statusColor}`}>
                               {statusLabel}
                             </span>
                           </td>
                           <td className="px-8 py-5">
                             <span className={`flex items-center gap-1.5 w-fit px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${sourceMeta.color}`}>
                               {sourceMeta.icon}
                               {sourceMeta.label}
                             </span>
                           </td>
                           <td className="px-8 py-5">
                             {isProcessing ? (
                               <div className="w-5 h-5 border-2 border-palma-primary border-t-transparent rounded-full animate-spin"></div>
                             ) : (
                               <div className="flex gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                 {!isApproved && (
                                   <button onClick={() => handleStatusChange(user.id, 'APPROVED')} className="p-2 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition" title={t.common.approve}>
                                     <Check className="w-4 h-4" />
                                   </button>
                                 )}
                                 {user.status !== 'REJECTED' && (
                                   <button onClick={() => handleStatusChange(user.id, 'REJECTED')} className="p-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition" title={t.common.reject}>
                                     <X className="w-4 h-4" />
                                   </button>
                                 )}
                               </div>
                             )}
                           </td>
                         </tr>
                       );
                     })}
                   </tbody>
                 </table>
               </div>
             </div>
          )}
        </div>
      )}

      {activeTab === 'treasury' && (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
            <h3 className="font-black text-palma-muted uppercase tracking-[0.15em] text-xs flex items-center gap-3 mb-8">
               <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></span> {t.common.pendingWithdrawals} ({pendingWithdrawals.length})
            </h3>

            {pendingWithdrawals.length === 0 ? (
               <div className="p-20 bg-white rounded-[3rem] border border-slate-100 text-center shadow-soft">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                    <Banknote className="w-8 h-8" />
                  </div>
                  <p className="text-palma-navy font-bold text-lg">{t.common.treasuryClear}</p>
                  <p className="text-palma-muted text-sm uppercase tracking-wide mt-1">{t.common.noPendingWithdrawals}</p>
               </div>
            ) : (
               <div className="bg-white rounded-[2.5rem] shadow-soft border border-slate-100 overflow-hidden">
                  <table className="min-w-full">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="px-8 py-5 text-left rtl:text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.requestID}</th>
                           <th className="px-8 py-5 text-left rtl:text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.users}</th>
                           <th className="px-8 py-5 text-left rtl:text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.amount}</th>
                           <th className="px-8 py-5 text-left rtl:text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.date}</th>
                           <th className="px-8 py-5 text-left rtl:text-right text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.common.actions}</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-100">
                        {pendingWithdrawals.map(w => {
                           const reqUser = allUsers.find(u => u.id === w.userId);
                           return (
                              <tr key={w.id} className="hover:bg-slate-50 transition group">
                                 <td className="px-8 py-5 text-xs font-mono text-slate-500 font-bold">{w.id.split('-')[0]}...</td>
                                 <td className="px-8 py-5">
                                    <div className="text-sm font-black text-slate-900">{reqUser?.name || w.userId}</div>
                                    <div className="text-[10px] text-slate-400 uppercase tracking-wider">{reqUser ? t.roles[reqUser.role as keyof typeof t.roles] : 'Unknown'}</div>
                                 </td>
                                 <td className="px-8 py-5 text-lg font-black text-palma-primary">{w.amount} ₪</td>
                                 <td className="px-8 py-5 text-xs text-slate-500 font-bold">{new Date(w.date).toLocaleDateString()}</td>
                                 <td className="px-8 py-5 flex gap-3">
                                    <button onClick={() => handleWithdrawal(w.id, 'APPROVED')} className="bg-palma-primary text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition shadow-lg shadow-palma-primary/20">{t.common.approve}</button>
                                    <button onClick={() => handleWithdrawal(w.id, 'REJECTED')} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-100 transition">{t.common.reject}</button>
                                 </td>
                              </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            )}
        </div>
      )}
    </div>
  );
};
