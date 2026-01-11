const nodemailer = require("nodemailer");

// ✅ Add all allowed origins, including 'http://bappatravels.com'
const ALLOWED_ORIGINS = new Set([
  "https://bappatravels.com",
  "https://www.bappatravels.com",
  "https://bappatravels.netlify.app",
  "http://localhost:3000",
  "http://bappatravels.com", // 👈 This was missing before
]);

// ✅ CORS header generator
function buildCorsHeaders(origin) {
  console.log("Incoming request origin:", origin); // helpful for debugging

  if (!ALLOWED_ORIGINS.has(origin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

exports.handler = async function (event) {
  const origin =
    (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const corsHeaders = buildCorsHeaders(origin);

  // ✅ Handle CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: "",
    };
  }

  // ✅ Block non-POST methods
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Method not allowed" }),
    };
  }

  // ✅ Parse request body
  let body;
  try {
    body = JSON.parse(event.body || "{}");
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Invalid JSON body" }),
    };
  }

  const {
    fullName,
    email,
    mobileNumber,
    selectedCar,
    pickupDate,
    pickupTime,
    pickupLocation,
    dropoffLocation,
    status,
    reason,
  } = body;

  if (!fullName || !email) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Missing required fields: fullName or email",
      }),
    };
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER || "travels.bappa15@gmail.com",
      pass: process.env.SMTP_PASS || "shmq ypiq wesf vyji",
    },
  });

  const adminRecipient = process.env.ADMIN_EMAIL || "yashnile.435@gmail.com";
  const adminMailOptions = {
    from: process.env.SMTP_FROM || "travels.bappa15@gmail.com",
    to: adminRecipient,
    subject: "New Booking Received - Bappa Travels",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
        <h2 style="color: #1976d2;">New Booking Received</h2>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr><td><strong>Name:</strong></td><td>${fullName}</td></tr>
          <tr><td><strong>Email:</strong></td><td>${email}</td></tr>
          <tr><td><strong>Mobile:</strong></td><td>${
            mobileNumber || ""
          }</td></tr>
          <tr><td><strong>Car:</strong></td><td>${selectedCar || ""}</td></tr>
          <tr><td><strong>Date:</strong></td><td>${pickupDate || ""}</td></tr>
          <tr><td><strong>Time:</strong></td><td>${pickupTime || ""}</td></tr>
          <tr><td><strong>Pickup:</strong></td><td>${
            pickupLocation || ""
          }</td></tr>
          <tr><td><strong>Drop-off:</strong></td><td>${
            dropoffLocation || ""
          }</td></tr>
        </table>
      </div>
    `,
  };

  const adminMobile = "9011333966";
  const userBaseHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto;">
      <p>Dear <strong>${fullName}</strong>,</p>
      <p>Your booking details are as follows:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td><strong>Car:</strong></td><td>${selectedCar || ""}</td></tr>
        <tr><td><strong>Date:</strong></td><td>${pickupDate || ""}</td></tr>
        <tr><td><strong>Time:</strong></td><td>${pickupTime || ""}</td></tr>
        <tr><td><strong>Pickup:</strong></td><td>${
          pickupLocation || ""
        }</td></tr>
        <tr><td><strong>Drop-off:</strong></td><td>${
          dropoffLocation || ""
        }</td></tr>
      </table>
      <div style="margin-top: 20px; padding: 10px; border: 1px solid #1976d2; border-radius: 8px;">
        <strong>Bappa Travels</strong><br>
        Proprietor: Anil Lohar<br>
        Contact: ${adminMobile}<br>
        Email: travels.bappa15@gmail.com
      </div>
    </div>
  `;

  try {
    if (status) {
      let subject, html;

      if (status === "accepted") {
        subject = "Your Booking Has Been Accepted!";
        html = `<h2 style="color: #388e3c;">Accepted</h2><p>Your booking has been accepted.</p>${userBaseHtml}`;
      } else if (status === "rejected") {
        subject = "Your Booking Has Been Rejected";
        html = `<h2 style="color: #c62828;">Rejected</h2><p>Reason: ${
          reason || "No reason provided."
        }</p>${userBaseHtml}`;
      } else {
        subject = `Booking Status: ${status}`;
        html = userBaseHtml;
      }

      await transporter.sendMail({
        from: process.env.SMTP_FROM || "travels.bappa15@gmail.com",
        to: email,
        subject,
        html,
      });

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Status email sent successfully" }),
      };
    }

    // New booking flow
    const userMailOptions = {
      from: process.env.SMTP_FROM || "travels.bappa15@gmail.com",
      to: email,
      subject: "Welcome to Bappa Travels! Your Booking details",
      html: userBaseHtml,
    };

    await transporter.sendMail(adminMailOptions);
    await transporter.sendMail(userMailOptions);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Emails sent successfully" }),
    };
  } catch (error) {
    console.error("Error sending emails:", error);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Failed to send emails",
        error: String(error),
      }),
    };
  }
};
