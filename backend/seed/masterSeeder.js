import mongoose from "mongoose";
import dotenv from "dotenv";
import { categories } from "./seedCategories.js";
import { products } from "./seedProducts.js";
import { offers } from "./seedOffers.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Offer from "../models/Offer.js";

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/mithai-world";

const seedDatabase = async () => {
  try {
    console.log("🚀 Starting database seeding...");
    
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // 1. Clear existing data
    console.log("🧹 Skipping clearing of old data to prevent accidental deletion...");
    // await Category.deleteMany({});
    // await Product.deleteMany({});
    // await Offer.deleteMany({});
    console.log("✅ Collections preserved");

    // 2. Seed Categories
    console.log("📁 Seeding categories...");
    const createdCategories = await Category.insertMany(categories);
    console.log(`✅ ${createdCategories.length} categories created`);

    // 3. Seed Products
    console.log("📦 Seeding products...");
    
    // Create an expanded list to reach 50+ products if needed
    let expandedProducts = [...products];
    
    // Logic to duplicate some items with different names/slugs to fill the catalog
    // if the manual list is short.
    const baseNames = ["Barfi", "Peda", "Laddu", "Halwa", "Gajak", "Chikki", "Mathri", "Sev"];
    const prefixes = ["Premium", "Royal", "Special", "Classic", "Deluxe", "Handcrafted", "Artisanal"];
    
    if (expandedProducts.length < 50) {
      console.log(`📝 Expanding product list from ${expandedProducts.length} to 50+...`);
      const categoriesSlugs = categories.map(c => c.slug);
      
      while (expandedProducts.length < 55) {
        const randomBase = baseNames[Math.floor(Math.random() * baseNames.length)];
        const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        const randomCat = categoriesSlugs[Math.floor(Math.random() * categoriesSlugs.length)];
        
        const name = `${randomPrefix} ${randomBase}`;
        const slug = `${name.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).substring(2, 5)}`;
        
        expandedProducts.push({
          name,
          slug,
          category: randomCat,
          description: `Exquisite ${name} prepared using traditional methods and premium ingredients.`,
          gstPercent: expandedProducts.length % 2 === 0 ? 5 : 12,
          isSignature: false,
          isHero: false,
          tags: ["fresh", "traditional"],
          variants: [
            { label: "250g", mrp: 200, discountPercent: 0, sellingPrice: 200, stock: 50 },
            { label: "500g", mrp: 380, discountPercent: 5, sellingPrice: 361, stock: 30 }
          ]
        });
      }
    }

    // Process all products to ensure finalPrice is set (matching business logic)
    const finalizedProducts = expandedProducts.map(p => ({
      ...p,
      variants: p.variants.map(v => ({
        ...v,
        finalPrice: v.sellingPrice // Strict rule: GST is already included
      })),
      image: p.image || `/uploads/products/${p.slug}.jpg`,
      images: p.images?.length > 0 ? p.images : [`/uploads/products/${p.slug}.jpg`]
    }));

    const createdProducts = await Product.insertMany(finalizedProducts);
    console.log(`✅ ${createdProducts.length} products created`);

    // 4. Seed Offers
    console.log("🏷️ Seeding offers...");
    // Link offers to real IDs if needed, but the model uses slugs/strings mostly
    const createdOffers = await Offer.insertMany(offers);
    console.log(`✅ ${createdOffers.length} offers created`);

    console.log("\n✨ DATABASE SEEDING COMPLETED SUCCESSFULLY!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
};

seedDatabase();
