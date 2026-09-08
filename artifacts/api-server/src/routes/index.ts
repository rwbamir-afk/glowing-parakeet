import { Router, type IRouter } from "express";
import healthRouter from "./health";
import hokmRouter from "./hokm";

const router: IRouter = Router();

router.use(healthRouter);
router.use(hokmRouter);

export default router;
