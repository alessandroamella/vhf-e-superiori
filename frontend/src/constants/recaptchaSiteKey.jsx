export const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;
if (!recaptchaSiteKey) {
  console.error("Missing VITE_RECAPTCHA_SITE_KEY env");
} else {
  console.log("Using recaptchaSiteKey:", recaptchaSiteKey);
}
