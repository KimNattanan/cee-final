import { SelfWebcam } from "@/features/webcam/components/webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Webcam() {
  return (
    <div className="relative min-h-screen w-full bg-[url('/img/background_1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="flex min-h-screen w-full flex-col space-y-6 bg-gradient-to-bl from-primary via-white/60 to-primary p-4 md:p-8">
        
        <div className="relative flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between z-10">
          <Link href="/" className="order-2 sm:order-1 sm:absolute sm:left-0 z-20">
            <Button className="w-20 text-lg md:text-xl shadow-md">Back</Button>
          </Link>

          <h1 className="order-1 text-3xl font-extrabold text-amber-50/90 md:text-5xl sm:w-full sm:text-center drop-shadow-sm">
            Webcam
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-4xl overflow-hidden rounded-2xl border-4 border-white/30 bg-black/20 shadow-2xl backdrop-blur-sm">
            <div className="relative aspect-video w-full flex items-center justify-center">
              <SelfWebcam />
            </div>
          </div>
        </div>

        <div className="h-10 md:h-16" />
        
      </div>
    </div>
    
  );
}