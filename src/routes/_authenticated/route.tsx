import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    const roles = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
    if (!roles.data?.some((row) => row.role === "admin")) throw redirect({ to: "/auth" });
    return { user: data.user };
  },
  component: () => <Outlet />,
});