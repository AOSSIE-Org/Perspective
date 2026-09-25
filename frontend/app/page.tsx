import { redirect } from "next/navigation";
import { defaultLanguage } from "@/config/languages";

export default function RootPage() {
  redirect(`/${defaultLanguage}`);
}
