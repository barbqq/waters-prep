export interface AttachmentLogger {
  attach(name: string, body: string, contentType: string): Promise<void>;
}
