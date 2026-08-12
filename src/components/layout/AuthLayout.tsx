import { Outlet } from "react-router";
import MorrusLogo from "./MorrusLogo";

export default function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#f6f8fc] px-0 py-0 dark:bg-gray-950">
      <div className="mx-auto grid min-h-screen w-full max-w-[1600px] lg:grid-cols-[minmax(520px,46%)_1fr]">
        <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white px-6 py-10 dark:bg-gray-950 sm:px-10 lg:px-14 xl:px-18">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-0 h-56 w-56 rounded-full bg-brand-100 blur-3xl" />
            <div className="absolute bottom-10 right-[-4rem] h-64 w-64 rounded-full bg-blue-light-100 blur-3xl" />
          </div>

          <div className="relative z-10 w-full max-w-md">
            <MorrusLogo />
            <div className="mt-10">
              <Outlet />
            </div>
          </div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          <img
            src="/images/auth/signin-pos-hero.jpg"
            alt="Operator menggunakan sistem POS modern di counter toko"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(10,17,40,0.12)_0%,rgba(10,17,40,0.36)_42%,rgba(10,17,40,0.78)_100%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(70,95,255,0.22),transparent_28%)]" />

          <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
            <div className="flex justify-end">
              <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-white/90 backdrop-blur-md">
                Modern retail operations
              </span>
            </div>

            <div className="max-w-xl space-y-6 text-white">
              <div className="space-y-4">
                <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                  MorrusPOS
                </p>
                <h1 className="text-4xl font-semibold leading-tight tracking-[-0.04em] xl:text-6xl">
                  Kendalikan checkout, stok, dan aktivitas toko dari satu dashboard.
                </h1>
                <p className="max-w-lg text-base leading-7 text-white/78 xl:text-lg">
                  Dirancang untuk tim operasional yang butuh alur cepat, data real-time,
                  dan pengalaman kasir yang rapi sejak login pertama.
                </p>
              </div>

              <div className="grid max-w-2xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">Checkout lebih cepat</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Akses transaksi dan pembayaran tanpa langkah yang membingungkan.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">Stok selalu sinkron</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Perubahan inventaris langsung tercatat lintas outlet dan gudang.
                  </p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-md">
                  <p className="text-sm font-semibold text-white">Operasional lebih tenang</p>
                  <p className="mt-1 text-sm leading-6 text-white/70">
                    Supplier, konsinyasi, dan pemantauan bisnis tersusun dalam satu alur.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
