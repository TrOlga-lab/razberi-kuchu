POST /api/analyze accepts multipart/form-data with one `image` file (JPEG, PNG, or WebP, up to 10 MiB). Responses include `mode`, `message`, and `items` with `name`, `action`, `reason`, and `confidence` (0–1, or null when not assessed).

Without VISION_PROVIDER, or with VISION_PROVIDER=demo, the server returns explicitly labeled examples, not image detections. Images are processed in memory and are not persisted.

To integrate a provider, implement VisionProvider in lib/analysis-provider.ts and register it in getProvider(). Normalize and validate the provider response into Analysis. Set mode to ai for real results. Read credentials only in that server module from environment variables (never NEXT_PUBLIC_*). Unsupported provider settings return 503 rather than silently producing demo results. No paid provider is included.
