/* ═══════════════════════════════════════════════════════════
 * PERMISSIONS SYSTEM
 * All permissions + role templates + can() function
 * v2.3 — Added Stamp & Reports Stamp Export permissions
 * ═══════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════
 * ALL PERMISSIONS — grouped
 * ═══════════════════════════════════════════════════════════ */
export const ALL_PERMISSIONS = {
  /* ─── Schedule ─── */
  schedule: {
    label_en: "Schedule",
    label_ar: "الجدول",
    icon: "📋",
    perms: [
      { key: "schedule.view", en: "View", ar: "عرض" },
      { key: "schedule.create", en: "Create", ar: "إنشاء" },
      { key: "schedule.edit", en: "Edit", ar: "تعديل" },
      { key: "schedule.delete", en: "Delete", ar: "حذف" },
      { key: "schedule.assign_crew", en: "Assign crew", ar: "تعيين طاقم" },
    ],
  },

  /* ─── FTL ─── */
  ftl: {
    label_en: "FTL",
    label_ar: "FTL",
    icon: "⏱️",
    perms: [
      { key: "ftl.view", en: "View", ar: "عرض" },
      { key: "ftl.edit", en: "Edit", ar: "تعديل" },
    ],
  },

  /* ─── Fleet ─── */
  fleet: {
    label_en: "Fleet",
    label_ar: "الأسطول",
    icon: "✈️",
    perms: [
      { key: "fleet.view", en: "View", ar: "عرض" },
      { key: "fleet.create", en: "Add", ar: "إضافة" },
      { key: "fleet.edit", en: "Edit", ar: "تعديل" },
      { key: "fleet.delete", en: "Delete", ar: "حذف" },
      { key: "fleet.docs", en: "View Documents", ar: "عرض المستندات" },
      { key: "fleet.docs_edit", en: "Edit Documents", ar: "تعديل المستندات" },
      {
        key: "fleet.docs_download",
        en: "Download Documents",
        ar: "تحميل المستندات",
      },
    ],
  },

  /* ─── Crew ─── */
  crew: {
    label_en: "Crew",
    label_ar: "الأطقم",
    icon: "👥",
    perms: [
      { key: "crew.view", en: "View", ar: "عرض" },
      { key: "crew.create", en: "Add", ar: "إضافة" },
      { key: "crew.edit", en: "Edit", ar: "تعديل" },
      { key: "crew.delete", en: "Delete", ar: "حذف" },
      { key: "crew.docs", en: "View Documents", ar: "عرض المستندات" },
      { key: "crew.docs_edit", en: "Edit Documents", ar: "تعديل المستندات" },
      {
        key: "crew.docs_download",
        en: "Download Documents",
        ar: "تحميل المستندات",
      },
      { key: "crew.card", en: "ID Card", ar: "بطاقة" },
    ],
  },

  /* ─── Roster ─── */
  roster: {
    label_en: "Roster",
    label_ar: "الجدول",
    icon: "📅",
    perms: [
      { key: "roster.view", en: "View", ar: "عرض" },
      { key: "roster.create", en: "Create", ar: "إنشاء" },
      { key: "roster.edit", en: "Edit", ar: "تعديل" },
      { key: "roster.delete", en: "Delete", ar: "حذف" },
      { key: "roster.publish", en: "Publish", ar: "نشر" },
    ],
  },

  /* ─── Standby ─── */
  standby: {
    label_en: "Standby",
    label_ar: "الاحتياطي",
    icon: "⏰",
    perms: [
      { key: "standby.view", en: "View", ar: "عرض" },
      { key: "standby.create", en: "Create", ar: "إنشاء" },
      { key: "standby.edit", en: "Edit", ar: "تعديل" },
      { key: "standby.delete", en: "Delete", ar: "حذف" },
    ],
  },

  /* ─── Leave ─── */
  leave: {
    label_en: "Leave",
    label_ar: "الإجازات",
    icon: "🌴",
    perms: [
      { key: "leave.view", en: "View", ar: "عرض" },
      { key: "leave.create", en: "Create", ar: "إنشاء" },
      { key: "leave.approve", en: "Approve", ar: "موافقة" },
      { key: "leave.delete", en: "Delete", ar: "حذف" },
    ],
  },

  /* ─── Training ─── */
  training: {
    label_en: "Training",
    label_ar: "التدريب",
    icon: "🎓",
    perms: [
      { key: "training.view", en: "View", ar: "عرض" },
      { key: "training.create", en: "Create", ar: "إنشاء" },
      { key: "training.edit", en: "Edit", ar: "تعديل" },
      { key: "training.delete", en: "Delete", ar: "حذف" },
    ],
  },

  /* ─── Reports ─── */
  reports: {
    label_en: "Reports",
    label_ar: "التقارير",
    icon: "📊",
    perms: [
      { key: "reports.view", en: "View", ar: "عرض" },
      { key: "reports.view_all", en: "View All Crew", ar: "عرض كل الطاقم" },
      { key: "reports.export", en: "Export", ar: "تصدير" },
      /* ⭐ صلاحية تصدير PDF بالختم */
      {
        key: "reports.export_stamp",
        en: "Export with Stamp",
        ar: "تصدير بالختم",
      },
    ],
  },

  /* ─── Tracking ─── */
  tracking: {
    label_en: "Flight Following",
    label_ar: "تتبع الرحلات",
    icon: "🛰️",
    perms: [{ key: "tracking.view", en: "View", ar: "عرض" }],
  },

  /* ─── Charts ─── */
  charts: {
    label_en: "Charts",
    label_ar: "الرسوم البيانية",
    icon: "📈",
    perms: [{ key: "charts.view", en: "View", ar: "عرض" }],
  },

  /* ─── WhatsApp ─── */
  whatsapp: {
    label_en: "WhatsApp",
    label_ar: "واتساب",
    icon: "💬",
    perms: [
      { key: "whatsapp.view", en: "View", ar: "عرض" },
      { key: "whatsapp.send", en: "Send", ar: "إرسال" },
      { key: "whatsapp.bulk", en: "Bulk Send", ar: "إرسال جماعي" },
    ],
  },

  /* ─── Users ─── */
  users: {
    label_en: "Users",
    label_ar: "المستخدمون",
    icon: "👤",
    perms: [
      { key: "users.view", en: "View", ar: "عرض" },
      { key: "users.create", en: "Add", ar: "إضافة" },
      { key: "users.edit", en: "Edit", ar: "تعديل" },
      { key: "users.delete", en: "Delete", ar: "حذف" },
      { key: "users.password", en: "Password", ar: "كلمة السر" },
      { key: "users.perms", en: "Permissions", ar: "صلاحيات" },
    ],
  },

  /* ─── Security ─── */
  security: {
    label_en: "Security",
    label_ar: "الأمان",
    icon: "🔐",
    perms: [
      { key: "security.login_history", en: "Login History", ar: "سجل الدخول" },
      { key: "security.audit_log", en: "Audit Log", ar: "سجل النشاطات" },
    ],
  },

  /* ─── Settings ─── */
  settings: {
    label_en: "Settings",
    label_ar: "الإعدادات",
    icon: "⚙️",
    perms: [
      { key: "settings.view", en: "View", ar: "عرض" },
      { key: "settings.edit", en: "Edit", ar: "تعديل" },
      /* ⭐ صلاحيات خاصة بالختم */
      { key: "settings.view_stamp", en: "View Stamp", ar: "رؤية الختم" },
      { key: "settings.edit_stamp", en: "Edit Stamp", ar: "تعديل الختم" },
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
 * ALL PERMISSIONS FLAT
 * ═══════════════════════════════════════════════════════════ */
export const ALL_PERMS_FLAT = Object.values(ALL_PERMISSIONS).flatMap((g) =>
  g.perms.map((p) => p.key)
);

export const TOTAL_PERMS_COUNT = ALL_PERMS_FLAT.length;

/* ═══════════════════════════════════════════════════════════
 * ROLE TEMPLATES
 * ═══════════════════════════════════════════════════════════ */
export const ROLE_TEMPLATES = {
  /* ─── Super Admin ─── */
  superAdmin: {
    label_en: "Super Admin",
    label_ar: "مدير عام",
    description_en: "Full system access",
    description_ar: "وصول كامل للنظام",
    color: "rose",
    icon: "👑",
    perms: ["*"],
  },

  /* ─── Dispatcher ─── */
  dispatcher: {
    label_en: "Dispatcher",
    label_ar: "منظم رحلات",
    description_en: "Flight dispatcher with full ops access",
    description_ar: "منظم رحلات مع صلاحيات تشغيلية كاملة",
    color: "sky",
    icon: "📋",
    perms: [
      "schedule.view",
      "schedule.create",
      "schedule.edit",
      "schedule.delete",
      "schedule.assign_crew",
      "ftl.view",
      "ftl.edit",
      "reports.view",
      "reports.view_all",
      "reports.export",
      "reports.export_stamp",
      "fleet.view",
      "fleet.docs",
      "fleet.docs_download",
      "crew.view",
      "crew.edit",
      "crew.docs",
      "crew.docs_edit",
      "crew.docs_download",
      "crew.card",
      "roster.view",
      "roster.create",
      "roster.edit",
      "roster.delete",
      "roster.publish",
      "standby.view",
      "standby.create",
      "standby.edit",
      "standby.delete",
      "leave.view",
      "leave.create",
      "leave.approve",
      "leave.delete",
      "training.view",
      "training.create",
      "training.edit",
      "training.delete",
      "tracking.view",
      "charts.view",
      "whatsapp.view",
      "whatsapp.send",
      "whatsapp.bulk",
      "users.view",
      "security.login_history",
      "security.audit_log",
      "settings.view",
      "settings.view_stamp",
      "settings.edit",
      "settings.edit_stamp",
    ],
  },

  /* ─── Captain ─── */
  captain: {
    label_en: "Captain",
    label_ar: "كابتن",
    description_en: "Captain with read access to ops",
    description_ar: "كابتن بصلاحيات عرض",
    color: "amber",
    icon: "✈️",
    perms: [
      "schedule.view",
      "ftl.view",
      "reports.view",
      "reports.export", // لا يملك تصدير بالختم
      "fleet.view",
      "fleet.docs",
      "fleet.docs_download",
      "crew.view",
      "crew.card",
      "crew.docs",
      "crew.docs_download",
      "roster.view",
      "standby.view",
      "leave.view",
      "training.view",
      "tracking.view",
      "charts.view",
      "settings.view",
      "settings.view_stamp", // يستطيع رؤية الختم لكن لا يعدله
    ],
  },

  /* ─── CAMO ─── */
  camo: {
    label_en: "CAMO",
    label_ar: "CAMO",
    description_en: "Continuing airworthiness management",
    description_ar: "إدارة صلاحية الطيران",
    color: "purple",
    icon: "🔧",
    perms: [
      "fleet.view",
      "fleet.create",
      "fleet.edit",
      "fleet.delete",
      "fleet.docs",
      "fleet.docs_edit",
      "fleet.docs_download",
      "crew.view",
      "crew.docs",
      "crew.docs_download",
      "reports.view",
      "reports.view_all",
      "reports.export",
      "reports.export_stamp",
      "charts.view",
      "settings.view",
      "settings.view_stamp",
      "settings.edit",
      "settings.edit_stamp",
    ],
  },

  /* ─── Crew Member ─── */
  crewMember: {
    label_en: "Crew Member",
    label_ar: "عضو طاقم",
    description_en: "Crew member with minimal access",
    description_ar: "عضو طاقم بصلاحيات محدودة",
    color: "emerald",
    icon: "👤",
    perms: [
      "schedule.view",
      "ftl.view",
      "reports.view",
      "reports.export",
      "crew.view",
      "crew.card",
      "crew.docs",
      "crew.docs_download",
      "roster.view",
      "standby.view",
      "leave.view",
      "training.view",
      "settings.view", // لا يرى الختم ولا يعدله
    ],
  },
};

/* ═══════════════════════════════════════════════════════════
 * GLOBAL ROLES STATE
 * ═══════════════════════════════════════════════════════════ */
let _globalRoles = [];

export const setGlobalRoles = (r) => {
  _globalRoles = r || [];
};

export const getGlobalRoles = () => _globalRoles;

/* ═══════════════════════════════════════════════════════════
 * CAN — Permission Check
 * ═══════════════════════════════════════════════════════════ */
export const can = (user, perm) => {
  if (!user) return false;
  if (user.role === "superAdmin") return true;

  const userPerms = (() => {
    if (!user.perms) return [];
    if (Array.isArray(user.perms)) return user.perms;
    if (typeof user.perms === "string") {
      try {
        const parsed = JSON.parse(user.perms);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  if (userPerms.length > 0) {
    if (userPerms.includes("*")) return true;
    return userPerms.includes(perm);
  }

  const role = _globalRoles.find((r) => r.name === user.role);
  let rolePerms = role?.perms;

  if (!rolePerms) {
    rolePerms = ROLE_TEMPLATES[user.role]?.perms || [];
  }

  if (typeof rolePerms === "string") {
    try {
      rolePerms = JSON.parse(rolePerms);
    } catch {
      rolePerms = [];
    }
  }
  if (!Array.isArray(rolePerms)) rolePerms = [];

  if (rolePerms.includes("*")) return true;
  return rolePerms.includes(perm);
};

/* ═══════════════════════════════════════════════════════════
 * GET USER PERMISSIONS
 * ═══════════════════════════════════════════════════════════ */
export const getUserPermissions = (user) => {
  if (!user) return [];
  if (user.role === "superAdmin") return ["*"];

  const userPerms = (() => {
    if (!user.perms) return [];
    if (Array.isArray(user.perms)) return user.perms;
    if (typeof user.perms === "string") {
      try {
        const parsed = JSON.parse(user.perms);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  })();

  if (userPerms.length > 0) return userPerms;

  const role = _globalRoles.find((r) => r.name === user.role);
  let rolePerms = role?.perms || ROLE_TEMPLATES[user.role]?.perms || [];

  if (typeof rolePerms === "string") {
    try {
      rolePerms = JSON.parse(rolePerms);
    } catch {
      rolePerms = [];
    }
  }
  if (!Array.isArray(rolePerms)) rolePerms = [];

  return rolePerms;
};

/* ═══════════════════════════════════════════════════════════
 * OTHER HELPERS
 * ═══════════════════════════════════════════════════════════ */
export const getRoleTemplate = (roleName) => ROLE_TEMPLATES[roleName] || null;

export const getRoleColor = (roleName, lang = "en") => {
  const role = _globalRoles.find((r) => r.name === roleName);
  const template = ROLE_TEMPLATES[roleName];
  const color = role?.color || template?.color || "slate";

  const colorMap = {
    rose: "bg-rose-100 text-rose-700 border-rose-300",
    sky: "bg-sky-100 text-sky-700 border-sky-300",
    amber: "bg-amber-100 text-amber-700 border-amber-300",
    purple: "bg-purple-100 text-purple-700 border-purple-300",
    emerald: "bg-emerald-100 text-emerald-700 border-emerald-300",
    slate: "bg-slate-100 text-slate-700 border-slate-300",
  };

  return colorMap[color] || colorMap.slate;
};

export const getRoleLabel = (roleName, lang = "en") => {
  const role = _globalRoles.find((r) => r.name === roleName);
  const template = ROLE_TEMPLATES[roleName];

  if (role) return lang === "ar" ? role.nameAr || role.name : role.name;
  if (template) return lang === "ar" ? template.label_ar : template.label_en;
  return roleName;
};

export const getRolePermissions = (roleName) => {
  const role = _globalRoles.find((r) => r.name === roleName);

  if (role) {
    let perms = role.perms || [];
    if (typeof perms === "string") {
      try {
        perms = JSON.parse(perms);
      } catch {
        perms = [];
      }
    }
    return Array.isArray(perms) ? perms : [];
  }

  return ROLE_TEMPLATES[roleName]?.perms || [];
};

export const countPermissions = (user) => {
  const perms = getUserPermissions(user);
  if (perms.includes("*")) return "ALL";
  return perms.length;
};

export const hasPermission = can;

export const getPermissionLabel = (permKey, lang = "en") => {
  for (const group of Object.values(ALL_PERMISSIONS)) {
    const perm = group.perms.find((p) => p.key === permKey);
    if (perm) return lang === "ar" ? perm.ar : perm.en;
  }
  return permKey;
};

export const groupPermissions = () => {
  return Object.entries(ALL_PERMISSIONS).map(([key, group]) => ({
    key,
    label_en: group.label_en,
    label_ar: group.label_ar,
    icon: group.icon,
    perms: group.perms,
  }));
};
