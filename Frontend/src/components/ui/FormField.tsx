'use client';

/**
 * FormField.tsx — Campo de formulario con etiqueta, ayuda y mensaje de error (Zod o API).
 *
 * FormField recibe un render-prop con los atributos de accesibilidad ya enlazados,
 * de modo que sirve para <input>, <select> o <textarea>. TextField y SelectField
 * son atajos para los casos comunes.
 */

import React, { useId } from 'react';

export interface FieldControlProps {
  id: string;
  'aria-invalid': boolean;
  'aria-describedby'?: string;
}

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: (control: FieldControlProps) => React.ReactNode;
}

export function FormField({ label, error, hint, required, className = '', children }: FormFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-xs uppercase tracking-wider text-white/70 font-[family-name:var(--font-ui)]">
        {label}
        {required && <span className="text-[#e9b949]"> *</span>}
      </label>
      {children({ id, 'aria-invalid': Boolean(error), 'aria-describedby': describedBy })}
      {hint && !error && (
        <p id={hintId} className="text-xs text-white/50">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}

type TextFieldProps = Omit<FormFieldProps, 'children'> &
  Omit<React.InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'>;

export function TextField({ label, error, hint, required, className, ...inputProps }: TextFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required} className={className}>
      {(control) => <input {...control} {...inputProps} required={required} className="panel-input" />}
    </FormField>
  );
}

export interface SelectOption {
  value: string | number;
  label: string;
}

type SelectFieldProps = Omit<FormFieldProps, 'children'> &
  Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'> & {
    options: SelectOption[];
    placeholder?: string;
  };

export function SelectField({ label, error, hint, required, className, options, placeholder, ...selectProps }: SelectFieldProps) {
  return (
    <FormField label={label} error={error} hint={hint} required={required} className={className}>
      {(control) => (
        <select {...control} {...selectProps} required={required} className="panel-input cursor-pointer">
          {placeholder !== undefined && <option value="">{placeholder}</option>}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}
