import express from "express";
import { createItem, getItems, updateItem, deleteItem, matchItems } from "../controllers/itemController.js";
import { upload } from "../middleware/upload.js";

const router = express.Router();

router.post("/", upload.single("image"), createItem);
router.get("/", getItems);
router.put("/:id", updateItem);
router.delete("/:id", deleteItem);
router.get("/match/:id", matchItems);

export default router;