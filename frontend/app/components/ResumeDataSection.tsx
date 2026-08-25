"use client";

import { useCallback, useEffect, useState } from "react";
import MaterialIcon from "./MaterialIcon";
import ConfirmModal from "./ConfirmModal";
import { ToastStack, useToasts } from "./Toast";
import { getToken } from "../../lib/api";

/**
 * Self-contained CRUD section for one of the four resume building blocks —
 * Education, Experience, Skills or Projects. Each maps to an identical
 * backend pattern: GET list / POST create / PUT {id} update / DELETE {id}.
 *
 * The section owns its own fetch, loading/error state and toast feedback:
 *  - loads the list on mount
 *  - adds new entries through an inline form (POST)
 *  - edits in place (toggle edit → PUT)
 *  - deletes behind a confirmation modal (DELETE)
 * Every mutation updates the local list optimistically, then re-fetches so
 * server ordering/values always win — no hard page refresh anywhere.
 */
export default function ResumeDataSection<
  Item,
  Create,
  F extends readonly FieldDef[],
>({
  title,
  icon,
  fields,
  emptyLabel,
  accent = "border-outline-variant",
  tint = "bg-surface-container-high",
  fetchList,
  createItem,
  updateItem,
  deleteItem,
}: {
  title: string;
  icon: string;
  /** Field definitions — first field is the row's headline, the rest detail. */
  fields: F;
  /** Empty-state copy, e.g. "No work experience yet". */
  emptyLabel: string;
  /** Border accent for the card. */
  accent?: string;
  /** Tint for the section header chip and empty states. */
  tint?: string;
  fetchList: (token: string) => Promise<Item[]>;
  createItem: (token: string, payload: Create) => Promise<Item>;
  updateItem: (token: string, id: string, payload: Create) => Promise<Item>;
  deleteItem: (token: string, id: string) => Promise<void>;
}) {
  const { toasts, dismiss, notify } = useToasts();

  // ---- List state ----
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setItems(await fetchList(token));
      setLoadError("");
    } catch (err) {
      console.error(`Failed to load ${title}:`, err);
      setItems([]); // Set safe fallback empty state
      setLoadError(""); // Suppress full-screen error block
      notify.error(`Failed to load ${title}. Showing local defaults.`);
    } finally {
      setLoading(false);
    }
  }, [fetchList, title, notify]);

  useEffect(() => {
    // Defer the initial fetch so the effect never writes state synchronously.
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  // ---- Editing state ----
  const [adding, setAdding] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(() => blankForm(fields));

  // ---- Mutation state ----
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [savingError, setSavingError] = useState("");

  const setField = useCallback(
    (name: string, value: string) => setForm((f) => ({ ...f, [name]: value })),
    []
  );

  const openAdd = useCallback(() => {
    setEditId(null);
    setSavingError("");
    setForm(blankForm(fields));
    setAdding(true);
  }, [fields]);

  const openEdit = useCallback(
    (item: Item) => {
      setAdding(false);
      setSavingError("");
      setForm(toForm(fields, item));
      setEditId(getId(item));
    },
    [fields]
  );

  const closeForms = useCallback(() => {
    setAdding(false);
    setEditId(null);
    setSavingError("");
  }, []);

  /** Save either a new row (adding) or the in-place edit. */
  const handleSave = async () => {
    const error = validate(fields, form);
    if (error) {
      setSavingError(error);
      return;
    }
    setBusy(true);
    try {
      const token = getToken();
      if (!token) return;
      const payload = toPayload(fields, form) as Create;
      if (adding) {
        const created = await createItem(token, payload);
        // Optimistic append, then re-fetch for server order.
        setItems((prev) => [...prev, created]);
        load();
        notify.success(`${title} added`);
      } else if (editId) {
        const updated = await updateItem(token, editId, payload);
        setItems((prev) =>
          prev.map((item) => (getId(item) === editId ? updated : item))
        );
        notify.success(`${title} updated`);
      }
      closeForms();
    } catch (err) {
      notify.error(
        err instanceof Error ? err.message : `Failed to save ${title.toLowerCase()}.`
      );
    } finally {
      setBusy(false);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    setDeleteError("");
    try {
      const token = getToken();
      if (!token) return;
      await deleteItem(token, pendingDelete);
      setItems((prev) =>
        prev.filter((item) => getId(item) !== pendingDelete)
      );
      setPendingDelete(null);
      notify.success(`${title} removed`);
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : `Failed to delete ${title.toLowerCase()}.`
      );
    }
  };

  const singular = title.endsWith("s") ? title.slice(0, -1) : title;

  return (
    <div className={`rounded-2xl border ${accent} bg-white overflow-hidden`}>
      {/* Section header — title, count, add button */}
      <div className={`flex items-center justify-between gap-3 px-5 py-4 ${tint}`}>
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-primary-container/50 flex items-center justify-center shrink-0">
            <MaterialIcon name={icon} className="text-primary text-[20px]" filled />
          </span>
          <div>
            <h4 className="text-body-md font-bold text-on-surface leading-tight">
              {title}
            </h4>
            <p className="text-label-sm text-on-surface-variant">
              {items.length} {items.length === 1 ? "entry" : "entries"}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAdd}
          disabled={loading}
          className="btn-primary btn-shine px-4 py-2 rounded-full text-label-md flex items-center gap-1.5 disabled:opacity-50"
        >
          <MaterialIcon name="add" className="text-[18px]" />
          Add
        </button>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <div
                key={i}
                className="h-20 rounded-xl border border-outline-variant bg-surface-container-low animate-pulse"
              />
            ))}
          </div>
        ) : loadError ? (
          <div className="rounded-xl border border-error-container bg-error-container/20 px-5 py-8 text-center">
            <MaterialIcon name="error" className="text-error text-[28px] mx-auto" filled />
            <p className="text-body-md text-on-surface mt-2">{loadError}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="btn-outline px-4 py-2 rounded-full text-label-md mt-4 inline-flex items-center gap-1.5"
            >
              <MaterialIcon name="refresh" className="text-[18px]" />
              Retry
            </button>
          </div>
        ) : items.length === 0 && !adding ? (
          <div className="rounded-xl border border-dashed border-outline-variant bg-surface-container-lowest px-5 py-8 text-center">
            <p className="text-body-md text-on-surface-variant">{emptyLabel}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Add form */}
            {adding && (
              <FormCard
                title={`Add ${singular}`}
                fields={fields}
                form={form}
                setField={setField}
                savingError={savingError}
                busy={busy}
                onCancel={closeForms}
                onSave={handleSave}
                saveLabel="Add"
              />
            )}

            {/* Rows */}
            {items.map((item) => {
              const id = getId(item);
              if (editId === id) {
                return (
                  <FormCard
                    key={id}
                    title={`Edit ${singular}`}
                    fields={fields}
                    form={form}
                    setField={setField}
                    savingError={savingError}
                    busy={busy}
                    onCancel={closeForms}
                    onSave={handleSave}
                    saveLabel="Save"
                  />
                );
              }
              return (
                <RowCard
                  key={id}
                  item={item}
                  fields={fields}
                  onEdit={() => openEdit(item)}
                  onDelete={() => setPendingDelete(id)}
                />
              );
            })}
          </div>
        )}
      </div>

      <ConfirmModal
        open={pendingDelete !== null}
        title={`Delete ${singular}?`}
        message={`This permanently removes this ${title.toLowerCase().slice(0, -1)} from your resume. This action cannot be undone.`}
        confirmLabel="Delete"
        error={deleteError}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}

