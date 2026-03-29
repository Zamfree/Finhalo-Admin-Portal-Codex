# Admin Auto Translation (Network Mode)

This project now supports two translation layers for Admin Portal:

1. Local dictionary replacement (fast, immediate)
2. Network batch translation (Google-translate-like full sentence translation)

## Enable Network Translation

Set these environment variables in `.env.local`:

```bash
ADMIN_TRANSLATE_ENABLE_NETWORK=true
```

## Provider: Azure Translator (Recommended Free Tier)

```bash
ADMIN_TRANSLATE_PROVIDER=azure
ADMIN_TRANSLATE_AZURE_ENDPOINT=https://api.cognitive.microsofttranslator.com
ADMIN_TRANSLATE_AZURE_KEY=your_key
ADMIN_TRANSLATE_AZURE_REGION=your_region
```

## Provider: LibreTranslate (Self-host or hosted endpoint)

```bash
ADMIN_TRANSLATE_PROVIDER=libretranslate
ADMIN_TRANSLATE_LIBRE_URL=https://your-libretranslate-host
ADMIN_TRANSLATE_LIBRE_API_KEY=optional_key
ADMIN_TRANSLATE_ALLOW_EXTERNAL=false
```

## Behavior

- Language switch to `zh` triggers global DOM translation.
- Newly rendered text (including drawer/table dynamic updates) is translated automatically.
- Unresolved English snippets are batched to server-side translator and cached in memory for the current session.

## Local-only Security Mode (Recommended for Admin Portal)

- Keep `ADMIN_TRANSLATE_ALLOW_EXTERNAL=false` (default secure mode in service logic).
- Set `ADMIN_TRANSLATE_LIBRE_URL=http://127.0.0.1:5000`.
- Translation service will reject non-local endpoints unless external mode is explicitly enabled.

## Local LibreTranslate Control Scripts (Windows)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\libretranslate\start-local.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\libretranslate\status.ps1
powershell -ExecutionPolicy Bypass -File .\scripts\libretranslate\stop-local.ps1
```
