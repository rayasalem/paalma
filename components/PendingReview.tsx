
import React from 'react';
import { User } from '../types';
import { translations, Language } from '../translations';
import { LogOut } from 'lucide-react';

interface PendingReviewProps {
  user: User;
  onLogout: () => void;
  lang?: Language;
}

export const PendingReview: React.FC<PendingReviewProps> = ({ user, onLogout, lang = 'ar' }) => {
  const t = translations[lang];
  const isRejected = user.status === 'REJECTED';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-sans" dir={lang === 'en' ? 'ltr' : 'rtl'}>
      <div className="max-w-xl w-full bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 p-12 md:p-16 text-center animate-in fade-in zoom-in duration-500">
        <div className={`w-24 h-24 ${isRejected ? 'bg-red-50 text-red-600' : 'bg-palma-primary/10 text-palma-primary'} rounded-[2rem] flex items-center justify-center mx-auto mb-10 text-4xl shadow-inner`}>
          {isRejected ? '❌' : '⏳'}
        </div>
        
        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-6">
          {isRejected 
            ? t.auth.accountRejectedTitle
            : t.auth.accountPendingTitle}
        </h1>
        
        <div className="space-y-6 mb-12">
          <p className="text-slate-600 leading-relaxed text-lg font-bold">
            {isRejected
              ? t.auth.accountRejectedMsg
              : t.auth.accountPendingMsg}
          </p>
          {!isRejected && (
            <p className="text-slate-400 text-sm font-medium">
              {t.auth.reviewTime}
            </p>
          )}
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 mb-12 border border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.auth.accountId}</p>
          <p className="text-sm font-mono text-slate-900 font-bold">{user.id}</p>
        </div>

        <button
          onClick={onLogout}
          className={`px-10 py-4 ${isRejected ? 'bg-red-600 hover:bg-red-700' : 'bg-palma-primary hover:bg-emerald-800'} text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 mx-auto hover:scale-105 duration-300`}
        >
          <LogOut className="w-4 h-4" />
          {t.common.logout}
        </button>
      </div>
    </div>
  );
};
