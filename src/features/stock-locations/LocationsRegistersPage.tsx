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
import { BoxCubeIcon, GroupIcon, LockIcon, PlusIcon, PlugInIcon } from "../../icons";

const inputClassName = "mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-white";
const secondaryButtonClassName = "inline-flex items-center justify-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:border-brand-400 hover:bg-brand-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-brand-500/10";

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
      <section className="rounded-3xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-6 dark:border-[#293b58] dark:from-[#172554] dark:via-[#1e1b4b] dark:to-[#111b2c] sm:p-8">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-lg shadow-brand-500/20"><PlugInIcon className="h-7 w-7" aria-hidden="true" /></div>
          <div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-600 dark:text-brand-300">Lokasi & perangkat kasir</p><h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Operasional terhubung, akses terarah</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-300">Kelola gudang dan akses tim, siapkan register per outlet, lalu hubungkan perangkat kasir menggunakan kode pairing.</p></div>
        </div>
      </section>
      {pairing ? (
        <InlineAlert
          tone="success"
          message={`Kode pairing ${pairing.code} berlaku sampai ${new Date(pairing.expiresAtUtc).toLocaleString("id-ID")}. Masukkan kode ini di menu Aktivasi Perangkat POS.`}
        />
      ) : null}

      {loading ? <AppLoader label="Memuat lokasi dan register..." /> : (
        <div className="space-y-8">
          <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
            <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><BoxCubeIcon className="h-6 w-6" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Gudang</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Atur lokasi penyimpanan dan pengguna yang dapat mengaksesnya.</p></div></div>
            <form onSubmit={submitWarehouse} className="mt-6 grid items-end gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c] sm:grid-cols-2 xl:grid-cols-4">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Kode gudang <span className="text-error-500">*</span><input required placeholder="Contoh: GDG001" value={warehouse.code} onChange={(e) => setWarehouse({ ...warehouse, code: e.target.value })} className={inputClassName} /></label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama gudang <span className="text-error-500">*</span><input required placeholder="Contoh: Gudang Utama" value={warehouse.name} onChange={(e) => setWarehouse({ ...warehouse, name: e.target.value })} className={inputClassName} /></label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Alamat <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(opsional)</span><input placeholder="Alamat gudang" value={warehouse.address} onChange={(e) => setWarehouse({ ...warehouse, address: e.target.value })} className={inputClassName} /></label>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Telepon <span className="text-xs font-normal text-gray-500 dark:text-gray-400">(opsional)</span><input type="tel" placeholder="Contoh: 021-1234567" value={warehouse.phone} onChange={(e) => setWarehouse({ ...warehouse, phone: e.target.value })} className={inputClassName} /></label>
              <div className="flex justify-end sm:col-span-2 xl:col-span-4"><button className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 sm:w-auto"><PlusIcon className="h-5 w-5" aria-hidden="true" />Tambah gudang</button></div>
            </form>
            <div className="mt-5 overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700 dark:text-gray-200">
                <thead className="bg-gray-50 dark:bg-[#111b2c]"><tr className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500 dark:border-gray-800 dark:text-gray-400">{["Gudang", "Alamat", "Status", "Aksi"].map((column) => <th key={column} scope="col" className="whitespace-nowrap px-4 py-4 font-semibold">{column}</th>)}</tr></thead>
                <tbody>
                  {locations.filter((x) => x.type === "warehouse").map((location) => (
                     <tr key={location.id} className="border-b border-gray-100 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.02]">
                       <td className="min-w-48 px-4 py-4"><p className="font-semibold text-gray-900 dark:text-white">{location.name}</p><p className="mt-1 font-mono text-xs text-gray-500 dark:text-gray-400">{location.code}</p></td><td className="min-w-48 break-words px-4 py-4">{location.address ?? "-"}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${location.isActive ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{location.isActive ? "Aktif" : "Nonaktif"}</span></td>
                       <td className="px-4 py-4"><div className="flex gap-2 whitespace-nowrap">
                         <button type="button" onClick={() => void editLocationUsers(location.id)} className={secondaryButtonClassName}><GroupIcon className="h-4 w-4" aria-hidden="true" />Akses pengguna</button>
                         <button type="button" onClick={() => void toggleWarehouse(location)} className={secondaryButtonClassName}>{location.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                       </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {accessLocationId ? (
               <div className="mt-5 rounded-2xl border border-brand-200 bg-brand-50/40 p-5 dark:border-[#293b58] dark:bg-[#111b2c]">
                 <h3 className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white"><LockIcon className="h-5 w-5 text-brand-500 dark:text-brand-300" aria-hidden="true" />Akses pengguna gudang</h3>
                 <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Pilih pengguna yang diizinkan mengakses {locations.find((location) => location.id === accessLocationId)?.name}.</p>
                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {users.map((user) => (
                     <label key={user.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-sm text-gray-700 dark:border-[#293b58] dark:bg-[#0b1422] dark:text-gray-200">
                      <input
                         type="checkbox"
                         className="h-4 w-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                        checked={assignedUserIds.includes(user.id)}
                        onChange={(event) => setAssignedUserIds((current) => event.target.checked
                          ? [...current, user.id]
                          : current.filter((id) => id !== user.id))}
                      />
                       <span><span className="block font-medium">{user.name}</span><span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">{user.roleName}</span></span>
                    </label>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="button" onClick={() => void saveLocationUsers()} className="rounded-lg bg-brand-500 px-3 py-2 text-sm font-semibold text-white">Simpan akses</button>
                   <button type="button" onClick={() => setAccessLocationId(null)} className={secondaryButtonClassName}>Batal</button>
                </div>
              </div>
            ) : null}
          </section>

           <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-gray-900 sm:p-8">
             <div className="flex items-center gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300"><PlugInIcon className="h-6 w-6" aria-hidden="true" /></div><div><h2 className="text-lg font-semibold text-gray-900 dark:text-white">Register & perangkat POS</h2><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Siapkan register kasir dan kelola perangkat yang terhubung.</p></div></div>
             <form onSubmit={submitRegister} className="mt-6 grid items-end gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-[#293b58] dark:bg-[#111b2c] sm:grid-cols-2 xl:grid-cols-4">
               <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Outlet <span className="text-error-500">*</span><select required value={register.outletId} onChange={(e) => setRegister({ ...register, outletId: e.target.value })} className={inputClassName}>
                {outlets.filter((x) => x.isActive).map((outlet) => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
               </select></label>
               <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Kode register <span className="text-error-500">*</span><input required placeholder="Contoh: REG001" value={register.code} onChange={(e) => setRegister({ ...register, code: e.target.value })} className={inputClassName} /></label>
               <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Nama register <span className="text-error-500">*</span><input required placeholder="Contoh: Kasir Depan" value={register.name} onChange={(e) => setRegister({ ...register, name: e.target.value })} className={inputClassName} /></label>
               <button className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-brand-500 px-4 text-sm font-semibold text-white transition hover:bg-brand-600"><PlusIcon className="h-5 w-5" aria-hidden="true" />Tambah register</button>
            </form>
            <div className="mt-5 space-y-3">
              {registers.map((item) => (
                 <div key={item.id} className="rounded-2xl border border-gray-200 bg-gray-50/50 p-5 dark:border-[#293b58] dark:bg-[#111b2c]">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                     <div><div className="flex flex-wrap items-center gap-3"><h3 className="font-semibold text-gray-900 dark:text-white">{item.name}</h3><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${item.isActive ? "bg-success-50 text-success-700 dark:bg-success-500/10 dark:text-success-300" : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"}`}>{item.isActive ? "Aktif" : "Nonaktif"}</span></div><p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{item.outletName} · <span className="font-mono text-xs">{item.code}</span></p></div>
                     <div className="flex flex-wrap gap-2">
                       <button type="button" onClick={() => void showDevices(item.id)} className={secondaryButtonClassName}><PlugInIcon className="h-4 w-4" aria-hidden="true" />Perangkat</button>
                       <button type="button" onClick={() => void toggleRegister(item)} className={secondaryButtonClassName}>{item.isActive ? "Nonaktifkan" : "Aktifkan"}</button>
                       <button type="button" onClick={() => void generatePairing(item.id)} disabled={!item.isActive} className="rounded-xl bg-brand-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50">Buat kode pairing</button>
                    </div>
                  </div>
                  {devices[item.id]?.map((device) => (
                     <div key={device.id} className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-4 text-sm dark:border-[#293b58]">
                       <div><p className="font-medium text-gray-900 dark:text-white">{device.name}</p><p className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{device.platform} · {device.status === "active" ? "Terhubung" : "Akses dicabut"}{device.lastSeenAtUtc ? ` · Terakhir aktif ${new Date(device.lastSeenAtUtc).toLocaleString("id-ID")}` : ""}</p></div>
                       {device.status === "active" ? <button type="button" onClick={() => void revoke(item.id, device.id)} className="rounded-xl border border-error-200 px-3 py-2 text-xs font-semibold text-error-700 transition hover:bg-error-50 dark:border-error-500/20 dark:text-error-300 dark:hover:bg-error-500/10">Cabut akses</button> : null}
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
