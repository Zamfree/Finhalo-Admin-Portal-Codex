"use client";

import Link from "next/link";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import { useReturnContext } from "@/hooks/use-return-context";
import type { ReturnContextQuery, ReturnContextSource } from "@/lib/return-context";

type ReturnContextLinkProps = Omit<ComponentProps<typeof Link>, "href"> & {
  href: string;
  query?: ReturnContextQuery;
  source?: ReturnContextSource | null;
  children: ReactNode;
};

export function ReturnContextLink({
  href,
  query,
  source,
  children,
  ...props
}: ReturnContextLinkProps) {
  const { buildHrefWithReturn } = useReturnContext();
  const nextHref = useMemo(
    () => buildHrefWithReturn(href, query, { source }),
    [buildHrefWithReturn, href, query, source]
  );

  return (
    <Link href={nextHref} {...props}>
      {children}
    </Link>
  );
}
