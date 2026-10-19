/* ═══════════════════════════════════════════════════════════
 * AeroOps API Client — Google Sheets + Drive
 * Version 3.5 — Stamp + Logo persistence (Strict URL Cleaning)
 * ═══════════════════════════════════════════════════════════ */

const API_URL =
  "https://script.google.com/macros/s/AKfycbx1Q_uFSgUs43Y3xqS7C8_yptcPPizMIBaUf0Kf07TKf4n_X75j84rHlAvwcXcTeMVtTg/exec";

/* ═══════════════════════════════════════════════════════════
 * SAFE HELPERS
 * ═══════════════════════════════════════════════════════════ */
function safeArray(val) {
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
}

/* ⭐⭐⭐ safeObject — مُحصَّن ضد كل الحالات ⭐⭐⭐ */
function safeObject(val) {
  if (!val) return null;

  /* object مباشر */
  if (typeof val === "object" && !Array.isArray(val)) {
    if (val instanceof Date) return null;
    return Object.keys(val).length > 0 ? val : null;
  }

  /* string */
  if (typeof val === "string") {
    let trimmed = val.trim();
    if (trimmed.startsWith("'")) trimmed = trimmed.slice(1);

    if (
      !trimmed ||
      trimmed === "" ||
      trimmed === "null" ||
      trimmed === "undefined"
    ) {
      return null;
    }

    /* محاولة parse عادية */
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed;
      }
      return null;
    } catch (e) {
      /* محاولة إصلاح JSON مقطوع */
      try {
        const fixed = trimmed.replace(/,\s*$/, "") + "}";
        const parsed = JSON.parse(fixed);
        if (parsed && typeof parsed === "object") {
          console.warn(
            "⚠️ safeObject — fixed truncated JSON for:",
            trimmed.substring(0, 50)
          );
          return parsed;
        }
      } catch (e2) {
        /* تجاهل */
      }

      /* محاولة تنظيف إضافي */
      try {
        const cleaned = trimmed
          .replace(/\\"/g, '"')
          .replace(/\\'/g, "'")
          .replace(/\\\\/g, "\\");
        const parsed = JSON.parse(cleaned);
        if (parsed && typeof parsed === "object") {
          console.warn(
            "⚠️ safeObject — cleaned escape chars for:",
            trimmed.substring(0, 50)
          );
          return parsed;
        }
      } catch (e3) {
        /* تجاهل */
      }

      console.warn("⚠️ safeObject — JSON.parse failed:", {
        raw: trimmed.substring(0, 150),
        error: e.message,
      });
      return null;
    }
  }

  return null;
}

function safeNumber(val, fallback = 0) {
  if (val === null || val === undefined || val === "") return fallback;
  const n = Number(val);
  return isNaN(n) ? fallback : n;
}

function safeBool(val) {
  return (
    val === true || val === "true" || val === "TRUE" || val === 1 || val === "1"
  );
}

function safeString(val, fallback = "") {
  if (val === null || val === undefined) return fallback;
  return String(val);
}

/* ⭐ دالة تنظيف الروابط (تزيل علامات الاقتباس والمسافات المخفية) */
function cleanUrl(url) {
  if (!url) return "";
  let str = String(url).trim();
  if (str.startsWith("'")) str = str.slice(1);
  if (str === "undefined" || str === "null") return "";
  return str;
}

/* ═══════════════════════════════════════════════════════════
 * Core
 * ═══════════════════════════════════════════════════════════ */
async function apiCall(action, sheet, data = {}, id = null) {
  const payload = JSON.stringify({ action, sheet, data, id });
  const body = "payload=" + encodeURIComponent(payload);

  const res = await fetch(API_URL, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    redirect: "follow",
  });

  const text = await res.text();
  if (text.trim().startsWith("<")) {
    const m = text.match(/<title>(.*?)<\/title>/i);
    throw new Error("Apps Script error: " + (m ? m[1] : "HTML"));
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("Non-JSON: " + text.substring(0, 200));
  }

  if (!result.ok) throw new Error(result.error || "API Error");
  return result.data;
}

