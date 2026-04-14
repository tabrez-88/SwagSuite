/**
 * Wouter → React Router compatibility shim.
 *
 * Reproduces the subset of Wouter's API used in this codebase, but backed by
 * react-router-dom. This lets the migration from Wouter proceed as a pure
 * import swap (`from "wouter"` → `from "@/lib/wouter-compat"`) without
 * touching call sites. New code should import from "react-router-dom" directly.
 */
import {
  Link as RRLink,
  useLocation as useRRLocation,
  useNavigate,
  useParams as useRRParams,
  matchPath,
  type LinkProps as RRLinkProps,
} from "react-router-dom";
import { forwardRef, type AnchorHTMLAttributes } from "react";

type SetLocation = (to: string | URL, options?: { replace?: boolean }) => void;

export function useLocation(): [string, SetLocation] {
  const { pathname } = useRRLocation();
  const navigate = useNavigate();
  const setLocation: SetLocation = (to, options) => {
    navigate(typeof to === "string" ? to : to.pathname + to.search + to.hash, {
      replace: options?.replace,
    });
  };
  return [pathname, setLocation];
}

export function useSearch(): string {
  const { search } = useRRLocation();
  return search.startsWith("?") ? search.slice(1) : search;
}

export function useParams<T extends Record<string, string | undefined> = Record<string, string | undefined>>(): T {
  return useRRParams() as T;
}

export function useRoute<T extends Record<string, string> = Record<string, string>>(
  pattern: string,
): [boolean, T | null] {
  const { pathname } = useRRLocation();
  const match = matchPath({ path: pattern, end: true }, pathname);
  if (!match) return [false, null];
  return [true, (match.params as T) ?? ({} as T)];
}

type LinkShimProps = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> &
  Partial<Pick<RRLinkProps, "replace" | "state">> & {
    href: string;
    to?: string;
    className?: string;
    children?: React.ReactNode;
  };

export const Link = forwardRef<HTMLAnchorElement, LinkShimProps>(function Link(
  { href, to, ...rest },
  ref,
) {
  return <RRLink ref={ref} to={to ?? href} {...(rest as Omit<RRLinkProps, "to">)} />;
});
