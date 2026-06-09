require("dotenv").config();
const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
const Product = require("./src/models/Product");
const Brand = require("./src/models/Brand");
const User = require("./src/models/User");
const Review = require("./src/models/Review");

const demoProducts = [
  {
    name: "Royal Canin Feline Health Nutrition",
    description: "Premium dry food for healthy cats",
    category: "food",
    price: 350000,
    quantity: 25,
    image: "../uploads/royal_canin_feline_adult_1780378370693.png",
    brand: "Royal Canin",
    weight: "2kg",
    lifeStage: "Adult",
    flavor: "Mix",
  },
  {
    name: "Me-O Premium Cat Food",
    description: "Me-O dry food with multivitamins",
    category: "food",
    price: 250000,
    quantity: 30,
    image: "../uploads/meo_premium_cat_food_1780378391329.png",
    brand: "Me-O",
    weight: "1.2kg",
    lifeStage: "Adult",
    flavor: "Chicken & Fish",
  },
  {
    name: "Pate Gourmet Gold Savoury Cake",
    description: "Premium pate with meat and vegetables",
    category: "pate",
    price: 35000,
    quantity: 50,
    image: "../uploads/gourmet_gold_pate_1780378474959.png",
    brand: "Gourmet",
    weight: "85g",
    lifeStage: "Adult",
    flavor: "Beef & Vegetables",
  },
  {
    name: "Catsrang Tuna Pate",
    description: "Fresh tuna pate for cats",
    category: "pate",
    price: 28000,
    quantity: 40,
    image: "../uploads/catsrang_tuna_pate_1780378492411.png",
    brand: "Catsrang",
    weight: "80g",
    lifeStage: "Adult",
    flavor: "Tuna",
  },
  {
    name: "Freeze-Dried Salmon Snack",
    description: "Natural salmon snack, rich in omega-3",
    category: "snack",
    price: 120000,
    quantity: 20,
    image: "../uploads/salmon_freeze_dried_1780378512128.png",
    brand: "Pet Love",
    weight: "100g",
    lifeStage: "All",
    flavor: "Salmon",
  },
  {
    name: "Crispy Bites Treats",
    description: "Crispy, tasty treats, low in calories",
    category: "snack",
    price: 45000,
    quantity: 35,
    image: "../uploads/crispy_bites_chicken_1780535352826.png",
    brand: "Pet Joy",
    weight: "60g",
    lifeStage: "Adult",
    flavor: "Chicken",
  },
  {
    name: "Cat Milk Standard",
    description: "Special formula milk for kittens",
    category: "milk",
    price: 85000,
    quantity: 15,
    image: "../uploads/beaphar_cat_milk_1780535372124.png",
    brand: "Pet Care",
    weight: "400ml",
    lifeStage: "Kitten",
    flavor: "Original",
  },
  {
    name: "Goat Milk Premium",
    description: "Premium goat milk for sensitive cats",
    category: "milk",
    price: 150000,
    quantity: 10,
    image: "../uploads/sua_goat_milk_premium_1780537481940.jpg",
    brand: "Premium Pet",
    weight: "500ml",
    lifeStage: "All",
    flavor: "Pure",
  },
  {
    name: "Bentonite Cat Litter",
    description: "Premium cat litter with excellent odor control",
    category: "accessories",
    price: 180000,
    quantity: 12,
    image: "../uploads/bentonite_cat_litter_1780535386342.png",
    brand: "Clean Paws",
    weight: "5kg",
    lifeStage: "All",
    flavor: "Lavender",
  },
  {
    name: "5-Tier Cat Scratching Tree",
    description: "Tall scratching tree with modern design",
    category: "accessories",
    price: 890000,
    quantity: 5,
    image: "../uploads/cat_tree_5_tier_1780535397792.png",
    brand: "Pet Furniture",
    weight: "15kg",
    lifeStage: "All",
    flavor: "Gray",
  },
  {
    name: "Squeaky Mouse Toy",
    description: "Interactive toy that stimulates intelligence",
    category: "accessories",
    price: 65000,
    quantity: 25,
    image: "../uploads/squeaky_mouse_toy_1780535411925.png",
    brand: "Fun Pets",
    weight: "50g",
    lifeStage: "All",
    flavor: "Multicolor",
  },
  {
    name: "GPS Tracking Collar",
    description: "Smart collar with GPS tracking",
    category: "accessories",
    price: 1200000,
    quantity: 3,
    image: "../uploads/gps_cat_collar_1780535424066.png",
    brand: "Tech Pet",
    weight: "80g",
    lifeStage: "Adult",
    flavor: "Black",
  },
  {
    name: "Premium Stainless Steel Feeding Bowls",
    description: "Set of 2 stainless steel feeding bowls",
    category: "accessories",
    price: 280000,
    quantity: 18,
    image: "../uploads/khay_an_inox_cao_cap_1780537482364.jpg",
    brand: "Pet Home",
    weight: "500g",
    lifeStage: "All",
    flavor: "Silver",
  },
  {
    name: "Professional Grooming Brush",
    description: "Effective shedding brush",
    category: "accessories",
    price: 95000,
    quantity: 22,
    image: "../uploads/ban_chai_long_chuyen_dung_1780537482482.jpg",
    brand: "Grooming Pro",
    weight: "200g",
    lifeStage: "All",
    flavor: "Blue",
  },
  {
    name: "Ultra-Absorbent Cat Towel",
    description: "Premium towel, quick-drying",
    category: "accessories",
    price: 120000,
    quantity: 16,
    image: "../uploads/khan_tam_meo_sieu_tham_1780537507782.jpg",
    brand: "Cozy Pet",
    weight: "300g",
    lifeStage: "All",
    flavor: "Pink",
  },
  {
    name: "Cat Carrier Bag",
    description: "Carrier bag designed for vet visits",
    category: "accessories",
    price: 450000,
    quantity: 8,
    image: "../uploads/tui_van_chuyen_meo_1780537483481.jpg",
    brand: "Travel Pet",
    weight: "600g",
    lifeStage: "All",
    flavor: "Cream",
  },
  {
    name: "Safe Deworming Medicine",
    description: "Adult deworming medicine for cats",
    category: "food",
    price: 75000,
    quantity: 14,
    image: "../uploads/thuoc_tay_giun_an_toan_1780537483788.jpg",
    brand: "Vet Care",
    weight: "10ml",
    lifeStage: "All",
    flavor: "Orange",
  },
  {
    name: "A-Z Multivitamin",
    description: "Complete nutrition vitamins for cats",
    category: "food",
    price: 180000,
    quantity: 11,
    image: "../uploads/vitamin_tong_hop_a_z_1780537483899.jpg",
    brand: "Pet Health",
    weight: "100g",
    lifeStage: "All",
    flavor: "Chicken",
  },
  {
    name: "Digestive Support Fish Oil",
    description: "Omega-3 fish oil for healthy cats",
    category: "food",
    price: 220000,
    quantity: 9,
    image: "../uploads/dau_gio_ho_tro_tieu_hoa_1780537484065.jpg",
    brand: "Premium Care",
    weight: "250ml",
    lifeStage: "Adult",
    flavor: "Fish",
  },
  {
    name: "Automatic Pet Water Fountain",
    description: "Electric water fountain that keeps water fresh",
    category: "accessories",
    price: 650000,
    quantity: 6,
    image: "../uploads/ban_nuoc_uong_tu_dong_1780537484198.jpg",
    brand: "Pet Tech",
    weight: "800g",
    lifeStage: "All",
    flavor: "White",
  },
];

