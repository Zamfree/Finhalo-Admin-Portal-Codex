type AdminTabOption<T extends string> = {
  value: T;
  label: string;
};

type AdminTabsProps<T extends string> = {
  value: T;
  onChange: (value: T) => void;
  options: AdminTabOption<T>[];
  className?: string;
};

export function AdminTabs<T extends string>({
  value,
  onChange,
  options,
  className = "",
}: AdminTabsProps<T>) {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-xl bg-white/[0.04] p-1 ${className}`}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`h-9 rounded-lg px-3.5 text-xs font-semibold uppercase tracking-[0.12em] transition ${
              isActive
                ? "bg-white/[0.08] text-white"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}