import { Button } from "@/components/ui/button";

export const LoginForm = () => {
  return (
    <div>
      <h1>Login Form</h1>
      <form>
        <div>
          <label htmlFor="email">Email</label>
          <input type="email" id="email" placeholder="Email" />
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input type="password" id="password" placeholder="Password" />
        </div>
        <Button type="submit">Login</Button>
      </form>
    </div>
  );
};
