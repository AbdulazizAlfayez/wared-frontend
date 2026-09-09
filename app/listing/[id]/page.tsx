import { redirect } from "next/navigation";

export default async function ListingRedirect({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/car/${id}`);
}
