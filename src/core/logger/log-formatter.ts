import { ContentType } from '@core/api/api.types';
import { AttachmentLogger } from '@core/logger/logger.types';

export class LogFormatter {
  private static readonly sensitiveKeys = ['password', 'token', 'authorization', 'cookie'];

  static format(data: unknown): string {
    if (data === undefined || data === null) {
      return '';
    }

    if (typeof data === 'string') {
      return data;
    }

    if (typeof data === 'number' || typeof data === 'boolean') {
      return String(data);
    }

    return JSON.stringify(this.mask(data), null, 2);
  }

  /** Форматирует данные и прикрепляет их к отчёту как JSON-вложение с маскировкой. */
  static async attachJson(logger: AttachmentLogger, name: string, data: unknown): Promise<void> {
    await logger.attach(name, this.format(data), ContentType.JSON);
  }

  private static mask(data: unknown): unknown {
    if (typeof data !== 'object' || data === null) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.mask(item));
    }

    const maskedObject: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      const isSensitive = this.sensitiveKeys.includes(key.toLowerCase());

      if (isSensitive && value !== null) {
        maskedObject[key] = '*****';
      } else if (typeof value === 'object') {
        maskedObject[key] = this.mask(value);
      } else {
        maskedObject[key] = value;
      }
    }

    return maskedObject;
  }
}
