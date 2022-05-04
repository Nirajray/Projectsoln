const { request } = require("express")
const { default: mongoose} = require("mongoose")
const authorModel = require("../Model/authorModel")
const blogModel = require("../Model/blogModel")

const isValid = function (value) {
    if (typeof value === 'undefined' || value === null) return false
    if (typeof value === 'string' && value.trim().length === 0) return false
    return true;
}

const isValidRequestBody = function (requestBody) {
    return Object.keys(requestBody).length > 0
}

const isValidObjectId = function (ObjectId) {
    return mongoose.Types.ObjectId.isValid(ObjectId)
}

const createBlog = async function (req, res) {
    try {
        const requestBody = req.body;
        if (!isValidRequestBody(requestBody)) {
            res.status(400).send({ status: false, message: "Invalid request parameters. Please provide blog details" })
            return
        }

        const { title, body, authorId, tags, category, subcategory, isPublished } = requestBody

        if (!isValid(title)) {
            res.status(400).send({ status: false, message: "Blog title is required" })
            return
        }

        if (!isValid(body)) {
            res.status(400).send({ status: false, message: "Blog body is required" })
            return
        }
        if (!isValid(authorId)) {
            res.status(400).send({ status: false, message: "AuthorId is required" })
            return
        }
        if (!isValidObjectId(authorId)) {
            res.status(400).send({ status: false, message: "${authorId} is not a valid authorId" })
            return
        }
        if (!isValid(category)) {
            res.status(400).send({ status: false, message: "Blog category is required" })
            return
        }

        const author = await authorModel.findById(authorId);

        if (!author) {
            res.status(400).send({ status: false, message: "Author does not exist" })
        }

        const blogData ={
            title,
            body,
            authorId,
            category,
            isPublished: isPublished ? isPublished : false,
            publishedAt: isPublished ? new Date() : null
        }

        if (tags) {
            if (Array.isArray(tags)) {
                blogData['tags'] = [...tags]
            }
            if (Object.prototype.toString.call(tags) === "[object String]") {
                blogData['tags'] = [tags]
            }

        }

        if (subcategory) {
            if (Array.isArray(subcategory)) {
                blogData['subcategory'] = [...subcategory]
            }

            if (Object.prototype.toString.call(subcategory) === "[object String]") {
                blogData['subcategory'] = [subcategory]
            }
        }

        const newBlog = await blogModel.create(blogData)
        res.status(201).send({ status: true, message: "New blog created succesfully", data: newBlog })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

const listBlog = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false, delatedAt: null, isPublished: true }
        const queryparams = req.query

        if (isValidRequestBody(queryparams)) {
            const { authorId, category, tags, subcategory } = queryparams
            if (isValid(authorId) && isValidObjectId(authorId)) {
                filterQuery['authorId'] = authorId

            }

            if (isValid(category)) {
                filterQuery['category'] = category.trim()
            }
            if (isValid(tags)) {
                const tagsArr = tags.trim().split(',').map((tag) => tag.trim());
                filterQuery['tags'] = { $all: tagsArr }
            }

            if (isValid(subcategory)) {
                const subcatArr = subcategory.trim().split(',').map((subcat) => subcat.trim());
                filterQuery['subcategory'] = { $all: subcatArr }
            }
        }

        const blogs = await blogModel.find(filterQuery)

        if (Array.isArray(blogs) && blogs.length === 0) {
            res.status(404).send({ status: false, message: "No blogs found" })
            return
        }

        res.status(200).send({ status: true, message: "Blog list", data: blogs })
    }

    catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

