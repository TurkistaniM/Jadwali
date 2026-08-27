import { Attendance, AttendanceStatus, GpaType } from '../types/database';

/**
 * دالة حساب نسبة الغياب المنقضية بدقة للمقرر أو لكافة المقررات
 * القاعدة الصارمة:
 * - حساب الغيابات فقط للمحاضرات المنقضية من بداية الترم وحتى اليوم.
 * - حظر حساب المحاضرات المستقبلية.
 * - الاستبعاد التام للمحاضرات الملغاة ("تم إلغاء الدرس") من إجمالي المحاضرات.
 */
export interface AttendanceStats {
  totalElapsedSessions: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  cancelledCount: number;
  futureOrIgnoredCount: number;
  absencePercentage: number;
  effectiveAbsencePercentage: number; // Includes 1/3 penalty for lates if applicable
  warningLevel: 'safe' | 'warning' | 'danger' | 'dn_risk';
  warningMessage: string;
}

export function calculateElapsedAbsenceStats(
  attendances: Attendance[],
  termStartDate?: string,
  termEndDate?: string
): AttendanceStats {
  const today = new Date();
  today.setHours(23, 59, 59, 999);

  const start = termStartDate ? new Date(termStartDate) : new Date(today.getFullYear(), today.getMonth() - 2, 1);
  start.setHours(0, 0, 0, 0);

  let presentCount = 0;
  let absentCount = 0;
  let lateCount = 0;
  let cancelledCount = 0;
  let futureOrIgnoredCount = 0;

  attendances.forEach(att => {
    const sessionDate = new Date(att.session_date);
    sessionDate.setHours(12, 0, 0, 0);

    // استبعاد المحاضرات المستقبلية أو السابقة لبداية الترم
    if (sessionDate > today || sessionDate < start) {
      futureOrIgnoredCount++;
      return;
    }

    if (att.status === 'تم إلغاء الدرس') {
      cancelledCount++;
      // مستثناة تماماً من إجمالي المحاضرات المحسوبة
      return;
    }

    if (att.status === 'حاضر') {
      presentCount++;
    } else if (att.status === 'غائب') {
      absentCount++;
    } else if (att.status === 'متأخر') {
      lateCount++;
    }
  });

  const totalElapsedSessions = presentCount + absentCount + lateCount;
  
  // نسبة الغياب المباشرة
  const absencePercentage = totalElapsedSessions > 0 
    ? Math.round((absentCount / totalElapsedSessions) * 100) 
    : 0;

  // كل 3 تأخيرات تعادل غياباً واحداً وفق اللائحة الجامعية
  const effectiveAbsences = absentCount + Math.floor(lateCount / 3);
  const effectiveAbsencePercentage = totalElapsedSessions > 0
    ? Math.min(100, Math.round((effectiveAbsences / totalElapsedSessions) * 100))
    : 0;

  let warningLevel: 'safe' | 'warning' | 'danger' | 'dn_risk' = 'safe';
  let warningMessage = 'نسبة الحضور ممتازة وفي النطاق الآمن';

  if (effectiveAbsencePercentage >= 20) {
    warningLevel = 'dn_risk';
    warningMessage = 'تجاوزت نسبة الغياب المسموحة (خطر الحرمان DN)!';
  } else if (effectiveAbsencePercentage >= 15) {
    warningLevel = 'danger';
    warningMessage = 'إنذار غياب: اقتربت من حاجز الحرمان الأكاديمي';
  } else if (effectiveAbsencePercentage >= 10) {
    warningLevel = 'warning';
    warningMessage = 'تنبيه: راقب نسبة حضورك لتجنب الإنذارات';
  }

  return {
    totalElapsedSessions,
    presentCount,
    absentCount,
    lateCount,
    cancelledCount,
    futureOrIgnoredCount,
    absencePercentage,
    effectiveAbsencePercentage,
    warningLevel,
    warningMessage
  };
}

