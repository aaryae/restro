const httpStatus = require("http-status");
const responseHelper = require("./response-helper");
const validationHelper = {};
const internal = {};

internal.buildUsefulErrorObject = (errors) => {
  let sendObject = {};
  if (errors) {
    let errorProcess = errors.details ? errors.details : null;
    if (!errorProcess) {
      errorProcess = errors.detail ? errors.detail : null;
    }
    if (!errorProcess) {
      errorProcess = errors.length ? errors : null;
    }
    if (errorProcess) {
      // Group messages by path to handle multiples without assuming type early
      const grouped = {};
      errorProcess.forEach((detail) => {
        let msg = `${detail.message.replace(/['"]/g, "")}`;
        const pathKey = detail.path.join(".");
        if (!grouped[pathKey]) {
          grouped[pathKey] = [];
        }
        grouped[pathKey].push(msg);
      });

      // Now build the nested object, using arrays for fields with multiple msgs
      Object.keys(grouped).forEach((pathKey) => {
        const msgs = grouped[pathKey];
        const keys = pathKey.split(".");
        let ref = sendObject;
        for (let i = 0; i < keys.length; i++) {
          let k = keys[i];
          const isIndex = Number(k).toString() !== "NaN";
          if (i === keys.length - 1) {
            // Leaf: if multiple msgs, use array; if one, use string for BC
            ref[k] = msgs.length > 1 ? msgs : msgs[0];
          } else {
            if (!ref[k]) {
              // Decide type based on next key
              const nextIsIndex =
                i + 1 < keys.length && Number(keys[i + 1]).toString() !== "NaN";
              ref[k] = nextIsIndex ? [] : {};
            }
            ref = ref[k];
          }
        }
      });
    }
  }
  return sendObject;
};

validationHelper.validateRequestBody = (req, res, validationModule, opt) => {
  try {
    const options = opt || {
      abortEarly: false,
    };
    const validation = validationModule.validate(req.body, options);
    if (validation.error) {
      const errors = internal.buildUsefulErrorObject(validation.error);
      return errors;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

validationHelper.validateRequestParams = (req, res, validationModule, opt) => {
  const options = opt || {
    abortEarly: false,
  };
  const validation = validationModule.validate(req.params, options);
  if (validation.error) {
    const errors = internal.buildUsefulErrorObject(validation.error);
    return errors;
  } else {
    return null;
  }
};

validationHelper.validateRequestQuery = (req, res, validationModule, opt) => {
  try {
    const options = {
      abortEarly: false,
    };
    const validation = validationModule.validate(req.query, options);
    if (validation.error) {
      const errors = internal.buildUsefulErrorObject(validation.error);
      return errors;
    } else {
      return null;
    }
  } catch (err) {
    throw err;
  }
};

validationHelper.requireJsonData = (req, res, next) => {
  if (req.headers["content-type"] !== "application/json") {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Server requires application/json got ${req.headers["content-type"]}`,
      "Bad Request.",
      null,
    );
  } else {
    return next();
  }
};

validationHelper.requireMultipartFormData = (req, res, next) => {
  if (!req.headers["content-type"]?.includes("multipart/form-data")) {
    return responseHelper.sendResponse(
      res,
      httpStatus.BAD_REQUEST,
      false,
      null,
      `Server requires multipart/form-data got ${req.headers["content-type"]}`,
      "Bad Request.",
      null,
    );
  } else {
    return next();
  }
};

module.exports = validationHelper;
