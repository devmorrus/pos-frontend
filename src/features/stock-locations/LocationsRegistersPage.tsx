import { useCallback, useEffect, useState, type FormEvent } from "react";
import ProtectedPageShell from "../../components/layout/ProtectedPageShell";
import { AppLoader, InlineAlert } from "../../components/ui";
import { getErrorMessage } from "../../utils/errors";
import { getOutlets } from "../outlets/api/outletsApi";
import type { OutletDto } from "../outlets/types/outlet";
import { getUsers } from "../users/api/usersApi";
import type { UserDto } from "../users/types/user";
import {
  createPairingCode,
  createPosRegister,
  createWarehouse,
  getPosRegisters,
  getRegisterDevices,
  getLocationUsers,
  getStockLocations,
  replaceLocationUsers,
  revokeDevice,
  updatePosRegister,
  updateWarehouse,
} from "./api";
import type { PairingCodeDto, PosDeviceDto, PosRegisterDto, StockLocationDto } from "./types";

export default function LocationsRegistersPage() {
  const [locations, setLocations] = useState<StockLocationDto[]>([]);
  const [registers, setRegisters] = useState<PosRegisterDto[]>([]);
  const [outlets, setOutlets] = useState<OutletDto[]>([]);
  const [users, setUsers] = useState<UserDto[]>([]);
  const [devices, setDevices] = useState<Record<string, PosDeviceDto[]>>({});
  const [pairing, setPairing] = useState<PairingCodeDto | null>(null);
  const [accessLocationId, setAccessLocationId] = useState<string | null>(null);
  const [assignedUserIds, setAssignedUserIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouse, setWarehouse] = useState({ code: "", name: "", address: "", phone: "" });
  const [register, setRegister] = useState({ outletId: "", code: "", name: "" });

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextLocations, nextRegisters, nextOutlets, nextUsers] = await Promise.all([
        getStockLocations(),
        getPosRegisters(),
        getOutlets(),
        getUsers(),
      ]);
      setLocations(nextLocations);
      setRegisters(nextRegisters);
      setOutlets(nextOutlets);
      setUsers(nextUsers.filter((user) => user.isActive));
      if (nextOutlets[0]) {
        setRegister((value) => value.outletId
          ? value
          : { ...value, outletId: nextOutlets[0].id });
      }
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat lokasi dan register."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function submitWarehouse(event: FormEvent) {
    event.preventDefault();
    try {
      await createWarehouse({
        code: warehouse.code,
        name: warehouse.name,
        address: warehouse.address || null,
        phone: warehouse.phone || null,
      });
      setWarehouse({ code: "", name: "", address: "", phone: "" });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal membuat gudang."));
    }
  }

  async function submitRegister(event: FormEvent) {
    event.preventDefault();
    try {
      await createPosRegister(register);
      setRegister((value) => ({ ...value, code: "", name: "" }));
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal membuat register."));
    }
  }

  async function toggleWarehouse(location: StockLocationDto) {
    try {
      await updateWarehouse(location.id, {
        code: location.code,
        name: location.name,
        address: location.address,
        phone: location.phone,
        isActive: !location.isActive,
      });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status gudang."));
    }
  }

  async function showDevices(registerId: string) {
    try {
      const nextDevices = await getRegisterDevices(registerId);
      setDevices((value) => ({ ...value, [registerId]: nextDevices }));
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat perangkat."));
    }
  }

  async function editLocationUsers(locationId: string) {
    try {
      const assigned = await getLocationUsers(locationId);
      setAssignedUserIds(assigned.map((item) => item.userId));
      setAccessLocationId(locationId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal memuat akses user gudang."));
    }
  }

  async function saveLocationUsers() {
    if (!accessLocationId) return;
    try {
      await replaceLocationUsers(accessLocationId, assignedUserIds);
      setAccessLocationId(null);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal menyimpan akses user gudang."));
    }
  }

  async function toggleRegister(item: PosRegisterDto) {
    try {
      await updatePosRegister(item.id, {
        code: item.code,
        name: item.name,
        isActive: !item.isActive,
      });
      await load();
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mengubah status register."));
    }
  }

  async function generatePairing(registerId: string) {
    try {
      setPairing(await createPairingCode(registerId));
      await showDevices(registerId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal membuat kode pairing."));
    }
  }

  async function revoke(registerId: string, deviceId: string) {
    try {
      await revokeDevice(registerId, deviceId);
      await showDevices(registerId);
    } catch (requestError) {
      setError(getErrorMessage(requestError, "Gagal mencabut perangkat."));
    }
  }

  return (
    <ProtectedPageShell
      title="Lokasi & Register"
      description="Kelola gudang fisik, register kasir, pairing perangkat, dan pencabutan akses."
    >
      <InlineAlert tone="error" message={error} />
      {pairing ? (
        <InlineAlert
          tone="success"
          message={`Kode pairing ${pairing.code} berlaku sampai ${new Date(pairing.expiresAtUtc).toLocaleString("id-ID")}. Masukkan kode ini di menu Aktivasi Perangkat POS.`}
        />
      ) : null}

      {loading ? <AppLoader label="Memuat lokasi dan register..." /> : (
        <div className="space-y-8">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold">Gudang</h2>
            <form onSubmit={submitWarehouse} className="mt-4 grid gap-3 md:grid-cols-5">
              <input required placeholder="Kode" value={warehouse.code} onChange={(e) => setWarehouse({ ...warehouse, code: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
              <input required placeholder="Nama gudang" value={warehouse.name} onChange={(e) => setWarehouse({ ...warehouse, name: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
              <input placeholder="Alamat" value={warehouse.address} onChange={(e) => setWarehouse({ ...warehouse, address: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
              <input placeholder="Telepon" value={warehouse.phone} onChange={(e) => setWarehouse({ ...warehouse, phone: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
              <button className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white">Tambah gudang</button>
            </form>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead><tr className="border-b text-left text-gray-500"><th className="py-3">Kode</th><th>Nama</th><th>Alamat</th><th>Status</th><th>Aksi</th></tr></thead>
                <tbody>
                  {locations.filter((x) => x.type === "warehouse").map((location) => (
                    <tr key={location.id} className="border-b border-gray-100 dark:border-gray-800">
                      <td className="py-3 font-mono">{location.code}</td><td>{location.name}</td><td>{location.address ?? "-"}</td><td>{location.isActive ? "Aktif" : "Nonaktif"}</td>
                      <td className="space-x-3">
                        <button type="button" onClick={() => void editLocationUsers(location.id)} className="text-sm font-semibold text-brand-600">Akses user</button>
                        <button type="button" onClick={() => void toggleWarehouse(location)} className="text-sm font-semibold text-brand-600">{location.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {accessLocationId ? (
              <div className="mt-5 rounded-xl border border-brand-200 p-4 dark:border-brand-800">
                <h3 className="font-semibold">User yang dapat mengakses gudang</h3>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {users.map((user) => (
                    <label key={user.id} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={assignedUserIds.includes(user.id)}
                        onChange={(event) => setAssignedUserIds((current) => event.target.checked
                          ? [...current, user.id]
                          : current.filter((id) => id !== user.id))}
                      />
                      {user.name} · {user.roleName}
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => void saveLocationUsers()} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">Simpan akses</button>
                  <button type="button" onClick={() => setAccessLocationId(null)} className="rounded-lg border px-3 py-2 text-sm">Batal</button>
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <h2 className="text-lg font-semibold">Register & perangkat POS</h2>
            <form onSubmit={submitRegister} className="mt-4 grid gap-3 md:grid-cols-4">
              <select required value={register.outletId} onChange={(e) => setRegister({ ...register, outletId: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700">
                {outlets.filter((x) => x.isActive).map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
              </select>
              <input required placeholder="Kode register" value={register.code} onChange={(e) => setRegister({ ...register, code: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
              <input required placeholder="Nama register" value={register.name} onChange={(e) => setRegister({ ...register, name: e.target.value })} className="rounded-xl border border-gray-300 bg-transparent px-3 py-2 dark:border-gray-700" />
              <button className="rounded-xl bg-brand-500 px-4 py-2 font-semibold text-white">Tambah register</button>
            </form>
            <div className="mt-5 space-y-3">
              {registers.map((item) => (
                <div key={item.id} className="rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div><strong>{item.name}</strong><p className="text-sm text-gray-500">{item.outletName} · {item.code} · {item.isActive ? "Aktif" : "Nonaktif"}</p></div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => void showDevices(item.id)} className="rounded-lg border px-3 py-2 text-sm">Perangkat</button>
                      <button type="button" onClick={() => void toggleRegister(item)} className="rounded-lg border px-3 py-2 text-sm">{item.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                      <button type="button" onClick={() => void generatePairing(item.id)} disabled={!item.isActive} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50">Buat kode pairing</button>
                    </div>
                  </div>
                  {devices[item.id]?.map((device) => (
                    <div key={device.id} className="mt-3 flex items-center justify-between border-t pt-3 text-sm dark:border-gray-800">
                      <span>{device.name} · {device.platform} · {device.status}{device.lastSeenAtUtc ? ` · terakhir ${new Date(device.lastSeenAtUtc).toLocaleString("id-ID")}` : ""}</span>
                      {device.status === "active" ? <button type="button" onClick={() => void revoke(item.id, device.id)} className="font-semibold text-error-600">Cabut</button> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </ProtectedPageShell>
  );
}
