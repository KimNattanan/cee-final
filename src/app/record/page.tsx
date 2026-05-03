import { SelfWebcam } from "@/features/hand/components/record-webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Record() {
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