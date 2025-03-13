const webpush = require("web-push");

const publicVapidKey =
  "BNG2BDTAu1qPmRWI5kXH2KyJR10rzQLltb6h7kBwm5OcmvoU7NToKfR5vwVk6C3yBneNC4Oojfl2Ug_gtuOg68I";
const privateVapidKey = "OPoDhj5n5NsdTIIrLCuZFuhyzJG2wrpzhNdcmgTfVGU";

webpush.setVapidDetails(
  "mailto:tanisha.vyas.btech2022@sitpune.edu.in",
  publicVapidKey,
  privateVapidKey
);

// Paste the subscription object you got
const subscription = {
  endpoint:
    "https://fcm.googleapis.com/fcm/send/fVwjO4zLvWk:APA91bEz1X-f-Lg9Cp1iXCHw2QA95luPiQm6pksCYxlpfQL__YxAW8P4IWGos4BoXGeuTmST_bkmEMgywC4usTY2K9mPnQLxuPXuXGKcWUP79w7XCI6NCbvUvmGqjCKGqdJ8RHlhj7XS",
  expirationTime: null,
  keys: {
    p256dh:
      "BJipUcR1oKOCFomcD3Z8FFr4UDhuNup2QL6qLqRQS1vyjdNd-Ip1M-Hqys-RVtShcywRv9uFa6S4Mk7hc8IhnY4",
    auth: "NL_4hQzHCvYB9uDsz_8VaA",
  },
};

// Send a test notification
const payload = JSON.stringify({
  title: "Hello!",
  message: "This is a test push notification from your backend! 🚀",
});

webpush
  .sendNotification(subscription, payload)
  .then(() => console.log("✅ Push notification sent successfully!"))
  .catch((err) => console.error("❌ Error sending push notification:", err));
