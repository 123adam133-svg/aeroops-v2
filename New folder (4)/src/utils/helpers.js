/* ═══════════════════════════════════════════════════════════
 * HELPERS — كل الأدوات المساعدة
 * Includes: Safe Parsing, Dates, Time, Strings, Validation
 * ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
 * SAFE PARSING — تحويلات آمنة
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ تحويل آمن إلى مصفوفة */
export const safeArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

/* ⭐ تحويل آمن إلى كائن */
export const safeObject = (val) => {
  if (!val) return null;
  if (typeof val === "object" && !Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return typeof parsed === "object" && !Array.isArray(parsed)
        ? parsed
        : null;
    } catch {
      return null;
    }
  }
  return null;
};

/* ⭐ تحويل آمن إلى رقم */
export const safeNumber = (val, fallback = 0) => {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
};

/* ⭐ تحويل آمن إلى boolean */
export const safeBool = (val) => {
  return (
    val === true || val === "true" || val === "TRUE" || val === 1 || val === "1"
  );
};

/* ⭐ تحويل آمن إلى نص */
export const safeString = (val, fallback = "") => {
  if (val === null || val === undefined) return fallback;
  return String(val);
};

/* ⭐ تحويل آمن لتاريخ ISO */
export const safeDateISO = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString();
  } catch {
    return "";
  }
};

/* ═══════════════════════════════════════════════════════════
 * DATES — التواريخ
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ أيام حتى تاريخ معين */
export const daysUntil = (iso) => {
  if (!iso) return Infinity;
  const target = new Date(iso);
  if (isNaN(target.getTime())) return Infinity;
  return Math.ceil((target - new Date()) / 86400000);
};

/* ⭐ حالة المستند */
export const docStatus = (iso) => {
  const d = daysUntil(iso);
  if (d === Infinity) return "valid";
  if (d < 0) return "expired";
  if (d < 15) return "critical";
  if (d < 60) return "expiring";
  return "valid";
};

/* ⭐ تنسيق تاريخ (YYYY-MM-DD) */
export const fmtDate = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return d.toISOString().slice(0, 10);
  } catch {
    return "—";
  }
};

