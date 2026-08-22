import { DataType, MessageSecurityMode, NodeClass, OPCUAClient, SecurityPolicy, StatusCodes } from 'node-opcua';

/** Ровно то, что принимает OPCUAClient.create — форму не дублируем руками. */
type ClientCreateOptions = Parameters<typeof OPCUAClient.create>[0];

export interface OpcUaClientOptions {
  securityMode?: MessageSecurityMode;
  securityPolicy?: SecurityPolicy;
  endpointMustExist?: boolean;
  connectionStrategy?: ClientCreateOptions['connectionStrategy'];
}

export type OpcUaDataTypeName = keyof typeof DataType;
export type OpcUaNodeClassName = keyof typeof NodeClass;

/**
 * Значение берётся из библиотеки, а не пишется строкой. Типом здесь union имён
 * не сделать: StatusCodes — класс, и `keyof typeof` притащил бы в него ещё и
 * 'prototype'. Да и неуспешных статусов сотни, каждый со своим именем
 * ('BadNodeIdUnknown', 'BadTimeout'), так что закрытого множества нет.
 */
export const GOOD_STATUS = StatusCodes.Good.name;

export interface OpcUaReading {
  nodeId: string;
  value: unknown;
  dataType: OpcUaDataTypeName;
  statusCode: string;
  sourceTimestamp?: Date;
}

export interface BrowsedNode {
  nodeId: string;
  browseName: string;
  nodeClass: OpcUaNodeClassName;
}

export type DataChangeHandler = (reading: OpcUaReading) => void;
