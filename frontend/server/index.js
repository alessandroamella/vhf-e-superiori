import "dotenv/config";
import express from "express";
import helmet from "helmet";
import permissionsPolicy from "permissions-policy";
import ViteExpress from "vite-express";

const app = express();
ViteExpress.config({
  mode: "production",
});

const port = Number(process.env.PORT);

const backendUrl = process.env.BACKEND_URL;

if (!port) {
  throw new Error("PORT environment variable is required");
} else if (!backendUrl) {
  throw new Error("BACKEND_URL environment variable is required");
}

console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("PORT:", port);
console.log("BACKEND_URL:", backendUrl);

// Secure the app with Helmet and configure Content Security Policy
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-eval'",
          "'unsafe-inline'",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
          "https://www.googletagmanager.com",
          "https://cdnjs.cloudflare.com",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.recaptcha.net",
          "https://www.google-analytics.com",
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com",
          "https://maps.googleapis.com",
          "https://maps.gstatic.com",
        ],
        imgSrc: ["*", "data:", "blob:"],
        connectSrc: [
          "'self'",
          "https://maps.googleapis.com",
          "https://*.googleapis.com",
          "https://www.googletagmanager.com",
          "https://*.google-analytics.com",
          "https://checkip.amazonaws.com",
          "https://www.google.com",
          "https://www.gstatic.com",
          "https://www.recaptcha.net",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        frameSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.paypal.com",
          "https://www.recaptcha.net",
        ],
        formAction: ["'self'", "https://www.paypal.com"],
        workerSrc: ["'self'", "https://cdnjs.cloudflare.com", "blob:"],
        childSrc: [
          "'self'",
          "https://www.google.com",
          "https://www.paypal.com",
          "https://www.recaptcha.net",
        ],
        mediaSrc: [
          "'self'",
          "https://vhfesuperiori.s3.eu-central-1.amazonaws.com",
          "https://vhfesuperiori.s3.amazonaws.com",
          "blob:",
        ],
      },
    },
  }),
);
app.use(
  permissionsPolicy({
    features: {
      fullscreen: ["self"],
      payment: [],
      syncXhr: [],
    },
  }),
);

// Serve public directory
// const publicDir = join(process.cwd(), "public");
// console.log("Serving static files from:", publicDir);
// app.use(express.static(publicDir));

ViteExpress.listen(app, port, () => {
  console.log(`Server is running on port ${port}`);
});
