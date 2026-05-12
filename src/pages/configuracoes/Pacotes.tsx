import AdditionalsConfig from "@/components/AdditionalsConfig";
import PackagesConfig from "@/components/PackagesConfig";
import { SettingsSection } from "./settings-section";

const ConfiguracoesPacotes = () => (
  <div className="max-w-6xl space-y-14">
    <SettingsSection>
      <PackagesConfig hideHeader />
    </SettingsSection>
    <SettingsSection
      title="Adicionais"
      description="Itens extras que podem ser incluídos em qualquer pacote"
    >
      <AdditionalsConfig hideHeader />
    </SettingsSection>
  </div>
);

export default ConfiguracoesPacotes;
