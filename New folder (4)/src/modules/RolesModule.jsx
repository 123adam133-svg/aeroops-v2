/* ═══════════════════════════════════════════════════════════
 * ROLES MODULE
 * Roles management with permissions matrix
 * ═══════════════════════════════════════════════════════════ */
import React, { useState } from "react";
import { Plus, Edit, Trash2, Save, Key, Shield } from "lucide-react";
import { useT, useAuth } from "../contexts";
import { Field } from "../components/ui/Field";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Modal } from "../components/ui/Modal";
import { Badge } from "../components/ui/Badge";
import { PermissionsMatrix } from "../components/PermissionsMatrix";
import { rolesAPI } from "../api";
import { logSafe } from "../utils/audit";
import { safeArray } from "../utils/helpers";

export function RolesModule({ roles, setRoles, setSyncStatus }) {
  const t = useT();
  const { user } = useAuth();
  const safeUser = user || { id: null, role: null };
  const lang = document.documentElement.lang || "en";

  const [editing, setEditing] = useState(null);
  const [draft, setDraft] = useState({});

  const canEdit = safeUser.role === "superAdmin";

  /* ⭐ CRUD */
  const openNew = () => {
    setDraft({
      name: "",
      nameAr: "",
      description: "",
      perms: [],
      active: true,
    });
    setEditing("new");
  };

  const openEdit = (r) => {
    setDraft({ ...r, perms: safeArray(r.perms) });
    setEditing(r.id);
  };

  const save = async () => {
    if (!draft.name || !draft.nameAr) return alert("الاسم مطلوب");
    const dup = roles.find((r) => r.name === draft.name && r.id !== editing);
    if (dup) return alert(t.usernameExists);

    setSyncStatus?.("syncing");
    try {
      if (editing === "new") {
        const created = await rolesAPI.create(draft);
        setRoles([...roles, { ...draft, id: created.id }]);
        logSafe(safeUser, "CREATE", "Role", created.id, draft.name, {
          name: draft.name,
        });
      } else {
        await rolesAPI.update(editing, draft);
        setRoles(
          roles.map((r) => (r.id === editing ? { ...draft, id: editing } : r))
        );
        logSafe(safeUser, "UPDATE", "Role", editing, draft.name, {
          name: draft.name,
        });
      }
      setEditing(null);
      setSyncStatus?.("synced");
    } catch (e) {
      alert("Save failed: " + e.message);
      setSyncStatus?.("error");
    }
  };

  const remove = async (id) => {
    const role = roles.find((r) => r.id === id);
    if (role?.name === "superAdmin") return alert(t.cannotDeleteSuperAdmin);
    if (!confirm(t.confirmDelete)) return;
    try {
      await rolesAPI.remove(id);
      setRoles(roles.filter((r) => r.id !== id));
      logSafe(safeUser, "DELETE", "Role", id, role?.name || "", {});
    } catch (e) {
      alert("Delete failed: " + e.message);
    }
  };

  const toggleActive = (id) => {
    const role = roles.find((r) => r.id === id);
    if (role?.name === "superAdmin") return alert(t.cannotDisableSuperAdmin);
    const updated = { ...role, active: !role.active };
    setRoles(roles.map((r) => (r.id === id ? updated : r)));
    rolesAPI.update(id, updated).catch(console.error);
  };

  return (
    <div className="space-y-4">
      {/* ═══ Header ═══ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <Key className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {t.roles}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {roles.length} {t.totalRoles}
            </p>
          </div>
        </div>

        {canEdit && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" /> {t.newRole}
          </button>
        )}
      </div>

      {/* ═══ Roles Grid ═══ */}
      <div className="grid md:grid-cols-2 gap-4">
        {roles.map((role) => {
          const isSuper = role.name === "superAdmin";
          const perms = safeArray(role.perms);

          return (
            <div
              key={role.id}
              className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 p-4 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isSuper
                        ? "bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300"
                        : "bg-sky-100 dark:bg-sky-950 text-sky-700 dark:text-sky-300"
                    }`}
                  >
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-100">
                      {lang === "ar" ? role.nameAr : role.name}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400">
                      {role.name}
                    </div>
                  </div>
                </div>

                <Badge kind={role.active ? "active" : "inactive"}>
                  {role.active ? t.active : t.inactive}
                </Badge>
              </div>

              {/* Perms preview */}
              <div className="flex flex-wrap gap-1">
                {perms.includes("*") ? (
                  <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold">
                    ⭐ {t.allPermissions}
                  </span>
                ) : (
                  perms.slice(0, 4).map((p) => (
                    <span
                      key={p}
                      className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[9px] font-mono text-slate-700 dark:text-slate-300"
                    >
                      {p}
                    </span>
                  ))
                )}
                {perms.length > 4 && (
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[9px] text-slate-600 dark:text-slate-400">
                    +{perms.length - 4}
                  </span>
                )}
              </div>

              {/* Actions */}
              {canEdit && (
                <div className="flex gap-2 pt-2 border-t border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => openEdit(role)}
                    className="flex-1 py-1.5 rounded bg-amber-50 dark:bg-amber-950 hover:bg-amber-100 dark:hover:bg-amber-900 text-amber-700 dark:text-amber-300 text-xs"
                  >
                    <Edit className="w-3.5 h-3.5 inline" /> {t.edit}
                  </button>
                  {!isSuper && (
                    <>
                      <button
                        onClick={() => toggleActive(role.id)}
                        className="flex-1 py-1.5 rounded bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-xs text-slate-700 dark:text-slate-200"
                      >
                        {role.active ? t.disabled : t.enabled}
                      </button>
                      <button
                        onClick={() => remove(role.id)}
                        className="p-1.5 rounded bg-rose-50 dark:bg-rose-950 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ EDIT MODAL ═══ */}
      <Modal
        open={!!editing}
        title={editing === "new" ? t.newRole : t.editRole}
        onClose={() => setEditing(null)}
        wide
        footer={
          <>
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
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid md:grid-cols-2 gap-3">
            <Field label={t.roleNameEn}>
              <Input
                value={draft.name || ""}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    name: e.target.value.toLowerCase().replace(/\s+/g, "_"),
                  })
                }
                disabled={draft.name === "superAdmin"}
              />
            </Field>
            <Field label={t.roleNameAr}>
              <Input
                value={draft.nameAr || ""}
                onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
              />
            </Field>
            <Field label={t.description} span>
              <Input
                value={draft.description || ""}
                onChange={(e) =>
                  setDraft({ ...draft, description: e.target.value })
                }
              />
            </Field>
            <Field label={t.status}>
              <Select
                value={String(draft.active)}
                onChange={(e) =>
                  setDraft({ ...draft, active: e.target.value === "true" })
                }
              >
                <option value="true">{t.active}</option>
                <option value="false">{t.inactive}</option>
              </Select>
            </Field>
          </div>

          <section>
            <div className="flex justify-between mb-2">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                {t.permissions}
              </h4>
              <button
                type="button"
                onClick={() =>
                  setDraft({
                    ...draft,
                    perms: safeArray(draft.perms).includes("*") ? [] : ["*"],
                  })
                }
                className={`px-3 py-1 rounded text-xs font-medium ${
                  safeArray(draft.perms).includes("*")
                    ? "bg-rose-600 text-white"
                    : "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200"
                }`}
              >
                {safeArray(draft.perms).includes("*")
                  ? `⭐ ${t.allPermissions}`
                  : t.grantAll}
              </button>
            </div>

            {safeArray(draft.perms).includes("*") ? (
              <div className="p-4 bg-rose-50 dark:bg-rose-950 border-2 border-rose-300 dark:border-rose-800 rounded-lg text-center">
                <Shield className="w-8 h-8 text-rose-600 mx-auto mb-2" />
                <div className="text-sm font-bold text-rose-800 dark:text-rose-200">
                  {t.allPermissionsGranted}
                </div>
              </div>
            ) : (
              <PermissionsMatrix
                value={draft.perms || []}
                onChange={(v) => setDraft({ ...draft, perms: v })}
                lang={lang}
              />
            )}
          </section>
        </div>
      </Modal>
    </div>
  );
}

export default RolesModule;
