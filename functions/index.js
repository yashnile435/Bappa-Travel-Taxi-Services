const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({
  origin: [
    'https://bappatravels.com',
    'https://www.bappatravels.com',
    'http://bappatravels.com',
    'http://www.bappatravels.com',
    'https://bappatravels.netlify.app',
    'http://localhost:3000'
  ],
  methods: ['POST', 'OPTIONS']
});
const nodemailer = require('nodemailer');

try { admin.initializeApp(); } catch (e) {}

function getConfig() {
  const cfg = functions.config && functions.config() ? functions.config() : {};
  return {
    smtpUser: process.env.SMTP_USER || (cfg.smtp && cfg.smtp.user) || '',
    smtpPass: process.env.SMTP_PASS || (cfg.smtp && cfg.smtp.pass) || '',
    smtpFrom: process.env.SMTP_FROM || (cfg.smtp && cfg.smtp.from) || 'travels.bappa15@gmail.com',
    adminEmail: process.env.ADMIN_EMAIL || (cfg.admin && cfg.admin.email) || 'yashnile.435@gmail.com'
  };
}

// Branded email helpers
const BRAND = {
  primary: '#388e3c',
  primaryDark: '#2e7d32',
  accent: '#66bb6a',
  text: '#222',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f7fbf7'
};

const LOGO_URL = 'https://bappatravels.com/logo512.png';

function formatTime12h(value) {
  if (!value) return '-';
  const raw = String(value).trim();
  if (/am|pm/i.test(raw)) return raw.toUpperCase();
  const match = raw.match(/^(\d{1,2})(?::(\d{2}))?/);
  if (!match) return raw;
  let h = parseInt(match[1], 10);
  const m = match[2] ? match[2] : '00';
  const suffix = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${suffix}`;
}

function buildDetailsRows({ fullName, email, mobileNumber, selectedCar, pickupDate, pickupTime, pickupLocation, dropoffLocation }) {
  const item = (label, value) => `
    <div style="margin:0 0 10px 0;">
      <div style="font-size:11px; letter-spacing:0.3px; color:${BRAND.muted}; text-transform:uppercase;">${label}</div>
      <div style="font-size:15px; color:${BRAND.text}; font-weight:600;">${value || '-'}</div>
    </div>`;

  const leftColumn = `
    <div style="border:1px solid ${BRAND.border}; border-radius:12px; padding:12px; background:#fff;">
      ${item('Name', fullName)}
      ${item('Email', email)}
      ${item('Mobile', mobileNumber)}
      ${item('Car', selectedCar)}
    </div>`;

  const rightColumn = `
    <div style="border:1px solid ${BRAND.border}; border-radius:12px; padding:12px; background:#fff;">
      ${item('Date', pickupDate)}
      ${item('Time', formatTime12h(pickupTime))}
      ${item('Pickup', pickupLocation)}
      ${item('Drop-off', dropoffLocation)}
    </div>`;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse; margin: 6px 0 0 0;">
      <tr>
        <td width="50%" valign="top" style="padding:8px 6px 8px 0;">${leftColumn}</td>
        <td width="50%" valign="top" style="padding:8px 0 8px 6px;">${rightColumn}</td>
      </tr>
    </table>`;
}

