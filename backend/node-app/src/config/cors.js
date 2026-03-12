
require('dotenv').config();
const configCors = (app) => {
    const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000,https://localhost:3000')
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);

    app.use(function (req, res, next) {
        const requestOrigin = req.headers.origin;
        const isAllowedOrigin = !requestOrigin || corsOrigins.includes(requestOrigin);

        if (!isAllowedOrigin) {
            return res.status(403).json({
                error: 'cors_forbidden',
                details: {
                    message: 'Origin is not allowed by CORS',
                    origin: requestOrigin
                }
            });
        }

        if (requestOrigin) {
            res.setHeader('Access-Control-Allow-Origin', requestOrigin);
            res.setHeader('Vary', 'Origin');
        }

        // Request methods you wish to allow
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

        // Request headers you wish to allow, thêm authorization để có thể hiểu có header
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

        // Set to true if you need the website to include cookies in the requests sent
        // to the API (e.g. in case you use sessions)

        // res.setHeader('Access-Control-Allow-Credentials', true);

        if (req.method == 'OPTIONS') {
            return res.status(204).end();
        }
        
        // Pass to next layer of middleware
        next();
    });

};

export default configCors;