const demoUsers = [
  {
    fullName: "David Nguyen",
    email: "admin1@example.com",
    password: "123456",
    phone: "0123456789",
    role: "admin",
  },
  {
    fullName: "Emily Nguyen",
    email: "admin2@example.com",
    password: "123456",
    phone: "0987654321",
    role: "admin",
  },
  {
    fullName: "Kevin Tran",
    email: "customer1@example.com",
    password: "123456",
    phone: "0912345678",
    role: "customer",
  },
  {
    fullName: "Maya Lee",
    email: "customer2@example.com",
    password: "123456",
    phone: "0923456789",
    role: "customer",
  },
  {
    fullName: "Michael Hoang",
    email: "customer3@example.com",
    password: "123456",
    phone: "0934567890",
    role: "customer",
  },
  {
    fullName: "Anna Pham",
    email: "customer4@example.com",
    password: "123456",
    phone: "0945678901",
    role: "customer",
  },
  {
    fullName: "Helen Dang",
    email: "customer5@example.com",
    password: "123456",
    phone: "0956789012",
    role: "customer",
  },
  {
    fullName: "Henry Vu",
    email: "customer6@example.com",
    password: "123456",
    phone: "0967890123",
    role: "customer",
  },
  {
    fullName: "Linda Trinh",
    email: "customer7@example.com",
    password: "123456",
    phone: "0978901234",
    role: "customer",
  },
  {
    fullName: "Daniel Bui",
    email: "customer8@example.com",
    password: "123456",
    phone: "0989012345",
    role: "customer",
  },
  {
    fullName: "Hannah To",
    email: "customer9@example.com",
    password: "123456",
    phone: "0990123456",
    role: "customer",
  },
  {
    fullName: "Daniel Luong",
    email: "customer10@example.com",
    password: "123456",
    phone: "0901234567",
    role: "customer",
  },
  {
    fullName: "Beth Ngo",
    email: "customer11@example.com",
    password: "123456",
    phone: "0912345670",
    role: "customer",
  },
  {
    fullName: "Tom Phan",
    email: "customer12@example.com",
    password: "123456",
    phone: "0923456780",
    role: "customer",
  },
  {
    fullName: "Helen Vo",
    email: "customer13@example.com",
    password: "123456",
    phone: "0934567891",
    role: "customer",
  },
  {
    fullName: "Long Dinh",
    email: "customer14@example.com",
    password: "123456",
    phone: "0945678902",
    role: "customer",
  },
  {
    fullName: "Nora Doan",
    email: "customer15@example.com",
    password: "123456",
    phone: "0956789013",
    role: "customer",
  },
  {
    fullName: "Quinn Ho",
    email: "customer16@example.com",
    password: "123456",
    phone: "0967890124",
    role: "customer",
  },
  {
    fullName: "Karen Lai",
    email: "customer17@example.com",
    password: "123456",
    phone: "0978901235",
    role: "customer",
  },
  {
    fullName: "Sam Duong",
    email: "customer18@example.com",
    password: "123456",
    phone: "0989012346",
    role: "customer",
  },
];

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("✓ MongoDB connected");

    // Clear existing data
    await Product.deleteMany({});
    await Brand.deleteMany({});
    await User.deleteMany({});
    console.log("✓ Cleared existing data");

    // Seed products
    const createdProducts = await Product.insertMany(demoProducts);
    console.log(`✓ Created ${createdProducts.length} demo products`);

    const uniqueBrandNames = [
      ...new Set(demoProducts.map((product) => product.brand).filter(Boolean)),
    ];
    const createdBrands = await Brand.insertMany(
      uniqueBrandNames.map((name) => ({ name }))
    );
    console.log(`✓ Created ${createdBrands.length} demo brands`);

    // Hash passwords and seed users
    const usersWithHashedPasswords = await Promise.all(
      demoUsers.map(async (user) => {
        const hashedPassword = await bcryptjs.hash(user.password, 10);
        return { ...user, password: hashedPassword };
      })
    );

    const createdUsers = await User.insertMany(usersWithHashedPasswords);
    console.log(`✓ Created ${createdUsers.length} demo users`);

    // Seed reviews
    await Review.deleteMany({});
    const customers = createdUsers.filter(u => u.role === "customer");
    const reviewsToCreate = [];
    for (const product of createdProducts) {
      // Create 1-3 random reviews per product
      const numReviews = Math.floor(Math.random() * 3) + 1;
      for (let i = 0; i < numReviews; i++) {
        reviewsToCreate.push({
          product: product._id,
          user: customers[i % customers.length]._id,
          rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
          comment: "Amazing product! My cat loves it.",
        });
      }
    }
    await Review.insertMany(reviewsToCreate);
    console.log(`✓ Created ${reviewsToCreate.length} demo reviews`);

    // Update product ratings based on generated reviews
    for (const product of createdProducts) {
      const productReviews = reviewsToCreate.filter(r => r.product.equals(product._id));
      const avg = productReviews.reduce((sum, r) => sum + r.rating, 0) / productReviews.length;
      await Product.findByIdAndUpdate(product._id, { rating: Math.round(avg * 10) / 10 });
    }
    console.log(`✓ Updated product average ratings`);

    console.log("\n✓ Database seeded successfully!");
    console.log("\n Admin accounts:");
    demoUsers
      .filter((u) => u.role === "admin")
      .forEach((user) => {
        console.log(`  - Email: ${user.email}, Password: ${user.password}`);
      });

    console.log("\n Customer sample accounts:");
    demoUsers
      .filter((u) => u.role === "customer")
      .slice(0, 3)
      .forEach((user) => {
        console.log(`  - Email: ${user.email}, Password: ${user.password}`);
      });

    process.exit(0);
  } catch (error) {
    console.error("✗ Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
