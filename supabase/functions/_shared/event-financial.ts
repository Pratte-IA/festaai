/** Saldo devedor do formulário de fechamento: total menos entrada (campo derivado). */
export const computeClosingFormValorSaldo = (valorTotal: number, valorEntrada: number) =>
  Math.max(Number(valorTotal || 0) - Number(valorEntrada || 0), 0);
