import type { ReactNode } from "react";

type AdminContainerProps = {
  children: ReactNode;
};

export function AdminContainer({ children }: AdminContainerProps) {
  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mx-auto w-full max-w-[1600px]">{children}</div>
    </main>
  );
}
