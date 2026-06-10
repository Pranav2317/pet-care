const fs = require("fs");
const path = require("path");
const https = require("https");

const root = path.join(__dirname, "..");
const imagesDir = path.join(root, "src/views/images");
const uploadsDir = path.join(root, "src/views/uploads");

const uploadFiles = [
  "royal_canin_feline_adult_1780378370693.png",
  "meo_premium_cat_food_1780378391329.png",
  "gourmet_gold_pate_1780378474959.png",
  "catsrang_tuna_pate_1780378492411.png",
  "salmon_freeze_dried_1780378512128.png",
  "crispy_bites_chicken_1780535352826.png",
  "beaphar_cat_milk_1780535372124.png",
  "sua_goat_milk_premium_1780537481940.jpg",
  "bentonite_cat_litter_1780535386342.png",
  "cat_tree_5_tier_1780535397792.png",
  "squeaky_mouse_toy_1780535411925.png",
  "gps_cat_collar_1780535424066.png",
  "khay_an_inox_cao_cap_1780537482364.jpg",
  "ban_chai_long_chuyen_dung_1780537482482.jpg",
  "khan_tam_meo_sieu_tham_1780537507782.jpg",
  "tui_van_chuyen_meo_1780537483481.jpg",
  "thuoc_tay_giun_an_toan_1780537483788.jpg",
  "vitamin_tong_hop_a_z_1780537483899.jpg",
  "dau_gio_ho_tro_tieu_hoa_1780537484065.jpg",
  "ban_nuoc_uong_tu_dong_1780537484198.jpg",
];

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      })
      .on("error", reject);
  });
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https
      .get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          file.close();
          fs.unlinkSync(dest);
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        }
        res.pipe(file);
        file.on("finish", () => file.close(resolve));
      })
      .on("error", (error) => {
        fs.unlink(dest, () => reject(error));
      });
  });
}

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
}

async function getDogImageUrl() {
  const data = await fetchJson("https://dog.ceo/api/breeds/image/random");
  return data.message;
}

async function main() {
  fs.mkdirSync(imagesDir, { recursive: true });
  fs.mkdirSync(uploadsDir, { recursive: true });

  console.log("Downloading brand/logo images...");
  const logoUrl = await getDogImageUrl();
  const logoPath = path.join(imagesDir, "logo.png");
  await downloadFile(logoUrl, logoPath);

  const heroUrl = await getDogImageUrl();
  await downloadFile(heroUrl, path.join(imagesDir, "xam.png"));

  for (const name of [
    "favicon.ico",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
  ]) {
    copyFile(logoPath, path.join(imagesDir, name));
  }

  console.log("Downloading product images...");
  for (const fileName of uploadFiles) {
    const dest = path.join(uploadsDir, fileName);
    const imageUrl = await getDogImageUrl();
    await downloadFile(imageUrl, dest);
    console.log(`  ✓ ${fileName}`);
  }

  console.log("\nAll images saved.");
  console.log(`  Brand assets: ${imagesDir}`);
  console.log(`  Product images: ${uploadsDir}`);
}

main().catch((error) => {
  console.error("Image setup failed:", error.message);
  process.exit(1);
});
