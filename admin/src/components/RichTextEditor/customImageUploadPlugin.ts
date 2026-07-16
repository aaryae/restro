import { BACKEND_BASE_URL, IMAGE_BASE_URL } from "@/constants";
import { getToken } from "@/utils/tokenHandler";

class CustomUploadAdapter {
  constructor(loader) {
    this.loader = loader;
  }

  async upload() {
    const file = await this.loader.file;

    // Ensure the file is available for multiple uploads
    if (!file) {
      return Promise.reject("No file available for upload.");
    }

    const token = getToken("token");

    if (!token) {
      return Promise.reject("Authentication Token not found");
    }

    return this.loader.file.then(
      (file) =>
        new Promise((resolve, reject) => {
          const formData = new FormData();
          formData.append("image", file);
          formData.append("mediaCategoryId", "354");

          fetch(`${BACKEND_BASE_URL}media`, {
            method: "POST",
            body: formData,
            headers: {
              Authorization: `Admin ${token}`,
            },
          })
            .then((response) => response.json())
            .then((data) => {
              if (data) {
                resolve({ default: `${IMAGE_BASE_URL}${data.data.path}` });
              } else {
                this.__handleUploadFailure(
                  reject,
                  data.error || "Upload Failed",
                );
              }
            })
            .catch((error) => this.__handleUploadFailure(reject, error));
        }),
    );
  }
  __handleUploadFailure(reject, errorMessage) {
    if (this.loader && typeof this.loader.abort === "function") {
      this.loader.abort();
    }

    reject(errorMessage);
  }
}

export default function CustomUploadAdapterPlugin(editor) {
  editor.plugins.get("FileRepository").createUploadAdapter = (loader) => {
    return new CustomUploadAdapter(loader);
  };
}
