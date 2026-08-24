interface Role {
  id: number;
  title: string;
  description: string;
  isActive: boolean;
  isDeleted: boolean;
  roleType: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  data: {
    data: Role[]; // Array of roles
    total: number;
    limit: number;
    page: number;
    totalPages: number;
  };
  success: boolean;
  msg: string;
}
