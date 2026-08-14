type FormInputProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
};

export default function FormInput({
  label,
  value,
  onChange,
  placeholder = "",
  type = "text",
}: FormInputProps) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-on-surface">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
          transition-all
          focus:border-primary
          focus:ring-2
          focus:ring-primary/10
        "
      />
    </div>
  );
}