/* ═══════════════════════════════════════════════════════════
 * ROSTER MODULE
 * Weekly/Monthly crew schedule
 * ═══════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Printer,
} from "lucide-react";
import { useT } from "../contexts";
import { rosterAPI } from "../api";
import { fmtDate } from "../utils/helpers";
import {
  ROSTER_TYPES,
  DAYS_EN,
  DAYS_AR,
  MONTHS_EN,
  MONTHS_AR,
} from "../config/constants";

export function RosterModule({ crew, roster = [], setRoster, setSyncStatus }) {
  const t = useT();
  const lang = document.documentElement.lang || "en";

  const [viewMode, setViewMode] = useState("week");
  const [currentDate, setCurrentDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [filterCrew, setFilterCrew] = useState("");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});

  /* ⭐ التواريخ */
  const getWeekDates = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00Z");
    const day = d.getUTCDay();
    const start = new Date(d);
    start.setUTCDate(start.getUTCDate() - day);
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const x = new Date(start);
      x.setUTCDate(x.getUTCDate() + i);
      dates.push(x.toISOString().slice(0, 10));
    }
    return dates;
  };

  const getMonthDates = (dateStr) => {
    const d = new Date(dateStr + "T00:00:00Z");
    const year = d.getUTCFullYear();
    const month = d.getUTCMonth();
    const firstDay = new Date(Date.UTC(year, month, 1)).getUTCDay();
    const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
    const dates = [];
    for (let i = 0; i < firstDay; i++) dates.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      dates.push(
        `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(
          2,
          "0"
        )}`
      );
    }
    return dates;
  };

  const dates =
    viewMode === "week"
      ? getWeekDates(currentDate)
      : getMonthDates(currentDate);

  const shift = (delta) => {
    const d = new Date(currentDate + "T00:00:00Z");
    if (viewMode === "week") d.setUTCDate(d.getUTCDate() + delta * 7);
    else d.setUTCMonth(d.getUTCMonth() + delta);
    setCurrentDate(d.toISOString().slice(0, 10));
  };

  const goToday = () => setCurrentDate(new Date().toISOString().slice(0, 10));

  /* ⭐ الحصول على إدخال */
  const getEntry = (crewId, date) => {
    return roster.find((r) => r.crewId === crewId && r.date === date);
  };

  /* ⭐ Filtering */
  const filteredCrew = crew.filter((c) => {
    if (filterCrew && c.id !== filterCrew) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.fullName.toLowerCase().includes(q) &&
        !(c.empNo || "").toLowerCase().includes(q)
      )
        return false;
    }
    return c.status === "active";
  });

  /* ⭐ CRUD */
  const openNew = (crewId, date) => {
    const member = crew.find((c) => c.id === crewId);
    setDraft({
      date,
      crewId,
      crewName: member?.fullName || "",
      type: "FLIGHT",
      flightIds: [],
      startTime: "",
      endTime: "",
      notes: "",
      status: "published",
      publishedAt: new Date().toISOString(),
    });
    setEditing("new");
  };

  const openEdit = (entry) => {
    setDraft({ ...entry, flightIds: entry.flightIds || [] });
    setEditing(entry.id);
  };

  const save = async () => {
    if (!draft.crewId || !draft.date) return;
    setSyncStatus?.("syncing");
    try {
      if (editing === "new") {
        const created = await rosterAPI.create(draft);
        setRoster([...roster, { ...draft, id: created.id }]);
      } else {
        await rosterAPI.update(editing, draft);
        setRoster(
          roster.map((r) => (r.id === editing ? { ...draft, id: editing } : r))
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
      await rosterAPI.remove(id);
      setRoster(roster.filter((r) => r.id !== id));
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  /* ⭐ Stats */
  const stats = useMemo(() => {
    const s = { FLIGHT: 0, STANDBY: 0, LEAVE: 0, OFF: 0, TRAINING: 0, SICK: 0 };
    dates.forEach((d) => {
      if (!d) return;
      filteredCrew.forEach((c) => {
        const e = getEntry(c.id, d);
        if (e) s[e.type] = (s[e.type] || 0) + 1;
      });
    });
    return s;
  }, [dates, filteredCrew, roster]);

  const fmtDateShort = (iso) => {
    if (!iso) return "";
    const d = new Date(iso + "T00:00:00Z");
    const days = lang === "ar" ? DAYS_AR : DAYS_EN;
    return `${days[d.getUTCDay()]} ${String(d.getUTCDate()).padStart(2, "0")}`;
  };

  const monthTitle = () => {
    const d = new Date(currentDate + "T00:00:00Z");
    const months = lang === "ar" ? MONTHS_AR : MONTHS_EN;
    return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
  };

  return (
    <div className="space-y-3">
      {/* ═══ Header ═══ */}
      <div className="bg-gradient-to-r from-indigo-700 to-purple-800 rounded-xl p-4 text-white shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <CalendarDays className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">{t.crewRoster}</h2>
              <div className="text-xs text-indigo-200">
                {filteredCrew.length} crew · {roster.length} entries
              </div>
            </div>
          </div>

          <div className="flex gap-2 items-center">
            <div className="flex rounded-lg overflow-hidden border border-white/30">
              <button
                onClick={() => setViewMode("week")}
                className={`px-3 py-1.5 text-xs font-bold ${
                  viewMode === "week"
                    ? "bg-white text-indigo-700"
                    : "bg-white/10"
                }`}
              >
                {t.weekView}
              </button>
              <button
                onClick={() => setViewMode("month")}
                className={`px-3 py-1.5 text-xs font-bold ${
                  viewMode === "month"
                    ? "bg-white text-indigo-700"
                    : "bg-white/10"
                }`}
              >
                {t.monthView}
              </button>
            </div>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1 px-3 py-1.5 rounded bg-white/20 hover:bg-white/30 text-xs font-bold"
            >
              <Printer className="w-3.5 h-3.5" /> {t.print}
            </button>
          </div>
        </div>
      </div>

      {/* ═══ Toolbar ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 flex flex-wrap gap-2 items-center">
        <button
          onClick={() => shift(-1)}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={goToday}
          className="px-3 py-2 rounded-lg bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300 text-xs font-bold hover:bg-sky-200"
        >
          {t.today}
        </button>

        <button
          onClick={() => shift(1)}
          className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="text-sm font-bold text-slate-700 dark:text-slate-200 mx-2">
          {viewMode === "week"
            ? `${fmtDateShort(dates[0])} – ${fmtDateShort(dates[6])}`
            : monthTitle()}
        </div>

        <div className="flex-1" />

        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 start-3 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.search}
            className="ps-9 pe-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-sky-400 w-48"
          />
        </div>

        <select
          value={filterCrew}
          onChange={(e) => setFilterCrew(e.target.value)}
          className="px-2 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-xs bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
        >
          <option value="">{t.allCrew}</option>
          {crew.map((c) => (
            <option key={c.id} value={c.id}>
              {c.fullName}
            </option>
          ))}
        </select>
      </div>

      {/* ═══ Stats ═══ */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
        {Object.entries(ROSTER_TYPES).map(([k, v]) => (
          <div key={k} className={`rounded-lg border-2 p-2 ${v.color}`}>
            <div className="text-[10px] font-bold uppercase opacity-80">
              {v.icon} {lang === "ar" ? v.label_ar : v.label_en}
            </div>
            <div className="text-xl font-bold">{stats[k] || 0}</div>
          </div>
        ))}
      </div>

      {/* ═══ Roster Grid ═══ */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-100 dark:bg-slate-900 border-b-2 border-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-2 py-2 text-start font-bold sticky start-0 bg-slate-100 dark:bg-slate-900 z-10 min-w-[150px] text-slate-700 dark:text-slate-200">
                  {t.crew}
                </th>
                {dates.map((d, i) => {
                  if (!d)
                    return (
                      <th
                        key={i}
                        className="p-2 border-s border-slate-200 dark:border-slate-700"
                      ></th>
                    );
                  const isToday = d === new Date().toISOString().slice(0, 10);
                  return (
                    <th
                      key={i}
                      className={`p-2 border-s border-slate-200 dark:border-slate-700 text-center font-bold min-w-[90px] ${
                        isToday
                          ? "bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300"
                          : "text-slate-700 dark:text-slate-200"
                      }`}
                    >
                      {fmtDateShort(d)}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {filteredCrew.length === 0 ? (
                <tr>
                  <td
                    colSpan={dates.length + 1}
                    className="p-8 text-center text-slate-400"
                  >
                    {t.noCrewMembers}
                  </td>
                </tr>
              ) : (
                filteredCrew.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                  >
                    <td className="px-2 py-1.5 font-bold sticky start-0 bg-white dark:bg-slate-800 z-10 border-e border-slate-200 dark:border-slate-700">
                      <div className="truncate text-slate-800 dark:text-slate-100">
                        {c.fullName}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400">
                        {c.empNo}
                      </div>
                    </td>

                    {dates.map((d, i) => {
                      if (!d)
                        return (
                          <td
                            key={i}
                            className="p-1 border-s border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900"
                          ></td>
                        );

                      const entry = getEntry(c.id, d);
                      const t2 = entry ? ROSTER_TYPES[entry.type] : null;

                      return (
                        <td
                          key={i}
                          className="p-1 border-s border-slate-100 dark:border-slate-800 text-center"
                        >
                          {entry ? (
                            <button
                              onClick={() => openEdit(entry)}
                              className={`w-full px-1 py-1.5 rounded border text-[10px] font-bold ${t2.color} hover:opacity-80`}
                              title={`${t2.label_en}${
                                entry.notes ? " — " + entry.notes : ""
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                <span
                                  className="w-1.5 h-1.5 rounded-full"
                                  style={{ background: t2.dot }}
                                />
                                {entry.type.slice(0, 3)}
                              </div>
                            </button>
                          ) : (
                            <button
                              onClick={() => openNew(c.id, d)}
                              className="w-full py-1.5 text-slate-300 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-600 dark:hover:text-slate-400 rounded text-lg"
                            >
                              +
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))
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
            className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-800 dark:text-slate-100">
                {editing === "new" ? t.addRoster : t.editRoster}
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
                  {t.crew}
                </label>
                <input
                  value={draft.crewName || ""}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t.date}
                </label>
                <input
                  type="date"
                  value={draft.date || ""}
                  disabled
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  {t.type}
                </label>
                <select
                  value={draft.type || "FLIGHT"}
                  onChange={(e) => setDraft({ ...draft, type: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                >
                  {Object.entries(ROSTER_TYPES).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.icon} {lang === "ar" ? v.label_ar : v.label_en}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.startTime}
                  </label>
                  <input
                    type="time"
                    value={draft.startTime || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, startTime: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-600 dark:text-slate-400">
                    {t.endTime}
                  </label>
                  <input
                    type="time"
                    value={draft.endTime || ""}
                    onChange={(e) =>
                      setDraft({ ...draft, endTime: e.target.value })
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
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RosterModule;
