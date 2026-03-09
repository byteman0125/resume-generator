/** DOM id for the resume element used for PDF export (single element per page). */
export const RESUME_PREVIEW_ID = "resume-preview-content";

export async function downloadResumeAsPdf(elementId: string, filename = "resume.pdf") {
  if (typeof document === "undefined") return;
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error("Resume element not found");
  }

  const html2pdf = (await import("html2pdf.js")).default;

  // Let the rendered resume (ResumePreview) control page margins via its own padding,
  // so the on-screen preview matches the exported PDF 1:1. We therefore set external
  // PDF margins to 0 and rely entirely on the DOM layout.
  const opt = {
    margin: 0,
    filename,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "letter", orientation: "portrait" },
    // Split at letter size (279mm); avoid-all would prevent flow and cause bad splits
    pagebreak: { mode: ["css", "legacy"], before: ".page-break-before", after: ".page-break-after" },
  };

  await html2pdf().set(opt).from(element).save();
}
