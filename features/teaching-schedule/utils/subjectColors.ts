/**
 * Cung cấp mã màu sắc và nhãn phân loại hài hòa cho từng môn học
 */

export interface SubjectTheme {
  bg: string;
  text: string;
  border: string;
  badgeBg: string;
  dotColor: string;
}

export function getSubjectTheme(subjectName: string): SubjectTheme {
  const norm = (subjectName || '').toLowerCase().trim();

  // Toán học
  if (norm.includes('toán') || norm.includes('toan')) {
    return {
      bg: 'bg-blue-500/10 dark:bg-blue-500/20',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-500/30 dark:border-blue-500/40',
      badgeBg: 'bg-blue-600 text-white',
      dotColor: 'bg-blue-500',
    };
  }

  // Ngữ văn
  if (norm.includes('văn') || norm.includes('van')) {
    return {
      bg: 'bg-purple-500/10 dark:bg-purple-500/20',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-500/30 dark:border-purple-500/40',
      badgeBg: 'bg-purple-600 text-white',
      dotColor: 'bg-purple-500',
    };
  }

  // Tiếng Anh / Ngoại ngữ
  if (norm.includes('anh') || norm.includes('tiếng anh') || norm.includes('t.anh') || norm.includes('t. anh')) {
    return {
      bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-500/30 dark:border-emerald-500/40',
      badgeBg: 'bg-emerald-600 text-white',
      dotColor: 'bg-emerald-500',
    };
  }

  // KHTN - Khoa học tự nhiên (Lý, Hóa, Sinh)
  if (norm.includes('khtn') || norm.includes('lý') || norm.includes('hóa') || norm.includes('sinh')) {
    return {
      bg: 'bg-amber-500/10 dark:bg-amber-500/20',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-500/30 dark:border-amber-500/40',
      badgeBg: 'bg-amber-600 text-white',
      dotColor: 'bg-amber-500',
    };
  }

  // Tin học
  if (norm.includes('tin')) {
    return {
      bg: 'bg-cyan-500/10 dark:bg-cyan-500/20',
      text: 'text-cyan-700 dark:text-cyan-300',
      border: 'border-cyan-500/30 dark:border-cyan-500/40',
      badgeBg: 'bg-cyan-600 text-white',
      dotColor: 'bg-cyan-500',
    };
  }

  // Lịch sử & Địa lý (LS&ĐL, Sử, Địa)
  if (norm.includes('ls&đl') || norm.includes('sử') || norm.includes('địa') || norm.includes('dia') || norm.includes('su')) {
    return {
      bg: 'bg-indigo-500/10 dark:bg-indigo-500/20',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-500/30 dark:border-indigo-500/40',
      badgeBg: 'bg-indigo-600 text-white',
      dotColor: 'bg-indigo-500',
    };
  }

  // Giáo dục thể chất (GDTC)
  if (norm.includes('gdtc') || norm.includes('thể chất') || norm.includes('the chat')) {
    return {
      bg: 'bg-teal-500/10 dark:bg-teal-500/20',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-500/30 dark:border-teal-500/40',
      badgeBg: 'bg-teal-600 text-white',
      dotColor: 'bg-teal-500',
    };
  }

  // Nghệ thuật (Âm nhạc, Mỹ thuật - M.T, Â.N)
  if (norm.includes('n.t') || norm.includes('m.t') || norm.includes('â.n') || norm.includes('nhạc') || norm.includes('họa')) {
    return {
      bg: 'bg-pink-500/10 dark:bg-pink-500/20',
      text: 'text-pink-700 dark:text-pink-300',
      border: 'border-pink-500/30 dark:border-pink-500/40',
      badgeBg: 'bg-pink-600 text-white',
      dotColor: 'bg-pink-500',
    };
  }

  // Giáo dục công dân (GDCD) / Giáo dục địa phương (GDĐP)
  if (norm.includes('gdcd') || norm.includes('gdđp') || norm.includes('công dân') || norm.includes('địa phương')) {
    return {
      bg: 'bg-rose-500/10 dark:bg-rose-500/20',
      text: 'text-rose-700 dark:text-rose-300',
      border: 'border-rose-500/30 dark:border-rose-500/40',
      badgeBg: 'bg-rose-600 text-white',
      dotColor: 'bg-rose-500',
    };
  }

  // Hoạt động trải nghiệm (HĐTN) / Chào cờ
  if (norm.includes('hđtn') || norm.includes('hdtn') || norm.includes('dưới cờ') || norm.includes('chào cờ')) {
    return {
      bg: 'bg-violet-500/10 dark:bg-violet-500/20',
      text: 'text-violet-700 dark:text-violet-300',
      border: 'border-violet-500/30 dark:border-violet-500/40',
      badgeBg: 'bg-violet-600 text-white',
      dotColor: 'bg-violet-500',
    };
  }

  // Công nghệ
  if (norm.includes('công nghệ') || norm.includes('c.nghệ') || norm.includes('c. nghệ')) {
    return {
      bg: 'bg-orange-500/10 dark:bg-orange-500/20',
      text: 'text-orange-700 dark:text-orange-300',
      border: 'border-orange-500/30 dark:border-orange-500/40',
      badgeBg: 'bg-orange-600 text-white',
      dotColor: 'bg-orange-500',
    };
  }

  // Mặc định
  return {
    bg: 'bg-slate-500/10 dark:bg-slate-500/20',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-500/30 dark:border-slate-500/40',
    badgeBg: 'bg-slate-700 text-white',
    dotColor: 'bg-slate-400',
  };
}
