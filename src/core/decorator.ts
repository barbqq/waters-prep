import { stepLogger } from '@core/logger/step-logger';

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

      return stepLogger.ui(name, () => target.call(this, ...args));
    } as T;
  };
}
