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

export interface LoginUserRequest {
  email: string;
  password: string;
}

export interface UserResponse {
  userId: string;
  email: string;
  username: string;
}