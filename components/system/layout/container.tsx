import type { ReactNode } from "react";

type AdminContainerProps = {
  children: ReactNode;
};

export function AdminContainer({ children }: AdminContainerProps) {
  return (
    <main className="flex-1 overflow-x-hidden px-6 py-6 md:px-8 md:py-8">
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </main>
  );
}