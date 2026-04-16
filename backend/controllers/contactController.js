const asyncHandler = require('express-async-handler');
const Contact      = require('../models/contactModel');
const sendEmail    = require('../utils/sendEmail');
const { successResponse, paginatedResponse, getPaginationOptions } = require('../utils/apiResponse');

// IMPORTANT: Use SMTP_USER as the admin notification email.
// Any custom ADMIN_NOTIFY_EMAIL in .env will override this.
// Do NOT use labourconnect5@gmail.com unless that account actually exists.
const ADMIN_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || process.env.SMTP_USER;

/* ── HTML email templates ───────────────────────────────────────────────────── */
const notifyAdminHtml = (c) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#1e293b,#0f2744);padding:28px 32px">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="width:40px;height:40px;background:#f97316;border-radius:10px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-size:20px">✉️</span>
      </div>
      <div>
        <p style="color:#f97316;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;margin:0">New Contact Message</p>
        <p style="color:white;font-size:18px;font-weight:700;margin:4px 0 0">Labour Connect</p>
      </div>
    </div>
  </div>
  <div style="padding:28px 32px;background:white">
    <table style="width:100%;border-collapse:collapse">
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px;width:120px">From</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${c.name}</td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Email</td><td style="padding:8px 0;color:#f97316;font-weight:600"><a href="mailto:${c.email}" style="color:#f97316">${c.email}</a></td></tr>
      ${c.phone ? `<tr><td style="padding:8px 0;color:#64748b;font-size:13px">Phone</td><td style="padding:8px 0;color:#1e293b;font-weight:600">${c.phone}</td></tr>` : ''}
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Category</td><td style="padding:8px 0"><span style="background:#fef3c7;color:#92400e;padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize">${c.category}</span></td></tr>
      <tr><td style="padding:8px 0;color:#64748b;font-size:13px">Priority</td><td style="padding:8px 0"><span style="background:${c.priority==='urgent'?'#fee2e2':c.priority==='high'?'#fef3c7':'#f0fdf4'};color:${c.priority==='urgent'?'#991b1b':c.priority==='high'?'#92400e':'#166534'};padding:2px 10px;border-radius:20px;font-size:12px;font-weight:600;text-transform:capitalize">${c.priority}</span></td></tr>
    </table>
    <div style="margin-top:20px;padding:20px;background:#f8fafc;border-radius:10px;border-left:4px solid #f97316">
      <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px">Subject</p>
      <p style="color:#1e293b;font-size:15px;font-weight:600;margin:0">${c.subject}</p>
    </div>
    <div style="margin-top:16px;padding:20px;background:#f8fafc;border-radius:10px">
      <p style="color:#64748b;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px">Message</p>
      <p style="color:#374151;font-size:14px;line-height:1.7;margin:0;white-space:pre-wrap">${c.message}</p>
    </div>
    <div style="margin-top:24px;text-align:center">
      <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}/admin/contacts" 
        style="display:inline-block;background:linear-gradient(135deg,#f97316,#ea580c);color:white;padding:12px 28px;border-radius:10px;font-weight:600;text-decoration:none;font-size:14px">
        View in Admin Panel →
      </a>
    </div>
  </div>
  <div style="padding:16px 32px;background:#f8fafc;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">Received: ${new Date().toLocaleString('en-IN', {timeZone:'Asia/Kolkata'})} IST</p>
  </div>
</div>`;

const autoReplyHtml = (c) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center">
    <p style="color:white;font-size:24px;font-weight:700;margin:0">Labour<span style="opacity:.8">Connect</span></p>
    <p style="color:rgba(255,255,255,.85);font-size:14px;margin:8px 0 0">Smart Labour Hiring Platform</p>
  </div>
  <div style="padding:32px;background:white">
    <p style="color:#1e293b;font-size:16px;font-weight:600">Hi ${c.name},</p>
    <p style="color:#475569;line-height:1.7">Thank you for reaching out to us! We have received your message and our team will review it shortly.</p>
    <div style="padding:20px;background:#fff7ed;border-radius:10px;border-left:4px solid #f97316;margin:20px 0">
      <p style="color:#9a3412;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 6px">Your Message Summary</p>
      <p style="color:#1e293b;font-weight:600;margin:0 0 6px">${c.subject}</p>
      <p style="color:#64748b;font-size:13px;margin:0;line-height:1.6">${c.message.substring(0, 200)}${c.message.length > 200 ? '…' : ''}</p>
    </div>
    <p style="color:#475569;line-height:1.7">We typically respond within <strong>24–48 hours</strong> on business days. If your query is urgent, please mention it in a follow-up email.</p>
    <p style="color:#475569;margin-top:24px">Regards,<br><strong style="color:#1e293b">Labour Connect Support Team</strong></p>
  </div>
  <div style="padding:20px 32px;background:#f8fafc;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} Labour Connect • support@labourconnect.in</p>
  </div>
</div>`;

