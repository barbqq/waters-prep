export interface OpcUaReading {
  nodeId: string;
  value: unknown;
  /** Имя OPC UA типа данных: 'UInt32', 'Double', 'Boolean' и т.д. */
  dataType: string;
  statusCode: string;
  sourceTimestamp?: Date;
}

export interface BrowsedNode {
  nodeId: string;
  browseName: string;
  nodeClass: string;
}

export type DataChangeHandler = (reading: OpcUaReading) => void;
