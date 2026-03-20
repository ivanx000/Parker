declare module '../lib/design-system' {
  export const spacing: Record<string, number>;
  export const typography: Record<string, Record<string, string | number>>;
  export const colors: Record<string, Record<string, string>>;
  export const elevation: Record<string, Record<string, string | number | { width: number; height: number }>>;
  export const radius: Record<string, number>;
  export const animation: Record<string, unknown>;
  export const layout: Record<string, unknown>;
  export const spacingValues: (...keys: string[]) => number[];
  export const opacity: Record<string, number>;
}

declare module '../../lib/design-system' {
  export const spacing: Record<string, number>;
  export const typography: Record<string, Record<string, string | number>>;
  export const colors: Record<string, Record<string, string>>;
  export const elevation: Record<string, Record<string, string | number | { width: number; height: number }>>;
  export const radius: Record<string, number>;
  export const animation: Record<string, unknown>;
  export const layout: Record<string, unknown>;
  export const spacingValues: (...keys: string[]) => number[];
  export const opacity: Record<string, number>;
}

declare module './lib/design-system' {
  export const spacing: Record<string, number>;
  export const typography: Record<string, Record<string, string | number>>;
  export const colors: Record<string, Record<string, string>>;
  export const elevation: Record<string, Record<string, string | number | { width: number; height: number }>>;
  export const radius: Record<string, number>;
  export const animation: Record<string, unknown>;
  export const layout: Record<string, unknown>;
  export const spacingValues: (...keys: string[]) => number[];
  export const opacity: Record<string, number>;
}