const replyEmailHtml = (c, replyMsg) => `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f8fafc;padding:0;border-radius:12px;overflow:hidden">
  <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:28px 32px;text-align:center">
    <p style="color:white;font-size:24px;font-weight:700;margin:0">Labour<span style="opacity:.8">Connect</span></p>
  </div>
  <div style="padding:32px;background:white">
    <p style="color:#1e293b;font-size:16px;font-weight:600">Hi ${c.name},</p>
    <p style="color:#475569;line-height:1.7">We have reviewed your query and here is our response:</p>
    <div style="padding:24px;background:#f8fafc;border-radius:10px;border-left:4px solid #3b82f6;margin:20px 0">
      <p style="color:#1d4ed8;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 10px">Response from Labour Connect Team</p>
      <p style="color:#1e293b;font-size:14px;line-height:1.8;margin:0;white-space:pre-wrap">${replyMsg}</p>
    </div>
    <div style="padding:16px;background:#f1f5f9;border-radius:8px;margin-top:20px">
      <p style="color:#64748b;font-size:12px;font-weight:600;margin:0 0 6px">Your original message:</p>
      <p style="color:#94a3b8;font-size:13px;margin:0;font-style:italic">"${c.message.substring(0, 150)}${c.message.length > 150 ? '…' : ''}"</p>
    </div>
    <p style="color:#475569;margin-top:24px;font-size:14px">If you have further questions, feel free to reply to this email or contact us again.</p>
    <p style="color:#475569;margin-top:16px">Regards,<br><strong style="color:#1e293b">Labour Connect Support Team</strong></p>
  </div>
  <div style="padding:20px 32px;background:#f8fafc;text-align:center">
    <p style="color:#94a3b8;font-size:12px;margin:0">© ${new Date().getFullYear()} Labour Connect • support@labourconnect.in</p>
  </div>
</div>`;

/* ── @route  POST /api/contact  (public) ────────────────────────────────────── */
const submitContact = asyncHandler(async (req, res) => {
  const { name, email, phone, subject, category, message, priority } = req.body;

  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    res.status(400); throw new Error('Name, email, subject, and message are required');
  }
  if (!/^\S+@\S+\.\S+$/.test(email)) {
    res.status(400); throw new Error('Please enter a valid email address');
  }

  // Determine priority from keywords
  const urgentKeywords = ['urgent', 'immediately', 'asap', 'emergency', 'critical'];
  const isUrgent = urgentKeywords.some(k => message.toLowerCase().includes(k) || subject.toLowerCase().includes(k));

  const contact = await Contact.create({
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: phone?.trim(),
    subject: subject.trim(),
    category: category || 'general',
    message: message.trim(),
    priority: isUrgent ? 'urgent' : (priority || 'normal'),
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });

  // Fire-and-forget email notifications — never block the API response
  // Contact is already saved in DB regardless of email outcome
  setImmediate(async () => {

    // 1. Notify admin (send to SMTP_USER — our own account, always works)
    try {
      await sendEmail({
        to:      ADMIN_EMAIL, // = SMTP_USER from .env (your actual Gmail)
        subject: `[LC Contact] ${isUrgent ? '🔴 URGENT: ' : ''}${subject} — from ${name}`,
        html:    notifyAdminHtml(contact),
        replyTo: `"${name}" <${email.trim()}>`, // reply goes to user's email
      });
      console.log(`📧 Admin notified: ${ADMIN_EMAIL}`);
    } catch (err) {
      console.error('Admin notify failed:', err.message);
    }

    // 2. Auto-reply to user — attempt but don't crash if their email is invalid
    try {
      await sendEmail({
        to:      email.trim(),
        subject: `We received your message — Labour Connect`,
        html:    autoReplyHtml(contact),
        replyTo: `"Labour Connect Support" <${process.env.SMTP_USER}>`,
      });
      console.log(`📧 Auto-reply sent to user: ${email}`);
    } catch (err) {
      // User's email may be wrong/unreachable — this is expected sometimes
      // Contact is saved, admin was notified — user can be replied from admin panel
      console.warn(`Auto-reply skipped for ${email}: ${err.message}`);
    }

  });

  successResponse(res, 201, 'Your message has been sent! We will get back to you within 24–48 hours.', {
    id: contact._id,
    isUrgent,
  });
});

