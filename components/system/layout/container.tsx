import type { ReactNode } from "react";

type AdminContainerProps = {
  children: ReactNode;
};

export function AdminContainer({ children }: AdminContainerProps) {
  return (
    <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 sm:px-6 sm:py-6 lg:px-7 lg:py-7 xl:px-8 xl:py-8">
      <div className="mx-auto w-full max-w-[1480px]">{children}</div>
    </main>
  );
}
