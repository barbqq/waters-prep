import {
  AttributeIds,
  ClientSession,
  ClientSubscription,
  DataType,
  DataValue,
  MessageSecurityMode,
  OPCUAClient,
  SecurityPolicy,
  TimestampsToReturn,
  NodeClass,
} from 'node-opcua';

import { LogFormatter } from '@core/logger/log-formatter';
import { AttachmentLogger } from '@core/logger/logger.types';
import {
  OpcUaConnectionError,
  OpcUaNotConnectedError,
  OpcUaTimeoutError,
} from '@core/opcua/opcua.errors';
import { BrowsedNode, DataChangeHandler, OpcUaReading } from '@core/opcua/opcua.types';

const CONNECT_TIMEOUT_MS = 10_000;
const PUBLISHING_INTERVAL_MS = 250;
const SAMPLING_INTERVAL_MS = 100;

export class OpcUaClient {
  private client?: OPCUAClient;
  private session?: ClientSession;
  private subscription?: ClientSubscription;

  constructor(
    private readonly endpointUrl: string,
    private readonly logger: AttachmentLogger,
  ) {}

  async connect(timeoutMs: number = CONNECT_TIMEOUT_MS): Promise<void> {
    // maxRetry: 0 — без него node-opcua переподключается по умолчанию долго и упорно,
    // и тест на недоступный эндпоинт вместо типизированной ошибки просто повиснет.
    const client = OPCUAClient.create({
      endpointMustExist: false,
      securityMode: MessageSecurityMode.None,
      securityPolicy: SecurityPolicy.None,
      connectionStrategy: { maxRetry: 0, initialDelay: 200, maxDelay: 1000 },
    });

    try {
      await this.withTimeout(client.connect(this.endpointUrl), timeoutMs, 'connect');
      this.session = await this.withTimeout(client.createSession(), timeoutMs, 'createSession');
      this.client = client;
    } catch (error) {
      // Клиент мог успеть поднять сокет до падения на createSession — гасим его,
      // иначе процесс воркера останется с висящим соединением.
      await client.disconnect().catch(() => undefined);

      if (error instanceof OpcUaTimeoutError) {
        throw error;
      }

      throw new OpcUaConnectionError(this.endpointUrl, error);
    }
  }

  async browse(nodeId: string): Promise<BrowsedNode[]> {
    const session = this.requireSession('browse the address space');
    const result = await session.browse(nodeId);

    const nodes = (result.references ?? []).map((reference) => ({
      nodeId: reference.nodeId.toString(),
      browseName: reference.browseName.toString(),
      nodeClass: NodeClass[reference.nodeClass],
    }));

    await LogFormatter.attachJson(this.logger, `Browse ${nodeId}`, nodes);

    return nodes;
  }

  async readNode(nodeId: string): Promise<OpcUaReading> {
    const session = this.requireSession('read a node');
    const dataValue = await session.read({ nodeId, attributeId: AttributeIds.Value });

    return this.toReading(nodeId, dataValue);
  }

  async subscribeToNode(nodeId: string, onChange: DataChangeHandler): Promise<void> {
    const session = this.requireSession('subscribe to a node');

    this.subscription ??= await session.createSubscription2({
      requestedPublishingInterval: PUBLISHING_INTERVAL_MS,
      requestedLifetimeCount: 100,
      requestedMaxKeepAliveCount: 10,
      maxNotificationsPerPublish: 100,
      publishingEnabled: true,
      priority: 10,
    });

    const monitoredItem = await this.subscription.monitor(
      { nodeId, attributeId: AttributeIds.Value },
      { samplingInterval: SAMPLING_INTERVAL_MS, discardOldest: true, queueSize: 10 },
      TimestampsToReturn.Both,
    );

    monitoredItem.on('changed', (dataValue: DataValue) => {
      onChange(this.toReading(nodeId, dataValue));
    });
  }

  // Идемпотентно: фикстура зовёт disconnect в teardown даже после падения теста,
  // а порядок закрытия — подписка, сессия, соединение — обратен порядку создания.
  async disconnect(): Promise<void> {
    await this.subscription?.terminate();
    this.subscription = undefined;

    await this.session?.close();
    this.session = undefined;

    await this.client?.disconnect();
    this.client = undefined;
  }

  private requireSession(operation: string): ClientSession {
    if (!this.session) {
      throw new OpcUaNotConnectedError(operation);
    }

    return this.session;
  }

  private toReading(nodeId: string, dataValue: DataValue): OpcUaReading {
    return {
      nodeId,
      value: dataValue.value.value as unknown,
      dataType: DataType[dataValue.value.dataType],
      statusCode: dataValue.statusCode.toString(),
      sourceTimestamp: dataValue.sourceTimestamp ?? undefined,
    };
  }

  private async withTimeout<T>(
    operation: Promise<T>,
    timeoutMs: number,
    name: string,
  ): Promise<T> {
    let timer: NodeJS.Timeout | undefined;

    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new OpcUaTimeoutError(name, timeoutMs)), timeoutMs);
    });

    try {
      return await Promise.race([operation, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
