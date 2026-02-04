function getOptionalEnv(name: string): string | null {
  const value = process.env[name];
  if (!value) return null;
  return value;
}

function getRequiredEnv(name: string): string {
  const value = getOptionalEnv(name);
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  supabaseUrlOptional: () => getOptionalEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKeyOptional: () => getOptionalEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKeyOptional: () => getOptionalEnv("SUPABASE_SERVICE_ROLE_KEY"),
  supabaseUrl: () => getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => getRequiredEnv("SUPABASE_SERVICE_ROLE_KEY"),
};
