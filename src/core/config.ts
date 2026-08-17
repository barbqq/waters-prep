import process from 'node:process';
import * as dotenv from 'dotenv';
dotenv.config();

export interface Config {
  ui: { baseURL: string };
  api: { baseURL: string };
  opcua: { endpoint: string };
  timeouts: {
    navigation: number;
    action: number;
    assertion: number;
  };
}

export const config: Config = {
  ui: { baseURL: process.env.UI_BASE_URL ?? 'https://openweathermap.org' },
  api: { baseURL: process.env.API_BASE_URL ?? 'https://api.restful-api.dev' },
  opcua: { endpoint: process.env.OPCUA_ENDPOINT ?? 'opc.tcp://localhost:4840' },
  timeouts: {
    navigation: Number(process.env.NAV_TIMEOUT ?? 30_000),
    action: Number(process.env.ACTION_TIMEOUT ?? 10_000),
    assertion: Number(process.env.ASSERT_TIMEOUT ?? 5_000),
  },
};