/* =========================================================
   FIELD METADATA + GENERIC HELPERS
   ========================================================= */

type FieldKind = "text" | "textarea" | "date" | "number" | "select";

export type FieldDef = {
  name: string;
  label: string;
  placeholder?: string;
  kind?: FieldKind;
  /** Options for kind === "select". */
  options?: readonly { value: string; label: string }[];
  required?: boolean;
};

/** Form state is a plain string map — inputs stay strings until save. */
type FormState = Record<string, string>;

/** Build an empty form keyed by field name. */
function blankForm(fields: readonly FieldDef[]): FormState {
  return Object.fromEntries(fields.map((f) => [f.name, ""]));
}

/** Read the item's server id (used to key rows + target PUT/DELETE). */
function getId<Item>(item: Item): string {
  return (item as { id: string }).id;
}

/** Seed a string form from an existing row (dates trimmed to YYYY-MM-DD). */
function toForm<Item>(fields: readonly FieldDef[], item: Item): FormState {
  const out: FormState = {};
  const record = item as Record<string, unknown>;
  for (const f of fields) {
    const value = record[f.name];
    if (f.kind === "date") {
      out[f.name] = typeof value === "string" ? value.slice(0, 10) : "";
    } else if (value === null || value === undefined) {
      out[f.name] = "";
    } else {
      out[f.name] = String(value);
    }
  }
  return out;
}

/** Check required fields; returns the first problem, or "" when valid. */
function validate(fields: readonly FieldDef[], form: FormState): string {
  for (const f of fields) {
    if (f.required && !form[f.name]?.trim()) {
      return `Please enter your ${f.label.toLowerCase()}.`;
    }
  }
  return "";
}

/** Convert the string form into the typed API payload. */
function toPayload<Create>(fields: readonly FieldDef[], form: FormState): Create {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = form[f.name];
    if (f.kind === "number") {
      payload[f.name] = raw ? Number(raw) : null;
    } else if (f.kind === "date") {
      payload[f.name] = raw || null;
    } else if (f.kind === "select") {
      payload[f.name] = raw;
    } else {
      payload[f.name] = (raw ?? "").trim() || null;
    }
  }
  return payload as unknown as Create;
}

/* =========================================================
   PRESENTATION SUB-COMPONENTS
   ========================================================= */

