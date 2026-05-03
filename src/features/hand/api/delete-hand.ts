import { api } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";

export const deleteHand = async (id: string) => {
  const response = await api.delete<ApiResponse<undefined>>(`/hand/${id}`);
  return response;
}