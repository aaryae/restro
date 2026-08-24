const bulkUploadHelper = (data, id) => {
  const bulkData = data.map((each) => {
    return { imageUrl: each, productVariantId: id };
  });
  return bulkData;
};

module.exports = bulkUploadHelper;
