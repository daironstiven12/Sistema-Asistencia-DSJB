"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AlertCircle, Info, Lock } from "lucide-react";
import { Modal } from "./overlays";
import styles from "./ui.module.css";

/* Motor de formularios declarativo.
   Un esquema de campos describe la pantalla; el componente se encarga de
   render, validación y errores. Evita un componente por entidad. */

function initialValues(schema, seed) {
  const base = {};
  schema.sections.forEach((section) =>
    section.fields.forEach((field) => {
      base[field.name] = seed?.[field.name] ?? field.default ?? "";
    }),
  );
  return base;
}

export function validate(schema, values) {
  const errors = {};
  schema.sections.forEach((section) =>
    section.fields.forEach((field) => {
      const raw = values[field.name];
      const value = String(raw ?? "").trim();
      if (field.required && !value) {
        errors[field.name] = `${field.label} es obligatorio.`;
        return;
      }
      if (value && field.validate) {
        const message = field.validate(value, values);
        if (message) errors[field.name] = message;
      }
    }),
  );
  return errors;
}

export function Field({ field, value, error, onChange }) {
  const id = `f-${field.name}`;
  const common = {
    id,
    name: field.name,
    value: value ?? "",
    onChange: (event) => onChange(field.name, event.target.value),
    placeholder: field.placeholder,
    disabled: field.disabled,
    readOnly: field.readOnly,
    "aria-invalid": error ? "true" : undefined,
    "aria-describedby": field.hint || error ? `${id}-help` : undefined,
    className: `${error ? styles.inputInvalid : ""} ${
      field.type === "textarea" ? styles.textarea : field.type === "select" ? styles.select : styles.input
    }`,
  };

  return (
    <div
      className={`${styles.field} ${field.span === "wide" ? styles.formGridWide : ""}`}
    >
      <label htmlFor={id}>
        {field.label}
        {field.required ? (
          <span className={styles.req} aria-hidden="true">
            *
          </span>
        ) : null}
      </label>

      {field.type === "select" ? (
        <select {...common}>
          <option value="">{field.placeholder ?? "Selecciona"}</option>
          {field.options.map((option) => {
            const v = typeof option === "string" ? option : option.value;
            const l = typeof option === "string" ? option : option.label;
            return (
              <option key={v} value={v}>
                {l}
              </option>
            );
          })}
        </select>
      ) : field.type === "textarea" ? (
        <textarea {...common} rows={field.rows ?? 3} />
      ) : (
        <input {...common} type={field.type ?? "text"} />
      )}

      {error ? (
        <span className={styles.fieldError} id={`${id}-help`}>
          <AlertCircle aria-hidden="true" />
          {error}
        </span>
      ) : field.hint ? (
        <span className={styles.fieldHint} id={`${id}-help`}>
          {field.readOnly ? (
            <Lock aria-hidden="true" />
          ) : (
            <Info aria-hidden="true" />
          )}
          {field.hint}
        </span>
      ) : null}
    </div>
  );
}

export function FormSections({ schema, values, errors, onChange }) {
  return (
    <>
      {schema.sections.map((section) => (
        <fieldset key={section.title} className={styles.formSection}>
          <legend className={styles.formLegend}>{section.title}</legend>
          <div className={styles.formGrid}>
            {section.fields.map((field) => (
              <Field
                key={field.name}
                field={field}
                value={values[field.name]}
                error={errors[field.name]}
                onChange={onChange}
              />
            ))}
          </div>
        </fieldset>
      ))}
    </>
  );
}

/* Formulario embebido en una página (no en diálogo). */
export function FormPanel({ schema, seed, submitLabel, onSubmit, onCancel, extra }) {
  const [values, setValues] = useState(() => initialValues(schema, seed));
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const found = validate(schema, values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    setSaved(true);
    onSubmit?.(values);
  }

  return (
    <form className={styles.dialogBody} onSubmit={handleSubmit} noValidate>
      {saved ? (
        <p className={styles.noticeOk} role="status">
          Cambios guardados.
        </p>
      ) : null}
      <FormSections
        schema={schema}
        values={values}
        errors={errors}
        onChange={handleChange}
      />
      {extra}
      <div className={styles.dialogActions}>
        {onCancel ? (
          <button type="button" className={styles.btnSecondary} onClick={onCancel}>
            Cancelar
          </button>
        ) : null}
        <button type="submit" className={styles.btnPrimary}>
          {submitLabel ?? "Guardar"}
        </button>
      </div>
    </form>
  );
}

/* Formulario dentro de diálogo. El cuerpo se monta solo mientras el
   diálogo está abierto, de modo que los valores nacen desde el seed
   sin necesidad de un efecto que reinicie el estado. */
function ModalForm({ id, schema, seed, onSubmit }) {
  const [values, setValues] = useState(() => initialValues(schema, seed));
  const [errors, setErrors] = useState({});

  function handleChange(name, value) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
  }

  return (
    <form
      id={id}
      className={styles.dialogBody}
      onSubmit={(event) => {
        event.preventDefault();
        const found = validate(schema, values);
        setErrors(found);
        if (Object.keys(found).length > 0) return;
        onSubmit?.(values);
      }}
      noValidate
    >
      <FormSections
        schema={schema}
        values={values}
        errors={errors}
        onChange={handleChange}
      />
    </form>
  );
}

export function FormModal({
  open,
  onClose,
  title,
  sub,
  schema,
  seed,
  submitLabel = "Guardar",
  onSubmit,
  onDelete,
}) {
  const formId = useId();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      sub={sub}
      wide={schema.wide}
      actions={
        <>
          {onDelete ? (
            <button
              type="button"
              className={styles.btnDangerGhost}
              onClick={onDelete}
            >
              Eliminar
            </button>
          ) : null}
          <button type="button" className={styles.btnSecondary} onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" form={formId} className={styles.btnPrimary}>
            {submitLabel}
          </button>
        </>
      }
    >
      {open ? (
        <ModalForm
          key={seed?.id ?? "nuevo"}
          id={formId}
          schema={schema}
          seed={seed}
          onSubmit={onSubmit}
        />
      ) : null}
    </Modal>
  );
}

export function useFormSchema() {
  return { initialValues, validate };
}
