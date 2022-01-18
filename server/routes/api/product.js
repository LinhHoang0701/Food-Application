const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk/clients/s3');
const Mongoose = require('mongoose');
var jwt = require('jsonwebtoken');

// Bring in Models & Helpers
const Product = require('../../models/product');
const Category = require('../../models/category');
const Wishlist = require('../../models/wishlist');
const Review = require('../../models/review');
const auth = require('../../middleware/auth');
const role = require('../../middleware/role');
const {
  addProduct,
  editProduct,
  deleteProduct,
  editProductActive,
  searchAll,
  getProduct,
  getListProduct,
} = require('../../controllers/product');

const storage = multer.memoryStorage();
const upload = multer({storage});

// fetch product slug api
router.get('/item/:slug', async (req, res) => {
  try {
    const slug = req.params.slug;

    const productDoc = await Product.findOne({slug, isActive: true}).populate({
      select: 'name isActive slug',
    });

    if (!productDoc) {
      return res.status(404).json({
        message: 'No product found.',
      });
    }

    res.status(200).json({
      product: productDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
});

// fetch  product name search api
router.get('/list/search/:name', async (req, res) => {
  try {
    const name = req.params.name;

    const productDoc = await Product.find(
      {name: {$regex: new RegExp(name), $options: 'is'}, isActive: true},
      {name: 1, slug: 1, imageUrl: 1, price: 1, _id: 0},
    );

    if (productDoc.length < 0) {
      return res.status(404).json({
        message: 'No product found.',
      });
    }

    res.status(200).json({
      products: productDoc,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
});

// fetch store products by advancedFilters api
router.post('/list', getListProduct);

router.get('/list/select', auth, async (req, res) => {
  try {
    const products = await Product.find({}, 'name');

    res.status(200).json({
      products,
    });
  } catch (error) {
    res.status(400).json({
      error: 'Your request could not be processed. Please try again.',
    });
  }
});

// add product api
router.post(
  '/add',
  auth,
  role.checkRole(role.ROLES.Admin),
  upload.single('image'),
  addProduct,
);

// fetch products api
router.get('/', auth, role.checkRole(role.ROLES.Admin), searchAll);

// fetch product api
router.get('/:id', auth, role.checkRole(role.ROLES.Admin), getProduct);

router.put('/:id', auth, role.checkRole(role.ROLES.Admin), editProduct);

router.put(
  '/:id/active',
  auth,
  role.checkRole(role.ROLES.Admin),
  editProductActive,
);

router.delete(
  '/delete/:id',
  auth,
  role.checkRole(role.ROLES.Admin),
  deleteProduct,
);

module.exports = router;
