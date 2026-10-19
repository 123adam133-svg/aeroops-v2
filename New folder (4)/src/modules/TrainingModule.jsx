/* ═══════════════════════════════════════════════════════════
 * TRAINING MODULE — Crew Training Records
 * ═══════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  GraduationCap,
} from "lucide-react";
import { useT } from "../contexts";
import { trainingAPI } from "../api";
import { fmtDate, daysUntil } from "../utils/helpers";
import { TRAINING_TYPES, TRAINING_RESULT } from "../config/constants";

/* ⭐ حالة انتهاء التدريب */
const getExpiryStatus = (expiryDate) => {
  if (!expiryDate)
    return {
      status: "no-expiry",
      color:
        "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
      label: "No Expiry",
    };

  const daysLeft = daysUntil(expiryDate);

  if (daysLeft < 0)
    return {
      status: "expired",
      color:
        "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border-rose-300",
      label: "EXPIRED",
      daysLeft,
    };
  if (daysLeft < 30)
    return {
      status: "critical",
      color:
        "bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 border-orange-300",
      label: `${daysLeft}d left`,
      daysLeft,
    };
  if (daysLeft < 90)
    return {
      status: "warning",
      color:
        "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border-amber-300",
      label: `${daysLeft}d left`,
      daysLeft,
    };
  return {
    status: "valid",
    color:
      "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300",
    label: "Valid",
    daysLeft,
  };
};

