export interface UnitRequestScope {
  scope: "all" | "one";
  unitId: number | null;
}

let unitRequest: UnitRequestScope = { scope: "one", unitId: null };

export const syncUnitRequest = (next: UnitRequestScope) => {
  unitRequest = next;
};

export const getUnitRequest = () => unitRequest;

export const applyUnitRequestHeaders = (headers: Headers) => {
  if (unitRequest.unitId != null) {
    headers.set("x-festaai-unit-id", String(unitRequest.unitId));
  } else {
    headers.delete("x-festaai-unit-id");
  }

  headers.set("x-festaai-unit-scope", unitRequest.scope);
};
