"use client";

import { useState } from "react";
import { logoutUser } from "../api/logout";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const LogoutButton = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const handleLogout = async () => {
    setLoading(true);
    try {
      const response = await logoutUser();
      toast.success(response.message);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "An unknown error occurred",
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant={"plant"} onClick={handleLogout} disabled={loading}>
      {loading ? "Logging out..." : "Logout"}
    </Button>
  );
};