/** Shared form card used for both "Add" and "Edit". */
function FormCard({
  title,
  fields,
  form,
  setField,
  savingError,
  busy,
  onCancel,
  onSave,
  saveLabel,
}: {
  title: string;
  fields: readonly FieldDef[];
  form: FormState;
  setField: (name: string, value: string) => void;
  savingError: string;
  busy: boolean;
  onCancel: () => void;
  onSave: () => void;
  saveLabel: string;
}) {
  return (
    <div className="rounded-xl border border-primary/30 bg-surface-container-low shadow-sm p-5 entrance-fade-up">
      <h5 className="text-label-md font-semibold text-primary mb-4">{title}</h5>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((field) => (
          <div
            key={field.name}
            className={field.kind === "textarea" ? "sm:col-span-2" : ""}
          >
            <label
              htmlFor={`field-${field.name}`}
              className="text-label-sm font-medium text-on-surface-variant block mb-1.5"
            >
              {field.label}
              {field.required && (
                <span className="text-error" aria-hidden="true">
                  {" "}
                  *
                </span>
              )}
            </label>

            {field.kind === "textarea" ? (
              <textarea
                id={`field-${field.name}`}
                rows={3}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                disabled={busy}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-white text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60 resize-y"
              />
            ) : field.kind === "select" ? (
              <select
                id={`field-${field.name}`}
                value={form[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                disabled={busy}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-white text-body-md text-on-surface input-focus-ring transition-all disabled:opacity-60"
              >
                <option value="">Select proficiency</option>
                {(field.options ?? []).map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={`field-${field.name}`}
                type={field.kind ?? "text"}
                inputMode={field.kind === "number" ? "decimal" : undefined}
                step={field.kind === "number" ? "0.01" : undefined}
                min={field.kind === "number" ? "0" : undefined}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={(e) => setField(field.name, e.target.value)}
                disabled={busy}
                className="w-full px-4 py-3 rounded-lg border border-outline-variant bg-white text-body-md text-on-surface input-focus-ring placeholder:text-outline-variant transition-all disabled:opacity-60"
              />
            )}
          </div>
        ))}
      </div>

      {savingError && (
        <p className="text-label-sm text-error mt-4" role="alert">
          {savingError}
        </p>
      )}

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-5">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="btn-outline px-4 py-2 rounded-full text-label-md disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={busy}
          className="btn-primary px-5 py-2 rounded-full text-label-md flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {busy && <MaterialIcon name="sync" className="animate-spin text-[18px]" />}
          {busy ? "Saving..." : saveLabel}
        </button>
      </div>
    </div>
  );
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/** "2021-08-15" → "Aug 2021"; empty/null → "". */
function formatDate(value?: string | null): string {
  if (!value) return "";
  const m = Number(value.slice(5, 7));
  const y = value.slice(0, 4);
  return m >= 1 && m <= 12 ? `${MONTHS[m - 1]} ${y}` : value;
}

/** Read-only row card with edit/delete actions. */
function RowCard<Item>({
  item,
  fields,
  onEdit,
  onDelete,
}: {
  item: Item;
  fields: readonly FieldDef[];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const record = item as Record<string, unknown>;
  const [titleField, ...rest] = fields;
  const title = String(record[titleField.name] ?? "Untitled");
  const dateFields = fields.filter((f) => f.kind === "date");
  const startValue = dateFields[0] ? String(record[dateFields[0].name] ?? "") : "";
  const endValue = dateFields[1] ? String(record[dateFields[1].name] ?? "") : "";
  const range =
    dateFields.length > 0 && startValue
      ? `${formatDate(startValue)} – ${formatDate(endValue) || "Present"}`
      : "";

  return (
    <div className="rounded-xl border border-outline-variant bg-white shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h5 className="text-body-md font-semibold text-on-surface leading-snug">
            {title}
          </h5>
          {range && (
            <p className="text-label-sm text-on-surface-variant mt-0.5">
              {range}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onEdit}
            aria-label={`Edit ${title}`}
            className="p-2 rounded-full text-on-surface-variant hover:text-primary hover:bg-primary-container/40 transition-colors"
          >
            <MaterialIcon name="edit" className="text-[18px]" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${title}`}
            className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error-container/40 transition-colors"
          >
            <MaterialIcon name="delete" className="text-[18px]" />
          </button>
        </div>
      </div>

      {/* Remaining fields as detail lines */}
      <div className="mt-2 space-y-1">
        {rest
          .filter((f) => f.kind !== "date")
          .map((field) => {
            const value = record[field.name];
            if (value === null || value === undefined || value === "") return null;
            const text = String(value);
            if (field.kind === "textarea") {
              return (
                <p key={field.name} className="text-body-md text-on-surface-variant whitespace-pre-line">
                  {text}
                </p>
              );
            }
            return (
              <p key={field.name} className="text-body-md text-on-surface-variant">
                {field.label}: <span className="text-on-surface">{text}</span>
              </p>
            );
          })}
      </div>
    </div>
  );
}
