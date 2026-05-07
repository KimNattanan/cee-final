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
    <div className="relative min-h-screen w-full bg-[url('/img/background_1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      
      <div className="grid grid-rows-[auto_1fr] min-h-screen w-full gap-4 p-4 md:p-6 lg:p-8">
        
        <div className="z-10 flex w-full justify-start">
          <Link href="/">
            <Button variant="outline" className="bg-white/20 backdrop-blur-sm hover:bg-white/40">
              Home
            </Button>
          </Link>
        </div>

        <div className="relative w-full h-full flex flex-col bg-amber-50/90 rounded-2xl shadow-2xl border border-white/20">
          <div className="w-full flex-1">
            <PeerVideoCall peerId={decoded} />
          </div>
        </div>

      </div>
    </div>
  );
}
