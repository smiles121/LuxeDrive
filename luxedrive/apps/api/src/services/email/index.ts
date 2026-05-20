// ─────────────────────────────────────────────
// LuxeDrive — Email Service
// Uses Nodemailer + Handlebars templates
// ─────────────────────────────────────────────

import nodemailer from 'nodemailer'
import handlebars from 'handlebars'
import fs from 'fs'
import path from 'path'

interface EmailOptions {
  to: string
  subject: string
  template: string
  data: Record<string, any>
}

const transporter = nodemailer.createTransporter({
  host:   process.env.SMTP_HOST,
  port:   parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

function loadTemplate(name: string): handlebars.TemplateDelegate {
  const templatePath = path.join(__dirname, '../../email-templates', `${name}.hbs`)

  if (!fs.existsSync(templatePath)) {
    // Fallback to inline template if file not found
    return handlebars.compile(getFallbackTemplate(name))
  }

  const source = fs.readFileSync(templatePath, 'utf8')
  return handlebars.compile(source)
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const template = loadTemplate(options.template)
    const html = template({
      ...options.data,
      year:        new Date().getFullYear(),
      companyName: process.env.COMPANY_NAME || 'LuxeDrive',
      companyEmail:process.env.COMPANY_EMAIL,
      appUrl:      process.env.WEB_URL,
    })

    await transporter.sendMail({
      from:    `"${process.env.EMAIL_FROM_NAME || 'LuxeDrive'}" <${process.env.EMAIL_FROM}>`,
      to:      options.to,
      subject: options.subject,
      html,
    })
  } catch (err) {
    // Log but don't throw — email failures shouldn't break the main flow
    console.error('Email send failed:', err)
  }
}

// ── Fallback inline templates (used in dev / if .hbs files are missing) ──

function getFallbackTemplate(name: string): string {
  const base = (content: string) => `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Georgia, serif; background: #080808; color: #F5F5F5; margin: 0; padding: 40px 20px; }
        .container { max-width: 600px; margin: 0 auto; background: #161616; border-radius: 12px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #FFD700, #B89900); padding: 32px; text-align: center; }
        .header h1 { margin: 0; color: #080808; font-size: 28px; letter-spacing: 2px; }
        .body { padding: 40px 32px; }
        .body h2 { color: #FFD700; margin-top: 0; }
        .detail-row { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #2a2a2a; }
        .label { color: #9E9E9E; font-size: 14px; }
        .value { color: #F5F5F5; font-weight: bold; }
        .btn { display: inline-block; margin: 24px 0; padding: 14px 32px; background: #FFD700; color: #080808; text-decoration: none; border-radius: 6px; font-weight: bold; }
        .footer { padding: 24px 32px; text-align: center; color: #757575; font-size: 12px; border-top: 1px solid #2a2a2a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header"><h1>✦ LUXEDRIVE</h1></div>
        <div class="body">${content}</div>
        <div class="footer">© {{year}} {{companyName}}. All rights reserved.<br>{{companyEmail}}</div>
      </div>
    </body>
    </html>
  `

  const templates: Record<string, string> = {
    'verify-email': base(`
      <h2>Welcome, {{firstName}}!</h2>
      <p>Thank you for joining LuxeDrive. Please verify your email to activate your account.</p>
      <a href="{{verifyUrl}}" class="btn">Verify My Email</a>
      <p style="color:#757575;font-size:12px">This link expires in 24 hours.</p>
    `),
    'reset-password': base(`
      <h2>Reset Your Password</h2>
      <p>Hello {{firstName}}, we received a request to reset your password.</p>
      <a href="{{resetUrl}}" class="btn">Reset Password</a>
      <p style="color:#757575;font-size:12px">This link expires in {{expiryMinutes}} minutes. If you didn't request this, you can safely ignore it.</p>
    `),
    'booking-received': base(`
      <h2>Booking Received! 🚗</h2>
      <p>Hello {{firstName}}, we've received your booking request.</p>
      <div class="detail-row"><span class="label">Reference</span><span class="value">{{reference}}</span></div>
      <div class="detail-row"><span class="label">Vehicle</span><span class="value">{{vehicleTitle}}</span></div>
      <div class="detail-row"><span class="label">Pickup</span><span class="value">{{pickupDate}} · {{pickupLocation}}</span></div>
      <div class="detail-row"><span class="label">Dropoff</span><span class="value">{{dropoffDate}}</span></div>
      <div class="detail-row"><span class="label">Total</span><span class="value" style="color:#FFD700">{{totalAmount}}</span></div>
      <p style="margin-top:24px;color:#9E9E9E">Your booking is pending payment confirmation. Please complete your payment to secure this vehicle.</p>
    `),
    'payment-receipt': base(`
      <h2>Payment Confirmed ✓</h2>
      <p>Hello {{firstName}}, your payment has been received.</p>
      <div class="detail-row"><span class="label">Booking Ref</span><span class="value">{{reference}}</span></div>
      <div class="detail-row"><span class="label">Vehicle</span><span class="value">{{vehicleTitle}}</span></div>
      <div class="detail-row"><span class="label">Amount</span><span class="value" style="color:#FFD700">{{amount}}</span></div>
      <div class="detail-row"><span class="label">Transaction ID</span><span class="value">{{transactionId}}</span></div>
      <div class="detail-row"><span class="label">Date</span><span class="value">{{paidAt}}</span></div>
      <div class="detail-row"><span class="label">Loyalty Points</span><span class="value">+{{pointsEarned}} pts</span></div>
    `),
  }

  return templates[name] || base('<p>Thank you for using LuxeDrive.</p>')
}
