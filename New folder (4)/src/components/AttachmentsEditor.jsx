/* ═══════════════════════════════════════════════════════════
 * ATTACHMENTS EDITOR Component
 * Upload + manage documents with expiry tracking
 * ═══════════════════════════════════════════════════════════ */
import React, { useRef, useState } from "react";
import {
  Eye,
  Download,
  Trash2,
  Upload,
  Plus,
  Image as ImageIcon,
  FileText,
  Paperclip,
} from "lucide-react";
import { uploadFile } from "../api";
import { useT } from "../contexts";
import { Badge } from "./ui/Badge";
import { Input } from "./ui/Input";
import {
  uid,
  docStatus,
  formatFileSize,
  canPreviewFile,
  fileTypeIcon,
  safeArray,
} from "../utils/helpers";

export function AttachmentsEditor({ value, onChange }) {
  const t = useT();
  const ref = useRef();

  /* ⭐ ضمان أن value مصفوفة دائماً */
  const safeValue = safeArray(value);

  const [pendingName, setPendingName] = useState("");
  const [pendingExpiry, setPendingExpiry] = useState("");
  const [pendingFile, setPendingFile] = useState(null);
  const [busy, setBusy] = useState(false);

  /* ⭐ اختيار ملف */
  const pickFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;

    if (!pendingName) setPendingName(f.name);
    setBusy(true);
    try {
      const r = await uploadFile(f, "documents");
      setPendingFile({
        fileName: r.fileName,
        url: r.fileUrl,
        path: r.filePath,
        mime: r.mimeType,
        size: r.size || f.size,
      });
    } catch (err) {
      alert("فشل الرفع: " + err.message);
    } finally {
      setBusy(false);
    }
  };

  /* ⭐ إضافة مستند */
  const add = () => {
    if (!pendingName) return;

    onChange([
      ...safeValue,
      {
        id: uid("DOC"),
        name: pendingName,
        expiry: pendingExpiry || null,
        fileName: pendingFile?.fileName,
        url: pendingFile?.url,
        path: pendingFile?.path,
        mime: pendingFile?.mime,
        size: pendingFile?.size,
        uploadedAt: new Date().toISOString(),
      },
    ]);

    setPendingName("");
    setPendingExpiry("");
    setPendingFile(null);
  };

  /* ⭐ حذف */
  const remove = (id) => {
    if (confirm("حذف هذا المستند؟")) {
      onChange(safeValue.filter((x) => x.id !== id));
    }
  };

  /* ⭐ أيقونة حسب النوع */
  const renderIcon = (fileName, mime) => {
    const type = fileTypeIcon(fileName, mime);
    if (type === "image")
      return <ImageIcon className="w-5 h-5 text-emerald-600" />;
    if (type === "pdf") return <FileText className="w-5 h-5 text-rose-600" />;
    if (type === "word") return <FileText className="w-5 h-5 text-blue-600" />;
    if (type === "excel")
      return <FileText className="w-5 h-5 text-green-600" />;
    return <Paperclip className="w-5 h-5 text-slate-500" />;
  };

  return (
    <div className="space-y-3">
      {/* ⭐ المستندات المرفقة */}
      {safeValue.length > 0 && (
        <div className="space-y-2">
          {safeValue.map((a) => {
            const st = docStatus(a.expiry);
            const preview = canPreviewFile(a.fileName, a.mime);
            return (
              <div
                key={a.id}
                className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              >
                <div className="flex-shrink-0">
                  {renderIcon(a.fileName, a.mime)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate text-slate-800 dark:text-slate-100">
                    {a.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {a.fileName && (
                      <span className="truncate">{a.fileName}</span>
                    )}
                    {a.size && <span> • {formatFileSize(a.size)}</span>}
                  </div>
                </div>

                {a.expiry && <Badge kind={st}>{t[st]}</Badge>}

                <div className="flex gap-1">
                  {preview && a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Preview"
                    >
                      <Eye className="w-4 h-4" />
                    </a>
                  )}
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded hover:bg-sky-100 dark:hover:bg-sky-900 text-sky-700 dark:text-sky-300"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(a.id)}
                    className="p-2 rounded hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ⭐ إضافة مستند جديد */}
      <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-700">
        <div className="grid grid-cols-12 gap-2">
          <div className="col-span-5">
            <Input
              value={pendingName}
              onChange={(e) => setPendingName(e.target.value)}
              placeholder="اسم المستند"
            />
          </div>
          <div className="col-span-3">
            <Input
              type="date"
              value={pendingExpiry}
              onChange={(e) => setPendingExpiry(e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={() => ref.current.click()}
              disabled={busy}
              className="w-full px-3 py-2 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-xs text-slate-700 dark:text-slate-200 disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5 inline" />{" "}
              {busy ? "..." : pendingFile ? "✓" : "ملف"}
            </button>
            <input
              ref={ref}
              type="file"
              onChange={pickFile}
              className="hidden"
            />
          </div>
          <div className="col-span-2">
            <button
              type="button"
              onClick={add}
              disabled={!pendingName || !pendingFile || busy}
              className="w-full px-3 py-2 rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 inline" /> إضافة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttachmentsEditor;
