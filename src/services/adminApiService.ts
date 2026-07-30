import apiClient from './apiService';
import type {
  AdminUsersResponse,
  AdminUserSessionsResponse,
  AdminGroupsResponse,
  CsvUploadResponse,
  AdminUsersFilterParams,
  AdminSessionsFilterParams,
} from '../types/api';

/**
 * Servicio para llamadas a la API de administración (solo accesible con profile=admin)
 */
function downloadBlob(blob: Blob, contentDisposition: string | undefined, fallbackName: string): void {
  let filename = fallbackName;
  if (contentDisposition) {
    const match = contentDisposition.match(/filename="(.+)"/);
    if (match) {
      filename = match[1];
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export const adminApiService = {
  async getGroups(): Promise<AdminGroupsResponse> {
    const response = await apiClient.get<AdminGroupsResponse>('/admin/groups');
    return response.data;
  },

  async listUsers(params: AdminUsersFilterParams = {}): Promise<AdminUsersResponse> {
    const response = await apiClient.get<AdminUsersResponse>('/admin/users', { params });
    return response.data;
  },

  async getUserSessions(
    userId: number,
    params: AdminSessionsFilterParams = {}
  ): Promise<AdminUserSessionsResponse> {
    const response = await apiClient.get<AdminUserSessionsResponse>(
      `/admin/users/${userId}/sessions`,
      { params }
    );
    return response.data;
  },

  async uploadCsv(file: File): Promise<CsvUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiClient.post<CsvUploadResponse>('/admin/users/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async exportUsers(params: AdminUsersFilterParams = {}): Promise<void> {
    const response = await apiClient.get('/admin/export/users', {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, response.headers['content-disposition'], 'usuarios.csv');
  },

  async exportUserSessions(userId: number, params: AdminSessionsFilterParams = {}): Promise<void> {
    const response = await apiClient.get(`/admin/export/users/${userId}/sessions`, {
      params,
      responseType: 'blob',
    });
    downloadBlob(response.data, response.headers['content-disposition'], 'sesiones.csv');
  },
};
