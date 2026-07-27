interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  hint?: string;
}

export function FormField({ label, hint, id, ...props }: FormFieldProps) {
  return (
    <label htmlFor={id} className="grid gap-2 text-sm font-medium">
      <span>{label}</span>
      <input id={id} className="field" {...props} />
      {hint && <small className="font-normal" style={{ color: 'var(--muted)' }}>{hint}</small>}
    </label>
  );
}
