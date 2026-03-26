"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

type DrawerStateOptions<TItem, TTab extends string> = {
  detailKey?: string;
  tabKey?: string;
  defaultTab: TTab;
  validTabs: readonly TTab[];
  items: TItem[];
  getItemId: (item: TItem) => string;
};

export function useDrawerQueryState<TItem, TTab extends string>(
  options: DrawerStateOptions<TItem, TTab>
) {
  const {
    detailKey = "detail_user_id",
    tabKey = "drawer",
    defaultTab,
    validTabs,
    items,
    getItemId,
  } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const detailIdFromUrl = searchParams.get(detailKey) ?? "";
  const tabFromUrl = searchParams.get(tabKey) ?? defaultTab;
  const itemById = useMemo(
    () => new Map(items.map((item) => [getItemId(item), item])),
    [items, getItemId]
  );

  const [selectedItem, setSelectedItem] = useState<TItem | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TTab>(defaultTab);

  useEffect(() => {
    const nextTab = validTabs.includes(tabFromUrl as TTab)
      ? (tabFromUrl as TTab)
      : defaultTab;

    if (detailIdFromUrl) {
      const matchedItem = itemById.get(detailIdFromUrl) ?? null;
      setSelectedItem(matchedItem);
      setIsOpen(true);
      setActiveTab(nextTab);
    } else {
      setSelectedItem(null);
      setIsOpen(false);
      setActiveTab(defaultTab);
    }
  }, [detailIdFromUrl, tabFromUrl, itemById, validTabs, defaultTab]);

  const openDrawer = useCallback((item: TItem, initialTab?: TTab) => {
    const nextTab = initialTab ?? defaultTab;

    setSelectedItem(item);
    setIsOpen(true);
    setActiveTab(nextTab);

    const params = new URLSearchParams(searchParams.toString());
    params.set(detailKey, getItemId(item));
    params.set(tabKey, nextTab);

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [defaultTab, detailKey, getItemId, pathname, router, searchParams, tabKey]);

  const closeDrawer = useCallback(() => {
    setSelectedItem(null);
    setIsOpen(false);
    setActiveTab(defaultTab);

    const params = new URLSearchParams(searchParams.toString());
    params.delete(detailKey);
    params.delete(tabKey);

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [defaultTab, detailKey, pathname, router, searchParams, tabKey]);

  const changeTab = useCallback((tab: TTab) => {
    setActiveTab(tab);

    const params = new URLSearchParams(searchParams.toString());
    params.set(tabKey, tab);

    const nextUrl = params.toString() ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [pathname, router, searchParams, tabKey]);

  return {
    selectedItem,
    isOpen,
    activeTab,
    openDrawer,
    closeDrawer,
    changeTab,
  };
}
