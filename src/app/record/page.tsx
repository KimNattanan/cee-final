import { SelfWebcam } from "@/features/hand/components/record-webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Record() {
  return (
    <div className="w-screen min-h-screen bg-[url('/img/background_1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="w-screen min-h-screen space-y-5 bg-linear-to-bl from-red-700/50 via-fuchsia-500/50 to-sky-700/50 text-cyan-50 text-3xl flex flex-col">
        <div className="w-screen p-5">
          <h1 className="text-amber-50/90 text-4xl font-extrabold justify-self-center">Webcam</h1>
          <Link href="/">
            <Button className="justify-self-start w-20 text-xl">Back</Button>
          </Link>
        </div>
        <div className="items-center justify-center bg-primary/60 min-h-screen">
          <SelfWebcam />
        </div>
      </div>
    </div>
  );
}