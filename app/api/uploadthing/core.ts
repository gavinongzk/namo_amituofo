import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError, UTApi } from "uploadthing/server";
import sharp from 'sharp';

const f = createUploadthing();
const utapi = new UTApi(); // Initialize UTApi

const auth = (req: Request) => ({ id: "fakeId" }); // Fake auth function

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  imageUploader: f({ image: { maxFileSize: "4MB" } }) // Consider maxFileCount: 1 if only one image is expected
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      const user = await auth(req);

      // If you throw, the user will not be able to upload
      if (!user) throw new UploadThingError("Unauthorized");

      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("Original file url:", file.url);
      console.log("Original file key:", file.key);

      try {
        // 1. Fetch the uploaded image
        const response = await fetch(file.url);
        if (!response.ok) {
          throw new UploadThingError(`Failed to fetch original image: ${response.statusText}`);
        }
        const imageBuffer = await response.arrayBuffer();

        // 2. Process the image with Sharp
        const processedImageBuffer = await sharp(Buffer.from(imageBuffer))
          .resize(1200, 630, {
            fit: 'cover', // Ensures the image covers 1200x630 and crops excess
            position: sharp.strategy.entropy // Smart cropping strategy
          })
          .jpeg({ quality: 80, progressive: true }) // Convert to JPEG, adjust quality for size
          .toBuffer();

        if (processedImageBuffer.length > 600 * 1024) {
          console.warn(`Processed image for ${file.name} is ${Math.round(processedImageBuffer.length / 1024)}KB, which might be too large for optimal WhatsApp preview. Target is < 600KB.`);
          // You could add further compression steps or throw an error here if strict size compliance is needed.
        }

        // 3. Upload the processed image back to UploadThing
        const processedFileName = `processed-${file.name || Date.now() + '.jpg'}`;
        const processedFile = new File([processedImageBuffer], processedFileName, { type: 'image/jpeg' });
        
        const [processedUploadResult] = await utapi.uploadFiles(processedFile);

        if (processedUploadResult.error) {
          console.error("Failed to upload processed image to UploadThing:", processedUploadResult.error);
          throw new UploadThingError(`Failed to re-upload processed image: ${processedUploadResult.error.message}`);
        }

        const newUrl = processedUploadResult.data?.url;
        if (!newUrl) {
          throw new UploadThingError("Processed image URL not found after re-upload.");
        }
        console.log("Processed file url:", newUrl);

        // 4. Delete the original unprocessed image from UploadThing
        try {
          await utapi.deleteFiles(file.key);
          console.log("Successfully deleted original file:", file.key);
        } catch (deleteError) {
          console.error("Failed to delete original file:", file.key, deleteError);
          // Log this error but don't fail the whole operation, as the processed image is available.
        }

        // 5. Return the URL of the processed image and other metadata
        // This will be sent to the client-side `onClientUploadComplete` callback
        return {
          processedFileUrl: newUrl,
          uploadedBy: metadata.userId,
          originalFileUrl: file.url // For potential client-side reference or debugging
        };

      } catch (error) {
        console.error("Error processing image in onUploadComplete:", error);
        // If processing fails, rethrow to notify the client.
        if (error instanceof UploadThingError) {
          throw error;
        }
        // Ensure a generic UploadThingError is thrown for other errors
        throw new UploadThingError(`An unexpected error occurred during image processing: ${error instanceof Error ? error.message : String(error)}`);
      }
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
