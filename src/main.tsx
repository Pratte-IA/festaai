const renderBootstrapError = (error: unknown) => {
  const rootElement = document.getElementById("root");
  const message = error instanceof Error ? error.message : "Erro desconhecido ao iniciar a aplicação.";

  console.error("[FestaAI] Falha ao iniciar:", error);

  if (!rootElement) {
    return;
  }

  rootElement.innerHTML = `
    <main style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:Inter,system-ui,sans-serif;background:#f7f7f8;color:#171717;">
      <div style="max-width:520px;width:100%;background:#fff;border:1px solid #e5e5e5;border-radius:16px;padding:24px;box-shadow:0 10px 30px rgba(0,0,0,0.06);">
        <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#6366f1;">FestaAI</p>
        <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;">Não foi possível carregar a aplicação</h1>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.5;color:#525252;">
          Verifique o console do navegador (F12) para mais detalhes. Se o problema persistir, reinicie o servidor com <code>pnpm dev</code>.
        </p>
        <pre style="margin:0;padding:12px;border-radius:8px;background:#fafafa;border:1px solid #eee;font-size:12px;line-height:1.5;white-space:pre-wrap;word-break:break-word;color:#b91c1c;">${message}</pre>
      </div>
    </main>
  `;
};

void import("./bootstrap.tsx").catch(renderBootstrapError);
