import { useEffect, useState } from "react";
import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { getSupabase } from "./supabase";

/**
 * NOT-01 / MSG-01: escucha inserciones de Supabase Realtime (postgres_changes,
 * filtradas por RLS) e invalida las queries indicadas. Devuelve si hay conexion
 * en vivo; sin Supabase (modo demo) devuelve false y la UI usa polling.
 */
export function useRealtimeInvalidate(
  table: "messages" | "notifications",
  filter: string | null,
  queryKeys: QueryKey[],
): boolean {
  const queryClient = useQueryClient();
  const [live, setLive] = useState(false);
  const keysJson = JSON.stringify(queryKeys);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !filter) {
      setLive(false);
      return;
    }
    const keys = JSON.parse(keysJson) as QueryKey[];
    const channel = supabase
      .channel(`${table}:${filter}`)
      .on("postgres_changes", { event: "*", schema: "public", table, filter }, () => {
        for (const key of keys) void queryClient.invalidateQueries({ queryKey: key });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => {
      setLive(false);
      void supabase.removeChannel(channel);
    };
  }, [table, filter, keysJson, queryClient]);

  return live;
}
