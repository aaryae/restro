const isLoggedIn = (req, res, next) => {
  if (req.user) {
    console.log(req.user);
    return next();
  } else {
    console.log("User is not logged in.");
    return res.sendStatus(401);
  }
};

module.exports = { isLoggedIn };