/**
 * دالة حساب موعد صرف المكافأة الجامعية بالتقويم المالي السعودي
 * القاعدة:
 * - موعد الصرف الأساسي: يوم 27 ميلادي.
 * - إذا وافق يوم 27 الجمعة -> يقدم للخميس 26.
 * - إذا وافق يوم 27 السبت -> يؤخر للأحد 28 (أو 29).
 */
export interface ScholarshipCountdown {
  targetDate: Date;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  formattedTargetDate: string;
  adjustmentNote: string;
  isToday: boolean;
  amount: number;
  monthNameArabic: string;
}

export function getAdjustedScholarshipDate(year: number, monthIndex: number): { date: Date; note: string } {
  // 27th of target month
  const rawDate = new Date(year, monthIndex, 27, 0, 0, 0);
  const dayOfWeek = rawDate.getDay(); // 0 = Sunday, 5 = Friday, 6 = Saturday

  if (dayOfWeek === 5) {
    // الجمعة -> تقديم للخميس 26
    const adjusted = new Date(year, monthIndex, 26, 0, 0, 0);
    return {
      date: adjusted,
      note: 'تم تقديم الصرف للخميس 26 لمصادفة يوم 27 يوم الجمعة'
    };
  } else if (dayOfWeek === 6) {
    // السبت -> تأخير للأحد 28
    const adjusted = new Date(year, monthIndex, 28, 0, 0, 0);
    return {
      date: adjusted,
      note: 'تم تأخير الصرف للأحد 28 لمصادفة يوم 27 يوم السبت'
    };
  } else {
    return {
      date: rawDate,
      note: 'موعد الصرف الاعتيادي يوم 27 من الشهر'
    };
  }
}

export function calculateNextScholarshipCountdown(now = new Date()): ScholarshipCountdown {
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let { date: targetDate, note } = getAdjustedScholarshipDate(currentYear, currentMonth);

  // إذا انتهى موعد صرف هذا الشهر، ننتقل للشهر القادم
  // نعتبر الصرف مستمراً طوال اليوم حتى نهاية اليوم 23:59:59
  const targetEndOfDay = new Date(targetDate);
  targetEndOfDay.setHours(23, 59, 59, 999);

  const isToday = now.toDateString() === targetDate.toDateString();

  if (now > targetEndOfDay) {
    const nextMonth = (currentMonth + 1) % 12;
    const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
    const nextCalc = getAdjustedScholarshipDate(nextYear, nextMonth);
    targetDate = nextCalc.date;
    note = nextCalc.note;
  }

  const diffMs = Math.max(0, targetDate.getTime() - now.getTime());
  const totalSeconds = Math.floor(diffMs / 1000);
  
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const arabicMonths = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const arabicDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const dayName = arabicDays[targetDate.getDay()];
  const monthNameArabic = arabicMonths[targetDate.getMonth()];
  const formattedTargetDate = `${dayName}، ${targetDate.getDate()} ${monthNameArabic} ${targetDate.getFullYear()}`;

  return {
    targetDate,
    days,
    hours,
    minutes,
    seconds,
    formattedTargetDate,
    adjustmentNote: note,
    isToday,
    amount: 1000,
    monthNameArabic
  };
}

/**
 * تنسيق وعرض المعدل التراكمي
 */
export function formatGpaDisplay(value: number, type: GpaType): { display: string; percentage: number; label: string } {
  let max = 5;
  let label = 'من 5.00';
  if (type === '4') {
    max = 4;
    label = 'من 4.00';
  } else if (type === '100') {
    max = 100;
    label = '% مئوي';
  }

  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  const display = type === '100' ? `${value.toFixed(1)}%` : `${value.toFixed(2)} / ${max.toFixed(2)}`;

  return { display, percentage, label };
}

/**
 * تحويل التواريخ إلى صيغة عربية لطيفة
 */
export function formatDateArabic(dateStr?: string | null): string {
  if (!dateStr) return 'غير محدد';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const arabicMonths = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return `${d.getDate()} ${arabicMonths[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
