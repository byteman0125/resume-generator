import { redirect } from "next/navigation";

/** Editor is deprecated; all editing (including style) happens on the template page. */
export default function EditorPage() {
  redirect("/template/format1");
}
