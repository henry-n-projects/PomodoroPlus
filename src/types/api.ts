import type { Prisma } from "@prisma/client";
import type { SessionStatus } from "@prisma/client";

export interface UserObject {
  id: string;
  auth_user_id: string;
  avartar: string | null;
  name: string;
  timezone: string;
  settings: Prisma.JsonValue;
}

//todo: match it to prisma model
export interface CreateSessionBody {
  name: string;
  start_at: string;
  end_at: string;
  break_time: number;
  status: SessionStatus;
  tag_id: string;
}

export interface SessionObject {
  id: string;
  user_id: string;
  name: string | null;
  start_at: string;
  end_at: string;
  break_time: number;
  status: SessionStatus;
  created_at: string;
  tag_id: string;
}
