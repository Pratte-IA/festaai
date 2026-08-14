import { describe, expect, it } from "vitest";

import { buildN8nChatHistoryStoredMessage } from "./agent-memory.ts";

describe("buildN8nChatHistoryStoredMessage", () => {
  it("grava IA no formato achatado que o n8n lê em kwargs.content", () => {
    const message = buildN8nChatHistoryStoredMessage("ai", "Oi, Fisio! Tudo bem?");

    expect(message).toEqual({
      additional_kwargs: {},
      content: "Oi, Fisio! Tudo bem?",
      invalid_tool_calls: [],
      response_metadata: {},
      tool_calls: [],
      type: "ai",
    });
    expect(message).not.toHaveProperty("data");
  });

  it("grava mensagem humana com content no topo", () => {
    const message = buildN8nChatHistoryStoredMessage("human", "Olá");

    expect(message).toEqual({
      additional_kwargs: {},
      content: "Olá",
      response_metadata: {},
      type: "human",
    });
    expect(message).not.toHaveProperty("data");
    expect(message).not.toHaveProperty("tool_calls");
  });
});
