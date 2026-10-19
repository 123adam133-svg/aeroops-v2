/* ═══════════════════════════════════════════════════════════
 * ALERTS PANEL
 * Top-bar bell with expiring documents alerts
 * ═══════════════════════════════════════════════════════════ */
import React, { useState, useMemo } from "react";
import { Bell, AlertTriangle, CheckCircle2, X } from "lucide-react";
import { useT } from "../contexts";
import { computeAlerts } from "../utils/alerts";
import { fmtDate } from "../utils/helpers";

export function AlertsPanel({ crew, users, fleet }) {
  const t = useT();
  const [open, setOpen] = useState(false);

  const alerts = useMemo(
    () => computeAlerts(crew, users, fleet),
    [crew, users, fleet]
  );

  const colorFor = (sev) =>
    ({
      expired: "bg-rose-50 border-rose-200 text-rose-700",
      critical: "bg-orange-50 border-orange-200 text-orange-700",
      expiring: "bg-amber-50 border-amber-200 text-amber-700",
    }[sev] || "bg-slate-50");

  return (
    <div className="relative">
      {/* ⭐ Bell button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
        title={t.alerts}
      >
        <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {alerts.length > 99 ? "99+" : alerts.length}
          </span>
        )}
      </button>

      {/* ⭐ Dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute end-0 mt-2 w-96 max-h-[70vh] overflow-auto bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xl z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between font-bold text-sm sticky top-0 bg-white dark:bg-slate-800 z-10">
              <span className="text-slate-800 dark:text-slate-100">
                {t.alerts} ({alerts.length})
              </span>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content */}
            {alerts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                {t.noAlerts}
              </div>
            ) : (
              <div className="p-2">
                {alerts.map((a, i) => (
                  <div
                    key={i}
                    className={`m-1 p-3 rounded-lg border text-xs ${colorFor(
                      a.sev
                    )}`}
                  >
                    <div className="flex justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold truncate">{a.subject}</div>
                        <div className="opacity-80">
                          {a.label} · {a.source}
                        </div>
                      </div>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                    </div>
                    <div className="mt-1 font-mono text-[10px]">
                      {fmtDate(a.expiry)} ·{" "}
                      {a.days < 0
                        ? `${Math.abs(a.days)} ${t.daysAgo}`
                        : `${a.days} ${t.daysLeft}`}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default AlertsPanel;
