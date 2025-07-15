declare global {
  interface Window {
    VANTA: {
      CLOUDS: (config: Record<string, unknown>) => Record<string, unknown>;
      NET: (config: Record<string, unknown>) => Record<string, unknown>;
      RINGS: (config: Record<string, unknown>) => Record<string, unknown>;
      [key: string]: unknown;
    };
  }
}
export {}; 