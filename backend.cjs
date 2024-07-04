const express = require("express");
const axios = require("axios");
const cors = require("cors");
const cheerio = require("cheerio"); // Include cheerio for parsing HTML
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const port = 5000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json()); // Use bodyParser for parsing JSON
app.use(express.json());
app.use(cors());
// Example endpoint to fetch product data from Shopify
app.get("/api/products/:id", async (req, res) => {
  try {
    let accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
    accessToken = accessToken.trim();

    const productId = req.params.id;
    const shopifyUrl = `https://happyruh.myshopify.com/admin/api/2024-04/products/${productId}.json`;

    // backend.cjs

    // const accessToken = '';

    const response = await axios.get(shopifyUrl, {
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": accessToken,
      },
    });

    const productData = response.data.product;

    // Extract "About" section from body_html using cheerio
    const $ = cheerio.load(productData.body_html);
    const aboutSection = $('span:contains("About:")').parent().text().trim();
    const productDescription = aboutSection.replace(/^About:\s*/i, "");

    // Prepare response to send to frontend
    const responseData = {
      id: productData.id,
      title: productData.title,
      handle: productData.handle,
      about: productDescription, // Include the extracted "About" section
      // Add other fields as needed
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching product:", error);
    res.status(500).json({ error: "Failed to fetch product from Shopify" });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
