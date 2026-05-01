import { api } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export const logoutUser = async () => {
  const response = await api.post<ApiResponse<void>>("/auth/logout");
  return response;
};