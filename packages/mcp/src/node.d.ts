declare module "node:path" {
  export function join(...paths: string[]): string;
  export function resolve(...paths: string[]): string;
  export function basename(path: string, suffix?: string): string;
  export const sep: string;
}

declare module "node:fs" {
  export function existsSync(path: string): boolean;
  export function mkdirSync(path: string, options?: { recursive?: boolean }): string | undefined;
  export function writeFileSync(path: string, data: string, encoding?: string): void;
}

declare var process: {
  env: Record<string, string | undefined>;
  cwd(): string;
  exit(code?: number): never;
};
