import { SelfWebcam } from "@/features/webcam/components/webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Webcam() {
  return (
    <div>
      <h1>Webcam</h1>
      <Link href="/">
        <Button>Back</Button>
      </Link>
      <SelfWebcam />
    </div>
  );
}