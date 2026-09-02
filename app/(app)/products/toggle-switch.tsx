export function ToggleSwitch({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked?: boolean;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer select-none group">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="peer sr-only"
      />
      <span
        aria-hidden
        className="
          relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center
          rounded-full border border-border bg-muted transition-colors
          peer-checked:bg-primary peer-checked:border-primary
          peer-focus-visible:ring-3 peer-focus-visible:ring-ring/40
          after:absolute after:h-5 after:w-5 after:top-1/2 after:-translate-y-1/2 after:left-0.5 after:rounded-full
          after:bg-background after:shadow-sm after:transition-transform
          peer-checked:after:translate-x-5
        "
      />
      <span className="flex-1">
        <span className="block text-sm font-medium text-foreground">
          {label}
        </span>
        <span className="block text-xs text-muted-foreground">
          {description}
        </span>
      </span>
    </label>
  );
}
