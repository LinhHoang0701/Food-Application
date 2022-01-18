const AWS = require("aws-sdk/clients/s3");
var jwt = require("jsonwebtoken");

// Bring in Models & Helpers
const Product = require("../models/product");
const Category = require("../models/category");
const Wishlist = require("../models/wishlist");
const Review = require("../models/review");

const checkAuth = require("../helpers/auth");

const addProduct = async (req, res) => {
  try {
    const name = req.body.name;
    const description = req.body.description;
    const isActive = req.body.isActive;
    const image = req.file;

    if (!description || !name) {
      return res
        .status(400)
        .json({ error: "You must enter description & name." });
    }

    let imageUrl = "";
    let imageKey = "";

    if (image) {
      const s3bucket = new AWS({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      });

      const params = {
        Bucket: process.env.AWS_BUCKET_NAME,
        Key: image.originalname,
        Body: image.buffer,
        ContentType: image.mimetype,
        ACL: "public-read",
      };
      const s3Upload = await s3bucket.upload(params).promise();

      imageUrl = s3Upload.Location;
      imageKey = s3Upload.key;
    }

    const product = new Product({
      name,
      description,
      isActive,
      imageUrl,
      imageKey,
    });

    const savedProduct = await product.save();

    res.status(200).json({
      success: true,
      message: `Product has been added successfully!`,
      product: savedProduct,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const searchAll = async (req, res) => {
  try {
    let products = [];

    products = await Product.find({});

    res.status(200).json({
      products,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const searchByName = async (req, res) => {
  try {
    const name = req.params.name;

    const productDoc = await Product.find(
      { name: { $regex: new RegExp(name), $options: "is" }, isActive: true },
      { name: 1, slug: 1, imageUrl: 1, price: 1, _id: 0 }
    );

    if (productDoc.length < 0) {
      return res.status(404).json({
        message: "No product found.",
      });
    }

    res.status(200).json({
      products: productDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const getProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    let productDoc = null;

    productDoc = await Product.findOne({ _id: productId });

    if (!productDoc) {
      return res.status(404).json({
        message: "No product found.",
      });
    }

    res.status(200).json({
      product: productDoc,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const getProductBySlug = async (req, res) => {
  try {
    const slug = req.params.slug;

    const productDoc = await Product.findOne({ slug, isActive: true });

    if (!productDoc) {
      return res.status(404).json({
        message: "No product found.",
      });
    }

    res.status(200).json({
      product: productDoc,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const getListProduct = async (req, res) => {
  try {
    let { sortOrder, rating, category, pageNumber: page = 1 } = req.body;

    const pageSize = 8;
    const categoryFilter = category ? { category } : {};
    const ratingFilter = rating
      ? { rating: { $gte: rating } }
      : { rating: { $gte: rating } };

    const basicQuery = [
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "product",
          as: "reviews",
        },
      },
      {
        $addFields: {
          totalRatings: { $sum: "$reviews.rating" },
          totalReviews: { $size: "$reviews" },
        },
      },
      {
        $addFields: {
          averageRating: {
            $cond: [
              { $eq: ["$totalReviews", 0] },
              0,
              { $divide: ["$totalRatings", "$totalReviews"] },
            ],
          },
        },
      },
      {
        $match: {
          isActive: true,
          averageRating: ratingFilter.rating,
        },
      },
      {
        $project: {
          reviews: 0,
        },
      },
    ];

    const userDoc = await checkAuth(req);
    const categoryDoc = await Category.findOne(
      { slug: categoryFilter.category, isActive: true },
      "products -_id"
    );
    if (categoryDoc && categoryFilter !== category) {
      basicQuery.push({
        $match: {
          isActive: true,
          _id: {
            $in: Array.from(categoryDoc.products),
          },
        },
      });
    }

    let products = null;
    let productsCount = 0;

    if (userDoc) {
      productsCount = await Product.aggregate(
        [
          {
            $lookup: {
              from: "wishlists",
              let: { product: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$$product", "$product"] } },
                      { user: new Mongoose.Types.ObjectId(userDoc.id) },
                    ],
                  },
                },
              ],
              as: "isLiked",
            },
          },
          {
            $addFields: {
              isLiked: { $arrayElemAt: ["$isLiked.isLiked", 0] },
            },
          },
        ].concat(basicQuery)
      );
      const paginateQuery = [
        { $sort: sortOrder },
        { $skip: pageSize * (productsCount.length > 8 ? page - 1 : 0) },
        { $limit: pageSize },
      ];
      products = await Product.aggregate(
        [
          {
            $lookup: {
              from: "wishlists",
              let: { product: "$_id" },
              pipeline: [
                {
                  $match: {
                    $and: [
                      { $expr: { $eq: ["$$product", "$product"] } },
                      { user: new Mongoose.Types.ObjectId(userDoc.id) },
                    ],
                  },
                },
              ],
              as: "isLiked",
            },
          },
          {
            $addFields: {
              isLiked: { $arrayElemAt: ["$isLiked.isLiked", 0] },
            },
          },
        ]
          .concat(basicQuery)
          .concat(paginateQuery)
      );
    } else {
      productsCount = await Product.aggregate(basicQuery);
      const paginateQuery = [
        { $sort: sortOrder },
        { $skip: pageSize * (productsCount.length > 8 ? page - 1 : 0) },
        { $limit: pageSize },
      ];
      products = await Product.aggregate(basicQuery.concat(paginateQuery));
    }

    res.status(200).json({
      products,
      page,
      pages:
        productsCount.length > 0
          ? Math.ceil(productsCount.length / pageSize)
          : 0,
      totalProducts: productsCount.length,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const editProduct = async (req, res) => {
  async (req, res) => {
    try {
      const productId = req.params.id;
      const update = req.body.product;
      const query = { _id: productId };

      await Product.findOneAndUpdate(query, update, {
        new: true,
      });

      res.status(200).json({
        success: true,
        message: "Product has been updated successfully!",
      });
    } catch (error) {
      res.status(400).json({
        error: "Your request could not be processed. Please try again.",
      });
    }
  };
};

const editProductActive = async (req, res) => {
  try {
    const productId = req.params.id;
    const update = req.body.product;
    const query = { _id: productId };

    await Product.findOneAndUpdate(query, update, {
      new: true,
    });

    res.status(200).json({
      success: true,
      message: "Product has been updated successfully!",
    });
  } catch (error) {
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.deleteOne({ _id: req.params.id });
    await Wishlist.deleteMany({ product: req.params.id });
    await Review.deleteMany({ product: req.params.id });
    res.status(200).json({
      success: true,
      message: `Product has been deleted successfully!`,
      product,
    });
  } catch (error) {
    console.log(error);
    res.status(400).json({
      error: "Your request could not be processed. Please try again.",
    });
  }
};

module.exports = {
  addProduct,
  editProduct,
  editProductActive,
  deleteProduct,
  searchAll,
  getProduct,
  getListProduct,
  getProductBySlug,
  searchByName,
};