/* ⭐ تنسيق تاريخ كلاسيكي (DD-MM-YYYY) */
export const fmtDateClassic = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${String(d.getUTCDate()).padStart(2, "0")}-${String(
      d.getUTCMonth() + 1
    ).padStart(2, "0")}-${d.getUTCFullYear()}`;
  } catch {
    return "—";
  }
};

/* ⭐ تنسيق وقت (HH:MM) */
export const fmtTime = (iso, mode = "UTC") => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    const h = mode === "UTC" ? d.getUTCHours() : d.getHours();
    const m = mode === "UTC" ? d.getUTCMinutes() : d.getMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  } catch {
    return "—";
  }
};

/* ⭐ تنسيق تاريخ ووقت كامل */
export const fmtDateTime = (iso) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "—";
    return `${d.toISOString().slice(0, 10)} ${d.toISOString().slice(11, 16)}`;
  } catch {
    return "—";
  }
};

/* ⭐ "منذ X" (Time ago) */
export const fmtTimeAgo = (iso) => {
  if (!iso) return "—";
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}s`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr}h`;
    const day = Math.floor(hr / 24);
    if (day < 30) return `${day}d`;
    const mo = Math.floor(day / 30);
    if (mo < 12) return `${mo}mo`;
    return `${Math.floor(mo / 12)}y`;
  } catch {
    return "—";
  }
};

/* ⭐ أجزاء التاريخ (day + date) */
export const fmtDateParts = (iso, mode = "UTC") => {
  if (!iso) return { day: "—", date: "—" };
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return { day: "—", date: "—" };
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const di = mode === "UTC" ? d.getUTCDay() : d.getDay();
    const dt = mode === "UTC" ? d.getUTCDate() : d.getDate();
    const mo = mode === "UTC" ? d.getUTCMonth() : d.getMonth();
    return { day: days[di], date: `${dt} ${months[mo]}` };
  } catch {
    return { day: "—", date: "—" };
  }
};

/* ⭐ تاريخ اليوم (YYYY-MM-DD) */
export const todayISO = () => new Date().toISOString().slice(0, 10);

/* ⭐ تاريخ قبل X يوم */
export const daysAgoISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
};

/* ⭐ تاريخ بعد X يوم */
export const daysAheadISO = (days) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

/* ⭐ نطاق تاريخ */
export const dateRange = (period) => {
  const today = new Date();
  let from = new Date();

  if (period === "today") from = today;
  else if (period === "week" || period === "7")
    from.setDate(today.getDate() - 7);
  else if (period === "month") from.setDate(1);
  else if (period === "30") from.setDate(today.getDate() - 30);
  else if (period === "year") from.setMonth(0);
  else if (period === "90") from.setDate(today.getDate() - 90);
  else if (period === "365") from.setDate(today.getDate() - 365);

  return {
    from: from.toISOString().slice(0, 10),
    to: today.toISOString().slice(0, 10),
  };
};

/* ═══════════════════════════════════════════════════════════
 * TIME — الأوقات
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ الفرق بين وقتين بالدقائق */
export const timeDiffMin = (start, end) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  let d = eh * 60 + em - (sh * 60 + sm);
  if (d < 0) d += 24 * 60;
  return d;
};

/* ⭐ تحويل دقائق إلى HH:MM */
export const minToHM = (min) => {
  if (!min && min !== 0) return "00:00";
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/* ⭐ تحويل دقائق إلى Xh Ym */
export const minToHMText = (min) => {
  if (!min && min !== 0) return "0h 0m";
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  return `${h}h ${m}m`;
};

/* ⭐ تحويل HH:MM إلى دقائق */
export const hmToMin = (hm) => {
  if (!hm) return 0;
  const [h, m] = hm.split(":").map(Number);
  return h * 60 + m;
};

/* ⭐ تنسيق دقائق (HH:MM) — نفس minToHM */
export const fmtDuty = (min) => {
  if (!min && min !== 0) return "00:00";
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
};

/* ⭐ تنسيق دقائق (Xh Ym) */
export const fmtDutyHM = (min) => {
  if (!min && min !== 0) return "0h 0m";
  const h = Math.floor(Math.abs(min) / 60);
  const m = Math.abs(min) % 60;
  return `${h}h ${m}m`;
};

/* ═══════════════════════════════════════════════════════════
 * IDs & RANDOM
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ توليد ID فريد */
export const uid = (prefix = "id") => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
};

/* ⭐ UUID بسيط */
export const uuid = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/* ═══════════════════════════════════════════════════════════
 * STRINGS
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ اختصار الاسم (Initials) */
export const initials = (name) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
};

/* ⭐ قص النص */
export const truncate = (str, len = 30) => {
  if (!str) return "";
  return str.length > len ? str.slice(0, len) + "…" : str;
};

/* ⭐ Slug من اسم */
export const slugify = (str) => {
  return String(str || "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^\w_]/g, "");
};

/* ═══════════════════════════════════════════════════════════
 * VALIDATION
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ التحقق من البريد */
export const isValidEmail = (email) => {
  if (!email) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/* ⭐ التحقق من الهاتف */
export const isValidPhone = (phone) => {
  if (!phone) return false;
  return /^[\d+\s()-]{7,}$/.test(phone);
};

/* ⭐ التحقق من التاريخ */
export const isValidDate = (iso) => {
  if (!iso) return false;
  const d = new Date(iso);
  return !isNaN(d.getTime());
};

/* ═══════════════════════════════════════════════════════════
 * FILES
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ تنسيق حجم الملف */
export const formatFileSize = (bytes) => {
  if (!bytes) return "—";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
};

/* ⭐ أيقونة نوع الملف */
export const fileTypeIcon = (fileName, mime) => {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  const m = (mime || "").toLowerCase();
  if (
    m.startsWith("image/") ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)
  )
    return "image";
  if (ext === "pdf" || m === "application/pdf") return "pdf";
  if (["doc", "docx"].includes(ext)) return "word";
  if (["xls", "xlsx"].includes(ext)) return "excel";
  return "file";
};

/* ⭐ هل يمكن معاينته */
export const canPreviewFile = (fileName, mime) => {
  const ext = (fileName || "").split(".").pop().toLowerCase();
  const m = (mime || "").toLowerCase();
  return (
    m.startsWith("image/") ||
    m === "application/pdf" ||
    ["jpg", "jpeg", "png", "gif", "webp", "svg", "pdf"].includes(ext)
  );
};

/* ═══════════════════════════════════════════════════════════
 * COLORS
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ ألوان حسب الحالة */
export const getStatusColor = (status) => {
  const map = {
    valid: "bg-emerald-100 text-emerald-700 border-emerald-200",
    expiring: "bg-amber-100 text-amber-700 border-amber-200",
    critical: "bg-orange-100 text-orange-700 border-orange-200",
    expired: "bg-rose-100 text-rose-700 border-rose-200",
    active: "bg-emerald-100 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-200 text-slate-600 border-slate-300",
    pending: "bg-amber-100 text-amber-700 border-amber-200",
    approved: "bg-emerald-100 text-emerald-700 border-emerald-200",
    rejected: "bg-rose-100 text-rose-700 border-rose-200",
    ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
    warning: "bg-amber-100 text-amber-700 border-amber-200",
    exceeded: "bg-rose-100 text-rose-700 border-rose-200",
  };
  return map[status] || "bg-slate-100 text-slate-700 border-slate-200";
};

/* ⭐ لون شريط التقدم */
export const getProgressColor = (status) => {
  const map = {
    exceeded: "#dc2626",
    critical: "#f97316",
    warning: "#f59e0b",
    ok: "#22c55e",
    valid: "#22c55e",
  };
  return map[status] || "#94a3b8";
};

/* ═══════════════════════════════════════════════════════════
 * ARRAYS
 * ═══════════════════════════════════════════════════════════ */

/* ⭐ Group by key */
export const groupBy = (arr, keyFn) => {
  return arr.reduce((acc, item) => {
    const key = typeof keyFn === "function" ? keyFn(item) : item[keyFn];
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});
};

/* ⭐ Sort by */
export const sortBy = (arr, keyFn, direction = "asc") => {
  return [...arr].sort((a, b) => {
    const av = typeof keyFn === "function" ? keyFn(a) : a[keyFn];
    const bv = typeof keyFn === "function" ? keyFn(b) : b[keyFn];
    if (av < bv) return direction === "asc" ? -1 : 1;
    if (av > bv) return direction === "asc" ? 1 : -1;
    return 0;
  });
};

/* ⭐ Unique */
export const unique = (arr) => [...new Set(arr)];

/* ⭐ Sum */
export const sum = (arr, keyFn) => {
  return arr.reduce((total, item) => {
    const val = typeof keyFn === "function" ? keyFn(item) : item[keyFn];
    return total + (Number(val) || 0);
  }, 0);
};
