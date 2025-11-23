import type { Prisma } from "@prisma/client";
import type { SessionStatus } from "@prisma/client";

export interface UserObject {
  id: string;
  auth_user_id: string;
  name: string;
  avatar_url?: string | null;
  timezone: string;
  settings: Prisma.JsonValue;
}

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

export interface TagObject {
  id: string;
  name: string;
  created_at: Date;
  user_id: string;
  color: string;
}
