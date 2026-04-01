const twilio = require("twilio");

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({
      success: false,
      error: "Method not allowed"
    });
  }

  try {
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );

    const data = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    let message = "";

    if (data.type === "supply") {
      message = `Darby's Ridge Supply Request

Requested by: ${data.requestedBy || ""}
Category: ${data.category || ""}
Item: ${data.item || ""}
Quantity: ${data.quantity || ""}
Urgency: ${data.urgency || ""}
Notes: ${data.notes || ""}`;
    } else if (data.type === "maintenance") {
      message = `Darby's Ridge Maintenance Request

Reported by: ${data.reportedBy || ""}
Area: ${data.area || ""}
Issue Type: ${data.issueType || ""}
Priority: ${data.priority || ""}
Description: ${data.description || ""}`;
    } else {
      return res.status(400).json({
        success: false,
        error: "Invalid request type"
      });
    }

    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE,
      to: "+13217949581"
    });

    return res.status(200).json({
      success: true,
      sid: result.sid
    });
  } catch (error) {
    console.error("Twilio send error:", error);

    return res.status(500).json({
      success: false,
      error: error.message || "Failed to send text"
    });
  }
};
