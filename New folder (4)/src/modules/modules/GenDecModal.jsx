/* ═══════════════════════════════════════════════════════════
 * GEN DEC MODAL — General Declaration
 * Uses HTML print (exact match to EACS template)
 * ═══════════════════════════════════════════════════════════ */
import React from "react";
import { X, Printer, Eye } from "lucide-react";
import { useT } from "../contexts";
import { printGenDec, buildGenDecHTML } from "../utils/gendecHTML";

export function GenDecModal({ flight, crew, onClose }) {
  const t = useT();
  if (!flight) return null;

  /* ⭐ عدد الطاقم */
  const roster = (flight.crewSlots || [])
    .map((s) => ({
      slot: s,
      member: crew.find((c) => c.id === s.crewId),
    }))
    .filter((x) => x.member);

  /* ⭐ طباعة */
  const handlePrint = () => {
    printGenDec(flight, crew);
  };

  /* ⭐ معاينة في تاب جديد */
  const handlePreview = () => {
    const html = buildGenDecHTML(flight, crew);
    const win = window.open("", "_blank");
    if (!win) {
      alert("⚠️ الرجاء السماح للنوافذ المنبثقة");
      return;
    }
    win.document.write(html);
    win.document.close();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100">
              {t.genDecTitle || "General Declaration"}
            </h2>
            <p className="text-sm text-slate-500">
              {t.genDecSubtitle || "EACS-Libya · ICAO Annex 9"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 text-sm border-y border-slate-200 dark:border-slate-700 py-3 mb-4">
          <div>
            <b>Flight:</b> {flight.flightNo || "—"}
          </div>
          <div>
            <b>Aircraft:</b> {flight.acft || "—"}
          </div>
          <div>
            <b>Route:</b> {flight.dep || "—"} → {flight.arr || "—"}
          </div>
          <div>
            <b>Crew:</b> {roster.length}
          </div>
          <div>
            <b>Date:</b>{" "}
            {flight.std
              ? new Date(flight.std).toISOString().slice(0, 10)
              : "—"}
          </div>
          <div>
            <b>PAX:</b> {flight.pax || 0}
          </div>
        </div>

        {/* Info */}
        <div className="bg-sky-50 dark:bg-sky-950 border border-sky-200 dark:border-sky-800 rounded-lg p-3 mb-4">
          <div className="text-xs text-sky-800 dark:text-sky-200">
            <b>💡 {t.info || "Info"}:</b>{" "}
            {t.genDecInfo ||
              "سيتم فتح نافذة الطباعة — اختر 'Save as PDF' لحفظها أو 'Print' للطباعة المباشرة."}
          </div>
        </div>

        {/* Crew preview */}
        <h3 className="font-semibold mb-2 text-slate-800 dark:text-slate-100">
          {t.crewList || "Crew List"} ({roster.length})
        </h3>
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden mb-4">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-900">
              <tr>
                <th className="p-2 text-start text-slate-700 dark:text-slate-200">
                  #
                </th>
                <th className="p-2 text-start text-slate-700 dark:text-slate-200">
                  Position
                </th>
                <th className="p-2 text-start text-slate-700 dark:text-slate-200">
                  Name
                </th>
                <th className="p-2 text-start text-slate-700 dark:text-slate-200">
                  Passport
                </th>
              </tr>
            </thead>
            <tbody>
              {roster.length === 0 ? (
                <tr>
                  <td
                    colSpan="4"
                    className="p-4 text-center text-slate-400 text-xs"
                  >
                    {t.noCrewAssigned || "No crew assigned"}
                  </td>
                </tr>
              ) : (
                roster.map((x, i) => (
                  <tr
                    key={i}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <td className="p-2 text-slate-700 dark:text-slate-200">
                      {String(i + 1).padStart(2, "0")}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-200 font-bold">
                      {x.slot.position}
                    </td>
                    <td className="p-2 text-slate-700 dark:text-slate-200">
                      {x.member.fullName}
                    </td>
                    <td className="p-2 text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                      {x.member.passportNo || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-sm text-slate-700 dark:text-slate-200"
          >
            {t.cancel || "Cancel"}
          </button>
          <button
            onClick={handlePreview}
            className="px-4 py-2 rounded-lg bg-slate-600 hover:bg-slate-700 text-white text-sm flex items-center gap-2"
          >
            <Eye className="w-4 h-4" /> {t.preview || "Preview"}
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-sm flex items-center gap-2 font-bold"
          >
            <Printer className="w-4 h-4" /> {t.print || "Print / Save PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenDecModal;