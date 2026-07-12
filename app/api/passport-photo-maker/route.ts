import { NextRequest, NextResponse } from "next/server";
import multer from "multer";
import sharp from "sharp";

// Multer setup to store file in memory
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed!"));
    }
  },
}).single("image");

// Helper function to run Multer as middleware
const runMiddleware = (req: any, res: any, fn: (...args: any[]) => void) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: unknown) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export async function POST(req: NextRequest) {
  try {
    // Convert NextRequest to Node.js compatible request for multer
    const formData = await req.formData();
    const file = formData.get("image") as File;
    const photoWidth = formData.get("photoWidth") as string;
    const photoHeight = formData.get("photoHeight") as string;
    const paperWidth = formData.get("paperWidth") as string;
    const paperHeight = formData.get("paperHeight") as string;
    const copies = formData.get("copies") as string;

    if (!file) {
      return NextResponse.json(
        { message: "No image file uploaded." },
        { status: 400 }
      );
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert dimensions from mm to pixels (300 DPI)
    const DPI = 300;
    const mmToPx = (mm: number) => Math.round((mm / 25.4) * DPI);

    const targetPhotoWidthPx = mmToPx(parseInt(photoWidth));
    const targetPhotoHeightPx = mmToPx(parseInt(photoHeight));
    const paperWidthPx = mmToPx(parseInt(paperWidth));
    const paperHeightPx = mmToPx(parseInt(paperHeight));
    const numCopies = parseInt(copies);

    if (
      !targetPhotoWidthPx ||
      !targetPhotoHeightPx ||
      !paperWidthPx ||
      !paperHeightPx ||
      !numCopies
    ) {
      return NextResponse.json(
        { message: "Invalid dimensions or copies provided." },
        { status: 400 }
      );
    }

    // Process the single photo: resize and crop
    const resizedImageBuffer = await sharp(buffer)
      .resize({
        width: targetPhotoWidthPx,
        height: targetPhotoHeightPx,
        fit: "cover",
        position: sharp.strategy.attention,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      })
      .png()
      .toBuffer();

    // Create the canvas (the final sheet)
    const canvas = sharp({
      create: {
        width: paperWidthPx,
        height: paperHeightPx,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    });

    // Calculate tiling positions
    const imagesToComposite = [];
    let count = 0;
    const padding = mmToPx(5); // 5mm internal padding/margin

    const maxPhotosX = Math.floor(
      (paperWidthPx - padding) / (targetPhotoWidthPx + padding)
    );
    const maxPhotosY = Math.floor(
      (paperHeightPx - padding) / (targetPhotoHeightPx + padding)
    );

    const gridWidth =
      maxPhotosX * targetPhotoWidthPx + (maxPhotosX - 1) * padding;
    const gridHeight =
      maxPhotosY * targetPhotoHeightPx + (maxPhotosY - 1) * padding;

    const offsetX = Math.floor((paperWidthPx - gridWidth) / 2);
    const offsetY = Math.floor((paperHeightPx - gridHeight) / 2);

    for (let y = 0; y < maxPhotosY && count < numCopies; y++) {
      for (let x = 0; x < maxPhotosX && count < numCopies; x++) {
        const left = offsetX + x * (targetPhotoWidthPx + padding);
        const top = offsetY + y * (targetPhotoHeightPx + padding);

        imagesToComposite.push({
          input: resizedImageBuffer,
          left: left,
          top: top,
        });

        count++;
      }
    }

    // Composite the images onto the canvas
    const finalBuffer = await canvas
      .composite(imagesToComposite)
      .png({
        compressionLevel: 9,
        quality: 100,
      })
      .toBuffer();

    // Return the result
    return new NextResponse(new Uint8Array(finalBuffer), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition":
          'attachment; filename="passport-photo-sheet.png"',
      },
    });
  } catch (error) {
    console.error("Passport Photo Maker Error:", error);
    return NextResponse.json(
      { message: "Internal Server Error during image processing." },
      { status: 500 }
    );
  }
}
