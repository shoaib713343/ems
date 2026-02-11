import { Router } from "express";
import { validate } from "../../middlewares/validate";
import { loginSchema, refreshSchema, registerSchema } from "./user.schema";
import { asyncHandler } from "../../utils/asyncHandler";
import { getMeController, loginController, logoutController, refreshTokenController, registerController } from "./user.controller";
import { protect } from "../../middlewares/auth.middleware";

const router = Router();

router.post(
    "/register",
    validate(registerSchema),
    asyncHandler(registerController)
)

router.post("/login", validate(loginSchema), asyncHandler(loginController));

router.get(

    "/me",
    protect,
    getMeController
)

router.post(
    "/refresh",
    validate(refreshSchema),
    asyncHandler(refreshTokenController)
);

router.post("/logout", protect,  asyncHandler(logoutController))

export default router;