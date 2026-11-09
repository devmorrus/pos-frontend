export type PosDeviceBinding = {
  deviceId: string;
  token: string;
  registerId: string;
  outletId: string;
  stockLocationId: string;
};

const bindingKey = "morrus:pos-device-binding";
const installationKey = "morrus:pos-installation-id";

export function getPosDeviceBinding(): PosDeviceBinding | null {
  const value = localStorage.getItem(bindingKey);
  if (!value) return null;
  try {
    return JSON.parse(value) as PosDeviceBinding;
  } catch {
    localStorage.removeItem(bindingKey);
    return null;
  }
}

export function savePosDeviceBinding(binding: PosDeviceBinding) {
  localStorage.setItem(bindingKey, JSON.stringify(binding));
}

export function clearPosDeviceBinding() {
  localStorage.removeItem(bindingKey);
}

export function getInstallationId() {
  const existing = localStorage.getItem(installationKey);
  if (existing) return existing;
  const created = crypto.randomUUID();
  localStorage.setItem(installationKey, created);
  return created;
}
