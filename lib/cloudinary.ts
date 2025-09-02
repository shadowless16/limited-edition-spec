import { v2 as cloudinary } from "cloudinary"

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export const uploadImage = async (file: File): Promise<{ url: string; publicId: string }> => {
  const bytes = await file.arrayBuffer()
  const buffer = Buffer.from(bytes)

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          resource_type: "image",
          folder: "limited-edition-products",
          transformation: [{ width: 800, height: 800, crop: "fill", quality: "auto" }],
        },
        (error, result) => {
          if (error) {
            reject(error)
          } else {
            resolve({ url: result!.secure_url, publicId: result!.public_id })
          }
        },
      )
      .end(buffer)
  })
}

export const deleteImage = async (publicId: string): Promise<void> => {
  await cloudinary.uploader.destroy(publicId)
}

export default cloudinary