const updateBlog = async function (req, res) {
    try {
        const requestBody = req.body
        const params = req.params
        const blogId = params.blogId
       const authorIdFromToken = req.authorId

        if (!isValidObjectId(blogId)) {
            res.status(400).send({ status: false, message: "${blogId} is not valid blog id" })
            return
        }

        if (!isValidObjectId(authorIdFromToken)) {
            res.status(400).send({ status: false, message: "${authorIdFromToken} is not valid token id" })
            return
        }

        const blog = await blogModel.findOne({ _id: blogId, isDeleted: false, deletedAt: null })
        if (!blog) {
            res.status(404).send({ status: false, message: "blog not found" })
            return
        }

        if (blog.authorId.toString() !== authorIdFromToken) {
            res.status(401).send({ status: false, message: "Unauthorized access owner info does not match" })
            return
        }

        if (!isValidRequestBody(requestBody)) {
            res.status(200).send({ status: true, message: "No aparameters passed blog unmodified", data: blog })
        }

        const { title, body, tags, category, subcategory, isPublished } = requestBody
        const updateBlogData = {}
        if (!isValid(title)) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['title'] = title
        }

        if (!isValid(body)) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['body'] = body
        }

        if (!isValid(category)) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['category'] = category
        }

        if (isPublished !== undefined) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$set')) updateBlogData['$set'] = {}
            updateBlogData['$set']['isPublished'] = isPublished
            updateBlogData['$set']['isPublished'] = isPublished ? new Date() : null
        }


        if (tags) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$addToSet')) updateBlogData['$addToSet'] = {}
            if (Array.isArray(tags)) {
                updateBlogData['$addToSet']['tags'] = { $each: [...tags] }
            }

            if (typeof tags === "string") {

                updateBlogData['$addToSet']['tags'] = ['tags']
            }
        }

        if (subcategory) {
            if (!Object.prototype.hasOwnProperty.call(updateBlogData, '$addToSet')) updateBlogData['$addToSet'] = {}
            if (Array.isArray(subcategory)) {
                updateBlogData['$addToSet']['tags'] = { $each: [...subcategory] }
            }

            if (typeof subcategory === "string") {

                updateBlogData['$addToSet']['subcategory'] = ['subcategory']
            }
        }

        const updateBlog = await blogModel.findOneAndUpdate({ _id: blogId }, updateBlogData, { new: true })
        res.status(200).send({ status: false, message: "Blog updated successfully", data: updateBlog })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

const deleteBlodbyId = async function (req, res) {
    try {
        const params = req.params
        const blogId = params.blogId
       const authorIdFromToken = req.authorId

        if (!isValidObjectId(blogId)) {
            res.status(400).send({ status: false, message: "${blogId} is not valid blog id" })
            return
        }

        if (!isValidObjectId(authorIdFromToken)) {
            res.status(400).send({ status: false, message: "${authorIdFromToken} is not valid token id" })
            return
        }

        const blog = await blogModel.findOne({ _id: blogId, isDeleted: false, deletedAt: null })
        if (!blog) {
            res.status(404).send({ status: false, message: "blog not found" })
            return
        }

        if (blog.authorId.toString() !== authorIdFromToken) {
            res.status(401).send({ status: false, message: "Unauthorized access owner info does not match" })
            return
        }

        await blogModel.findOneAndUpdate({ _id: blogId }, { $set: { isDeleted: true, deletedAt: new Date() } })
        res.status(200).send({ status: false, message: "Blog updated successfully" })
    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}


const deleteBlodByParams = async function (req, res) {
    try {
        const filterQuery = { isDeleted: false, deletedAt:null}
        const queryparams = req.query
       const authorIdFromToken = req.authorId

        if (!isValidObjectId(authorIdFromToken)) {
            res.status(400).send({ status: false, message: "${authorIdFromToken} is not valid token id" })
            return
        }

        if (!isValidRequestBody(queryparams)) {
            res.status(400).send({ status: false, message: "No query params received aborting delete operation" })
            return
        }

        const{ authorId, category, tags, subcategory, isPublished} = queryparams

        if (isValid(authorId) && isValidObjectId(authorId)) {
            filterQuery['authorId'] = authorId

        }

        if (isValid(category)) {
            filterQuery['category'] = category.trim()
        }
        if (isValid(tags)) {
            const tagsArr = tags.trim().split(',').map(tag => tag.trim());
            filterQuery['tags'] = {$all: tagsArr }
        }

        if (isValid(subcategory)) {
            const subcatArr = subcategory.trim().split(',').map(subcat => subcat.trim());
            filterQuery['subcategory'] = { $all: subcatArr }
        }

        if (isValid(isPublished)) {
            filterQuery['isPublished'] = isPublished
        }
        const blogs = await blogModel.find(filterQuery)

        if (Array.isArray(blogs) && blogs.length === 0) {
            res.status(404).send({ status: false, message: "No matching blogs found" })
            return
        }

        const idsBlogsToDelete = blogs.map(blog => {
            if (blog.authorId.toString() === authorIdFromToken) return blog._id
        })

        if (idsBlogsToDelete.length === 0) {
            res.status(404).send({ status: false, message: "No blogs found" })
            return
        }

        await blogModel.updateMany({ _id: idsBlogsToDelete }, { $set: { isDeleted: true, deletedAt: new Date() } })
        res.status(200).send({ status: true, message: "Blogs deleted successfully" })

    }
    catch (error) {
        res.status(500).send({ status: false, message: error.message })

    }
}

module.exports = {
    createBlog,
    listBlog,
    updateBlog,
    deleteBlodbyId,
    deleteBlodByParams
}