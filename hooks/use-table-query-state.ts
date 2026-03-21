"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type PrimitiveFilterValue = string;

type UseTableQueryStateOptions<TFilters extends Record<string, PrimitiveFilterValue>> = {
  filters: TFilters;
};

export function useTableQueryState<TFilters extends Record<string, PrimitiveFilterValue>>(
  options: UseTableQueryStateOptions<TFilters>
) {
  const { filters } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [defaultFilters] = useState(filters);
  const filterKeys = Object.keys(defaultFilters) as Array<keyof TFilters>;

  const [inputFilters, setInputFilters] = useState<TFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<TFilters>(defaultFilters);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const nextFilters = { ...defaultFilters };

    for (const key of filterKeys) {
      const valueFromUrl = searchParams.get(String(key));
      nextFilters[key] = (valueFromUrl ?? defaultFilters[key]) as TFilters[keyof TFilters];
    }

    const pageFromUrl = searchParams.get("page") ?? "1";
    const parsedPage = Number.parseInt(pageFromUrl, 10);
    const nextPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

    setInputFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setCurrentPage(nextPage);
  }, [searchParams]);

  function setInputFilter<K extends keyof TFilters>(key: K, value: TFilters[K]) {
    setInputFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyFilters() {
    setAppliedFilters(inputFilters);
    setCurrentPage(1);

    const params = new URLSearchParams();

    for (const key of filterKeys) {
      const value = inputFilters[key];

      if (value && value !== defaultFilters[key]) {
        params.set(String(key), String(value));
      }
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);
  }

  function clearFilters() {
    setInputFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
    router.replace(pathname);
  }

  function updatePageInUrl(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl);
  }

  return {
    inputFilters,
    appliedFilters,
    currentPage,
    setCurrentPage,
    setInputFilter,
    applyFilters,
    clearFilters,
    updatePageInUrl,
  };
}