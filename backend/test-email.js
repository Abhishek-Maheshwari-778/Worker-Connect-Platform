/**
 * Test your Resend email configuration.
 * Usage:  node test-email.js your@email.com
 */

require('dotenv').config();

const to = process.argv[2];
if (!to) {
  console.error('❌ Usage: node test-email.js your@email.com');
  process.exit(1);
}

console.log('\n🔍 Checking Resend configuration...');
console.log('   RESEND_API_KEY:', process.env.RESEND_API_KEY ? '✅ SET (hidden)' : '❌ NOT SET');
console.log('   FROM_EMAIL    :', process.env.FROM_EMAIL    || '❌ NOT SET');
console.log('   FROM_NAME     :', process.env.FROM_NAME     || '❌ NOT SET');
console.log('');

if (!process.env.RESEND_API_KEY) {
  console.error('❌ RESEND_API_KEY is missing from your .env file');
  process.exit(1);
}

async function test() {
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  console.log(`📧 Sending test email to: ${to}`);

  const { data, error } = await resend.emails.send({
    from:    `${process.env.FROM_NAME || 'Labour Connect'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
    to,
    subject: '✅ Labour Connect — Email Test Successful',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:16px">
        <div style="background:linear-gradient(135deg,#f97316,#ea580c);padding:20px;border-radius:12px;text-align:center;margin-bottom:24px">
          <h1 style="color:#fff;margin:0;font-size:20px">Labour Connect</h1>
        </div>
        <h2 style="color:#16a34a;margin:0 0 12px">✅ Resend is working!</h2>
        <p style="color:#374151">Your email configuration is correct. OTP emails will now be delivered successfully.</p>
        <p style="color:#9ca3af;font-size:12px;margin-top:20px">Sent at: ${new Date().toLocaleString()}</p>
      </div>
    `,
  });

  if (error) {
    console.error('\n❌ Failed to send:', error.message);
    console.error('\n💡 Check that your RESEND_API_KEY is correct.');
    process.exit(1);
  }

  console.log('\n✅ Test email SENT successfully!');
  console.log('   Email ID:', data.id);
  console.log(`\n📬 Check your inbox at: ${to}`);
  console.log('   (Also check spam/junk folder)\n');
}

test().catch(err => {
  console.error('❌ Unexpected error:', err.message);
  process.exit(1);
});