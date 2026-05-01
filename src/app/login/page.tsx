import { Button } from "@/components/ui/button";
import { LoginForm } from "@/features/auth/components/login-form";
import Link from "next/link";

export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <div>
        <Link href="/">
          <Button>Back</Button>
        </Link>
        <LoginForm />
      </div>
    </div>
  );
}
