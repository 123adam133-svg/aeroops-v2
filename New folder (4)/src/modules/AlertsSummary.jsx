/* ═══════════════════════════════════════════════════════════
 * ALERTS SUMMARY — Dashboard widget
 * Shows list of expiring documents
 * ═══════════════════════════════════════════════════════════ */
import React, { useMemo } from "react";
import { Bell, AlertTriangle, CheckCircle2 } from "lucide-react";
import { useT } from "../contexts";
import { computeAlerts } from "../utils/alerts";
import { fmtDate } from "../utils/helpers";

export function AlertsSummary({ crew, users, fleet }) {
  const t = useT();

  const alerts = useMemo(
    () => computeAlerts(crew, users, fleet),
    [crew, users, fleet]
  );

  /* ⭐ لا تنبيهات */
  if (alerts.length === 0) {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 flex items-center gap-3">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        <div>
          <div className="font-bold text-emerald-800 dark:text-emerald-200">
            {t.noAlerts}
          </div>
          <div className="text-xs text-emerald-700 dark:text-emerald-400">
            {t.allDocumentsValid}
          </div>
        </div>
      </div>
    );
  }

  const colorFor = (sev) =>
    ({
      expired:
        "bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300",
      critical:
        "bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300",
      expiring:
        "bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
    }[sev] || "bg-slate-50 border-slate-200 text-slate-700");

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <h3 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
          <Bell className="w-4 h-4 text-rose-600" />
          {t.alerts}
          <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900 text-rose-700 dark:text-rose-300 text-xs">
            {alerts.length}
          </span>
        </h3>
      </div>

      {/* Content */}
      <div className="p-3 grid md:grid-cols-2 gap-2 max-h-72 overflow-auto">
        {alerts.slice(0, 12).map((a, i) => (
          <div
            key={i}
            className={`p-3 rounded-lg border text-xs ${colorFor(a.sev)}`}
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

      {/* Footer */}
      {alerts.length > 12 && (
        <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-500">
          {t.showing} 12 / {alerts.length}
        </div>
      )}
    </div>
  );
}

export default AlertsSummary;
