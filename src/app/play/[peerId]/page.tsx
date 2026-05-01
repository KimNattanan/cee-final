import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PeerVideoCall } from "@/features/webcam/components/peer-video-call";

export default async function PlayPage({
  params,
}: {
  params: Promise<{ peerId: string }>;
}) {
  const { peerId } = await params;
  const decoded = decodeURIComponent(peerId);

  return (
    <div className="flex flex-col gap-4 p-4">
      <Link href="/">
        <Button variant="outline">Home</Button>
      </Link>
      <PeerVideoCall peerId={decoded} />
    </div>
  );
}
