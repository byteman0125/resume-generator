import { getProfile } from "@/lib/db";
import type { ResumeData } from "@/lib/resume-store";
import { PdfResumeClient } from "@/components/pdf-resume-client";

type Props = { params: Promise<{ profileId: string }> };

export default async function PrintProfilePage({ params }: Props) {
  const { profileId } = await params;
  const row = getProfile(profileId);
  if (!row) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" data-pdf-ready="error">
        <p className="text-red-600">Profile not found</p>
      </div>
    );
  }
  let data: ResumeData;
  try {
    data = JSON.parse(row.data) as ResumeData;
  } catch {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" data-pdf-ready="error">
        <p className="text-red-600">Invalid profile data</p>
      </div>
    );
  }

  return <PdfResumeClient data={data} />;
}


