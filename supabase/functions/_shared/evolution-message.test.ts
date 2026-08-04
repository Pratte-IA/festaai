import { describe, expect, it } from "vitest";

import {
  extractReplyTo,
  parseEvolutionMessages,
} from "./evolution-message.ts";
import {
  buildLogPayload,
  buildN8nInboundPayload,
  N8N_INBOUND_PAYLOAD_VERSION,
} from "./n8n-client.ts";

const baseKey = {
  fromMe: false,
  id: "3A3153A7C56A711E703A",
  remoteJid: "554884300209@s.whatsapp.net",
};

const connection = {
  id: 1,
  instance_name: "festaai-vila-encantada-1781746380080-711495",
  name: "WhatsApp Principal",
  phone: "4891664516",
};

const tenant = { id: 2, slug: "vila-encantada" };

describe("evolution-message replyTo", () => {
  it("cenário 1 — texto comum: replyTo é null e text permanece igual", () => {
    const [message] = parseEvolutionMessages({
      data: {
        key: baseKey,
        message: { conversation: "Olá, bom dia!" },
        messageTimestamp: 1722124635,
        pushName: "Millena",
      },
      event: "messages.upsert",
    });

    expect(message.text).toBe("Olá, bom dia!");
    expect(message.type).toBe("text");
    expect(message.replyTo).toBeNull();

    const payload = buildN8nInboundPayload({
      connection,
      event: "messages.upsert",
      message: {
        customerName: message.customerName,
        customerPhone: message.customerPhone as string,
        fromMe: message.fromMe,
        id: message.id,
        mediaBase64: message.mediaBase64,
        mediaMimetype: message.mediaMimetype,
        replyTo: message.replyTo,
        text: message.text as string,
        timestamp: message.timestamp,
        type: message.type,
      },
      tenant,
    });

    expect(payload.version).toBe(N8N_INBOUND_PAYLOAD_VERSION);
    expect(payload.message.replyTo).toBeNull();
    expect(payload.message.text).toBe("Olá, bom dia!");
  });

  it("cenário 2 — resposta a texto: replyTo.id/text/type preenchidos", () => {
    const quotedText =
      "🎡 Pacote Roda Gigante 🍽️ Buffet delicioso, decoração personalizada...";

    const [message] = parseEvolutionMessages({
      data: {
        key: baseKey,
        message: {
          extendedTextMessage: {
            contextInfo: {
              participant: "554891664516@s.whatsapp.net",
              quotedMessage: {
                conversation: quotedText,
              },
              stanzaId: "BAE5QUOTEDID123",
            },
            text: "Gostaria de saber mais dessa opção",
          },
        },
        messageTimestamp: 1722124635,
        pushName: "Millena",
      },
      event: "messages.upsert",
    });

    expect(message.text).toBe("Gostaria de saber mais dessa opção");
    expect(message.replyTo).toEqual({
      id: "BAE5QUOTEDID123",
      text: quotedText,
      type: "conversation",
      participant: "554891664516@s.whatsapp.net",
    });
  });

  it("cenário 3 — resposta a imagem com legenda", () => {
    const [message] = parseEvolutionMessages({
      data: {
        key: baseKey,
        message: {
          extendedTextMessage: {
            contextInfo: {
              quotedMessage: {
                imageMessage: {
                  caption: "Foto do salão principal",
                  mimetype: "image/jpeg",
                },
              },
              stanzaId: "IMGQUOTE001",
            },
            text: "Esse espaço cabe quantas pessoas?",
          },
        },
        pushName: "Millena",
      },
      event: "messages.upsert",
    });

    expect(message.replyTo?.id).toBe("IMGQUOTE001");
    expect(message.replyTo?.text).toBe("Foto do salão principal");
    expect(message.replyTo?.type).toBe("imageMessage");
  });

  it("cenário 4 — resposta a vídeo ou documento com legenda", () => {
    const videoReply = parseEvolutionMessages({
      data: {
        key: baseKey,
        message: {
          extendedTextMessage: {
            contextInfo: {
              quotedMessage: {
                videoMessage: {
                  caption: "Tour do parque",
                  mimetype: "video/mp4",
                },
              },
              stanzaId: "VIDQUOTE001",
            },
            text: "Adorei o vídeo",
          },
        },
      },
      event: "messages.upsert",
    })[0];

    expect(videoReply.replyTo?.text).toBe("Tour do parque");
    expect(videoReply.replyTo?.type).toBe("videoMessage");

    const docReply = parseEvolutionMessages({
      data: {
        key: baseKey,
        message: {
          conversation: "Pode enviar o contrato?",
        },
      },
      event: "messages.upsert",
    })[0];

    // Documento citado via reply em imagem inbound com contextInfo no imageMessage
    const docQuoted = extractReplyTo({
      imageMessage: {
        caption: "Ok",
        contextInfo: {
          quotedMessage: {
            documentMessage: {
              caption: "Contrato v1.pdf",
              mimetype: "application/pdf",
            },
          },
          stanzaId: "DOCQUOTE001",
        },
      },
    });

    expect(docQuoted?.text).toBe("Contrato v1.pdf");
    expect(docQuoted?.type).toBe("documentMessage");
    expect(docReply.replyTo).toBeNull();
  });

  it("cenário 5 — stanzaId sem quotedMessage: replyTo existe com text null", () => {
    const [message] = parseEvolutionMessages({
      data: {
        key: baseKey,
        message: {
          extendedTextMessage: {
            contextInfo: {
              stanzaId: "ONLYSTANZA999",
            },
            text: "Sim",
          },
        },
      },
      event: "messages.upsert",
    });

    expect(message.replyTo).toEqual({
      id: "ONLYSTANZA999",
      text: null,
      type: null,
      participant: null,
    });
  });

  it("cenário 6 — estrutura desconhecida/incompleta não quebra o parse", () => {
    expect(() =>
      parseEvolutionMessages({
        data: {
          key: baseKey,
          message: {
            weirdFutureMessage: {
              foo: "bar",
            },
          },
        },
        event: "messages.upsert",
      }),
    ).not.toThrow();

    const incomplete = extractReplyTo({
      extendedTextMessage: {
        contextInfo: {
          quotedMessage: {},
          stanzaId: "EMPTYQUOTE",
        },
        text: "ok",
      },
    });

    expect(incomplete).toEqual({
      id: "EMPTYQUOTE",
      text: null,
      type: null,
      participant: null,
    });

    expect(extractReplyTo(null)).toBeNull();
    expect(extractReplyTo(undefined)).toBeNull();
    expect(extractReplyTo({})).toBeNull();
  });

  it("cenário 7 — mídia/base64 intacta e não duplicada em replyTo", () => {
    const mediaBase64 = "aGVsbG8=";
    const [message] = parseEvolutionMessages({
      data: {
        base64: mediaBase64,
        key: baseKey,
        message: {
          imageMessage: {
            caption: "Minha foto",
            contextInfo: {
              quotedMessage: {
                extendedTextMessage: {
                  text: "Manda uma foto do bolo",
                },
              },
              stanzaId: "MEDIAQUOTE001",
            },
            mimetype: "image/jpeg",
          },
        },
        pushName: "Millena",
      },
      event: "messages.upsert",
    });

    expect(message.type).toBe("image");
    expect(message.mediaBase64).toBe(mediaBase64);
    expect(message.mediaMimetype).toBe("image/jpeg");
    expect(message.text).toBe("Minha foto");
    expect(message.replyTo).toEqual({
      id: "MEDIAQUOTE001",
      text: "Manda uma foto do bolo",
      type: "extendedTextMessage",
      participant: null,
    });
    expect(JSON.stringify(message.replyTo)).not.toContain(mediaBase64);

    const payload = buildN8nInboundPayload({
      connection,
      event: "messages.upsert",
      message: {
        customerName: message.customerName,
        customerPhone: message.customerPhone as string,
        fromMe: message.fromMe,
        id: message.id,
        mediaBase64: message.mediaBase64,
        mediaMimetype: message.mediaMimetype,
        replyTo: message.replyTo,
        text: message.text as string,
        timestamp: message.timestamp,
        type: message.type,
      },
      tenant,
    });

    expect(payload.message.mediaBase64).toBe(mediaBase64);
    expect(JSON.stringify(payload.message.replyTo)).not.toContain(mediaBase64);

    const logPayload = buildLogPayload(payload);
    expect(logPayload.message.hasReplyTo).toBe(true);
    expect(logPayload.message.replyToId).toBe("MEDIAQUOTE001");
    expect(logPayload.message.hasMediaBase64).toBe(true);
    expect(JSON.stringify(logPayload)).not.toContain(mediaBase64);
  });

  it("extrai replyTo quando contextInfo vem no nível do entry (Evolution findMessages/webhook)", () => {
    const [message] = parseEvolutionMessages({
      data: {
        contextInfo: {
          participant: "110535697821824@lid",
          quotedMessage: {
            conversation:
              "🎡 *Pacote Roda Gigante*  🍽️ Buffet delicioso, decoração personalizada.",
          },
          stanzaId: "3EB043F196E3F9E7B721B9",
        },
        key: {
          fromMe: false,
          id: "3A3153A7C56A711E703A",
          remoteJid: "8671639674960@lid",
          remoteJidAlt: "554884300209@s.whatsapp.net",
        },
        message: {
          conversation: "Gostaria de saber mais dessa opção",
        },
        messageTimestamp: 1785191835,
        pushName: "Millena",
      },
      event: "messages.upsert",
    });

    expect(message.text).toBe("Gostaria de saber mais dessa opção");
    expect(message.customerPhone).toBe("554884300209");
    expect(message.replyTo).toEqual({
      id: "3EB043F196E3F9E7B721B9",
      text: "🎡 *Pacote Roda Gigante*  🍽️ Buffet delicioso, decoração personalizada.",
      type: "conversation",
      participant: "110535697821824@lid",
    });
  });

  it("extrai replyTo também de conversation com contextInfo no wrapper ephemeral", () => {
    const replyTo = extractReplyTo({
      ephemeralMessage: {
        message: {
          extendedTextMessage: {
            contextInfo: {
              participant: "554891664516@s.whatsapp.net",
              quotedMessage: {
                extendedTextMessage: {
                  text: "Pacote Premium",
                },
              },
              stanzaId: "EPH001",
            },
            text: "Quero esse",
          },
        },
      },
    });

    expect(replyTo).toEqual({
      id: "EPH001",
      text: "Pacote Premium",
      type: "extendedTextMessage",
      participant: "554891664516@s.whatsapp.net",
    });
  });
});
