import { Link } from "react-router-dom";
import { ArrowLeft, CircleHelp, ExternalLink } from "lucide-react";

import AppLayout from "@/components/AppLayout";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { FAQ_CATEGORIES } from "@/features/suporte-faq/faq-content";

const SuporteFaq = () => {
  return (
    <AppLayout>
      <div className="mb-6">
        <Button asChild className="mb-4 -ml-2 gap-2 px-2" variant="ghost">
          <Link to="/suporte">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao suporte
          </Link>
        </Button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <CircleHelp className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dúvidas frequentes</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Respostas rápidas sobre o portal e como acessar cada área. Se não encontrar o que
              precisa, volte ao Suporte e abra um atendimento.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-8">
        {FAQ_CATEGORIES.map((category) => (
          <section key={category.id}>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {category.title}
            </h2>
            <div className="glass-card px-4 sm:px-5">
              <Accordion className="w-full" collapsible type="single">
                {category.items.map((item) => (
                  <AccordionItem key={item.id} value={item.id}>
                    <AccordionTrigger className="text-left hover:no-underline">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">{item.answer}</p>
                      {(item.howToAccess || item.href) && (
                        <div className="mt-3 flex flex-col gap-2 rounded-md border border-border/60 bg-muted/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                          {item.howToAccess ? (
                            <p className="text-xs text-foreground sm:text-sm">
                              <span className="font-medium text-foreground">Como acessar: </span>
                              <span className="text-muted-foreground">{item.howToAccess}</span>
                            </p>
                          ) : (
                            <span />
                          )}
                          {item.href ? (
                            <Button asChild className="h-8 shrink-0 gap-1.5 self-start sm:self-auto" size="sm" variant="outline">
                              <Link to={item.href}>
                                Abrir
                                <ExternalLink className="h-3.5 w-3.5" />
                              </Link>
                            </Button>
                          ) : null}
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-muted-foreground">
        Ainda com dúvida?{" "}
        <Link className="font-medium text-primary underline-offset-4 hover:underline" to="/suporte/novo">
          Solicitar atendimento
        </Link>
      </p>
    </AppLayout>
  );
};

export default SuporteFaq;
