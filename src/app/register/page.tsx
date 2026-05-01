import { Button } from "@/components/ui/button";
import { RegisterForm } from "@/features/auth/components/register-form";
import Link from "next/link";

export default function Register() {
  return (
    <div>
      <h1>Register</h1>
      <div>
        <Link href="/">
          <Button>Back</Button>
        </Link>
        <RegisterForm />
      </div>
    </div>
  );
}
