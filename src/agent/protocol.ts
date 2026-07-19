export const AGENT_NDJSON_MEDIA_TYPE = "application/x-ndjson";
export const AGENT_NDJSON_CONTENT_TYPE = `${AGENT_NDJSON_MEDIA_TYPE}; charset=utf-8`;
export const AGENT_TRANSPORT_ID = "ndjson-v1";

export const AGENT_API_SECURITY_HEADERS = {
  "Cache-Control": "no-store",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Content-Type-Options": "nosniff"
} as const;
