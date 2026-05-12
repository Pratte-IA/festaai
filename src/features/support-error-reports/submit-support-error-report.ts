import { supabase } from "@/lib/supabase/client";

import {
  SUPPORT_ERROR_MAX_BYTES_PER_FILE,
  SUPPORT_ERROR_MAX_FILES,
  SUPPORT_ERROR_REPORTS_BUCKET,
} from "./constants";

const sanitizeFileName = (name: string): string => {
  const trimmed = name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
  return trimmed.length > 0 ? trimmed : "captura";
};

export interface SubmitSupportErrorReportParams {
  description: string;
  files: File[];
  tenantId: number;
  title: string;
  userId: string;
}

export const validateSupportErrorFiles = (files: File[]): string | null => {
  if (files.length === 0) {
    return "Inclua pelo menos uma imagem (print da tela ou do erro).";
  }

  if (files.length > SUPPORT_ERROR_MAX_FILES) {
    return `Limite de ${SUPPORT_ERROR_MAX_FILES} arquivos por envio.`;
  }

  for (const file of files) {
    if (!file.type.startsWith("image/")) {
      return `Arquivo não suportado: "${file.name}". Use apenas imagens (PNG, JPG, WebP etc.).`;
    }

    if (file.size > SUPPORT_ERROR_MAX_BYTES_PER_FILE) {
      return `O arquivo "${file.name}" excede 5 MB.`;
    }

    if (file.size <= 0) {
      return `Arquivo inválido: "${file.name}".`;
    }
  }

  return null;
};

export const submitSupportErrorReport = async ({
  description,
  files,
  tenantId,
  title,
  userId,
}: SubmitSupportErrorReportParams): Promise<number> => {
  const validationError = validateSupportErrorFiles(files);
  if (validationError) {
    throw new Error(validationError);
  }

  const { data: insertRow, error: insertErr } = await supabase
    .from("support_error_reports")
    .insert({
      created_by: userId,
      description: description.trim(),
      tenant_id: tenantId,
      title: title.trim(),
    })
    .select("id")
    .single();

  if (insertErr || insertRow == null) {
    throw new Error(insertErr?.message ?? "Não foi possível registrar o relatório.");
  }

  const reportId = insertRow.id;
  const uploadedPaths: string[] = [];

  try {
    let sortOrder = 0;

    for (const file of files) {
      const path = `${tenantId}/${reportId}/${crypto.randomUUID()}_${sanitizeFileName(file.name)}`;

      const { error: upErr } = await supabase.storage.from(SUPPORT_ERROR_REPORTS_BUCKET).upload(path, file, {
        cacheControl: "3600",
        contentType: file.type || "image/png",
        upsert: false,
      });

      if (upErr) {
        throw new Error(upErr.message);
      }

      uploadedPaths.push(path);

      const { error: metaErr } = await supabase.from("support_error_report_files").insert({
        byte_size: file.size,
        content_type: file.type || null,
        file_name: file.name.slice(0, 500),
        report_id: reportId,
        sort_order: sortOrder,
        storage_path: path,
      });

      sortOrder += 1;

      if (metaErr) {
        throw new Error(metaErr.message);
      }
    }

    return reportId;
  } catch (error) {
    if (uploadedPaths.length > 0) {
      await supabase.storage.from(SUPPORT_ERROR_REPORTS_BUCKET).remove(uploadedPaths);
    }

    await supabase.from("support_error_reports").delete().eq("id", reportId);

    throw error instanceof Error ? error : new Error("Falha ao enviar anexos.");
  }
};
