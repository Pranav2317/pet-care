const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const Order = require("../models/Order");
const Product = require("../models/Product");

// =============================================
// Helper Functions
// =============================================

/**
 * Load VNPAY configuration from environment variables or JSON file
 */
function loadVnpayConfig() {
  if (process.env.VNP_TMNCODE && process.env.VNP_HASHSECRET) {
    return {
      vnp_TmnCode: process.env.VNP_TMNCODE,
      vnp_HashSecret: process.env.VNP_HASHSECRET,
      vnp_Url:
        process.env.VNP_URL ||
        "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
      vnp_ReturnUrl:
        process.env.VNPAY_RETURN_URL ||
        process.env.VNP_RETURNURL ||
        `http://localhost:${process.env.PORT || 5000}/api/payments/vnpay/return`,
    };
  }

  const configPath = path.resolve(
    __dirname,
    "../vnpay_nodejs/config/default.json"
  );

  if (fs.existsSync(configPath)) {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  }

  throw new Error(
    "VNPay is not configured. Set VNP_TMNCODE and VNP_HASHSECRET in .env or create src/vnpay_nodejs/config/default.json"
  );
}

/**
 * Sort object alphabetically (required by VNPAY)
 */
function sortObject(obj) {
  const sorted = {};
  const keys = Object.keys(obj)
    .map((key) => encodeURIComponent(key))
    .sort();

  for (const key of keys) {
    sorted[key] = encodeURIComponent(obj[key]).replace(/%20/g, "+");
  }

  return sorted;
}

/** Pad with leading zero if value < 10 */
function pad(value) {
  return String(value).padStart(2, "0");
}

/**
 * Get current time in Vietnam timezone (UTC+7)
 */
function getVnTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3600000 * 7);
}

/**
 * Create transaction ID in format: YYYYMMDDHHmmssSSS
 */
function createOrderId() {
  const vn = getVnTime();
  return [
    vn.getFullYear(),
    pad(vn.getMonth() + 1),
    pad(vn.getDate()),
    pad(vn.getHours()),
    pad(vn.getMinutes()),
    pad(vn.getSeconds()),
    String(vn.getMilliseconds()).padStart(3, "0"),
  ].join("");
}

/**
 * Create date string in format: YYYYMMDDHHmmss
 */
function createDateValue() {
  const vn = getVnTime();
  return [
    vn.getFullYear(),
    pad(vn.getMonth() + 1),
    pad(vn.getDate()),
    pad(vn.getHours()),
    pad(vn.getMinutes()),
    pad(vn.getSeconds()),
  ].join("");
}

/**
 * Get client IP address, fallback to 127.0.0.1
 */
function getClientIp(req) {
  const forwardedFor = req.headers["x-forwarded-for"];
  let ip = forwardedFor
    ? forwardedFor.split(",")[0].trim()
    : req.ip || req.connection.remoteAddress || req.socket.remoteAddress;

  if (!ip || ip === "::1" || ip.includes(":")) {
    ip = "127.0.0.1";
  }

  return ip;
}

/**
 * Build HMAC SHA512 secure hash for VNPAY
 */
function buildSecureHash(data, secretKey) {
  return crypto
    .createHmac("sha512", secretKey)
    .update(Buffer.from(data, "utf8"))
    .digest("hex");
}

/**
 * Verify secure hash from VNPAY callback
 */
function verifySecureHash(params, secretKey) {
  const clonedParams = { ...params };
  const secureHash = clonedParams.vnp_SecureHash;

  delete clonedParams.vnp_SecureHash;
  delete clonedParams.vnp_SecureHashType;

  const sortedParams = sortObject(clonedParams);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join("&");

  return secureHash === buildSecureHash(signData, secretKey);
}

/**
 * Build VNPAY payment URL
 */
