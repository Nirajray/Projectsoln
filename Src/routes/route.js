const express = require('express');
const router = express.Router();
const authorController= require("../controller/authorController")
const blogController= require("../controller/blogController")
const mid= require("../Middleware/allMiddleware")


router.post("/authors",authorController.registerAuthor)
router.post("/blogs",mid.authorAuth, blogController.createBlog)
router.get("/blogs",mid.authorAuth,blogController.listBlog)
router.put("/blogs/:blogId",mid.authorAuth,blogController.updateBlog)
router.delete("/blogs/:blogId",mid.authorAuth, blogController.deleteBlodbyId)
router.delete("/blogs", mid.authorAuth, blogController.deleteBlodByParams)
router.post("/login", authorController.loginAuthor)


module.exports = router;