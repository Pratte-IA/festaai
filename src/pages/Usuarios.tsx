import { FormEvent, useState } from "react";
import { Eye, EyeOff, KeyRound, Lock, UserPlus, UsersRound } from "lucide-react";
import { z } from "zod";

import AppLayout from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/features/auth";
import { useTenantAdminCapability } from "@/features/tenants/use-tenant-admin-capability";
import { useCreateTenantTeamMember, useTenantTeamMembers } from "@/features/usuarios";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase/client";

const cpfDigitsSchema = z
  .string()
  .min(1, "Informe o CPF.")
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits.length === 11, "CPF deve conter 11 dígitos.");

const createUserFormSchema = z.object({
  appRole: z.enum(["admin", "member"]),
  cpf: cpfDigitsSchema,
  email: z.string().email("E-mail inválido."),
  fullName: z.string().min(2, "Nome muito curto."),
  password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  passwordConfirm: z.string().min(8, "Confirme a senha."),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "As senhas não conferem.",
  path: ["passwordConfirm"],
});

const changePasswordSchema = z
  .object({
    confirmPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não conferem.",
    path: ["confirmPassword"],
  });

const formatCpf = (digits: string | null | undefined) => {
  if (!digits || digits.length !== 11) {
    return "—";
  }
  return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
};

const roleLabel = (role: string) => {
  if (role === "owner") {
    return "Dono";
  }
  if (role === "admin") {
    return "Admin";
  }
  return "Vendas";
};

const roleBadgeVariant = (role: string): "default" | "secondary" | "outline" => {
  if (role === "owner") {
    return "default";
  }
  if (role === "admin") {
    return "secondary";
  }
  return "outline";
};