function buildPaymentUrl(req, amount, bankCode = "", orderNumber = "") {
  const config = loadVnpayConfig();
  // VNPay only accepts alphanumeric TxnRef, strip special characters
  const txnRef = orderNumber
    ? orderNumber.replace(/[^a-zA-Z0-9]/g, "")
    : createOrderId();
  const createDate = createDateValue();
  const locale = req.body?.language || "vn";

  const params = {
    vnp_Version: "2.1.0",
    vnp_Command: "pay",
    vnp_TmnCode: config.vnp_TmnCode,
    vnp_Locale: locale,
    vnp_CurrCode: "VND",
    vnp_TxnRef: txnRef,
    vnp_OrderInfo: `Payment for order ${txnRef}`,
    vnp_OrderType: "other",
    vnp_Amount: Math.round(Number(amount) * 100),
    vnp_ReturnUrl:
      config.vnp_ReturnUrl ||
      process.env.VNPAY_RETURN_URL ||
      `http://localhost:${process.env.PORT || 5000}/api/payments/vnpay/return`,
    vnp_IpAddr: getClientIp(req) || "127.0.0.1",
    vnp_CreateDate: createDate,
  };

  if (bankCode) {
    params.vnp_BankCode = bankCode;
  }

  const sortedParams = sortObject(params);
  const signData = Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join("&");

  sortedParams.vnp_SecureHash = buildSecureHash(
    signData,
    config.vnp_HashSecret
  );

  const redirectUrl = `${config.vnp_Url}?${Object.keys(sortedParams)
    .map((key) => `${key}=${sortedParams[key]}`)
    .join("&")}`;

  return { redirectUrl, txnRef };
}

// =============================================
// Controller Methods
// =============================================

/**
 * Create VNPAY payment URL
 * POST /api/payments/vnpay/create
 */
exports.createPayment = async (req, res) => {
  try {
    const amount = Number(req.body?.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount.",
      });
    }

    const { redirectUrl, txnRef } = buildPaymentUrl(
      req,
      amount,
      req.body?.bankCode || "",
      req.body?.orderId || ""
    );

    // Save txnRef to order so vnpayReturn can find it later
    if (req.body?.orderId) {
      await Order.findOneAndUpdate(
        { orderNumber: req.body.orderId },
        { paymentTransactionRef: txnRef }
      );
    }

    return res.json({ success: true, redirectUrl, orderId: txnRef });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to create VNPAY payment link.",
      error: error.message,
    });
  }
};

/**
 * Handle VNPAY payment return callback
 * GET /api/payments/vnpay/return
 */
exports.vnpayReturn = async (req, res) => {
  try {
    const config = loadVnpayConfig();
    const responseCode = req.query.vnp_ResponseCode || "99";
    const isValid = verifySecureHash(req.query, config.vnp_HashSecret);
    const isSuccess = isValid && responseCode === "00";
    const transactionRef = req.query.vnp_TxnRef;

    // Update payment status in database
    if (transactionRef) {
      // Decode transactionRef in case of URL encoding
      const decodedRef = decodeURIComponent(transactionRef);

      // Find order by paymentTransactionRef (saved when creating VNPay link)
      const order = await Order.findOne({ paymentTransactionRef: decodedRef });

      if (order) {
        if (isSuccess) {
          order.paymentStatus = "paid";
          order.status = "confirmed";
          order.updatedAt = new Date();
          await order.save();
        } else {
          // Payment cancelled -> restore inventory then delete order
          if (order.products && order.products.length > 0) {
            for (const item of order.products) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { quantity: item.quantity },
              });
            }
          }
          await Order.findByIdAndDelete(order._id);
        }
      }
    }

    // Render payment result page
    res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VNPAY Payment</title>
    <style>
      body { font-family: Arial, sans-serif; background: #fff8f4; color: #211a13; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
      .card { background: #ffffff; padding: 32px; border-radius: 24px; box-shadow: 0 16px 40px rgba(132, 84, 0, 0.12); max-width: 560px; width: calc(100% - 32px); text-align: center; }
      .status { font-size: 40px; margin-bottom: 12px; }
      .title { font-size: 24px; margin-bottom: 10px; }
      .message { color: #524535; line-height: 1.6; margin-bottom: 24px; }
      .button { display: inline-block; background: #845400; color: #ffffff; padding: 12px 20px; border-radius: 999px; text-decoration: none; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="card">
      <div class="status">${isSuccess ? "✅" : "❌"}</div>
      <div class="title">${isSuccess ? "Payment successful" : "Payment failed"}</div>
      <p class="message">
        ${isSuccess ? "Your order has been paid via VNPAY. We will redirect you to the order page." : "Transaction failed or security signature is invalid. Please try again."}
      </p>
      <a class="button" href="/order/detail">View order</a>
      <script>
        ${isSuccess ? "localStorage.removeItem('cart');" : ""}
        setTimeout(() => {
          window.location.href = '/order/detail';
        }, 2500);
      </script>
    </div>
  </body>
</html>`);
  } catch {
    return res
      .status(500)
      .send(
        `<!doctype html><html><body><p>Unable to process payment result.</p></body></html>`
      );
  }
};
