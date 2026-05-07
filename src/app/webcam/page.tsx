import { SelfWebcam } from "@/features/webcam/components/webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Webcam() {
  return (
    <div className="w-screen min-h-screen bg-[url('/img/background_1.jpg')] bg-cover bg-fixed bg-center bg-no-repeat">
      <div className="w-screen min-h-screen space-y-5 bg-linear-to-bl from-primary via-white/60 to-primary flex flex-col">
        <div className="w-screen p-5">
          <h1 className="text-amber-50/90 text-4xl font-extrabold justify-self-center">Webcam</h1>
          <Link href="/">
            <Button className="justify-self-start w-20 text-xl">Back</Button>
          </Link>
        </div>
        <div className="justify-items-center">
          <SelfWebcam />
        </div>
      </div>
    </div>
    
  );
}