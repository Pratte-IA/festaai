import { Navigate, useSearchParams } from "react-router-dom";

const FinanceiroLancamentos = () => {
  const [searchParams] = useSearchParams();
  const tab = searchParams.get("tab") ?? "entradas";

  return <Navigate to={`/financeiro?tab=${tab}`} replace />;
};

export default FinanceiroLancamentos;
