revoke execute on function public.handle_new_user_profile() from public, anon, authenticated;
revoke execute on function public.is_tenant_member(bigint) from public, anon, authenticated;
revoke execute on function public.has_tenant_role(bigint, text[]) from public, anon, authenticated;

grant execute on function public.is_tenant_member(bigint) to authenticated;
grant execute on function public.has_tenant_role(bigint, text[]) to authenticated;
