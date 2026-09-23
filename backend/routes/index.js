import express from "express";

import AuthRoute from "./AuthRoute.js";
import InventoryRoute from "./InventoryRoute.js";
import InboundRoute from "./InboundRoute.js";
import DashboardRoute from "./DashboardRoute.js";
import OperationsRoute from "./OperationsRoute.js";
import PeopleRoute from "./PeopleRoute.js";

const router = express.Router();

router.use(AuthRoute);
router.use(InventoryRoute);
router.use(InboundRoute);
router.use(DashboardRoute);
router.use(OperationsRoute);
router.use(PeopleRoute);
export default router;