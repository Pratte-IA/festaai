import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, ShieldCheck, Sparkles } from "lucide-react";
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

const updatePasswordSchema = z
  .object({
    confirmPassword: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas informadas não conferem.",
    path: ["confirmPassword"],
  });

const NovaSenha = () => {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isWaitingSession, setIsWaitingSession] = useState(true);

  const isFirstAccess = useMemo(
    () => new URLSearchParams(window.location.search).get("origem") === "primeiro-acesso",
    [],
  );

  useEffect(() => {
    let isMounted = true;

    const bootstrapSession = async () => {
      await refreshSession();
      if (isMounted) {
        setIsWaitingSession(false);
      }
    };

    void bootstrapSession();

    return () => {
      isMounted = false;
    };
  }, [refreshSession]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const parsedPasswords = updatePasswordSchema.safeParse({ confirmPassword, password });

    if (!parsedPasswords.success) {
      setFormError(parsedPasswords.error.issues[0]?.message ?? "Revise os dados informados.");
      return;
    }

    setIsSubmitting(true);

    const { error } = await supabase.auth.updateUser({
      password: parsedPasswords.data.password,
    });

    setIsSubmitting(false);

    if (error) {
      setFormError("Não foi possível atualizar sua senha. Solicite um novo link de recuperação.");
      return;
    }

    toast({
      title: isFirstAccess ? "Senha criada com sucesso" : "Senha atualizada",
      description: isFirstAccess
        ? "Entrando na sua central FestaAI..."
        : "Sua senha foi atualizada.",
    });

    await refreshSession();

    if (isFirstAccess) {
      navigate("/", { replace: true });
      return;
    }

    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

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
              Recuperação segura de acesso
            </div>
            <h1 className="max-w-xl text-5xl font-bold leading-tight tracking-tight">
              {isFirstAccess ? "Crie sua senha e acesse o painel." : "Crie uma nova senha para voltar ao painel."}
            </h1>
            <p className="mt-4 max-w-lg text-base leading-7 text-white/80">
              {isFirstAccess
                ? "Este é o seu primeiro acesso ao FestaAI. Defina uma senha segura para entrar na central."
                : "Use uma senha forte para manter sua central FestaAI protegida."}
            </p>
          </div>
        </section>

        <section className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-[radial-gradient(circle_at_20%_12%,rgba(230,188,233,0.55),transparent_32%),radial-gradient(circle_at_86%_24%,rgba(217,86,147,0.18),transparent_30%),linear-gradient(145deg,#ffffff_0%,#fbf7ff_48%,#fff3f8_100%)] px-4 py-8 sm:px-8 lg:px-12">
          <div className="absolute -right-24 top-16 h-72 w-72 rounded-full bg-[#e6bce9]/40 blur-3xl" />
          <div className="absolute -bottom-20 left-8 h-64 w-64 rounded-full bg-[#5158e7]/15 blur-3xl" />
          <div className="absolute right-12 top-1/2 h-40 w-40 rounded-full bg-[#d95693]/10 blur-2xl" />

          <div className="relative z-10 flex w-full max-w-[480px] flex-col">
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
                    <CardTitle className="text-2xl tracking-tight">
                      {isFirstAccess ? "Criar senha de acesso" : "Definir nova senha"}
                    </CardTitle>
                    <CardDescription className="text-sm leading-6">
                      {isFirstAccess
                        ? "Escolha a senha que você usará para entrar no FestaAI."
                        : "Escolha uma nova senha para acessar sua central FestaAI."}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-7 pb-7 sm:px-9 sm:pb-9">
                {!isLoading && !isWaitingSession && !isAuthenticated ? (
                  <div className="space-y-5">
                    <p className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-foreground">
                      Link inválido ou expirado. Solicite uma nova recuperação de senha.
                    </p>
                    <Button asChild className="h-12 w-full rounded-xl">
                      <Link to="/login">Voltar para o login</Link>
                    </Button>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2.5">
                      <Label htmlFor="password" className="text-sm font-semibold text-foreground">
                        Nova senha
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="password"
                          autoComplete="new-password"
                          className="h-12 rounded-xl border-black/10 bg-[#fbfaff] pl-11 pr-12 shadow-inner shadow-black/[0.02] transition-all placeholder:text-muted-foreground/70 focus-visible:border-[#5158e7]/60 focus-visible:ring-[#5158e7]/20 focus-visible:ring-offset-0"
                          onChange={(event) => setPassword(event.target.value)}
                          placeholder="Digite sua nova senha"
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

                    <div className="space-y-2.5">
                      <Label htmlFor="confirmPassword" className="text-sm font-semibold text-foreground">
                        Confirmar senha
                      </Label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          autoComplete="new-password"
                          className="h-12 rounded-xl border-black/10 bg-[#fbfaff] pl-11 pr-4 shadow-inner shadow-black/[0.02] transition-all placeholder:text-muted-foreground/70 focus-visible:border-[#5158e7]/60 focus-visible:ring-[#5158e7]/20 focus-visible:ring-offset-0"
                          onChange={(event) => setConfirmPassword(event.target.value)}
                          placeholder="Repita sua nova senha"
                          type={isPasswordVisible ? "text" : "password"}
                          value={confirmPassword}
                        />
                      </div>
                    </div>

                    {formError && (
                      <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                        {formError}
                      </p>
                    )}

                    <Button
                      className="h-12 w-full rounded-xl bg-[linear-gradient(135deg,#5158e7_0%,#d95693_58%,#e6bce9_100%)] text-base font-semibold text-white shadow-lg shadow-[#5158e7]/25 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#d95693]/25 focus-visible:ring-[#5158e7]/30 disabled:translate-y-0 disabled:shadow-none"
                      disabled={isSubmitting || isLoading || isWaitingSession}
                      type="submit"
                    >
                      {isSubmitting
                        ? "Salvando..."
                        : isFirstAccess
                          ? "Criar senha e entrar"
                          : "Atualizar senha"}
                    </Button>

                    <p className="flex items-center justify-center gap-2 text-center text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-[#5158e7]" />
                      Central segura para gestão da sua casa de festas.
                    </p>
                  </form>
                )}
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

export default NovaSenha;
