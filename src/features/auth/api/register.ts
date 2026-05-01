import { api } from "@/lib/api-client";
import { RegisterUserRequest, RegisterUserResponse } from "../types/users";
import { ApiResponse } from "@/types/api";

export type RegisterUserFormData = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export const registerUser = async (data: RegisterUserFormData) => {
  console.log(data,"!!");
  if (data.password !== data.confirmPassword) {
    throw new Error("Passwords do not match");
  }
  const req: RegisterUserRequest = {
    username: data.username,
    email: data.email,
    password: data.password,
  }
  const response = await api.post<ApiResponse<RegisterUserResponse>>("/auth/register", req);
  return response;
};