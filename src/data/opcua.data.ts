export const OPCUA_NODES = {
  /** Стандартная точка входа в адресное пространство любого OPC UA сервера. */
  OBJECTS_FOLDER: 'ns=0;i=85',
  /** Папка симулятора: внутри Basic, Fast, Slow, Anomaly, Special. */
  TELEMETRY_FOLDER: 'ns=3;s=Telemetry',
  /** UInt32, обновляется раз в секунду — запущено с --fn=5 --fr=1. */
  FAST_COUNTER: 'ns=3;s=FastUInt1',
  /** UInt32, монотонно растущий счётчик. */
  STEP_UP: 'ns=3;s=StepUp',
  /** Int32, случайное значение — имитация датчика. */
  RANDOM_SENSOR: 'ns=3;s=RandomSignedInt32',
} as const;

export const UNREACHABLE_ENDPOINT = 'opc.tcp://127.0.0.1:14840';
