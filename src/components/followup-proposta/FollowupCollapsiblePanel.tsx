import { ChevronDown } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

interface FollowupCollapsiblePanelProps {
  children: ReactNode;
  description?: string;
  expandLabel?: string;
  title: string;
}

export const FollowupCollapsiblePanel = ({
  children,
  description,
  expandLabel = "Expandir mensagem",
  title,
}: FollowupCollapsiblePanelProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div className="rounded-xl border border-border/60 bg-card/40 overflow-hidden">
        <CollapsibleTrigger asChild>
          <Button
            className="h-auto w-full justify-between gap-3 rounded-none px-4 py-3.5 text-left font-normal hover:bg-muted/30"
            type="button"
            variant="ghost"
          >
            <span className="min-w-0 space-y-0.5">
              <span className="block text-sm font-semibold text-foreground">{title}</span>
              {description ? (
                <span className="block text-xs text-muted-foreground line-clamp-2">{description}</span>
              ) : null}
            </span>
            <span className="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground">
              {open ? "Recolher" : expandLabel}
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform duration-200",
                  open && "rotate-180",
                )}
                aria-hidden
              />
            </span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="space-y-4 border-t border-border/60 p-4 pt-4">{children}</div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
