import { z } from "zod";

const AccountPermissionSchema = z.object({
  userId: z.string().min(1, "User is required"),
  accountId: z.string().min(1, "Account is required"),
  canView: z.boolean().default(false),
  canEdit: z.boolean().default(false),
  canDelete: z.boolean().default(false),
});

export default AccountPermissionSchema;
