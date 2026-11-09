export type StockLocationDto = {
  id: string;
  type: "outlet" | "warehouse";
  code: string;
  name: string;
  outletId: string | null;
  outletName: string | null;
  address: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PosRegisterDto = {
  id: string;
  outletId: string;
  outletName: string;
  stockLocationId: string;
  code: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PosDeviceDto = {
  id: string;
  registerId: string;
  installationId: string;
  name: string;
  platform: string;
  status: "active" | "revoked";
  appVersion: string | null;
  activatedAtUtc: string;
  lastSeenAtUtc: string | null;
  revokedAtUtc: string | null;
};

export type PairingCodeDto = {
  registerId: string;
  outletId: string;
  code: string;
  expiresAtUtc: string;
};

export type PairedDeviceDto = {
  deviceId: string;
  token: string;
  registerId: string;
  outletId: string;
  stockLocationId: string;
};
