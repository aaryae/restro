const isValidCaptcha = async (req, res, next) => {
  try {
    const { captchaToken } = req.body;
    let formData = new FormData();
    formData.append("secret", process.env.SECRET_KEY);
    formData.append("response", captchaToken);

    console.log(captchaToken, "cccccccccccccccccccccccccccccccc");
    const url = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
    const result = await fetch(url, {
      body: formData,
      method: "POST",
    });
    console.log(result, "rrrrrrrrrrrrrrrrrrrr");
    const challengeSucceeded = (await result.json()).success;
    if (!challengeSucceeded) {
      return res.status(403).json({ msg: "Invalid reCAPTCHA token" });
    }
    next();
  } catch (e) {
    throw e;
  }
};

module.exports = { isValidCaptcha };