export function TrainingModule({
  crew,
  training = [],
  setTraining,
  setSyncStatus,
}) {
  const t = useT();
  const lang = document.documentElement.lang || "en";

  const [search, setSearch] = useState("");
  const [crewFilter, setCrewFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [resultFilter, setResultFilter] = useState("");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});

  /* ⭐ Filtering */
  const filtered = useMemo(() => {
    return training
      .filter((tr) => {
        if (search) {
          const q = search.toLowerCase();
          if (
            !tr.crewName?.toLowerCase().includes(q) &&
            !tr.title?.toLowerCase().includes(q) &&
            !tr.instructor?.toLowerCase().includes(q) &&
            !tr.location?.toLowerCase().includes(q)
          )
            return false;
        }
        if (crewFilter && tr.crewId !== crewFilter) return false;
        if (typeFilter && tr.type !== typeFilter) return false;
        if (resultFilter && tr.result !== resultFilter) return false;

        if (expiryFilter !== "all") {
          const exp = getExpiryStatus(tr.expiryDate);
          if (expiryFilter === "expired" && exp.status !== "expired")
            return false;
          if (expiryFilter === "critical" && exp.status !== "critical")
            return false;
          if (expiryFilter === "warning" && exp.status !== "warning")
            return false;
          if (expiryFilter === "valid" && exp.status !== "valid") return false;
        }

        return true;
      })
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [training, search, crewFilter, typeFilter, resultFilter, expiryFilter]);

  /* ⭐ Stats */
  const stats = useMemo(() => {
    const s = {
      total: training.length,
      passed: training.filter((tr) => tr.result === "PASS").length,
      failed: training.filter((tr) => tr.result === "FAIL").length,
      expired: training.filter(
        (tr) => getExpiryStatus(tr.expiryDate).status === "expired"
      ).length,
      critical: training.filter(
        (tr) => getExpiryStatus(tr.expiryDate).status === "critical"
      ).length,
      byType: {},
    };
    Object.keys(TRAINING_TYPES).forEach((k) => {
      s.byType[k] = training.filter((tr) => tr.type === k).length;
    });
    return s;
  }, [training]);

  /* ⭐ Crew Summary */
  const crewSummary = useMemo(() => {
    const summary = {};
    crew.forEach((c) => {
      const myTraining = training.filter((tr) => tr.crewId === c.id);
      const expired = myTraining.filter(
        (tr) => getExpiryStatus(tr.expiryDate).status === "expired"
      ).length;
      const critical = myTraining.filter(
        (tr) => getExpiryStatus(tr.expiryDate).status === "critical"
      ).length;
      summary[c.id] = { total: myTraining.length, expired, critical };
    });
    return summary;
  }, [crew, training]);

  /* ⭐ CRUD */
  const openNew = () => {
    setDraft({
      crewId: "",
      crewName: "",
      type: "SIMULATOR",
      title: "",
      date: new Date().toISOString().slice(0, 10),
      expiryDate: "",
      instructor: "",
      location: "",
      result: "PASS",
      score: "",
      notes: "",
      certificate: "",
    });
    setEditing("new");
  };

  const openEdit = (tr) => {
    setDraft({ ...tr });
    setEditing(tr.id);
  };

  const save = async () => {
    if (!draft.crewId || !draft.date) {
      alert("Crew and date are required");
      return;
    }
    setSyncStatus?.("syncing");
    try {
      if (editing === "new") {
        const created = await trainingAPI.create(draft);
        setTraining([...training, { ...draft, id: created.id }]);
      } else {
        await trainingAPI.update(editing, draft);
        setTraining(
          training.map((tr) =>
            tr.id === editing ? { ...draft, id: editing } : tr
          )
        );
      }
      setEditing(null);
      setSyncStatus?.("synced");
    } catch (e) {
      alert("Save failed: " + e.message);
      setSyncStatus?.("error");
    }
  };

  const remove = async (id) => {
    if (!confirm(t.confirmDelete)) return;
    try {
      await trainingAPI.remove(id);
      setTraining(training.filter((tr) => tr.id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  return (
    <div className="space-y-3">
      {/* ═══ Header ═══ */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-xl p-4 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.trainingTitle}</h2>
              <div className="text-xs text-purple-100">
                {stats.total} {t.totalRecords} · {stats.passed} {t.passed} ·{" "}
                {stats.expired} {t.expired}
              </div>
            </div>
          </div>

          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm font-bold"
          >
            <Plus className="w-4 h-4" /> {t.newTraining}
          </button>
        </div>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-purple-200 dark:border-purple-800 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {t.totalRecords}
          </div>
          <div className="text-2xl font-bold font-mono text-purple-700 dark:text-purple-300">
            {stats.total}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-emerald-200 dark:border-emerald-800 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {t.passed}
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-300">
            {stats.passed}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-rose-200 dark:border-rose-800 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {t.failed}
          </div>
          <div className="text-2xl font-bold font-mono text-rose-700 dark:text-rose-300">
            {stats.failed}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-orange-200 dark:border-orange-800 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {t.criticalTraining}
          </div>
          <div className="text-2xl font-bold font-mono text-orange-700 dark:text-orange-300">
            {stats.critical}
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg border-2 border-red-200 dark:border-red-800 p-3">
          <div className="text-[10px] font-bold text-slate-500 uppercase">
            {t.expiredTraining}
          </div>
          <div className="text-2xl font-bold font-mono text-red-700 dark:text-red-300">
            {stats.expired}
          </div>
        </div>
      </div>

      {/* ═══ Crew Summary ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3">
        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
          {t.trainingStatus}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-48 overflow-auto">
          {crew.map((c) => {
            const s = crewSummary[c.id] || {
              total: 0,
              expired: 0,
              critical: 0,
            };
            const hasIssue = s.expired > 0 || s.critical > 0;
            return (
              <button
                key={c.id}
                onClick={() => setCrewFilter(c.id)}
                className={`text-start p-2 rounded-lg border text-xs ${
                  hasIssue
                    ? "bg-rose-50 dark:bg-rose-950/50 border-rose-300 dark:border-rose-800"
                    : "bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800"
                } hover:shadow`}
              >
                <div className="font-bold truncate text-slate-800 dark:text-slate-100">
                  {c.fullName}
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">
                  {c.empNo}
                </div>
                <div className="flex gap-1 mt-1 flex-wrap">
                  <span className="px-1 rounded bg-white/60 dark:bg-slate-800/60 text-[9px] font-bold text-slate-700 dark:text-slate-300">
                    📚 {s.total}
                  </span>
                  {s.expired > 0 && (
                    <span className="px-1 rounded bg-rose-200 dark:bg-rose-800 text-rose-800 dark:text-rose-200 text-[9px] font-bold">
                      ⚠️ {s.expired}
                    </span>
                  )}
                  {s.critical > 0 && (
                    <span className="px-1 rounded bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 text-[9px] font-bold">
                      🔴 {s.critical}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══ Filters ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="w-full ps-9 pe-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-purple-400"
          />
        </div>

        <select
          value={crewFilter}
          onChange={(e) => setCrewFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
        >
          <option value="">{t.allCrew}</option>
          {crew.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>

        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
        >
          <option value="">{t.all}</option>
          {Object.entries(TRAINING_TYPES).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {lang === "ar" ? v.label_ar : v.label_en}
            </option>
          ))}
        </select>

        <select
          value={resultFilter}
          onChange={(e) => setResultFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
        >
          <option value="">{t.all}</option>
          <option value="PASS">{t.pass}</option>
          <option value="FAIL">{t.fail}</option>
          <option value="PENDING">{t.pending}</option>
        </select>

        <select
          value={expiryFilter}
          onChange={(e) => setExpiryFilter(e.target.value)}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
        >
          <option value="all">{t.all}</option>
          <option value="valid">{t.valid}</option>
          <option value="warning">{t.warning}</option>
          <option value="critical">{t.critical}</option>
          <option value="expired">{t.expired}</option>
        </select>
      </div>

      {/* ═══ Table ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
              <tr>
                {[
                  t.date,
                  t.crew,
                  t.trainingType,
                  t.trainingTitleField,
                  t.instructor,
                  t.result,
                  t.trainingExpiry,
                  t.actions,
                ].map((h) => (
                  <th
                    key={h}
                    className="px-3 py-2 text-start font-bold text-slate-700 dark:text-slate-200"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">
                    {t.noData}
                  </td>
                </tr>
              ) : (
                filtered.map((tr) => {
                  const type =
                    TRAINING_TYPES[tr.type] || TRAINING_TYPES.SIMULATOR;
                  const result =
                    TRAINING_RESULT[tr.result] || TRAINING_RESULT.PENDING;
                  const expiry = getExpiryStatus(tr.expiryDate);

                  return (
                    <tr
                      key={tr.id}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-purple-50/40 dark:hover:bg-slate-700/50"
                    >
                      <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                        {fmtDate(tr.date)}
                      </td>
                      <td className="px-3 py-2 font-bold text-slate-800 dark:text-slate-100">
                        {tr.crewName}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${type.color}`}
                        >
                          <span>{type.icon}</span>
                          {
                            (lang === "ar"
                              ? type.label_ar
                              : type.label_en
                            ).split(" ")[0]
                          }
                        </span>
                      </td>
                      <td className="px-3 py-2 truncate max-w-[200px] text-slate-700 dark:text-slate-300">
                        {tr.title || "—"}
                      </td>
                      <td className="px-3 py-2 text-slate-600 dark:text-slate-400 truncate max-w-[120px]">
                        {tr.instructor || "—"}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-bold ${result.color}`}
                        >
                          {result.icon}{" "}
                          {lang === "ar" ? result.label_ar : result.label_en}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-center">
                        {tr.expiryDate ? (
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full border text-[10px] font-bold ${expiry.color}`}
                          >
                            {expiry.label}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <div className="flex gap-1 justify-center">
                          <button
                            onClick={() => openEdit(tr)}
                            className="p-1.5 rounded hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => remove(tr.id)}
                            className="p-1.5 rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ═══ EDIT MODAL ═══ */}
      {editing && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setEditing(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 max-h-[90vh] overflow-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
                {editing === "new" ? t.newTraining : t.editTraining}
              </h3>
              <button
                onClick={() => setEditing(null)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t.crew} *
                </label>
                <select
                  value={draft.crewId || ""}
                  onChange={(e) => {
                    const c = crew.find((x) => x.id === e.target.value);
                    setDraft({
                      ...draft,
                      crewId: e.target.value,
                      crewName: c?.fullName || "",
                    });
                  }}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                >
                  <option value="">{t.selectCrew}</option>
                  {crew.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.empNo})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.trainingType} *
                  </label>
                  <select
                    value={draft.type || "SIMULATOR"}
                    onChange={(e) =>
                      setDraft({ ...draft, type: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    {Object.entries(TRAINING_TYPES).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.icon} {lang === "ar" ? v.label_ar : v.label_en}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.result}
                  </label>
                  <select
                    value={draft.result || "PASS"}
                    onChange={(e) =>
                      setDraft({ ...draft, result: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  >
                    <option value="PASS">{t.pass}</option>
                    <option value="FAIL">{t.fail}</option>
                    <option value="PENDING">{t.pending}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t.trainingTitleField}
                </label>
                <input
                  value={draft.title || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, title: e.target.value })
                  }
                  placeholder="e.g. A320 Type Rating Renewal"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.date} *
                  </label>
                  <input
                    type="date"
                    value={draft.date || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, date: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.trainingExpiry}
                  </label>
                  <input
                    type="date"
                    value={draft.expiryDate || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, expiryDate: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.instructor}
                  </label>
                  <input
                    value={draft.instructor || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, instructor: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.location}
                  </label>
                  <input
                    value={draft.location || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, location: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.score}
                  </label>
                  <input
                    value={draft.score || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, score: e.target.value })
                    }
                    placeholder="e.g. 95/100"
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.certificate}
                  </label>
                  <input
                    value={draft.certificate || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, certificate: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t.notes}
                </label>
                <textarea
                  value={draft.notes || ""}
                  onChange={(e) =>
                    setDraft({ ...draft, notes: e.target.value })
                  }
                  rows="2"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                />
              </div>

              {draft.expiryDate && (
                <div
                  className={`p-3 rounded-lg border-2 ${
                    getExpiryStatus(draft.expiryDate).color
                  }`}
                >
                  <div className="text-xs font-bold">{t.trainingExpiry}</div>
                  <div className="text-sm">
                    {getExpiryStatus(draft.expiryDate).label}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              {editing !== "new" && (
                <button
                  onClick={() => {
                    remove(draft.id);
                    setEditing(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-sm"
                >
                  {t.delete}
                </button>
              )}
              <button
                onClick={() => setEditing(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={save}
                className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold flex items-center gap-1"
              >
                <Save className="w-4 h-4" /> {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingModule;
