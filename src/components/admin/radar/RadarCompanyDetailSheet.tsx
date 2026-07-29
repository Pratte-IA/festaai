import { RadarCompanyDetailContent } from "@/components/admin/radar/RadarCompanyDetailContent";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface RadarCompanyDetailSheetProps {
  companyId: number | null;
  onClose: () => void;
  open: boolean;
}

export const RadarCompanyDetailSheet = ({ companyId, onClose, open }: RadarCompanyDetailSheetProps) => (
  <Sheet onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
    <SheetContent className="w-full overflow-y-auto sm:max-w-2xl lg:max-w-4xl">
      {companyId != null ? <RadarCompanyDetailContent companyId={companyId} /> : null}
    </SheetContent>
  </Sheet>
);
