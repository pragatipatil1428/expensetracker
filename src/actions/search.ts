"use server";

import { requireUserId } from "@/lib/auth-helpers";
import { globalSearch } from "@/lib/queries";
import type { ActionResult, SearchResults } from "@/lib/types";

export async function searchAction(query: string): Promise<ActionResult<SearchResults>> {
  const userId = await requireUserId();
  const results = await globalSearch(userId, query);
  return { success: true, data: results };
}
