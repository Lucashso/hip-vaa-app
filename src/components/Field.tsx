// Field — inputs reusáveis para dialogs admin.

export function FieldText({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block mb-2.5">
      <div className="text-[12px] font-semibold text-hv-text mb-1">
        {label}
        {required && <span className="text-hv-coral"> *</span>}
      </div>
      <input
        type="text"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
        style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
      />
    </label>
  );
}

export function FieldNumber({
  label,
  value,
  onChange,
  step,
  min,
  max,
  placeholder,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  step?: number;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <label className="block mb-2.5">
      <div className="text-[12px] font-semibold text-hv-text mb-1">{label}</div>
      <input
        type="number"
        value={value ?? ""}
        step={step}
        min={min}
        max={max}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === "" ? null : Number(v));
        }}
        className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
        style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
      />
    </label>
  );
}

export function FieldTextArea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <label className="block mb-2.5">
      <div className="text-[12px] font-semibold text-hv-text mb-1">{label}</div>
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
        style={{
          background: "hsl(var(--hv-bg))",
          border: "1px solid hsl(var(--hv-line))",
          resize: "vertical",
        }}
      />
    </label>
  );
}

export function FieldSelect<T extends string>({
  label,
  value,
  options,
  onChange,
  required,
  placeholderOption = "— selecionar —",
}: {
  label: string;
  value: T | "";
  options: { value: T; label: string }[];
  onChange: (v: T | "") => void;
  required?: boolean;
  placeholderOption?: string;
}) {
  return (
    <label className="block mb-2.5">
      <div className="text-[12px] font-semibold text-hv-text mb-1">
        {label}
        {required && <span className="text-hv-coral"> *</span>}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T | "")}
        className="w-full px-3 py-2 rounded-[8px] text-[13px] text-hv-text"
        style={{ background: "hsl(var(--hv-bg))", border: "1px solid hsl(var(--hv-line))" }}
      >
        <option value="">{placeholderOption}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FieldToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex justify-between items-center mb-2.5">
      <div className="min-w-0">
        <div className="text-[12px] font-semibold text-hv-text">{label}</div>
        {description && (
          <div className="text-[11px] text-hv-text-3 mt-0.5">{description}</div>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="w-[42px] h-6 rounded-[12px] p-0.5 border-0 shrink-0"
        style={{ background: checked ? "hsl(var(--hv-leaf))" : "hsl(var(--hv-line))" }}
      >
        <div
          className="w-5 h-5 rounded-[10px] bg-white"
          style={{
            transform: checked ? "translateX(18px)" : "none",
            transition: "transform 0.2s",
          }}
        />
      </button>
    </div>
  );
}
