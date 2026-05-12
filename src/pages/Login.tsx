import { FormEvent, useEffect, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { z } from "zod";

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
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/features/auth";
import { supabase } from "@/lib/supabase/client";

const loginSchema = z.object({
  email: z.string().email("Informe um e-mail válido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

const passwordResetSchema = loginSchema.pick({ email: true });

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

const Login = () => {
  const { isAuthenticated, isLoading, isPlatformAdmin, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSendingPasswordReset, setIsSendingPasswordReset] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const locationState = location.state as LoginLocationState | null;
  const explicitRedirectTo = locationState?.from?.pathname;
  const redirectTo = explicitRedirectTo ?? (isPlatformAdmin ? "/admin" : "/");

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, redirectTo]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsedCredentials = loginSchema.safeParse({ email, password });

    if (!parsedCredentials.success) {
      setFormError(parsedCredentials.error.issues[0]?.message ?? "Revise os dados informados.");
      return;
    }

    const { email: parsedEmail, password: parsedPassword } = parsedCredentials.data;

    if (!parsedEmail || !parsedPassword) {
      setFormError("Revise os dados informados.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: parsedEmail,
      password: parsedPassword,
    });

    setIsSubmitting(false);

    if (error) {
      setFormError("Não foi possível entrar. Confira seu e-mail e senha.");
      return;
    }

    const nextAuthState = await refreshSession();
    const nextRedirectTo =
      explicitRedirectTo ?? (nextAuthState.profile?.is_platform_admin ? "/admin" : "/");

    toast({
      title: "Login realizado",
      description: "Bem-vindo ao FestaAI.",
    });

    navigate(nextRedirectTo, { replace: true });
  };

  const handlePasswordResetRequest = async () => {
    setFormError(null);

    const parsedEmail = passwordResetSchema.safeParse({ email });

    if (!parsedEmail.success) {
      setFormError("Informe seu e-mail para receber o link de redefinição de senha.");
      return;
    }

    setIsSendingPasswordReset(true);

    const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data.email, {
      redirectTo: `${window.location.origin}/nova-senha`,
    });

    setIsSendingPasswordReset(false);

    if (error) {
      setFormError("Não foi possível enviar o link de redefinição. Tente novamente.");
      return;
    }

    toast({
      title: "Link de redefinição enviado",
      description: "Confira seu e-mail para criar uma nova senha de acesso.",
    });
  };

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="min-h-screen bg-[#ececec] text-foreground">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden min-h-screen overflow-hidden bg-[#f7d7ef] lg:block">
          <img
            src="/tela%20inicial%20.svg?v=3"
            alt="Arte da marca FestaAI"
            className="block h-full w-full scale-[1.01] object-cover"
          />
          <div className="absolute inset-x-10 bottom-12 text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm shadow-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-[#e6bce9]" />
              Centro de controle para casas de festas infantis
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">
              Organize eventos, vendas e operação em um único lugar.
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/80">
              Acesse o painel para acompanhar o que precisa de ação, mover eventos no CRM e manter a operação simples para toda a equipe.
            </p>
          </div>
        </section>

        <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_12%,rgba(230,188,233,0.55),transparent_32%),radial-gradient(circle_at_86%_24%,rgba(217,86,147,0.18),transparent_30%),linear-gradient(145deg,#ffffff_0%,#fbf7ff_48%,#fff3f8_100%)] px-4 py-8 sm:px-8 lg:px-12">
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#e6bce9]/40 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-[#5158e7]/15 blur-3xl" />
          <div className="absolute right-12 top-1/2 h-40 w-40 rounded-full bg-[#d95693]/10 blur-2xl" />

          <div className="absolute inset-x-4 top-5 z-20 flex justify-center sm:inset-x-8 lg:inset-x-12">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-3 py-2 text-sm shadow-[0_16px_45px_rgba(34,20,60,0.10)] backdrop-blur-xl">
              <span className="font-medium text-muted-foreground">Ainda não tem uma conta?</span>
              <Button
                asChild
                className="h-8 rounded-full bg-[linear-gradient(135deg,#5158e7_0%,#d95693_100%)] px-4 text-xs font-semibold text-white shadow-md shadow-[#5158e7]/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#d95693]/25 focus-visible:ring-[#5158e7]/30"
                size="sm"
              >
                <Link to="/contratar">Ver planos</Link>
              </Button>
            </div>
          </div>

          <div className="relative z-10 flex w-full max-w-[480px] flex-col">
            <div className="mb-6 text-center lg:hidden">
              <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground">
                Organize eventos, vendas e operação em um único lugar.
              </h1>
              <p className="mt-3 text-base leading-7 text-muted-foreground">
                Acesse o painel para acompanhar o que precisa de ação, mover eventos no CRM e manter a operação simples para toda a equipe.
              </p>
            </div>

            <Card className="rounded-3xl border-white/80 bg-white/85 shadow-[0_24px_70px_rgba(34,20,60,0.14)] backdrop-blur-xl">
              <CardHeader className="space-y-6 px-7 pb-5 pt-7 sm:px-9 sm:pt-9">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center">
                    <img
                      src="/favicon%20simbolo1.svg?v=2"
                      alt="Marca FestaAI"
                      className="h-14 w-14 object-contain"
                    />
                  </div>
                  <div className="space-y-1 pt-1">
                    <CardTitle className="text-2xl tracking-tight">Bem Vindo ao FestaAI</CardTitle>
                    <CardDescription className="text-sm leading-6">
                      Acesse sua central para gerenciar vendas, festas e operação.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-7 pb-7 sm:px-9 sm:pb-9">
                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-sm font-semibold text-foreground">
                      E-mail
                    </Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="email"
                        autoComplete="email"
                        className="h-12 rounded-xl border-black/10 bg-[#fbfaff] pl-11 pr-4 shadow-inner shadow-black/[0.02] transition-all placeholder:text-muted-foreground/70 focus-visible:border-[#5158e7]/60 focus-visible:ring-[#5158e7]/20 focus-visible:ring-offset-0"
                        inputMode="email"
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="seunome@empresa.com"
                        type="email"
                        value={email}
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-3">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                        Senha
                      </Label>
                      <button
                        className="text-xs font-semibold text-[#5158e7] transition-colors hover:text-[#d95693] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5158e7]/30"
                        disabled={isSendingPasswordReset || isSubmitting || isLoading}
                        onClick={handlePasswordResetRequest}
                        type="button"
                      >
                        {isSendingPasswordReset ? "Enviando..." : "Esqueceu sua senha?"}
                      </button>
                    </div>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="password"
                        autoComplete="current-password"
                        className="h-12 rounded-xl border-black/10 bg-[#fbfaff] pl-11 pr-12 shadow-inner shadow-black/[0.02] transition-all placeholder:text-muted-foreground/70 focus-visible:border-[#5158e7]/60 focus-visible:ring-[#5158e7]/20 focus-visible:ring-offset-0"
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="Sua senha"
                        type={isPasswordVisible ? "text" : "password"}
                        value={password}
                      />
                      <button
                        aria-label={isPasswordVisible ? "Ocultar senha" : "Mostrar senha"}
                        className="absolute right-3 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-[#5158e7]/10 hover:text-[#5158e7] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5158e7]/30"
                        onClick={() => setIsPasswordVisible((currentValue) => !currentValue)}
                        type="button"
                      >
                        {isPasswordVisible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  {formError && (
                    <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                      {formError}
                    </p>
                  )}

                  <Button
                    className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#5158e7_0%,#d95693_58%,#e6bce9_100%)] text-base font-semibold text-white shadow-lg shadow-[#5158e7]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#d95693]/25 focus-visible:ring-[#5158e7]/30 disabled:translate-y-0 disabled:shadow-none"
                    disabled={isSubmitting || isLoading}
                    type="submit"
                  >
                    {isSubmitting ? "Entrando..." : "Entrar no painel"}
                  </Button>

                  <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-[#5158e7]" />
                    Central segura para gestão da sua casa de festas.
                  </p>
                </form>
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              FestaAI © Central de gestão para casas de festas infantis
            </p>
          </div>
        </section>
      </div>
    </main>
  );
};

export default Login;
