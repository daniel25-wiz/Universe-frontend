/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_MODE?: string;
  readonly VITE_API_URL?: string;
  readonly VITE_MOCK_LATENCY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
