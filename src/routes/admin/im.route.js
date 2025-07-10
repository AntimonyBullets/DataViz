import {Router} from "express";
import { adminAuth } from "../../middlewares/adminAuth.middleware.js";
import { addIndustry, deleteIndustry } from "../../controllers/admin/im.controller.js";
import { getAllIndustries } from "../../controllers/industry.controller.js";

const router = Router();
router.use(adminAuth);

router
    .route("/add")
    .post(addIndustry);

router
    .route("/fetch-all-industries")
    .get(getAllIndustries);

router
    .route("/delete/:id")
    .delete(deleteIndustry);

export default router;