const Usuarios = () => {
  const { user } = useAuth();
  const { data: adminCap } = useTenantAdminCapability();
  const { data: members = [], error: membersError, isLoading: isMembersLoading } = useTenantTeamMembers();
  const createMember = useCreateTenantTeamMember();

  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [appRole, setAppRole] = useState<"admin" | "member">("member");
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordFormError, setPasswordFormError] = useState<string | null>(null);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const isTenantAdmin = adminCap?.isTenantAdmin === true;

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCreateFormError(null);

    const parsed = createUserFormSchema.safeParse({
      appRole,
      cpf,
      email,
      fullName,
      password,
      passwordConfirm,
    });

    if (!parsed.success) {
      setCreateFormError(parsed.error.issues[0]?.message ?? "Revise os dados.");
      return;
    }

    try {
      await createMember.mutateAsync({
        appRole: parsed.data.appRole,
        cpf: parsed.data.cpf,
        email: parsed.data.email,
        fullName: parsed.data.fullName,
        password: parsed.data.password,
      });

      toast({
        description: "O colaborador já pode entrar com o e-mail e a senha definidos.",
        title: "Usuário criado",
      });

      setFullName("");
      setCpf("");
      setEmail("");
      setPassword("");
      setPasswordConfirm("");
      setAppRole("member");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Não foi possível criar o usuário.";
      setCreateFormError(message);
    }
  };

  const handleChangePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordFormError(null);

    const parsed = changePasswordSchema.safeParse({
      confirmPassword: confirmNewPassword,
      password: newPassword,
    });

    if (!parsed.success) {
      setPasswordFormError(parsed.error.issues[0]?.message ?? "Revise os dados.");
      return;
    }

    setIsSavingPassword(true);
    const { error } = await supabase.auth.updateUser({
      password: parsed.data.password,
    });
    setIsSavingPassword(false);

    if (error) {
      setPasswordFormError("Não foi possível alterar a senha. Tente novamente.");
      return;
    }

    toast({
      description: "Sua senha foi atualizada com sucesso.",
      title: "Senha alterada",
    });

    setNewPassword("");
    setConfirmNewPassword("");
  };

  return (
    <AppLayout>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground">Usuários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Equipe da empresa ativa. Cada pessoa pode alterar a própria senha aqui.
        </p>
      </div>

      <div className={`grid gap-6 ${isTenantAdmin ? "lg:grid-cols-2" : ""}`}>
        <Card className="glass-card border-border/50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" aria-hidden />
              <CardTitle className="text-lg">Sua senha</CardTitle>
            </div>
            <CardDescription>
              Você está logado como {user?.email ?? "usuário"}. Defina uma nova senha quando quiser.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nova senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="new-password"
                    autoComplete="new-password"
                    className="pl-9 pr-10"
                    type={isPasswordVisible ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                  <button
                    aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-muted"
                    type="button"
                    onClick={() => setIsPasswordVisible((v) => !v)}
                  >
                    {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="confirm-new-password"
                    autoComplete="new-password"
                    className="pl-9"
                    type={isPasswordVisible ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                  />
                </div>
              </div>
              {passwordFormError && (
                <p className="text-sm text-destructive">{passwordFormError}</p>
              )}
              <Button disabled={isSavingPassword} type="submit">
                {isSavingPassword ? "Salvando..." : "Atualizar senha"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {isTenantAdmin && (
          <Card className="glass-card border-border/50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" aria-hidden />
                <CardTitle className="text-lg">Adicionar à equipe</CardTitle>
              </div>
              <CardDescription>
                Crie o acesso com e-mail e senha. O perfil define se a pessoa administrará o tenant ou
                apenas vendas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateUser}>
                <div className="space-y-2">
                  <Label htmlFor="member-name">Nome completo</Label>
                  <Input
                    id="member-name"
                    autoComplete="name"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-cpf">CPF</Label>
                  <Input
                    id="member-cpf"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="000.000.000-00"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-email">E-mail</Label>
                  <Input
                    id="member-email"
                    autoComplete="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-role">Perfil</Label>
                  <select
                    id="member-role"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    value={appRole}
                    onChange={(e) => setAppRole(e.target.value as "admin" | "member")}
                  >
                    <option value="member">Vendas</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password">Senha inicial</Label>
                  <Input
                    id="member-password"
                    autoComplete="new-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="member-password-confirm">Confirmar senha</Label>
                  <Input
                    id="member-password-confirm"
                    autoComplete="new-password"
                    type="password"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                </div>
                {createFormError && (
                  <p className="text-sm text-destructive">{createFormError}</p>
                )}
                <Button disabled={createMember.isPending} type="submit">
                  {createMember.isPending ? "Criando..." : "Criar usuário"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="glass-card mt-8 border-border/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UsersRound className="h-5 w-5 text-primary" aria-hidden />
            <CardTitle className="text-lg">Equipe atual</CardTitle>
          </div>
          <CardDescription>Usuários vinculados ao tenant ativo ({members.length} ativos).</CardDescription>
        </CardHeader>
        <CardContent>
          {membersError && (
            <p className="mb-4 text-sm text-destructive">
              Não foi possível carregar a lista. Verifique sua conexão e tente de novo.
            </p>
          )}
          {isMembersLoading ? (
            <p className="text-sm text-muted-foreground">Carregando equipe…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhum membro ativo encontrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Perfil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((row) => {
                  const isSelf = row.user_id === user?.id;
                  return (
                    <TableRow key={row.id} className={isSelf ? "bg-primary/5" : undefined}>
                      <TableCell className="font-medium">
                        {row.profile?.full_name?.trim() || "—"}
                        {isSelf ? (
                          <span className="ml-2 text-xs font-normal text-muted-foreground">(você)</span>
                        ) : null}
                      </TableCell>
                      <TableCell>{row.profile?.email ?? "—"}</TableCell>
                      <TableCell className="tabular-nums">{formatCpf(row.profile?.cpf)}</TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariant(row.role)}>{roleLabel(row.role)}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
};

export default Usuarios;
