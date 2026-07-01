import { cn } from "@/lib/utils";

interface LegalDocumentPanelProps {
  body: string;
  className?: string;
  title: string;
}

export const LegalDocumentPanel = ({ body, className, title }: LegalDocumentPanelProps) => (
  <div className={cn("space-y-3", className)}>
    <p className="text-sm font-semibold text-white">{title}</p>
    <div className="max-h-72 overflow-y-auto rounded-xl border border-white/[0.12] bg-[#07070c]/80 p-4">
      <pre className="whitespace-pre-wrap font-sans text-xs leading-relaxed text-zinc-300">{body}</pre>
    </div>
  </div>
);
