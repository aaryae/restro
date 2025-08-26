const { v4: uuidv4 } = require("uuid");

const generateUUID = () => {
  console.log("running +++++++++++++++++++++++++++++++++++");
  console.log(uuidv4(), "helllll");
  return uuidv4();
};

module.exports = { generateUUID };
