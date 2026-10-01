"use client";

import { Filter, Search, X } from "lucide-react";
import styles from "./ui.module.css";

/* Barra de búsqueda con acción de limpiar. */
export function SearchBar({
  value,
  onChange,
  placeholder,
  ariaLabel,
  className = "",
}) {
  return (
    <div className={`${styles.search} ${className}`}>
      <Search aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {value ? (
        <button
          type="button"
          className={styles.searchClear}
          aria-label="Limpiar búsqueda"
          onClick={() => onChange("")}
        >
          <X aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

/* Barra de filtros declarativa: cada filtro describe su tipo y opciones. */
export function FilterPanel({ filters = [], values = {}, onChange, activeCount = 0 }) {
  return (
    <div className={styles.toolbar}>
      <div className={styles.filterBar}>
        {filters.map((filter) => {
          if (filter.type === "search") {
            return (
              <SearchBar
                key={filter.key}
                value={values[filter.key] ?? ""}
                onChange={(next) => onChange({ [filter.key]: next })}
                placeholder={filter.placeholder}
                ariaLabel={filter.label}
              />
            );
          }
          if (filter.type === "date") {
            return (
              <span key={filter.key} className={styles.filterGroup}>
                <span className={styles.filterLabel}>{filter.label}</span>
                <input
                  type="date"
                  className={styles.input}
                  value={values[filter.key] ?? ""}
                  onChange={(event) => onChange({ [filter.key]: event.target.value })}
                  aria-label={filter.label}
                />
              </span>
            );
          }
          return (
            <select
              key={filter.key}
              className={styles.select}
              value={values[filter.key] ?? ""}
              onChange={(event) => onChange({ [filter.key]: event.target.value })}
              aria-label={filter.label}
            >
              <option value="">{filter.placeholder ?? filter.label}</option>
              {filter.options.map((option) => {
                const value = typeof option === "string" ? option : option.value;
                const label = typeof option === "string" ? option : option.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          );
        })}
        {activeCount > 0 ? (
          <>
            <span className={styles.filterCount}>
              <Filter aria-hidden="true" />
              {activeCount} filtro{activeCount > 1 ? "s" : ""}
            </span>
            <button
              type="button"
              className={styles.linkBtn}
              onClick={() => onChange({})}
            >
              Limpiar
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}

/* Tabla declarativa. `columns[].render` permite celdas.actions.
   `columns[].nowrap` fija la celda en una sola línea (fechas, códigos). */
export function DataTable({ columns = [], rows = [], getKey, empty }) {
  const cellClass = (column) => {
    const classes = [];
    if (column.align === "right") classes.push(styles.cellActions);
    if (column.mono) classes.push(styles.cellMono);
    if (column.muted) classes.push(styles.cellSecondary);
    if (column.nowrap) classes.push(styles.cellNowrap);
    return classes.length ? classes.join(" ") : undefined;
  };

  return (
    <div className={styles.cardFlushCard}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={column.align === "right" ? styles.cellActions : undefined}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className={styles.tableEmpty}>
                  {empty ?? "Sin registros."}
                </td>
              </tr>
            ) : (
              rows.map((row, index) => (
                <tr key={getKey ? getKey(row, index) : row.id ?? index}>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      data-label={column.header}
                      className={cellClass(column)}
                    >
                      {column.render
                        ? column.render(row, index)
                        : String(row[column.key] ?? "—")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Estado vacío: siempre ofrece una salida. */
export function EmptyState({ icon: Icon, title, text, children }) {
  return (
    <div className={styles.empty}>
      {Icon ? (
        <span className={styles.emptyIcon} aria-hidden="true">
          <Icon />
        </span>
      ) : null}
      <strong>{title}</strong>
      {text ? <p>{text}</p> : null}
      {children ? <div className={styles.emptyActions}>{children}</div> : null}
    </div>
  );
}

/* Fila de identidad: iniciales + nombre + dato secundario. */
export function PersonCell({ name, detail, accent = false }) {
  const initials = String(name ?? "?")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
  return (
    <div className={styles.person}>
      <span
        className={`${styles.personAvatar} ${accent ? styles.personAvatarAccent : ""}`}
        aria-hidden="true"
      >
        {initials}
      </span>
      <span className={styles.personText}>
        <strong>{name}</strong>
        {detail ? <small>{detail}</small> : null}
      </span>
    </div>
  );
}
