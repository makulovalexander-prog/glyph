import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { toDesign } from "@/lib/mappers";
import { EditorClient } from "./EditorClient";

export const dynamic = "force-dynamic";

// Optional ?id=<designId> opens an existing design (owned by the user).
export default async function EditorPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const { id } = await searchParams;
  let initial = null;
  if (id) {
    const session = await auth();
    const row = await prisma.design.findUnique({ where: { id } });
    if (row && session?.user?.id === row.ownerId) initial = toDesign(row);
  }
  return <EditorClient initial={initial} />;
}
