require("dotenv").config();
import loginRegisterNewUser from "../service/loginRegisterService";
import authSessionService from "../service/authSessionService";

const buildCookieOptions = () => ({
  maxAge: Number(process.env.SESSION_TTL_MS || 7 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.COOKIE_SECURE === 'true',
});
const handleRegister = async (req, res) => {
  try {
    //email, phone, username, password * validate phía sever
    if (
      !req.body.email ||
      !req.body.password ||
      !req.body.phone ||
      !req.body.username
    ) {
      return res.status(200).json({
        EM: "Missing requeried parameters", //error message
        EC: 2, //error code post
        DT: [],
      });
    }
    if (req.body.password.length < 6) {
      return res.status(200).json({
        EM: "Your password must have more than 6 letters", //error message
        EC: 1, //error code post
        DT: [],
      });
    }
    //service * call service create user
    let data = await loginRegisterNewUser.registerNewUser(req.body);
    res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: "",
    });
  } catch (e) {
    console.error("Lỗi trong quá trình xử lý dữ liệu:", error);
    return ({
      EM: "Some error",
      EC: -1,
      DT: []
    });
  }
};
const handleLogin = async (req, res) => {
  //call login service
  try {
    let data = await loginRegisterNewUser.loginUserService(req.body);
    if (data && data.DT && data.DT.access_token) {
      const cookieOptions = buildCookieOptions();
      const session = await authSessionService.createSession({
        userId: data.DT.userId,
        req,
      });

      res.cookie("jwt", data.DT.access_token, cookieOptions);
      res.cookie("session_id", session.sessionId, cookieOptions);
    }
    res.status(200).json({
      EM: data.EM,
      EC: data.EC,
      DT: data.DT,
    });
  } catch (e) {
    console.error("check error: ", e);
    return res.status(500).json({
      EM: "error from sever", //error message
      EC: -1, //error code
      DT: "",
    });
  }
};
const handleLogout = async (req, res) => {
  //call logout service
  try {
    const sessionId = req.cookies?.session_id;
    await authSessionService.revokeSession(sessionId);
    res.clearCookie("jwt");
    res.clearCookie("session_id");
    res.status(200).json({
      EM: "Clear cookie successfully",
      EC: 0,
      DT: "",
    });
  } catch (e) {
    console.error("check error: ", e);
    return res.status(500).json({
      EM: "error from sever", //error message
      EC: -1, //error code
      DT: "",
    });
  }
};

module.exports = {
  handleRegister,
  handleLogin,
  handleLogout,
};