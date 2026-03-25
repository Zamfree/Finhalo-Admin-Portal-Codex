import { cn } from "@/lib/utils";

type DrawerStateProps = {
  title: string;
  description?: string;
  className?: string;
};

export function DrawerEmpty({
  title,
  description,
  className,
}: DrawerStateProps) {
  return (
    <div
      className={cn(
        "admin-surface-soft flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center",
        className
      )}
    >
      <h3 className="text-base font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

export function DrawerLoading({
  title = "Loading",
  description = "Please wait while content is being prepared.",
  className,
}: Partial<DrawerStateProps>) {
  return (
    <div
      className={cn(
        "admin-surface-soft flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center",
        className
      )}
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
      <h3 className="mt-4 text-base font-semibold text-white">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}

export function DrawerError({
  title,
  description,
  className,
}: DrawerStateProps) {
  return (
    <div
      className={cn(
        "admin-surface-soft flex min-h-[240px] flex-col items-center justify-center px-6 py-10 text-center",
        className
      )}
    >
      <p className="mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      {description ? (
        <p className="mt-2 max-w-md text-sm text-zinc-400">{description}</p>
      ) : null}
    </div>
  );
}