import type { User } from "@supabase/supabase-js";

export const FIRST_ACCESS_PASSWORD_PATH = "/nova-senha?origem=primeiro-acesso";

export const userMustSetPassword = (user: User | null | undefined): boolean =>
  user?.user_metadata?.must_set_password === true;
