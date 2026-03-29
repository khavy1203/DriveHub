import mailService from '../service/mailService.js';

const PHONE_PATTERN = /^[\d\s+().-]{8,30}$/;

const submitContactLead = async (req, res, next) => {
  try {
    const rawName = req.body?.name;
    const rawPhone = req.body?.phone;
    const rawEmail = req.body?.email;

    const name = typeof rawName === 'string' ? rawName.trim().slice(0, 200) : '';
    const phone = typeof rawPhone === 'string' ? rawPhone.trim().slice(0, 30) : '';
    const email = typeof rawEmail === 'string' ? rawEmail.trim().slice(0, 255) : '';

    if (!name || !phone) {
      return res.status(400).json({ EM: 'Vui lòng nhập họ tên và số điện thoại', EC: -1, DT: null });
    }
    if (!PHONE_PATTERN.test(phone)) {
      return res.status(400).json({ EM: 'Số điện thoại không hợp lệ', EC: -1, DT: null });
    }
    const digitsOnly = phone.replace(/\D/g, '');
    if (digitsOnly.length < 8) {
      return res.status(400).json({ EM: 'Số điện thoại không hợp lệ', EC: -1, DT: null });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ EM: 'Email không hợp lệ', EC: -1, DT: null });
    }

    const result = await mailService.sendContactLeadNotification({
      name,
      phone,
      email: email || null,
    });

    if (result.reason === 'not_configured' || result.reason === 'no_recipient') {
      return res.status(200).json({ EM: 'Chưa cấu hình gửi email trên máy chủ', EC: 1, DT: null });
    }
    if (!result.ok) {
      return res.status(500).json({ EM: 'Gửi email thất bại', EC: -1, DT: null });
    }
    return res.status(200).json({ EM: 'Đã gửi thông tin. Chúng tôi sẽ liên hệ sớm.', EC: 0, DT: null });
  } catch (err) {
    next(err);
  }
};

export default { submitContactLead };
