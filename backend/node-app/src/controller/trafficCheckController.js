import axios from "axios";

const lookupTrafficViolation = async (req, res) => {
    try {
        const { BienKiemSoat, LoaiXe } = req.body;

        if (!BienKiemSoat || !LoaiXe) {
            return res.status(400).json({ success: false, message: 'Missing license plate or vehicle type.' });
        }

        const sessionResponse = await axios.get('https://csgt.vn/tra-cuu-phat-nguoi', {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
            },
            timeout: 10000,
        });

        const html = sessionResponse.data;
        const setCookie = sessionResponse.headers['set-cookie'] || [];
        
        const tokenMatch = html.match(/name="_token"\s+value="([^"]+)"/) || html.match(/value="([^"]+)"\s+name="_token"/);
        const csrfToken = tokenMatch ? tokenMatch[1] : '';

        const cookiesMap = new Map();
        setCookie.forEach(cookie => {
            const [kv] = cookie.split(';');
            const [key, val] = kv.split('=');
            cookiesMap.set(key.trim(), val);
        });

        const cookieHeader = Array.from(cookiesMap.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('; ');

        const params = new URLSearchParams();
        params.append('_token', csrfToken);
        params.append('BienKiemSoat', BienKiemSoat.trim());
        params.append('LoaiXe', LoaiXe);
        params.append('g-recaptcha-response', '');

        const searchResponse = await axios.post(
            'https://csgt.vn/tra-cuu-vi-pham-qua-hinh-anh',
            params.toString(),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-XSRF-TOKEN': cookiesMap.get('XSRF-TOKEN') ? decodeURIComponent(cookiesMap.get('XSRF-TOKEN')) : '',
                    'Origin': 'https://csgt.vn',
                    'Referer': 'https://csgt.vn/tra-cuu-phat-nguoi',
                    'Cookie': cookieHeader,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                    'Accept': 'application/json, text/javascript, */*; q=0.01',
                    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8',
                },
                maxRedirects: 5,
                timeout: 20000,
            }
        );

        const data = searchResponse.data;
        
        if (typeof data === 'string' && data.includes('Unauthorized')) {
            return res.status(200).json({
                success: false,
                message: 'Hệ thống CSGT yêu cầu xác thực bảo mật mới. Vui lòng làm mới trang và thử lại.'
            });
        }

        return res.status(200).json({
            success: true,
            data: Array.isArray(data) ? data : (data?.data || []),
        });

    } catch (error) {
        console.error('[TrafficCheck Error]', error?.message);
        if (error.response) {
            console.error('[CSGT API Response]:', error.response.status, JSON.stringify(error.response.data));
        }
        return res.status(200).json({ 
            success: false, 
            message: 'Không thể kết nối trực tiếp đến Cục CSGT (vướng Captcha bảo mật). Vui lòng thử tra cứu trên web chính chủ csgt.vn.' 
        });
    }
};

export default { lookupTrafficViolation };
