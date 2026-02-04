type PublicConfig = {
  supabaseUrl: string | null;
  supabaseAnonKey: string | null;
};

let cachedConfigPromise: Promise<PublicConfig> | null = null;

export async function getSupabasePublicConfig(): Promise<PublicConfig> {
  if (cachedConfigPromise) return cachedConfigPromise;

  cachedConfigPromise = fetch("/api/public-config", { cache: "no-store" })
    .then(async (res) => {
      if (!res.ok) return { supabaseUrl: null, supabaseAnonKey: null };
      const data = (await res.json()) as unknown;
      if (!data || typeof data !== "object") {
        return { supabaseUrl: null, supabaseAnonKey: null };
      }
      const obj = data as Record<string, unknown>;
      const supabaseUrl = obj["supabaseUrl"];
      const supabaseAnonKey = obj["supabaseAnonKey"];
      return {
        supabaseUrl: typeof supabaseUrl === "string" ? supabaseUrl : null,
        supabaseAnonKey:
          typeof supabaseAnonKey === "string" ? supabaseAnonKey : null,
      };
    })
    .catch(() => ({ supabaseUrl: null, supabaseAnonKey: null }));

  return cachedConfigPromise;
}
