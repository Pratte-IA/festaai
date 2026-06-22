import { useQuery } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase/client";

import { comercialQueryKeys } from "./query-keys";
import { PublicCommercialOffer } from "./types";

export const usePublicCommercialOffer = (token: string | undefined) =>
  useQuery({
    enabled: Boolean(token),
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_public_commercial_offer", {
        p_token: token as string,
      });

      if (error) {
        throw error;
      }

      const row = data?.[0];
      if (!row) {
        return null;
      }

      return row as PublicCommercialOffer;
    },
    queryKey: comercialQueryKeys.publicOffer(token),
    retry: false,
  });
