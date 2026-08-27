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

  if (totalElapsedSessions === 0) {
    return {
      totalElapsedSessions: 0,
      presentCount: 0,
      absentCount: 0,
      lateCount: 0,
      cancelledCount,
      futureOrIgnoredCount,
      absencePercentage: 0,
      effectiveAbsencePercentage: 0,
      warningLevel: 'safe',
      warningMessage: 'لا توجد محاضرات منقضية مسجلة بعد'
    };
  }

  // في اللائحة الجامعية: كل 3 تأخيرات تعادل غياب محاضرة واحدة (أو ثلث غياب لكل تأخير)
  const effectiveAbsentUnits = absentCount + (lateCount / 3);
  const absencePercentage = Math.round((absentCount / totalElapsedSessions) * 100);
  const effectiveAbsencePercentage = Math.min(100, Math.round((effectiveAbsentUnits / totalElapsedSessions) * 100));

  let warningLevel: 'safe' | 'warning' | 'danger' | 'dn_risk' = 'safe';
  let warningMessage = 'نسبة حضور ممتازة وضمن النطاق الآمن 🟢';

  if (effectiveAbsencePercentage >= 25) {
    warningLevel = 'dn_risk';
    warningMessage = 'تجاوزت الحد المسموح (25%) - معرض للحرمان الأكاديمي 🛑';
  } else if (effectiveAbsencePercentage >= 20) {
    warningLevel = 'danger';
    warningMessage = 'إنذار ثانٍ حرج (20%) - محاضرة واحدة تفصلك عن الحرمان ⚠️';
  } else if (effectiveAbsencePercentage >= 10) {
    warningLevel = 'warning';
    warningMessage = 'إنذار أول (10%) - يرجى الانتباه وتجنب الغياب 🟡';
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
 * خوارزمية عداد المكافأة بالتقويم المالي السعودي
 * القواعد الصارمة:
 * - موعد الإيداع الأساسي: يوم 27 من كل شهر ميلادي.
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
  const rawDate = new Date(year, monthIndex, 27, 0, 0, 0);
  const dayOfWeek = rawDate.getDay();

  if (dayOfWeek === 5) {
    const adjusted = new Date(year, monthIndex, 26, 0, 0, 0);
    return {
      date: adjusted,
      note: 'تم تقديم الصرف للخميس 26 لمصادفة يوم 27 يوم الجمعة'
    };
  } else if (dayOfWeek === 6) {
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

  const endOfTargetDate = new Date(targetDate);
  endOfTargetDate.setHours(23, 59, 59, 999);

  if (now > endOfTargetDate) {
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    const nextTarget = getAdjustedScholarshipDate(nextYear, nextMonth);
    targetDate = nextTarget.date;
    note = nextTarget.note;
  }

  const isToday = 
    now.getFullYear() === targetDate.getFullYear() &&
    now.getMonth() === targetDate.getMonth() &&
    now.getDate() === targetDate.getDate();

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
 * تنسيق وعرض المعدل التراكمي بدون أي قيم افتراضية عشوائية
 */
export function formatGpaDisplay(value?: number | null, type: GpaType = '5'): { display: string; percentage: number; label: string } {
  let max = 5;
  let label = 'من 5.00';
  if (type === '4') {
    max = 4;
    label = 'من 4.00';
  } else if (type === '100') {
    max = 100;
    label = '% مئوي';
  }

  const numericValue = typeof value === 'number' && !isNaN(value) ? value : null;
  if (numericValue === null || numericValue === 0) {
    return { display: 'غير محدد', percentage: 0, label };
  }

  const percentage = Math.min(100, Math.max(0, (numericValue / max) * 100));
  const display = type === '100' ? `${numericValue.toFixed(1)}%` : `${numericValue.toFixed(2)} / ${max.toFixed(2)}`;

  return { display, percentage, label };
}

/**
 * تحويل التواريخ إلى صيغة عربية لطيفة
 */
export function formatDateArabic(dateStr?: string | null): string {
  if (!dateStr || dateStr.trim() === '') return 'غير محدد';
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
