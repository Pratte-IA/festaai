import { ContractModuleGate } from "@/components/contracts/ContractModuleGate";
import { FormConfigurationPage } from "@/components/formulario-contratacao/FormConfigurationPage";

const ConfiguracoesFormularioContratacao = () => (
  <ContractModuleGate>
    <FormConfigurationPage />
  </ContractModuleGate>
);

export default ConfiguracoesFormularioContratacao;
