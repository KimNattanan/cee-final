export interface RegisterUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface RegisterUserResponse {
  userId: string;
  username: string;
  email: string;
}