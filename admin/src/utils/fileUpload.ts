type DataType = Record<string, any>;
type ImageType = Record<string, File | File[]>;

export default function getFormData(data: DataType, images: ImageType) {
  const formData = new FormData();

  // Append normal form data
  for (let key in data) {
    formData.append(key, data[key]);
  }

  // Append images
  Object.keys(images).forEach((each) => {
    if (Array.isArray(images[each])) {
      images[each].forEach((fileObj) => {
        formData.append("image", fileObj); // Corrected key usage
      });
    } else {
      formData.append("image", images[each]); // Single image upload
    }
  });

  return formData;
}
