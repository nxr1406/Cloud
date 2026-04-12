import admin from "firebase-admin";

// Initialize Firebase Admin ONLY once
if (!admin.apps.length) {
  const serviceAccount = JSON.parse(
    Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, "base64").toString()
  );

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Only POST method allowed",
    });
  }

  try {
    const { fcmToken, senderName, message, type } = req.body;

    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: "FCM token is required",
      });
    }

    // Notification title logic (WhatsApp style)
    let title = "🔔 Notification";

    if (type === "message") title = "💬 New Message";
    else if (type === "reaction") title = "❤️ New Reaction";
    else if (type === "call") title = "📞 Incoming Call";

    // FCM payload
    const payload = {
      token: fcmToken,
      notification: {
        title,
        body: `${senderName || "Someone"}: ${message || ""}`,
      },
      data: {
        type: type || "message",
        click_action: "FLUTTER_NOTIFICATION_CLICK",
      },
    };

    // Send push notification
    const response = await admin.messaging().send(payload);

    return res.status(200).json({
      success: true,
      messageId: response,
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
