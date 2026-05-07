import { FormEvent, useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { Sparkles } from "lucide-react";
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
  email: z.string().email("Informe um e-mail valido."),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres."),
});

interface LoginLocationState {
  from?: {
    pathname?: string;
  };
}

const Login = () => {
  const { isAuthenticated, isLoading, refreshSession } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const locationState = location.state as LoginLocationState | null;
  const redirectTo = locationState?.from?.pathname ?? "/";

  useEffect(() => {
    if (isAuthenticated) {
      navigate(redirectTo, { replace: true });
    }
  }, [isAuthenticated, navigate, redirectTo]);

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
      setFormError("Nao foi possivel entrar. Confira seu e-mail e senha.");
      return;
    }

    await refreshSession();

    toast({
      title: "Login realizado",
      description: "Bem-vindo ao FestaAI.",
    });

    navigate(redirectTo, { replace: true });
  };

  if (!isLoading && isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-black via-primary/30 to-rosa/30 px-4 py-10 text-foreground">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-6xl items-center justify-center">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1fr_440px]">
          <section className="hidden text-white lg:block">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm backdrop-blur">
              <Sparkles className="h-4 w-4 text-lilas" />
              Centro de controle para casas de festas infantis
            </div>
            <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight">
              Organize eventos, vendas e operacao em um unico lugar.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Acesse o painel para acompanhar o que precisa de acao, mover eventos no CRM e manter a operacao simples para toda a equipe.
            </p>
          </section>

          <Card className="border-white/20 bg-card/95 shadow-2xl shadow-black/20 backdrop-blur">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-rosa to-lilas">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <CardTitle>Entrar no FestaAI</CardTitle>
                  <CardDescription>Acesse sua central de controle.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    autoComplete="email"
                    inputMode="email"
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="voce@empresa.com"
                    type="email"
                    value={email}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    autoComplete="current-password"
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Sua senha"
                    type="password"
                    value={password}
                  />
                </div>

                {formError && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {formError}
                  </p>
                )}

                <Button className="w-full" disabled={isSubmitting || isLoading} type="submit">
                  {isSubmitting ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
};

export default Login;
