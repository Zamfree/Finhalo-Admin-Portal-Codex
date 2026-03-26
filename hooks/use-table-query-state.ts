"use client";

import { useEffect, useMemo, useState } from "react";
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
  const filterKeys = useMemo(
    () => Object.keys(defaultFilters) as Array<keyof TFilters>,
    [defaultFilters]
  );
  const [inputFilters, setInputFilters] = useState<TFilters>(defaultFilters);
  const [appliedFilters, setAppliedFilters] = useState<TFilters>(defaultFilters);
  const [currentPage, setCurrentPageState] = useState(1);

  useEffect(() => {
    const nextFilters = { ...defaultFilters };

    for (const key of filterKeys) {
      const valueFromUrl = searchParams.get(String(key));
      nextFilters[key] = (valueFromUrl ?? defaultFilters[key]) as TFilters[keyof TFilters];
    }

    const pageFromUrl = searchParams.get("page") ?? "1";
    const parsedPage = parseInt(pageFromUrl, 10);
    const validPage = isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;

    setInputFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setCurrentPageState(validPage);
  }, [searchParams, defaultFilters, filterKeys]);

  function setInputFilter<K extends keyof TFilters>(key: K, value: TFilters[K]) {
    setInputFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function applyFilters() {
    setAppliedFilters(inputFilters);
    setCurrentPageState(1);

    const params = new URLSearchParams(searchParams.toString());

    for (const key of filterKeys) {
      const value = inputFilters[key];

      if (value && value !== defaultFilters[key]) {
        params.set(String(key), String(value));
      } else {
        params.delete(String(key));
      }
    }

    params.delete("page");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function applyNextFilters(nextFilters: TFilters) {
    setInputFilters(nextFilters);
    setAppliedFilters(nextFilters);
    setCurrentPageState(1);

    const params = new URLSearchParams(searchParams.toString());

    for (const key of filterKeys) {
      const value = nextFilters[key];

      if (value && value !== defaultFilters[key]) {
        params.set(String(key), String(value));
      } else {
        params.delete(String(key));
      }
    }

    params.delete("page");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function clearFilters() {
    setInputFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPageState(1);

    const params = new URLSearchParams(searchParams.toString());

    for (const key of filterKeys) {
      params.delete(String(key));
    }
    params.delete("page");

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  function setCurrentPage(nextPage: number) {
    const validPage = nextPage < 1 ? 1 : nextPage;

    setCurrentPageState(validPage);
    updatePageInUrl(validPage);
  }

  function updatePageInUrl(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString());

    if (nextPage <= 1) {
      params.delete("page");
    } else {
      params.set("page", String(nextPage));
    }

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }

  return {
    inputFilters,
    appliedFilters,
    currentPage,
    setCurrentPage,
    setInputFilter,
    applyFilters,
    applyNextFilters,
    clearFilters,
    updatePageInUrl,
  };
}