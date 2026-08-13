import type { OutletFormValues } from "../types/outlet";

export type OutletFieldErrors = Partial<Record<keyof OutletFormValues, string>>;

export function validateOutletForm(
  values: OutletFormValues,
  existingCodes: string[],
  currentCode?: string
) {
  const errors: OutletFieldErrors = {};

  const trimmedCode = values.code.trim().toUpperCase();

  if (!trimmedCode) {
    errors.code = "Kode cabang wajib diisi.";
  } else if (trimmedCode.length < 3 || trimmedCode.length > 20) {
    errors.code = "Kode cabang harus berkisar antara 3 sampai 20 karakter.";
  } else {
    const codePattern = /^[A-Z0-9\-_]+$/;
    if (!codePattern.test(trimmedCode)) {
      errors.code = "Kode cabang hanya boleh berisi huruf, angka, strip (-), dan underscore (_).";
    } else {
      const isDuplicate = existingCodes.some(
        (code) => code.toUpperCase() === trimmedCode && code.toUpperCase() !== currentCode?.toUpperCase()
      );
      if (isDuplicate) {
        errors.code = "Kode cabang sudah digunakan.";
      }
    }
  }

  if (!values.name.trim()) {
    errors.name = "Nama cabang wajib diisi.";
  } else if (values.name.trim().length < 3 || values.name.trim().length > 150) {
    errors.name = "Nama cabang harus berkisar antara 3 sampai 150 karakter.";
  }

  if (values.phone && values.phone.trim()) {
    const phonePattern = /^[0-9+\-\s()]+$/;
    if (!phonePattern.test(values.phone.trim())) {
      errors.phone = "Nomor telepon tidak valid.";
    } else if (values.phone.trim().length > 20) {
      errors.phone = "Nomor telepon maksimal 20 karakter.";
    }
  }

  return errors;
}
