import { ApiResponse } from "@/types/api";
import { api } from "./api-client";
import { UserResponse } from "@/features/auth/types/users";
import { toast } from "sonner";

export async function getUser(): Promise<UserResponse | null> {
  try {
    const response = await api.get<ApiResponse<UserResponse>>('/users');
    return response.data;
  } catch (error) {
    toast.error('Failed to fetch user');
    return null;
  }
}