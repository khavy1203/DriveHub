import nodemailer from 'nodemailer';

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: parseInt(process.env.MAIL_PORT ?? '587', 10),
    secure: process.env.MAIL_SECURE === 'true',
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
};

const isConfigured = () => !!(process.env.MAIL_USER && process.env.MAIL_PASS && process.env.MAIL_HOST);

// ── Gửi link thiết lập mật khẩu lần đầu ─────────────────────────────────────
const sendSetupEmail = async ({ toEmail, hoTen, setupLink, role = 'học viên' }) => {
  if (!isConfigured()) {
    console.warn('[mailService] Chưa cấu hình SMTP — bỏ qua gửi email setup');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"DriveHub" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: `Thiết lập tài khoản ${role} DriveHub`,
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:10px">
          <h2 style="color:#00685d;margin-top:0">Chào mừng bạn đến với DriveHub!</h2>
          <p>Xin chào <strong>${hoTen}</strong>,</p>
          <p>Tài khoản <strong>${role}</strong> của bạn đã được tạo trong hệ thống DriveHub. Vui lòng nhấn nút bên dưới để thiết lập mật khẩu và bắt đầu sử dụng.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${setupLink}"
               style="background:#00685d;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;display:inline-block">
              Thiết lập mật khẩu
            </a>
          </div>
          <p style="color:#757575;font-size:13px">Hoặc copy link sau vào trình duyệt:<br/>
            <a href="${setupLink}" style="color:#00685d;word-break:break-all">${setupLink}</a>
          </p>
          <p style="color:#e53935;font-size:13px">⚠️ Link này có hiệu lực trong <strong>7 ngày</strong>. Sau đó vui lòng liên hệ quản trị viên để được cấp lại.</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0"/>
          <p style="font-size:12px;color:#9e9e9e">Email này được gửi tự động từ hệ thống DriveHub. Vui lòng không trả lời.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (e) {
    console.error('[mailService.sendSetupEmail]', e.message);
    return { ok: false, reason: e.message };
  }
};

// ── Gửi lại thông tin credentials (fallback nếu không có email) ───────────────
const sendHocVienCredentials = async ({ toEmail, hoTen, username, password }) => {
  if (!isConfigured()) {
    console.warn('[mailService] Chưa cấu hình SMTP — bỏ qua gửi email credentials');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"DriveHub" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: 'Tài khoản học viên DriveHub của bạn',
      html: `
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e0e0e0;border-radius:8px">
          <h2 style="color:#00685d;margin-top:0">Tài khoản học viên DriveHub</h2>
          <p>Xin chào <strong>${hoTen}</strong>,</p>
          <div style="background:#f5f5f5;border-radius:6px;padding:16px;margin:16px 0">
            <p style="margin:4px 0"><strong>Tên đăng nhập:</strong> ${username}</p>
            <p style="margin:4px 0"><strong>Mật khẩu:</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px">${password}</code></p>
          </div>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0"/>
          <p style="font-size:12px;color:#9e9e9e">Email tự động từ DriveHub.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (e) {
    console.error('[mailService.sendHocVienCredentials]', e.message);
    return { ok: false, reason: e.message };
  }
};

// ── Gửi link đặt lại mật khẩu (quên mật khẩu) ───────────────────────────────
const sendResetEmail = async ({ toEmail, hoTen, setupLink }) => {
  if (!isConfigured()) {
    console.warn('[mailService] Chưa cấu hình SMTP — bỏ qua gửi email reset');
    return { ok: false, reason: 'not_configured' };
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"DriveHub" <${process.env.MAIL_USER}>`,
      to: toEmail,
      subject: 'Đặt lại mật khẩu DriveHub',
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;border:1px solid #e0e0e0;border-radius:10px">
          <h2 style="color:#00685d;margin-top:0">Đặt lại mật khẩu</h2>
          <p>Xin chào <strong>${hoTen}</strong>,</p>
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn. Nhấn nút bên dưới để tiếp tục.</p>
          <div style="text-align:center;margin:32px 0">
            <a href="${setupLink}"
               style="background:#00685d;color:#fff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:16px;font-weight:700;display:inline-block">
              Đặt lại mật khẩu
            </a>
          </div>
          <p style="color:#757575;font-size:13px">Hoặc copy link sau vào trình duyệt:<br/>
            <a href="${setupLink}" style="color:#00685d;word-break:break-all">${setupLink}</a>
          </p>
          <p style="color:#e53935;font-size:13px">⚠️ Link này có hiệu lực trong <strong>7 ngày</strong>. Nếu bạn không yêu cầu đặt lại mật khẩu, hãy bỏ qua email này.</p>
          <hr style="border:none;border-top:1px solid #e0e0e0;margin:24px 0"/>
          <p style="font-size:12px;color:#9e9e9e">Email này được gửi tự động từ hệ thống DriveHub. Vui lòng không trả lời.</p>
        </div>
      `,
    });
    return { ok: true };
  } catch (e) {
    console.error('[mailService.sendResetEmail]', e.message);
    return { ok: false, reason: e.message };
  }
};

export default { sendSetupEmail, sendHocVienCredentials, sendResetEmail };
