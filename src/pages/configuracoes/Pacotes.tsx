import PackagesConfig from "@/components/PackagesConfig";
import { SettingsSection } from "./settings-section";

const ConfiguracoesPacotes = () => (
  <div className="max-w-6xl">
    <SettingsSection>
      <PackagesConfig hideHeader />
    </SettingsSection>
  </div>
);

export default ConfiguracoesPacotes;
