import { getPdfData } from "@/lib/pdf-cache";
import { PdfResumeClient } from "@/components/pdf-resume-client";

type Props = { searchParams: Promise<{ token?: string | null }> };

export default async function PrintPreviewPage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token ?? null;

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" data-pdf-ready="error">
        <p className="text-red-600">Missing token</p>
      </div>
    );
  }

  const payload = getPdfData(token);
  if (!payload) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" data-pdf-ready="error">
        <p className="text-red-600">Expired or invalid token</p>
      </div>
    );
  }

  return <PdfResumeClient data={payload.data} templateId={payload.templateId} />;
}
