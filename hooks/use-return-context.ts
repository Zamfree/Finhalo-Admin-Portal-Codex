"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  buildPathWithReturnContext,
  detectReturnContextSource,
  getCurrentReturnContext,
  getReturnTargetFromSearchParams,
  getSourceFromSearchParams,
  type ReturnContextQuery,
  type ReturnContextSource,
} from "@/lib/return-context";

type NavigationOptions = {
  source?: ReturnContextSource | null;
  scroll?: boolean;
};

type UseReturnContextOptions = {
  source?: ReturnContextSource | null;
};

export function useReturnContext(options: UseReturnContextOptions = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentContext = useMemo(
    () => getCurrentReturnContext(pathname, searchParams),
    [pathname, searchParams]
  );

  const currentModuleSource = useMemo(
    () => options.source ?? detectReturnContextSource(pathname),
    [options.source, pathname]
  );

  function buildHrefWithReturn(
    targetPath: string,
    targetQuery?: ReturnContextQuery,
    navigationOptions: NavigationOptions = {}
  ) {
    return buildPathWithReturnContext({
      currentPathname: pathname,
      currentSearchParams: searchParams,
      targetPath,
      targetQuery,
      source: navigationOptions.source ?? currentModuleSource,
    });
  }

  function getCurrentContext() {
    return currentContext;
  }

  function pushWithReturn(
    targetPath: string,
    targetQuery?: ReturnContextQuery,
    navigationOptions: NavigationOptions = {}
  ) {
    router.push(buildHrefWithReturn(targetPath, targetQuery, navigationOptions), {
      scroll: navigationOptions.scroll ?? false,
    });
  }

  function replaceWithReturn(
    targetPath: string,
    targetQuery?: ReturnContextQuery,
    navigationOptions: NavigationOptions = {}
  ) {
    router.replace(buildHrefWithReturn(targetPath, targetQuery, navigationOptions), {
      scroll: navigationOptions.scroll ?? false,
    });
  }

  function getReturnTarget(fallbackPath: string) {
    return getReturnTargetFromSearchParams(searchParams, fallbackPath);
  }

  function goBackToContext(
    fallbackPath: string,
    navigationOptions: NavigationOptions & { replace?: boolean } = {}
  ) {
    const target = getReturnTarget(fallbackPath);

    if (navigationOptions.replace) {
      router.replace(target, { scroll: navigationOptions.scroll ?? false });
      return;
    }

    router.push(target, { scroll: navigationOptions.scroll ?? false });
  }

  function maybeGetSource() {
    return getSourceFromSearchParams(searchParams, pathname, currentModuleSource);
  }

  return {
    getCurrentContext,
    buildHrefWithReturn,
    pushWithReturn,
    replaceWithReturn,
    getReturnTarget,
    goBackToContext,
    maybeGetSource,
  };
}
