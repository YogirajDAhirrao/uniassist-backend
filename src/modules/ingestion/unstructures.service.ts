import https from "https";
import FormData from "form-data";

export class UnstructuredService {
  async extractText(fileBuffer: Buffer) {
    const formData = new FormData();

    formData.append("files", fileBuffer, {
      filename: "document.pdf",
      contentType: "application/pdf",
    });

    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          method: "POST",
          hostname: "api.unstructuredapp.io",
          path: "/general/v0/general",
          headers: {
            ...formData.getHeaders(),
            "unstructured-api-key": process.env.UNSTRUCTURED_API_KEY,
          },
        },
        (res) => {
          let data = "";

          res.on("data", (chunk) => {
            data += chunk;
          });

          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch {
              reject(new Error("Invalid response from Unstructured API"));
            }
          });
        },
      );

      req.on("error", reject);
      formData.pipe(req);
    });
  }
}
