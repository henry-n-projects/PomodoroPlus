import type { Prisma } from "@prisma/client";

export interface UserObject {
  id: string;
  auth_user_id: string;
  avartar: string | null;
  name: string;
  timezone: string;
  settings: Prisma.JsonValue;
}

export interface CreateSessionBody {
  start_at: string;
  end_at: string;
  break_time: number;
  completed: boolean;
  tag_id: string;
}

export interface SessionObject {
  id: string;
  user_id: string;
  start_at: string;
  end_at: string;
  break_time: number;
  completed: boolean;
  created_at: string;
  tag_id: string;
}
