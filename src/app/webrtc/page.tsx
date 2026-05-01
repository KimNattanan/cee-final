import { DualWebcam } from "@/features/webcam/components/webcam";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function WebRTC() {
  return (
    <div>
      <Link href="/">
        <Button>Back</Button>
      </Link>
      <DualWebcam />
    </div>
  );
}