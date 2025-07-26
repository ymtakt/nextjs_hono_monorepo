import type { AppType } from "backend/src";
import { hc } from "hono/client";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export const apiClient = hc<AppType>(API_URL);
