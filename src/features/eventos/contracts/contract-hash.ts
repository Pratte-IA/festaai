export const hashContractContent = async (content: string): Promise<string> => {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(hashBuffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const formatContractHashShort = (hash: string): string =>
  hash.length >= 16 ? `${hash.slice(0, 8)}…${hash.slice(-8)}` : hash;
