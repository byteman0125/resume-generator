import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProfileForm } from "@/components/profile-form";
import type { ResumeData } from "@/lib/resume-store";

interface ProfileEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ResumeData;
  onSave: (data: ResumeData) => void;
}

export function ProfileEditModal({
  open,
  onOpenChange,
  data,
  onSave,
}: ProfileEditModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden p-0 gap-0 border rounded-lg shadow-xl">
        <DialogHeader className="flex-shrink-0 px-6 pt-6 pb-4 border-b bg-muted/30">
          <DialogTitle className="text-lg font-semibold">Edit profile</DialogTitle>
          <p className="text-sm text-muted-foreground mt-0.5">Update contact info, career, and education.</p>
        </DialogHeader>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
          <ProfileForm
            data={data}
            onChange={onSave}
            sections={["profile", "experience", "education"]}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
