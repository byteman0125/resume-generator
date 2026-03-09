import { redirect } from "next/navigation";

/** Templates list is now at /template/[formatId]. Redirect to the default format. */
export default function TemplatesPage() {
  redirect("/template/format1");
}
