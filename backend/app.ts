import express, { Request, Response, json } from "express";
import {
  S3Client,
  GetObjectCommand,
  GetObjectCommandInput,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { prisma } from "./_base";
// import bodyParser, { BodyParser } from "body-parser";
import formidable from "express-formidable";
import * as fs from "fs";

const app = express();
app.use(formidable());
const port = 8000;

type imageData = {
  id: number;
  description: string;
  imageName: string;
};

type imageInput = {
  description: string;
  imageName: string;
};

const client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

let getPresignedUrl = async (fileName: string) => {
  const bucketParams: GetObjectCommandInput = {
    Bucket: process.env.BUCKETNAME,
    Key: fileName,
  };
  const command = new GetObjectCommand(bucketParams);
  const signedUrl = await getSignedUrl(client, command, {
    expiresIn: 3600,
  });
  return signedUrl;
};

let fetchImageUrls = async (imageData: imageData[]) => {
  const urlPromises = imageData.map(async (image: imageData) => {
    const imageUrl = await getPresignedUrl(image.imageName);
    return {
      id: image.id,
      url: imageUrl,
      description: image.description,
      key: image.imageName,
    };
  });

  const imageUrls = await Promise.all(urlPromises);
  return imageUrls;
};

app.get("/api/upload", async (req: Request, res: Response) => {
  const imageData = await prisma.imageTable.findMany();
  let dataList = await fetchImageUrls(imageData);
  // Custom success response message.
  return res.send({ message: "Successfully got presigned URLS", dataList });
});

function fileToBuffer(file: any): Promise<ArrayBuffer> {
  return new Promise<ArrayBuffer>((resolve, reject) => {
    fs.readFile(file, (err, data) => {
      if (err) {
        reject(err);
      } else {
        // Convert data to ArrayBuffer
        const arrayBuffer = data.buffer.slice(
          data.byteOffset,
          data.byteOffset + data.byteLength
        );
        resolve(arrayBuffer);
      }
    });
  });
}

app.post("/api/upload", async (req: Request, res: Response) => {
  let imageKey = `${new Date(Date.now())
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
    .replace(/\//g, "-")}.jpg`;
  try {
    if (!req.files) {
      return res.status(400).send({ error: "No files uploaded." });
    }

    console.log(req.fields!!.description);

    const fileObject = req.files;
    // @ts-ignore
    const fileImage = await fileObject.files.path;
    // console.log(fileImage.files.path);
    fileToBuffer(fileImage.toString()).then((buffer) => {
      // Do something with the ArrayBuffer
      client.send(
        new PutObjectCommand({
          Bucket: process.env.BUCKETNAME,
          Key: imageKey,
          // @ts-ignore
          Body: buffer,
        })
      );
    });

    let descriptionText = req.fields!!.description as unknown as string;
    const body: imageInput = {
      description: descriptionText,
      imageName: imageKey,
    };

    const imageInsert = await prisma.imageTable.create({
      data: body,
    });

    return res.send({
      status: 200,
      message: "Successful Upload",
      imageInsert,
    });
  } catch (err) {
    return res.status(500).send({ error: "Internal Server Error", err });
  }
  // }
});

app.delete("/api/upload", async (req: Request, res: Response) => {
  const formData = await req.fields!!.key;
  let keyText = req.fields!!.key as unknown as string;
  const command = new DeleteObjectCommand({
    Bucket: process.env.BUCKETNAME,
    Key: keyText,
  });

  try {
    const response = await client.send(command);
    return res.send({ response });
  } catch (err) {
    return res.send({ error: "Internal Server Error", err });
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