/* ── @route  GET /api/admin/contacts  (admin) ───────────────────────────────── */
const getContacts = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPaginationOptions(req.query);
  const { status, category, priority, search, starred } = req.query;

  const filter = {};
  if (status)   filter.status   = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (starred === 'true') filter.isStarred = true;
  if (search) filter.$or = [
    { name:    { $regex: search, $options: 'i' } },
    { email:   { $regex: search, $options: 'i' } },
    { subject: { $regex: search, $options: 'i' } },
    { message: { $regex: search, $options: 'i' } },
  ];

  const [contacts, total, stats] = await Promise.all([
    Contact.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Contact.countDocuments(filter),
    Contact.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
  ]);

  const statusStats = { new: 0, read: 0, replied: 0, closed: 0 };
  stats.forEach(s => { statusStats[s._id] = s.count; });

  paginatedResponse(res, { contacts, stats: statusStats }, total, page, limit, 'Contacts fetched');
});

/* ── @route  GET /api/admin/contacts/:id  (admin) ───────────────────────────── */
const getContactById = asyncHandler(async (req, res) => {
  const contact = await Contact.findById(req.params.id);
  if (!contact) { res.status(404); throw new Error('Contact not found'); }

  // Mark as read on first view
  if (contact.status === 'new') {
    contact.status = 'read';
    await contact.save();
  }

  successResponse(res, 200, 'Contact fetched', contact);
});

/* ── @route  POST /api/admin/contacts/:id/reply  (admin) ───────────────────── */
const replyToContact = asyncHandler(async (req, res) => {
  const { message: replyMsg } = req.body;
  if (!replyMsg?.trim()) { res.status(400); throw new Error('Reply message is required'); }

  const contact = await Contact.findById(req.params.id);
  if (!contact) { res.status(404); throw new Error('Contact not found'); }

  // Send reply email to the contact's email address
  // This is a manual admin action — admin has verified the email is correct
  try {
    await sendEmail({
      to:      contact.email,
      subject: `Re: ${contact.subject} — Labour Connect Support`,
      html:    replyEmailHtml(contact, replyMsg.trim()),
      replyTo: `"Labour Connect Support" <${process.env.SMTP_USER}>`,
    });
  } catch (emailErr) {
    // If email fails, still save the reply in DB but warn admin
    contact.replies.push({
      sentBy: req.user?.name || 'Admin',
      message: replyMsg.trim(),
      emailSent: false,
    });
    contact.status = 'replied';
    await contact.save();
    res.status(200);
    return successResponse(res, 200, `Reply saved but email delivery failed: ${emailErr.message}. The message is stored in the contact record.`, contact);
  }

  // CC our own admin email for records
  sendEmail({
    to:      process.env.ADMIN_NOTIFY_EMAIL || 'labourconnect5@gmail.com',
    subject: `[Sent Reply] Re: ${contact.subject} → ${contact.name} (${contact.email})`,
    html:    '<div style="font-family:Arial,sans-serif;padding:20px"><h3>Reply sent to ' + contact.name + '</h3><p><strong>Email:</strong> ' + contact.email + '</p><hr><p>' + replyMsg.split('\n').join('<br>') + '</p></div>',
  }).catch(() => {});

  contact.replies.push({ sentBy: req.user?.name || 'Admin', message: replyMsg.trim(), emailSent: true });
  contact.status = 'replied';
  await contact.save();

  successResponse(res, 200, 'Reply sent successfully', contact);
});

/* ── @route  PATCH /api/admin/contacts/:id  (admin) ────────────────────────── */
const updateContact = asyncHandler(async (req, res) => {
  const { status, priority, isStarred, adminNotes } = req.body;
  const contact = await Contact.findById(req.params.id);
  if (!contact) { res.status(404); throw new Error('Contact not found'); }

  if (status)     contact.status     = status;
  if (priority)   contact.priority   = priority;
  if (isStarred !== undefined) contact.isStarred = isStarred;
  if (adminNotes !== undefined) contact.adminNotes = adminNotes;
  await contact.save();

  successResponse(res, 200, 'Contact updated', contact);
});

/* ── @route  DELETE /api/admin/contacts/:id  (admin) ───────────────────────── */
const deleteContact = asyncHandler(async (req, res) => {
  await Contact.findByIdAndDelete(req.params.id);
  successResponse(res, 200, 'Contact deleted');
});

module.exports = { submitContact, getContacts, getContactById, replyToContact, updateContact, deleteContact };