import { FollowupCollapsiblePanel } from "@/components/followup-proposta/FollowupCollapsiblePanel";

interface FollowupMessagePreviewProps {
  description?: string;
  expandLabel?: string;
  message: string;
  title: string;
}

export const FollowupMessagePreview = ({
  description,
  expandLabel = "Ver prévia da mensagem",
  message,
  title,
}: FollowupMessagePreviewProps) => (
  <FollowupCollapsiblePanel description={description} expandLabel={expandLabel} title={title}>
    <div className="rounded-xl border border-border/60 bg-background/80 p-4">
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">{message}</p>
    </div>
  </FollowupCollapsiblePanel>
);
