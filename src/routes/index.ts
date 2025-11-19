import { Router, type Request, type Response } from "express";
import authRoutes from "./auth_routes.js";
import sessionRoutes from "./session_routes.js";
const router = Router();

router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

router.use("/auth", authRoutes);
router.use("/sessions", sessionRoutes);
export default router;
