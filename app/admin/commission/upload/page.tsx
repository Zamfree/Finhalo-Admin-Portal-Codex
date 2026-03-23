import { DataPanel } from "@/components/system/data/data-panel";
import { getAdminServerPreferences } from "@/lib/admin-ui-server";

export default async function CommissionUploadPage() {
  const { translations } = await getAdminServerPreferences();

  return (
    <div className="space-y-6 pb-8">
      <div>
        <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
          Admin / Commission
        </p>
        <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl">
          {translations.commission.uploadTitle}
          <span className="ml-1.5 inline-block text-amber-400">.</span>
        </h1>
        <p className="mt-4 max-w-3xl text-base text-zinc-400 md:text-lg">
          {translations.commission.uploadDescription}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">{translations.commission.uploadPlaceholderTitle}</h2>}
          description={
            <p className="max-w-2xl text-sm text-zinc-400">
              {translations.commission.uploadPlaceholderDescription}
            </p>
          }
        >
          <div className="rounded-2xl border border-dashed border-white/12 bg-white/[0.03] px-6 py-14 text-center">
            <p className="text-base font-medium text-white">{translations.commission.uploadPlaceholderTitle}</p>
            <p className="mt-2 text-sm text-zinc-400">{translations.commission.supportedFormats}</p>
            <p className="mt-3 text-sm text-zinc-500">
              {translations.commission.mappingValidationNote}
            </p>
          </div>
        </DataPanel>

        <DataPanel
          title={<h2 className="text-xl font-semibold text-white">{translations.common.labels.overview}</h2>}
        >
          <dl className="space-y-4 text-sm">
            <div className="space-y-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {translations.commission.supportedFormats}
              </dt>
              <dd className="text-zinc-300">CSV, XLSX</dd>
            </div>
            <div className="space-y-1.5">
              <dt className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                {translations.common.labels.validation}
              </dt>
              <dd className="text-zinc-300">{translations.commission.mappingValidationNote}</dd>
            </div>
          </dl>
        </DataPanel>
      </div>
    </div>
  );
}
