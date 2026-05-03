import { api } from "@/lib/api-client";
import { ApiResponse } from "@/types/api";
import { PatchHandData } from "../types/hand";

export const updateHand = async (data: PatchHandData) => {
  const response = await api.patch<ApiResponse<undefined>>(`/hand/${data.id}`, data);
  return response;
}