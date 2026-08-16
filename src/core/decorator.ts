import { test } from '@playwright/test';

export function step(stepName: string) {
  return function decorator<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    T extends (this: any, ...args: any[]) => Promise<unknown>,
  >(target: T, _context: ClassMethodDecoratorContext): T {
    return function (this: object, ...args: unknown[]): Promise<unknown> {
      const name = stepName.replace(/\{(\d+)\}/g, (placeholder, index: string) => {
        const argIndex = Number(index);
        return argIndex < args.length ? String(args[argIndex]) : placeholder;
      });

      return test.step(name, async () => target.call(this, ...args), { box: true });
    } as T;
  };
}
