import { AxiosError } from 'axios';
import type { AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import apiClient from '../../src/services/apiService';

export interface MockReply {
  status?: number;
  data?: unknown;
  headers?: Record<string, string>;
}

/**
 * Sustituye el adaptador de red de axios. Los interceptores del cliente real
 * (token Bearer, manejo de errores) siguen ejecutándose; solo se evita la red.
 * Devuelve la lista de peticiones capturadas.
 */
export function mockApi(
  reply: MockReply | ((config: InternalAxiosRequestConfig) => MockReply) = {}
): InternalAxiosRequestConfig[] {
  const calls: InternalAxiosRequestConfig[] = [];

  apiClient.defaults.adapter = async (config) => {
    calls.push(config);
    const { status = 200, data = {}, headers = {} } = typeof reply === 'function' ? reply(config) : reply;
    const response: AxiosResponse = { data, status, statusText: '', headers, config };
    if (status >= 400) {
      throw new AxiosError('Request failed', 'ERR_BAD_REQUEST', config, null, response);
    }
    return response;
  };

  return calls;
}

/** Simula una caída de red: la petición sale pero no hay respuesta. */
export function mockApiNetworkError(): void {
  apiClient.defaults.adapter = async (config) => {
    throw new AxiosError('Network Error', 'ERR_NETWORK', config, {});
  };
}
