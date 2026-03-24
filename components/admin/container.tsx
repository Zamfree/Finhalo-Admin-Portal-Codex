import type { ReactNode } from "react";

type AdminContainerProps = {
  children: ReactNode;
};

export function AdminContainer({ children }: AdminContainerProps) {
  return (
    <main className="flex-1 overflow-x-hidden px-4 pb-6 md:px-6 md:pb-8">
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </main>
  );
}