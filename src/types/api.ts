import type { Prisma } from "@prisma/client";

export interface UserObject {
  id: string;
  auth_user_id: string;
  avartar: string | null;
  name: string;
  timezone: string;
  settings: Prisma.JsonValue;
}
