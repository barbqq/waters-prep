import { LogFormatter } from '@core/logger/log-formatter';
import { AttachmentLogger } from '@core/logger/logger.types';
import { stepLogger } from '@core/logger/step-logger';
import { OpcUaClient } from '@core/opcua/opcua.client';
import { BrowsedNode, DataChangeHandler, OpcUaReading } from '@core/opcua/opcua.types';

export class TelemetryActions {
  constructor(
    private readonly client: OpcUaClient,
    private readonly logger: AttachmentLogger,
  ) {}

  async connect(): Promise<void> {
    await stepLogger.opcua('Connect to OPC UA server', () => this.client.connect());
  }

  async disconnect(): Promise<void> {
    await stepLogger.opcua('Disconnect from OPC UA server', () => this.client.disconnect());
  }

  async browseNodes(nodeId: string): Promise<BrowsedNode[]> {
    return stepLogger.opcua(`Browse node ${nodeId}`, () => this.client.browse(nodeId));
  }

  async discoverVariables(rootNodeId: string): Promise<BrowsedNode[]> {
    return stepLogger.opcua(`Discover variables under ${rootNodeId}`, async () => {
      const roots = await this.client.browse(rootNodeId);
      const variables = roots.filter((node) => node.nodeClass === 'Variable');

      for (const folder of roots.filter((node) => node.nodeClass === 'Object')) {
        const children = await this.client.browse(folder.nodeId);
        variables.push(...children.filter((node) => node.nodeClass === 'Variable'));
      }

      await LogFormatter.attachJson(this.logger, 'Discovered variables', variables);

      return variables;
    });
  }

  async readNode(nodeId: string): Promise<OpcUaReading> {
    return stepLogger.opcua(`Read node ${nodeId}`, async () => {
      const reading = await this.client.readNode(nodeId);
      await LogFormatter.attachJson(this.logger, `Reading ${nodeId}`, reading);
      return reading;
    });
  }

  async subscribeToNode(nodeId: string, onChange: DataChangeHandler): Promise<void> {
    await stepLogger.opcua(`Subscribe to node ${nodeId}`, () =>
      this.client.subscribeToNode(nodeId, onChange),
    );
  }
}
