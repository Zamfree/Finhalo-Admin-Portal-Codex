export default async function SettingsPage() {
  return (
    <section className="rounded-lg border bg-background p-4 shadow-sm">
      <h1 className="text-lg font-semibold">Settings</h1>
      <p className="mb-4 text-sm text-muted-foreground">Preview-mode system settings panel.</p>
      <div className="space-y-3 text-sm">
        <div className="rounded-md border p-3">Platform timezone: UTC</div>
        <div className="rounded-md border p-3">Default currency: USD</div>
        <div className="rounded-md border p-3">Admin alerts: Enabled</div>
      </div>
    </section>
  );
}
