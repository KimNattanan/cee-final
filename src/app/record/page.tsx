import { SelfWebcam } from "@/features/hand/components/record-webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Record() {
  return (
    <div className="relative min-h-screen w-full bg-[url('/img/background_1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat overflow-x-hidden">
      <div className="flex min-h-screen w-full flex-col space-y-6 bg-gradient-to-bl from-red-700/50 via-fuchsia-500/50 to-sky-700/50 p-4 text-cyan-50 md:p-10">
        
        <div className="relative flex w-full flex-col items-center justify-center gap-4 sm:flex-row sm:justify-between z-10">
          <Link href="/" className="order-2 sm:order-1 sm:absolute sm:left-0 z-20">
            <Button className="w-20 text-lg md:text-xl shadow-lg border border-white/20">Back</Button>
          </Link>

          <h1 className="order-1 text-3xl font-extrabold text-amber-50/90 md:text-5xl sm:w-full sm:text-center drop-shadow-md">
            Record
          </h1>
        </div>

        <div className="flex flex-1 items-center justify-center rounded-3xl bg-primary/40 backdrop-blur-sm border border-white/10 shadow-2xl overflow-hidden p-2 sm:p-6">
          <div className="w-full max-w-5xl">
            <SelfWebcam />
          </div>
        </div>
      </div>
    </div>
  );
}