function buildWrapper({ title, intro, bodyHtml, footerNote }) {
  return `
  <div style="background:${BRAND.bg}; padding:24px 12px;">
    <div style="max-width:560px; margin:0 auto; background:#ffffff; border:1px solid ${BRAND.border}; border-radius:14px; overflow:hidden; box-shadow:0 6px 18px rgba(0,0,0,0.06); font-family: Arial, sans-serif;">
      <div style="display:flex; align-items:center; gap:12px; padding:16px 18px; background: linear-gradient(90deg, ${BRAND.primary}, ${BRAND.accent}); color:#fff;">
        <img src="${LOGO_URL}" alt="Bappa Travels" width="40" height="40" style="border-radius:8px; display:block;" />
        <div style="font-size:18px; font-weight:700;">Bappa Travels</div>
      </div>
      <div style="padding:20px 18px 8px 18px;">
        <h2 style="margin:0 0 8px 0; color:${BRAND.primaryDark}; font-size:20px;">${title}</h2>
        ${intro ? `<p style=\"margin:0 0 12px 0; color:${BRAND.text}; line-height:1.5;\">${intro}</p>` : ''}
        ${bodyHtml}
      </div>
      <div style="padding:14px 18px 18px 18px;">
        <div style="margin-top:8px; font-size:12px; color:${BRAND.muted};">${footerNote || 'Bappa Travels • Jalgaon • +91 90113 33966'}</div>
      </div>
    </div>
  </div>`;
}

function buildAdminEmailHTML(data) {
  const badge = `<span style=\"display:inline-block; padding:4px 10px; border-radius:999px; background:${BRAND.bg}; color:${BRAND.primaryDark}; font-size:12px; font-weight:700; border:1px solid ${BRAND.border};\">New Booking</span>`;
  const title = 'New Booking Received';
  const intro = `A new booking has been made. ${badge}`;
  const quick = `
    <div style=\"margin:12px 0 0 0;\">
      <a href=\"mailto:${data.email}\" style=\"display:inline-block; padding:8px 12px; background:${BRAND.primary}; color:#fff; text-decoration:none; border-radius:8px; font-weight:600; font-size:13px;\">Reply to customer</a>
      ${data.mobileNumber ? `<a href=\"tel:${data.mobileNumber}\" style=\"display:inline-block; margin-left:8px; padding:8px 12px; background:#eef7ef; color:${BRAND.primaryDark}; text-decoration:none; border-radius:8px; font-weight:600; font-size:13px; border:1px solid ${BRAND.border};\">Call ${data.mobileNumber}</a>` : ''}
    </div>`;
  const bodyHtml = buildDetailsRows(data) + quick;
  return buildWrapper({ title, intro, bodyHtml, footerNote: 'Admin notification • Please respond promptly.' });
}

function buildUserEmailHTML(kind, data, extra) {
  let title = 'Booking Update';
  let intro = `Dear <strong>${data.fullName}</strong>,`;
  let afterTableNote = '';
  let badge = '';

  if (kind === 'received') {
    title = 'We received your booking!';
    intro += ' thank you for choosing Bappa Travels. Your booking request has been received.';
    afterTableNote = 'Our team will review your request and get back to you soon.';
    badge = `<span style=\"display:inline-block; padding:4px 10px; border-radius:999px; background:#f3f4f6; color:#374151; font-size:12px; font-weight:700; border:1px solid ${BRAND.border};\">Pending</span>`;
  } else if (kind === 'accepted') {
    title = 'Your booking has been accepted';
    intro += ' great news! Your booking has been accepted.';
    afterTableNote = 'We look forward to serving you. For any changes, reply to this email.';
    badge = `<span style=\"display:inline-block; padding:4px 10px; border-radius:999px; background:#e8f5e9; color:${BRAND.primaryDark}; font-size:12px; font-weight:700; border:1px solid ${BRAND.border};\">Accepted</span>`;
  } else if (kind === 'rejected') {
    title = 'Your booking could not be fulfilled';
    intro += ' unfortunately, we cannot fulfill your booking at this time.';
    afterTableNote = `Reason: <span style=\"color:#c62828; font-weight:600;\">${(extra && extra.reason) || 'Not specified'}</span>`;
    badge = `<span style=\"display:inline-block; padding:4px 10px; border-radius:999px; background:#fdecea; color:#c62828; font-size:12px; font-weight:700; border:1px solid ${BRAND.border};\">Rejected</span>`;
  }

  const details = buildDetailsRows(data);
  const bodyHtml = `${badge ? `<div style=\"margin:0 0 10px 0;\">${badge}</div>` : ''}${details}
    <div style=\"margin-top:14px; padding:12px 14px; border:1px solid ${BRAND.border}; border-radius:10px; background:#f9fdf9; color:${BRAND.text};\">
      ${afterTableNote}
    </div>`;

  return buildWrapper({ title, intro, bodyHtml });
}

function buildFeedbackEmailHTML({ name, email, message, rating }) {
  const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating);
  const title = 'New Feedback Received';
  const intro = `You have received a new feedback from <strong>${name}</strong>.`;
  
  const bodyHtml = `
    <div style="background: #fff; border: 1px solid ${BRAND.border}; border-radius: 12px; padding: 16px;">
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; text-transform: uppercase; color: ${BRAND.muted}; margin-bottom: 4px;">Rating</div>
        <div style="font-size: 18px; color: #ffc107;">${stars}</div>
      </div>
      <div style="margin-bottom: 12px;">
        <div style="font-size: 11px; text-transform: uppercase; color: ${BRAND.muted}; margin-bottom: 4px;">From</div>
        <div style="font-size: 15px; color: ${BRAND.text};"><strong>${name}</strong> (${email})</div>
      </div>
      <div>
        <div style="font-size: 11px; text-transform: uppercase; color: ${BRAND.muted}; margin-bottom: 4px;">Message</div>
        <div style="font-size: 15px; color: ${BRAND.text}; line-height: 1.5;">${message}</div>
      </div>
    </div>
    <div style="margin-top: 16px;">
      <a href="mailto:${email}" style="display: inline-block; padding: 10px 20px; background: ${BRAND.primary}; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600;">Reply to User</a>
    </div>
  `;

  return buildWrapper({ title, intro, bodyHtml, footerNote: 'Feedback Notification' });
}

exports.sendEmail = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        return res.status(204).send('');
      }
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
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
        reason
      } = req.body || {};

      if (!fullName || !email) {
        return res.status(400).json({ message: 'Missing required fields: fullName or email' });
      }

      const { smtpUser, smtpPass, smtpFrom, adminEmail } = getConfig();
      if (!smtpUser || !smtpPass) {
        return res.status(500).json({ message: 'SMTP credentials are not configured' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      });

      const adminMailOptions = {
        from: smtpFrom,
        to: adminEmail,
        subject: 'New Booking Received - Bappa Travels',
        html: buildAdminEmailHTML({
          fullName,
          email,
          mobileNumber,
          selectedCar,
          pickupDate,
          pickupTime,
          pickupLocation,
          dropoffLocation
        })
      };

      try {
        if (status) {
          let subject;
          let html;
          if (status === 'accepted') {
            subject = 'Your Booking Has Been Accepted!';
            html = buildUserEmailHTML('accepted', {
              fullName,
              email,
              mobileNumber,
              selectedCar,
              pickupDate,
              pickupTime,
              pickupLocation,
              dropoffLocation
            });
          } else if (status === 'rejected') {
            subject = 'Your Booking Has Been Rejected';
            html = buildUserEmailHTML('rejected', {
              fullName,
              email,
              mobileNumber,
              selectedCar,
              pickupDate,
              pickupTime,
              pickupLocation,
              dropoffLocation
            }, { reason });
          } else {
            subject = `Booking Status: ${String(status).toUpperCase()}`;
            html = buildUserEmailHTML('received', {
              fullName,
              email,
              mobileNumber,
              selectedCar,
              pickupDate,
              pickupTime,
              pickupLocation,
              dropoffLocation
            });
          }

          await transporter.sendMail({ from: smtpFrom, to: email, subject, html });
          return res.status(200).json({ message: 'Status email sent successfully' });
        }

        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail({
          from: smtpFrom,
          to: email,
          subject: 'We received your booking – Bappa Travels',
          html: buildUserEmailHTML('received', {
            fullName,
            email,
            mobileNumber,
            selectedCar,
            pickupDate,
            pickupTime,
            pickupLocation,
            dropoffLocation
          })
        });

        return res.status(200).json({ message: 'Emails sent successfully' });
      } catch (err) {
        console.error('Error sending emails:', err);
        return res.status(500).json({ message: 'Failed to send emails', error: String(err) });
      }
    });
  });

exports.sendFeedback = functions
  .region('us-central1')
  .https.onRequest(async (req, res) => {
    return cors(req, res, async () => {
      if (req.method === 'OPTIONS') {
        return res.status(204).send('');
      }
      if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
      }

      const { name, email, message, rating } = req.body || {};

      if (!name || !email || !message || !rating) {
        return res.status(400).json({ message: 'Missing required fields' });
      }

      const { smtpUser, smtpPass, smtpFrom } = getConfig();
      if (!smtpUser || !smtpPass) {
        return res.status(500).json({ message: 'SMTP credentials are not configured' });
      }

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass }
      });

      const mailOptions = {
        from: smtpFrom,
        to: 'support@bappatravels.com', // As requested
        subject: `New Feedback from ${name} - Bappa Travels`,
        html: buildFeedbackEmailHTML({ name, email, message, rating })
      };

      try {
        await transporter.sendMail(mailOptions);
        return res.status(200).json({ message: 'Feedback email sent successfully' });
      } catch (err) {
        console.error('Error sending feedback email:', err);
        return res.status(500).json({ message: 'Failed to send email', error: String(err) });
      }
    });
  });