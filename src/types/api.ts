import type { Prisma } from "@prisma/client";

export interface UserObject {
  id: string;
  auth_user_id: string;
  name: string;
  avatar_url?: string | null;
  timezone: string;
  settings: Prisma.JsonValue;
}

// Client response bodys
export interface CreateUpcomingBody {
  name?: string;
  start_at: string;
  tag_id: string;
}

export interface UpdateUpcomingBody {
  name?: string;
  start_at?: string;
  end_at?: string;
  tag_id?: string;
}
