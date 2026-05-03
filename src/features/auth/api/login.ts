import { api } from "@/lib/api-client";
import { LoginUserRequest } from "../types/users";
import { ApiResponse } from "@/types/api";

export type LoginUserFormData = {
  email: string;
  password: string;
}

export const loginUser = async (data: LoginUserFormData) => {
  const req: LoginUserRequest = {
    email: data.email,
    password: data.password,
  }
  const response = await api.post<ApiResponse<undefined>>("/auth/login", req);
  return response;
};