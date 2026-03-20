export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold mb-4">Admin Login</h1>

        <input
          placeholder="Email"
          className="w-full mb-3 px-3 py-2 rounded bg-white/10 border border-white/10"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-3 py-2 rounded bg-white/10 border border-white/10"
        />

        <button className="w-full py-2 rounded bg-white text-black font-medium">
          Login
        </button>
      </div>
    </main>
  );
}
