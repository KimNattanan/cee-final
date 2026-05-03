import { SelfWebcam } from "@/features/webcam/components/webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Webcam() {
  return (
    <div className="w-screen h-screen space-y-5 bg-orange-200 flex flex-col">
      <div className="w-screen p-5">
        <h1 className="text-fuchsia-700 text-4xl font-extrabold justify-self-center">Webcam</h1>
        <Link href="/">
          <Button>Back</Button>
        </Link>
      </div>
      <div className="justify-items-center">
        <SelfWebcam />
      </div>
    </div>
  );
}