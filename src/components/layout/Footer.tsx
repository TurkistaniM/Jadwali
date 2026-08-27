import React from 'react';
import { Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#0F3040] border-t border-[#A56F63]/30 py-6 px-4 text-center mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#D99B7F] animate-pulse"></div>
          <span className="font-bold text-white text-sm">
            جَدْوَلي
          </span>
          <span className="text-slate-300 text-xs">
            - منصة الطالب الجامعي الشاملة
          </span>
        </div>

        {/* النص الإلزامي المعتمد في وثيقة المتطلبات (PRD) وتوجيهات الذكاء الاصطناعي (AGENTS.md) */}
        <div className="px-4 py-1.5 rounded-full bg-[#464858]/80 border border-[#A56F63]/40 shadow-inner">
          <p className="font-bold text-[#D99B7F] text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#D99B7F]" />
            <span>تم تصميم هذا الموقع من قبل محمد تركستاني</span>
          </p>
        </div>

        <div className="text-[11px] text-slate-400">
          <span>نظام آمن ومشفر بنسبة 100% • مدعوم بـ Supabase RLS</span>
        </div>
      </div>
    </footer>
  );
};
