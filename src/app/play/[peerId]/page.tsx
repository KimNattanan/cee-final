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
    <div className="w-screen min-h-screen bg-[url('/img/background_1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="w-full min-h-screen flex flex-col gap-4 p-4">
        <Link href="/">
          <Button variant="outline">Home</Button>
        </Link>
        <div className="flex-1 min-h-0 flex justify-center bg-amber-50/90 rounded-2xl overflow-hidden">
          <PeerVideoCall peerId={decoded} />
        </div>
      </div>
    </div>
  );
}
