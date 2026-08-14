type FormTextareaProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
};

export default function FormTextarea({
  label,
  value,
  onChange,
  placeholder = "",
  rows = 5,
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-on-surface">
        {label}
      </label>

      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="
          w-full
          px-4
          py-3
          rounded-xl
          border
          border-outline-variant
          bg-surface
          text-on-surface
          placeholder:text-on-surface-variant
          outline-none
          resize-none
          transition-all
          focus:border-primary
          focus:ring-2
          focus:ring-primary/10
        "
      />
    </div>
  );
}