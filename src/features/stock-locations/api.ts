import { apiClient } from "../../api/client";
import type {
  PairedDeviceDto,
  PairingCodeDto,
  PosDeviceDto,
  PosRegisterDto,
  StockLocationDto,
} from "./types";

export const getStockLocations = () =>
  apiClient.get<StockLocationDto[]>("/api/stock-locations");

export const createWarehouse = (payload: {
  code: string;
  name: string;
  address: string | null;
  phone: string | null;
}) => apiClient.post<StockLocationDto>("/api/stock-locations", payload);

export const updateWarehouse = (
  id: string,
  payload: { code: string; name: string; address: string | null; phone: string | null; isActive: boolean },
) => apiClient.put<StockLocationDto>(`/api/stock-locations/${id}`, payload);

export const replaceLocationUsers = (id: string, userIds: string[]) =>
  apiClient.put(`/api/stock-locations/${id}/users`, { userIds });

export const getLocationUsers = (id: string) =>
  apiClient.get<{ userId: string; userName: string; email: string; isDefault: boolean }[]>(
    `/api/stock-locations/${id}/users`,
  );

export const getPosRegisters = () =>
  apiClient.get<PosRegisterDto[]>("/api/pos-registers");

export const createPosRegister = (payload: { outletId: string; code: string; name: string }) =>
  apiClient.post<PosRegisterDto>("/api/pos-registers", payload);

export const updatePosRegister = (
  id: string,
  payload: { code: string; name: string; isActive: boolean },
) => apiClient.put<PosRegisterDto>(`/api/pos-registers/${id}`, payload);

export const getRegisterDevices = (registerId: string) =>
  apiClient.get<PosDeviceDto[]>(`/api/pos-registers/${registerId}/devices`);

export const createPairingCode = (registerId: string) =>
  apiClient.post<PairingCodeDto>(`/api/pos-registers/${registerId}/pairing-codes`, {});

export const revokeDevice = (registerId: string, deviceId: string) =>
  apiClient.post<PosDeviceDto>(`/api/pos-registers/${registerId}/devices/${deviceId}/revoke`, {});

export const pairPosDevice = (payload: {
  code: string;
  installationId: string;
  name: string;
  platform: string;
  appVersion: string | null;
}) => apiClient.post<PairedDeviceDto>("/api/pos-devices/pair", payload);
