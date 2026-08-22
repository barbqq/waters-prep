export class OpcUaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class OpcUaConnectionError extends OpcUaError {
  constructor(
    readonly endpointUrl: string,
    readonly cause: unknown,
  ) {
    const reason = cause instanceof Error ? cause.message : 'unknown error';
    super(`Failed to connect to OPC UA server at ${endpointUrl}: ${reason}`);
  }
}

export class OpcUaNotConnectedError extends OpcUaError {
  constructor(readonly operation: string) {
    super(`Cannot ${operation}: OPC UA client has no active session`);
  }
}
