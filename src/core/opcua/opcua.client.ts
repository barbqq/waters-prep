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
import { OpcUaConnectionError, OpcUaNotConnectedError } from '@core/opcua/opcua.errors';
import {
  BrowsedNode,
  DataChangeHandler,
  OpcUaClientOptions,
  OpcUaDataTypeName,
  OpcUaNodeClassName,
  OpcUaReading,
} from '@core/opcua/opcua.types';
import { deepMerge } from '@core/utils/deep-merge';

// maxRetry: 0 — без него node-opcua переподключается по умолчанию долго и упорно,
// и тест на недоступный эндпоинт вместо типизированной ошибки просто повиснет.
const DEFAULT_OPTIONS: OpcUaClientOptions = {
  securityMode: MessageSecurityMode.None,
  securityPolicy: SecurityPolicy.None,
  endpointMustExist: false,
  connectionStrategy: { maxRetry: 0, initialDelay: 200, maxDelay: 1000 },
};

const PUBLISHING_INTERVAL_MS = 250;
const SAMPLING_INTERVAL_MS = 100;

export class OpcUaClient {
  private client?: OPCUAClient;
  private session?: ClientSession;
  private subscription?: ClientSubscription;

  constructor(
    private readonly endpointUrl: string,
    private readonly logger: AttachmentLogger,
    private readonly options: OpcUaClientOptions = {},
  ) {}

  async connect(): Promise<void> {
    const opts = deepMerge(DEFAULT_OPTIONS, this.options);

    const client = OPCUAClient.create({
      endpointMustExist: opts.endpointMustExist,
      securityMode: opts.securityMode,
      securityPolicy: opts.securityPolicy,
      connectionStrategy: opts.connectionStrategy,
    });

    try {
      await client.connect(this.endpointUrl);
      this.session = await client.createSession();
      this.client = client;
    } catch (error) {
      // Соединение могло подняться, а createSession упасть — гасим сокет,
      // иначе у воркера останется висящее подключение.
      await client.disconnect().catch(() => undefined);

      throw new OpcUaConnectionError(this.endpointUrl, error);
    }
  }

  async browse(nodeId: string): Promise<BrowsedNode[]> {
    const session = this.requireSession('browse the address space');
    const result = await session.browse(nodeId);

    const nodes = (result.references ?? []).map((reference) => ({
      nodeId: reference.nodeId.toString(),
      browseName: reference.browseName.toString(),
      nodeClass: NodeClass[reference.nodeClass] as OpcUaNodeClassName,
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
     dataType: DataType[dataValue.value.dataType] as OpcUaDataTypeName,
      // .name даёт 'Good', тогда как toString() — 'Good (0x00000000)'.
      statusCode: dataValue.statusCode.name,
      sourceTimestamp: dataValue.sourceTimestamp ?? undefined,
    };
  }
}
