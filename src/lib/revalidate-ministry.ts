import "server-only";
import { revalidatePath } from "next/cache";

/** Refresh operational views after a ministry record changes. */
export function revalidateMinistry() {
  revalidatePath("/(app)", "layout");
}
