function getEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

export const env = {
  supabaseUrl: () => getEnv("NEXT_PUBLIC_SUPABASE_URL"),
  supabaseAnonKey: () => getEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: () => getEnv("SUPABASE_SERVICE_ROLE_KEY"),
};

