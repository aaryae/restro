// Define the structure of a single user
interface User {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  imageUrl: string | null;
  gender: string;
  addedBy: number | null;
  isActive: boolean;
  mobileNo: string;
  mobilePrefix: string;
  otp: string | null;
  roleId: number;
  loginAttemptsCount: number;
  updatedBy: number | null;
  isDeleted: boolean;
  deletedAt: string | null;
  supervisorId: number | null;
  createdAt: string;
  updatedAt: string;
}

// Define the structure for the "data" object
interface Data {
  data: User[]; // Array of User objects
  total: number;
  limit: number;
  page: number;
  totalPages: number;
}

// Define the structure for the API response
export interface ApiResponse {
  success: boolean;
  data: Data; // The Data object containing users and pagination
  msg: string; // The message string
}

export interface GetAllUserRequestType {
  limit: number;
  page: number;
  username?: string;
}
