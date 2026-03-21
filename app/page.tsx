import Link from "next/link";

export default async function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6 md:p-10">
      <section className="admin-surface relative w-full max-w-6xl overflow-hidden rounded-[28px] bg-[#0f0f0f]/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)] backdrop-blur-2xl">        <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-emerald-500/15 blur-[90px]" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-blue-500/15 blur-[120px]" />

        <div className="grid gap-0 lg:grid-cols-2">
          <div className="p-8 md:p-12 lg:pr-14">
            <p className="mb-6 inline-flex rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-400">            Finhalo Admin
            </p>
            <h1 className="mb-4 text-4xl font-bold tracking-tight text-white md:text-5xl">Welcome back.</h1>
            <p className="max-w-md text-sm leading-6 text-zinc-400 md:text-base md:leading-7">
              Sign in to review platform operations, commission pipelines, and financial workflows in the preview dashboard.
            </p>

            <div className="mt-10 grid grid-cols-2 gap-3 text-xs">
              <div className="admin-surface-soft rounded-2xl p-4">
                <p className="text-zinc-500">Environment</p>
                <p className="mt-1 font-semibold text-zinc-100">Preview Mode</p>
              </div>
              <div className="admin-surface-soft rounded-2xl p-4">
                <p className="text-zinc-500">Status</p>
                <p className="mt-1 font-semibold text-emerald-400">Operational</p>
              </div>
            </div>
          </div>

          <div className="p-8 md:p-12">
            <h2 className="mb-1 text-lg font-semibold text-white">Admin Login</h2>
            <p className="mb-8 text-sm text-zinc-500">Use your operator credentials to continue.</p>

            <form className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="admin@finhalo.com"
                  className="admin-control h-12 w-full rounded-xl bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-zinc-600 outline-none" />
              </div>

              <div className="space-y-2">
                <label htmlFor="password" className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="admin-control h-12 w-full rounded-xl bg-[#1a1a1a] px-4 text-sm text-white placeholder:text-zinc-600 outline-none" />
              </div>

              <Link
                href="/admin/dashboard"
                className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-emerald-500 text-sm font-bold uppercase tracking-[0.14em] text-black transition hover:bg-emerald-400"
              >
                Sign In
              </Link>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}