async function apiRead(sheet) {
  const res = await fetch(`${API_URL}?sheet=${encodeURIComponent(sheet)}`, {
    method: "GET",
    redirect: "follow",
  });

  const text = await res.text();
  if (text.trim().startsWith("<")) {
    const m = text.match(/<title>(.*?)<\/title>/i);
    throw new Error("Apps Script error: " + (m ? m[1] : "HTML"));
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("Non-JSON: " + text.substring(0, 200));
  }

  if (!result.ok) throw new Error(result.error || "Read Error");
  return result.data || [];
}

/* ═══════════════════════════════════════════════════════════
 * CREW
 * ═══════════════════════════════════════════════════════════ */
export const crewAPI = {
  list: async () => {
    const list = await apiRead("Crew");
    return list.map((c) => ({
      ...c,
      attachments: safeArray(c.attachments),
      ftl28: safeNumber(c.ftl28, 0),
      active: safeBool(c.active),
      status: safeString(c.status, "active"),
    }));
  },
  create: (c) =>
    apiCall("create", "Crew", {
      fullName: c.fullName || "",
      role: c.role || "",
      empNo: c.empNo || "",
      email: c.email || "",
      phone: c.phone || "",
      nationality: c.nationality || "",
      dob: c.dob || "",
      gender: c.gender || "male",
      base: c.base || "",
      licenseNo: c.licenseNo || "",
      licenseExpiry: c.licenseExpiry || "",
      medicalExpiry: c.medicalExpiry || "",
      passportNo: c.passportNo || "",
      passportExpiry: c.passportExpiry || "",
      eNumber: c.eNumber || "",
      ftl28: c.ftl28 || 0,
      avatar: c.avatar || "",
      status: c.status || "active",
      attachments: JSON.stringify(c.attachments || []),
    }),
  update: (id, c) =>
    apiCall(
      "update",
      "Crew",
      {
        fullName: c.fullName || "",
        role: c.role || "",
        empNo: c.empNo || "",
        email: c.email || "",
        phone: c.phone || "",
        nationality: c.nationality || "",
        dob: c.dob || "",
        gender: c.gender || "male",
        base: c.base || "",
        licenseNo: c.licenseNo || "",
        licenseExpiry: c.licenseExpiry || "",
        medicalExpiry: c.medicalExpiry || "",
        passportNo: c.passportNo || "",
        passportExpiry: c.passportExpiry || "",
        eNumber: c.eNumber || "",
        ftl28: c.ftl28 || 0,
        avatar: c.avatar || "",
        status: c.status || "active",
        attachments: JSON.stringify(c.attachments || []),
      },
      id
    ),
  remove: (id) => apiCall("delete", "Crew", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * FLEET
 * ═══════════════════════════════════════════════════════════ */
export const fleetAPI = {
  list: async () => {
    const list = await apiRead("Fleet");
    return list.map((a) => ({
      ...a,
      attachments: safeArray(a.attachments),
      tah: safeNumber(a.tah, 0),
      tac: safeNumber(a.tac, 0),
      status: safeString(a.status, "AIRWORTHY"),
    }));
  },
  create: (a) =>
    apiCall("create", "Fleet", {
      reg: a.reg || "",
      type: a.type || "",
      status: a.status || "AIRWORTHY",
      tah: a.tah || 0,
      tac: a.tac || 0,
      lastCheck: a.lastCheck || "",
      nextCheck: a.nextCheck || "",
      attachments: JSON.stringify(a.attachments || []),
    }),
  update: (id, a) =>
    apiCall(
      "update",
      "Fleet",
      {
        reg: a.reg || "",
        type: a.type || "",
        status: a.status || "AIRWORTHY",
        tah: a.tah || 0,
        tac: a.tac || 0,
        lastCheck: a.lastCheck || "",
        nextCheck: a.nextCheck || "",
        attachments: JSON.stringify(a.attachments || []),
      },
      id
    ),
  remove: (id) => apiCall("delete", "Fleet", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * FLIGHTS
 * ═══════════════════════════════════════════════════════════ */
export const flightsAPI = {
  list: async () => {
    const list = await apiRead("Flights");
    return list.map((f) => {
      const actualRaw = f.actual;
      let actual = safeObject(actualRaw);

      if (!actual && actualRaw && String(actualRaw).trim() !== "") {
        console.warn("⚠️ flightsAPI.list — actual failed for", f.flightNo, {
          raw: String(actualRaw).substring(0, 200),
          type: typeof actualRaw,
        });
      }

      return {
        ...f,
        crewSlots: safeArray(f.crewSlots),
        actual: actual || {},
        pax: safeNumber(f.pax, 0),
        cargo: safeNumber(f.cargo, 0),
        status: safeString(f.status, "SCHEDULED"),
        flightType: safeString(f.flightType, "SCHEDULED"),
        notes: safeString(f.notes),
        permits: safeString(f.permits),
        services: safeString(f.services),
      };
    });
  },
  create: (f) =>
    apiCall("create", "Flights", {
      flightNo: f.flightNo || "",
      dep: f.dep || "",
      arr: f.arr || "",
      altn: f.altn || "",
      altn2: f.altn2 || "",
      std: f.std || "",
      sta: f.sta || "",
      acft: f.acft || "",
      status: f.status || "SCHEDULED",
      flightType: f.flightType || "SCHEDULED",
      notes: f.notes || "",
      permits: f.permits || "",
      services: f.services || "",
      pax: f.pax || 0,
      cargo: f.cargo || 0,
      crewSlots: JSON.stringify(f.crewSlots || []),
      actual: f.actual ? JSON.stringify(f.actual) : "",
    }),
  update: (id, f) =>
    apiCall(
      "update",
      "Flights",
      {
        flightNo: f.flightNo || "",
        dep: f.dep || "",
        arr: f.arr || "",
        altn: f.altn || "",
        altn2: f.altn2 || "",
        std: f.std || "",
        sta: f.sta || "",
        acft: f.acft || "",
        status: f.status || "SCHEDULED",
        flightType: f.flightType || "SCHEDULED",
        notes: f.notes || "",
        permits: f.permits || "",
        services: f.services || "",
        pax: f.pax || 0,
        cargo: f.cargo || 0,
        crewSlots: JSON.stringify(f.crewSlots || []),
        actual: f.actual ? JSON.stringify(f.actual) : "",
      },
      id
    ),
  remove: (id) => apiCall("delete", "Flights", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * USERS
 * ═══════════════════════════════════════════════════════════ */
export const usersAPI = {
  list: async () => {
    const list = await apiRead("Users");
    return list.map((u) => ({
      ...u,
      perms: safeArray(u.perms),
      active: safeBool(u.active),
      username: safeString(u.username),
      password: safeString(u.password),
      fullName: safeString(u.fullName),
      role: safeString(u.role, "crewMember"),
    }));
  },
  create: (u) =>
    apiCall("create", "Users", {
      username: u.username || "",
      password: u.password || "",
      fullName: u.fullName || "",
      role: u.role || "dispatcher",
      email: u.email || "",
      phone: u.phone || "",
      jobTitle: u.jobTitle || "",
      active: u.active !== false,
      crewId: u.crewId || "",
      perms: JSON.stringify(u.perms || []),
      avatar: u.avatar || "",
    }),
  update: (id, u) =>
    apiCall(
      "update",
      "Users",
      {
        username: u.username || "",
        password: u.password || "",
        fullName: u.fullName || "",
        role: u.role || "dispatcher",
        email: u.email || "",
        phone: u.phone || "",
        jobTitle: u.jobTitle || "",
        active: u.active !== false,
        crewId: u.crewId || "",
        perms: JSON.stringify(u.perms || []),
        avatar: u.avatar || "",
      },
      id
    ),
  remove: (id) => apiCall("delete", "Users", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * ROLES
 * ═══════════════════════════════════════════════════════════ */
export const rolesAPI = {
  list: async () => {
    const list = await apiRead("Roles");
    return list.map((r) => ({
      id: r.id,
      name: safeString(r.name),
      nameAr: safeString(r.nameAr, r.name),
      description: safeString(r.description),
      perms: safeArray(r.perms),
      active: safeBool(r.active),
    }));
  },
  create: (role) =>
    apiCall("create", "Roles", {
      name: role.name || "",
      nameAr: role.nameAr || role.name || "",
      description: role.description || "",
      perms: JSON.stringify(role.perms || []),
      active: role.active !== false,
    }),
  update: (id, role) =>
    apiCall(
      "update",
      "Roles",
      {
        name: role.name || "",
        nameAr: role.nameAr || role.name || "",
        description: role.description || "",
        perms: JSON.stringify(role.perms || []),
        active: role.active !== false,
      },
      id
    ),
  remove: (id) => apiCall("delete", "Roles", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * SETTINGS — with stamp support + merge on save
 * ═══════════════════════════════════════════════════════════ */
export const settingsAPI = {
  get: async () => {
    const list = await apiRead("Settings");
    if (!list[0]) return null;
    return {
      ...list[0],
      companyName: safeString(list[0].companyName, "AeroOps"),
      companyNameAr: safeString(list[0].companyNameAr, "إيرو أوبس"),
      operatorCode: safeString(list[0].operatorCode, "EACS"),
      navLayout: safeString(list[0].navLayout, "top"),
      tabPreferences: safeObject(list[0].tabPreferences) || null,
      logo: cleanUrl(list[0].logo) /* ⭐ قراءة نظيفة للشعار */,
      stamp: cleanUrl(list[0].stamp) /* ⭐ قراءة نظيفة للختم */,
      timeMode: safeString(list[0].timeMode, "utc"),
    };
  },

  /* ⭐ update صريح — يُستخدَم فقط عندما نريد الكتابة المباشرة */
  update: (id, data) => {
    const payload = {
      companyName: data.companyName !== undefined ? data.companyName : "",
      companyNameAr: data.companyNameAr !== undefined ? data.companyNameAr : "",
      operatorCode: (data.operatorCode || "EACS").toUpperCase(),
      navLayout: data.navLayout || "top",
      tabPreferences: data.tabPreferences
        ? JSON.stringify(data.tabPreferences)
        : "",
      logo: data.logo !== undefined ? data.logo : "",
      stamp: data.stamp !== undefined ? data.stamp : "",
      timeMode: data.timeMode || "utc",
    };

    /* ⭐ دعم المسح الصريح */
    if (data.__clearFields && Array.isArray(data.__clearFields)) {
      payload.__clearFields = data.__clearFields;
    }

    return apiCall("update", "Settings", payload, id);
  },

  /* ⭐⭐⭐ save — يدمج البيانات القديمة مع الجديدة ⭐⭐⭐
   * هذا هو الحل الجذري لمشكلة اختفاء الشعار/الختم:
   * نجلب البيانات الحالية من السيرفر، ثم ندمجها مع البيانات المُرسلة،
   * بحيث لا يمسح حفظٌ جزئيٌّ (مثل تعديل اسم الشركة) الختمَ أو الشعار.
   */
  save: async (data) => {
    let existing = null;
    try {
      existing = await settingsAPI.get();
    } catch (e) {
      console.warn(
        "⚠️ settingsAPI.save — could not fetch existing:",
        e.message
      );
    }

    /* ⭐ الدمج: القيم الموجودة أولاً، ثم القيم الجديدة (إن مُرِّرت) */
    const merged = {
      companyName:
        data.companyName !== undefined
          ? data.companyName
          : existing?.companyName || "",
      companyNameAr:
        data.companyNameAr !== undefined
          ? data.companyNameAr
          : existing?.companyNameAr || "",
      operatorCode:
        data.operatorCode !== undefined
          ? data.operatorCode
          : existing?.operatorCode || "EACS",
      navLayout:
        data.navLayout !== undefined
          ? data.navLayout
          : existing?.navLayout || "top",
      tabPreferences:
        data.tabPreferences !== undefined
          ? data.tabPreferences
          : existing?.tabPreferences || null,
      logo: data.logo !== undefined ? data.logo : existing?.logo || "",
      stamp: data.stamp !== undefined ? data.stamp : existing?.stamp || "",
      timeMode:
        data.timeMode !== undefined
          ? data.timeMode
          : existing?.timeMode || "utc",
    };

    /* ⭐ المسح الصريح */
    if (data.__clearFields && Array.isArray(data.__clearFields)) {
      merged.__clearFields = data.__clearFields;
    }

    const payload = {
      companyName: merged.companyName || "",
      companyNameAr: merged.companyNameAr || "",
      operatorCode: (merged.operatorCode || "EACS").toUpperCase(),
      navLayout: merged.navLayout || "top",
      tabPreferences: merged.tabPreferences
        ? JSON.stringify(merged.tabPreferences)
        : "",
      logo: merged.logo || "",
      stamp: merged.stamp || "",
      timeMode: merged.timeMode || "utc",
    };

    if (merged.__clearFields) {
      payload.__clearFields = merged.__clearFields;
    }

    if (existing && existing.id) {
      return apiCall("update", "Settings", payload, existing.id);
    }
    return apiCall("create", "Settings", payload);
  },

  /* ⭐ مسح الشعار صراحةً */
  clearLogo: async () => {
    return settingsAPI.save({ logo: "", __clearFields: ["logo"] });
  },

  /* ⭐ مسح الختم صراحةً */
  clearStamp: async () => {
    return settingsAPI.save({ stamp: "", __clearFields: ["stamp"] });
  },
};

/* ═══════════════════════════════════════════════════════════
 * AUDIT LOG
 * ═══════════════════════════════════════════════════════════ */
export const auditAPI = {
  list: async () => {
    const list = await apiRead("AuditLog");
    return list.map((l) => ({
      ...l,
      timestamp: safeString(l.timestamp),
      userId: safeString(l.userId),
      userName: safeString(l.userName),
      userRole: safeString(l.userRole),
      action: safeString(l.action),
      entity: safeString(l.entity),
      entityId: safeString(l.entityId),
      entityName: safeString(l.entityName),
      details: safeString(l.details, "{}"),
      ipAddress: safeString(l.ipAddress),
      userAgent: safeString(l.userAgent),
    }));
  },
  create: (log) =>
    apiCall("create", "AuditLog", {
      timestamp: log.timestamp || new Date().toISOString(),
      userId: log.userId || "",
      userName: log.userName || "",
      userRole: log.userRole || "",
      action: log.action || "",
      entity: log.entity || "",
      entityId: log.entityId || "",
      entityName: log.entityName || "",
      details:
        typeof log.details === "string"
          ? log.details
          : JSON.stringify(log.details || {}),
      ipAddress: log.ipAddress || "",
      userAgent: log.userAgent || "",
    }),
  remove: (id) => apiCall("delete", "AuditLog", {}, id),
  clearAll: async () => {
    const all = await apiRead("AuditLog");
    for (const log of all) {
      await apiCall("delete", "AuditLog", {}, log.id);
    }
  },
};

/* ═══════════════════════════════════════════════════════════
 * ROSTER
 * ═══════════════════════════════════════════════════════════ */
export const rosterAPI = {
  list: async () => {
    const list = await apiRead("Roster");
    return list.map((r) => ({
      ...r,
      date: safeString(r.date),
      crewId: safeString(r.crewId),
      crewName: safeString(r.crewName),
      type: safeString(r.type, "FLIGHT"),
      flightIds: safeArray(r.flightIds),
      startTime: safeString(r.startTime),
      endTime: safeString(r.endTime),
      notes: safeString(r.notes),
      status: safeString(r.status, "published"),
      publishedAt: safeString(r.publishedAt),
    }));
  },
  create: (r) =>
    apiCall("create", "Roster", {
      date: r.date || "",
      crewId: r.crewId || "",
      crewName: r.crewName || "",
      type: r.type || "FLIGHT",
      flightIds: JSON.stringify(r.flightIds || []),
      startTime: r.startTime || "",
      endTime: r.endTime || "",
      notes: r.notes || "",
      status: r.status || "published",
      publishedAt: r.publishedAt || "",
    }),
  update: (id, r) =>
    apiCall(
      "update",
      "Roster",
      {
        date: r.date || "",
        crewId: r.crewId || "",
        crewName: r.crewName || "",
        type: r.type || "FLIGHT",
        flightIds: JSON.stringify(r.flightIds || []),
        startTime: r.startTime || "",
        endTime: r.endTime || "",
        notes: r.notes || "",
        status: r.status || "published",
        publishedAt: r.publishedAt || "",
      },
      id
    ),
  remove: (id) => apiCall("delete", "Roster", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * STANDBY
 * ═══════════════════════════════════════════════════════════ */
export const standbyAPI = {
  list: async () => {
    const list = await apiRead("Standby");
    return list.map((s) => ({
      ...s,
      date: safeString(s.date),
      crewId: safeString(s.crewId),
      crewName: safeString(s.crewName),
      type: safeString(s.type, "AIRPORT"),
      startTime: safeString(s.startTime),
      endTime: safeString(s.endTime),
      durationMin: safeNumber(s.durationMin, 0),
      activated: safeBool(s.activated),
      activatedAt: safeString(s.activatedAt),
      flightId: safeString(s.flightId),
      notes: safeString(s.notes),
    }));
  },
  create: (s) =>
    apiCall("create", "Standby", {
      date: s.date || "",
      crewId: s.crewId || "",
      crewName: s.crewName || "",
      type: s.type || "AIRPORT",
      startTime: s.startTime || "",
      endTime: s.endTime || "",
      durationMin: s.durationMin || 0,
      activated: s.activated || false,
      activatedAt: s.activatedAt || "",
      flightId: s.flightId || "",
      notes: s.notes || "",
    }),
  update: (id, s) =>
    apiCall(
      "update",
      "Standby",
      {
        date: s.date || "",
        crewId: s.crewId || "",
        crewName: s.crewName || "",
        type: s.type || "AIRPORT",
        startTime: s.startTime || "",
        endTime: s.endTime || "",
        durationMin: s.durationMin || 0,
        activated: s.activated || false,
        activatedAt: s.activatedAt || "",
        flightId: s.flightId || "",
        notes: s.notes || "",
      },
      id
    ),
  remove: (id) => apiCall("delete", "Standby", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * LEAVE
 * ═══════════════════════════════════════════════════════════ */
export const leaveAPI = {
  list: async () => {
    const list = await apiRead("Leave");
    return list.map((l) => ({
      ...l,
      crewId: safeString(l.crewId),
      crewName: safeString(l.crewName),
      type: safeString(l.type, "ANNUAL"),
      fromDate: safeString(l.fromDate),
      toDate: safeString(l.toDate),
      days: safeNumber(l.days, 0),
      reason: safeString(l.reason),
      status: safeString(l.status, "pending"),
      requestedAt: safeString(l.requestedAt),
      approvedBy: safeString(l.approvedBy),
      approvedAt: safeString(l.approvedAt),
      notes: safeString(l.notes),
    }));
  },
  create: (l) =>
    apiCall("create", "Leave", {
      crewId: l.crewId || "",
      crewName: l.crewName || "",
      type: l.type || "ANNUAL",
      fromDate: l.fromDate || "",
      toDate: l.toDate || "",
      days: l.days || 0,
      reason: l.reason || "",
      status: l.status || "pending",
      requestedAt: l.requestedAt || new Date().toISOString(),
      approvedBy: l.approvedBy || "",
      approvedAt: l.approvedAt || "",
      notes: l.notes || "",
    }),
  update: (id, l) =>
    apiCall(
      "update",
      "Leave",
      {
        crewId: l.crewId || "",
        crewName: l.crewName || "",
        type: l.type || "ANNUAL",
        fromDate: l.fromDate || "",
        toDate: l.toDate || "",
        days: l.days || 0,
        reason: l.reason || "",
        status: l.status || "pending",
        requestedAt: l.requestedAt || "",
        approvedBy: l.approvedBy || "",
        approvedAt: l.approvedAt || "",
        notes: l.notes || "",
      },
      id
    ),
  remove: (id) => apiCall("delete", "Leave", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * TRAINING
 * ═══════════════════════════════════════════════════════════ */
export const trainingAPI = {
  list: async () => {
    const list = await apiRead("Training");
    return list.map((t) => ({
      ...t,
      crewId: safeString(t.crewId),
      crewName: safeString(t.crewName),
      type: safeString(t.type, "SIMULATOR"),
      title: safeString(t.title),
      date: safeString(t.date),
      expiryDate: safeString(t.expiryDate),
      instructor: safeString(t.instructor),
      location: safeString(t.location),
      result: safeString(t.result, "PASS"),
      score: safeString(t.score),
      notes: safeString(t.notes),
      certificate: safeString(t.certificate),
    }));
  },
  create: (t) =>
    apiCall("create", "Training", {
      crewId: t.crewId || "",
      crewName: t.crewName || "",
      type: t.type || "SIMULATOR",
      title: t.title || "",
      date: t.date || "",
      expiryDate: t.expiryDate || "",
      instructor: t.instructor || "",
      location: t.location || "",
      result: t.result || "PASS",
      score: t.score || "",
      notes: t.notes || "",
      certificate: t.certificate || "",
    }),
  update: (id, t) =>
    apiCall(
      "update",
      "Training",
      {
        crewId: t.crewId || "",
        crewName: t.crewName || "",
        type: t.type || "SIMULATOR",
        title: t.title || "",
        date: t.date || "",
        expiryDate: t.expiryDate || "",
        instructor: t.instructor || "",
        location: t.location || "",
        result: t.result || "PASS",
        score: t.score || "",
        notes: t.notes || "",
        certificate: t.certificate || "",
      },
      id
    ),
  remove: (id) => apiCall("delete", "Training", {}, id),
};

/* ═══════════════════════════════════════════════════════════
 * LOGIN HISTORY
 * ═══════════════════════════════════════════════════════════ */
export const loginHistoryAPI = {
  list: async () => {
    const list = await apiRead("LoginHistory");
    return list.map((h) => ({
      ...h,
      timestamp: safeString(h.timestamp),
      userId: safeString(h.userId),
      userName: safeString(h.userName),
      username: safeString(h.username),
      userRole: safeString(h.userRole),
      action: safeString(h.action, "LOGIN"),
      browser: safeString(h.browser),
      os: safeString(h.os),
      userAgent: safeString(h.userAgent),
      ipAddress: safeString(h.ipAddress),
      success: safeBool(h.success) || h.success === undefined,
      reason: safeString(h.reason),
    }));
  },
  create: (h) =>
    apiCall("create", "LoginHistory", {
      timestamp: h.timestamp || new Date().toISOString(),
      userId: h.userId || "",
      userName: h.userName || "",
      username: h.username || "",
      userRole: h.userRole || "",
      action: h.action || "LOGIN",
      browser: h.browser || "",
      os: h.os || "",
      userAgent: h.userAgent || "",
      ipAddress: h.ipAddress || "",
      success: h.success !== false,
      reason: h.reason || "",
    }),
  remove: (id) => apiCall("delete", "LoginHistory", {}, id),
  clearAll: async () => {
    const all = await apiRead("LoginHistory");
    for (const h of all) {
      await apiCall("delete", "LoginHistory", {}, h.id);
    }
  },
};

/* ═══════════════════════════════════════════════════════════
 * FILES
 * ═══════════════════════════════════════════════════════════ */
export async function uploadFile(file, folder = "general") {
  if (!file) throw new Error("لم يتم اختيار ملف");
  if (file.size === 0) throw new Error("الملف فارغ");
  if (file.size > 5 * 1024 * 1024) throw new Error("حجم الملف يتجاوز 5 MB");

  const base64 = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (!result || typeof result !== "string")
        return reject(new Error("FileReader result invalid"));
      const parts = result.split(",");
      if (parts.length < 2 || !parts[1])
        return reject(new Error("Cannot extract base64"));
      resolve(parts[1]);
    };
    reader.onerror = () => reject(new Error("FileReader failed"));
    reader.readAsDataURL(file);
  });

  const payload = JSON.stringify({
    action: "upload",
    fileName: file.name || "file",
    mimeType: file.type || "application/octet-stream",
    base64,
    folder,
  });

  const body = "payload=" + encodeURIComponent(payload);

  const res = await fetch(API_URL, {
    method: "POST",
    body,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
    },
    redirect: "follow",
  });

  const text = await res.text();
  if (text.trim().startsWith("<")) {
    const m = text.match(/<title>(.*?)<\/title>/i);
    throw new Error("Apps Script error: " + (m ? m[1] : "HTML"));
  }

  let result;
  try {
    result = JSON.parse(text);
  } catch {
    throw new Error("Non-JSON: " + text.substring(0, 200));
  }

  if (!result.ok) throw new Error(result.error || "Upload failed");
  return result.data;
}

export async function deleteFile(filePath) {
  if (!filePath) return { ok: true };
  return apiCall("deleteFile", null, { filePath });
}
