import { cn } from "@/lib/utils";

interface ContractDocumentViewProps {
  className?: string;
  html: string;
}

export const contractDocumentClassName = cn(
  "text-sm leading-relaxed text-foreground",
  "[&_.contract-document_h1]:text-xl [&_.contract-document_h1]:font-bold [&_.contract-document_h1]:mb-4",
  "[&_.contract-document_h2]:text-base [&_.contract-document_h2]:font-semibold [&_.contract-document_h2]:mt-6 [&_.contract-document_h2]:mb-2",
  "[&_.contract-document_p]:mb-2",
  "[&_.contract-document_ul]:list-disc [&_.contract-document_ul]:pl-5 [&_.contract-document_ul]:mb-3",
  "[&_.contract-document_pre]:whitespace-pre-wrap [&_.contract-document_pre]:rounded-md [&_.contract-document_pre]:bg-muted/50 [&_.contract-document_pre]:p-3 [&_.contract-document_pre]:text-xs",
);

export const ContractDocumentView = ({ className, html }: ContractDocumentViewProps) => (
  <div
    className={cn(contractDocumentClassName, className)}
    dangerouslySetInnerHTML={{ __html: html }}
  />
);
