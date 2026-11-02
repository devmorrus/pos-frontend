import { storefrontClient } from "../../../api/storefrontClient";
import type { PublicOutlet } from "../types";

/**
 * Ambil semua outlet yang aktif — untuk ditampilkan di halaman pemilihan outlet customer.
 * Endpoint: GET /api/public/outlets
 */
export async function fetchPublicOutlets(): Promise<PublicOutlet[]> {
  return storefrontClient.get<PublicOutlet[]>("/api/public/outlets");
}

/**
 * Ambil detail satu outlet berdasarkan code/slug.
 * Dipakai saat customer reload page atau direct URL — restore outlet context dari URL param.
 * Endpoint: GET /api/public/{businessSlug}/outlets/{code}
 */
export async function fetchOutletByCode(businessSlug: string, code: string): Promise<PublicOutlet> {
  return storefrontClient.get<PublicOutlet>(
    `/api/public/${encodeURIComponent(businessSlug)}/outlets/${encodeURIComponent(code)}`
  );
}
