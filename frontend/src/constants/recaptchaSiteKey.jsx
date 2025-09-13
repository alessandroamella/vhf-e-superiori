export const recaptchaSiteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
if (!recaptchaSiteKey) {
  console.error("Missing VITE_TURNSTILE_SITE_KEY env");
} else {
  console.log("Using Turnstile site key:", recaptchaSiteKey);
}
