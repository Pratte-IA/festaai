import { compareIsoDateToToday } from "@/lib/date";

import { Evento } from "./types";

/** Festas passadas primeiro (mais recentes no topo), depois futuras pela data mais próxima. */
export const sortEventosByPartyDateExecutionOrder = (events: Evento[]): Evento[] =>
  [...events].sort((left, right) => {
    const leftDate = left.data_evento?.trim() ?? null;
    const rightDate = right.data_evento?.trim() ?? null;

    if (!leftDate && !rightDate) {
      return right.created_at.localeCompare(left.created_at);
    }
    if (!leftDate) return 1;
    if (!rightDate) return -1;

    const leftDiff = compareIsoDateToToday(leftDate);
    const rightDiff = compareIsoDateToToday(rightDate);

    if (leftDiff === null && rightDiff === null) {
      return leftDate.localeCompare(rightDate);
    }
    if (leftDiff === null) return 1;
    if (rightDiff === null) return -1;

    const leftIsPast = leftDiff < 0;
    const rightIsPast = rightDiff < 0;

    if (leftIsPast !== rightIsPast) {
      return leftIsPast ? -1 : 1;
    }

    if (leftIsPast) {
      return rightDate.localeCompare(leftDate);
    }

    return leftDate.localeCompare(rightDate);
  });
