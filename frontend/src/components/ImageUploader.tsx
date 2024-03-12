import {
  Paper,
  Title,
  TextInput,
  Button,
  Container,
  Group,
  Text,
  rem,
  CloseButton,
  SimpleGrid,
} from "@mantine/core";
import { SubmitHandler, useForm } from "react-hook-form";
import { AddImageInput, addImageSchema } from "../../schema/image-schema";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { SetStateAction, useState } from "react";
import { Dropzone, FileWithPath, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import {
  IconPhoto,
  IconTrashXFilled,
  IconUpload,
  IconX,
} from "@tabler/icons-react";
import { _Object } from "@aws-sdk/client-s3";

export type responseData = {
  dataList: ImageViewData[];
};
type ImageViewData = {
  id: number;
  url: string;
  description: string;
  key: string;
};

export type imageData = {
  description: string;
  file: File;
};
export type imageResponse = {
  description: string;
  imageName: string;
};

export default function ImageUploader() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<AddImageInput>({ resolver: zodResolver(addImageSchema) });
  const [data, setData] = useState<responseData>();
  const [fileData, setFileData] = useState<FileWithPath[]>();

  const onSubmit: SubmitHandler<AddImageInput> = async (data) => {
    const formData = new FormData();
    console.log(data.description, fileData);
    formData.append("description", data.description);
    formData.append("files", fileData!![0]);
    const response = await axios({
      method: "POST",
      url: `http://${import.meta.env.VITE_IP}:8000/api/upload`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
        Accept: "application/json",
      },
    });
    console.log(response);
    reset();
    setFileData([]);
  };

  const delImage = async (key: string) => {
    const formData = new FormData();
    formData.append("key", key);
    const response = await axios({
      method: "delete",
      url: `http://${import.meta.env.VITE_IP}:8000/api/upload`,
      data: formData,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    console.log(response);
  };

  const fetchImages = async () => {
    const response = await axios.get(
      `http://${import.meta.env.VITE_IP}:8000/api/upload`
    );
    const imageList: responseData = response.data;
    setData(imageList);
    console.log(imageList);
    return response;
  };

  let ec2Id = import.meta.env.VITE_INSTANCEID;
  let avaz = import.meta.env.VITE_AZ;

  const selectedFiles = fileData?.map((file, index) => (
    <Text key={file.name}>
      <b>{file.name}</b> ({(file.size / 1024).toFixed(2)} kb)
      <CloseButton size="xs" onClick={() => setFileData([])} />
    </Text>
  ));

  return (
    <div>
      <Container my={30}>
        <Title ta="center" order={1}>
          CIS Image App
        </Title>

        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <Title ta="center" order={4}>
            Instance ID:
          </Title>
          <Title ta="center" order={4}>
            {ec2Id}
          </Title>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          <Title ta="center" order={4}>
            Availability Zone:
          </Title>
          <Title ta="center" order={4}>
            {avaz}
          </Title>
        </div>

        <Paper
          withBorder
          shadow="md"
          p="xl"
          radius="md"
          my="lg"
          style={{
            width: 500,
            margin: "auto",
          }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <Dropzone
              onDrop={(files: SetStateAction<FileWithPath[] | undefined>) =>
                setFileData(files)
              }
              onReject={(files: any) => console.log("rejected files", files)}
              maxSize={5 * 1024 ** 2}
              accept={IMAGE_MIME_TYPE}
              name="files"
            >
              <Group
                justify="center"
                gap="xl"
                mih={220}
                style={{ pointerEvents: "none" }}
              >
                <Dropzone.Accept>
                  <IconUpload
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-blue-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Accept>
                <Dropzone.Reject>
                  <IconX
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-red-6)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Reject>
                <Dropzone.Idle>
                  <IconPhoto
                    style={{
                      width: rem(52),
                      height: rem(52),
                      color: "var(--mantine-color-dimmed)",
                    }}
                    stroke={1.5}
                  />
                </Dropzone.Idle>

                <div>
                  <Text size="xl" inline>
                    Drag images here or click to select file
                  </Text>
                  <Text size="sm" c="dimmed" inline mt={7}>
                    Select an image, file size should not exceed 5mb
                  </Text>
                </div>
              </Group>
            </Dropzone>
            {selectedFiles?.length! > 0 && (
              <>
                <Text mb={5} mt="md">
                  Selected files:
                </Text>
                {selectedFiles}
              </>
            )}
            <TextInput
              label="Description"
              placeholder="Image of a dragon"
              required
              pb={10}
              {...register("description")}
            />
            <Group justify="space-between" mt="lg">
              <Button type="submit">Add Image</Button>
              <Button onClick={fetchImages}>Fetch Images</Button>
            </Group>
          </form>
        </Paper>
        {data?.dataList.length! > 0 ? (
          <SimpleGrid
            cols={{ base: 1, sm: 2, lg: 5 }}
            spacing={{ base: 10, sm: "xl" }}
            verticalSpacing={{ base: "md", sm: "xl" }}
          >
            {data?.dataList.map((item) => (
              <div
                key={item.id}
                style={{
                  alignItems: "center",
                  justifyContent: "start",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                <img width={150} height={150} src={item.url} />
                <Button
                  onClick={() => delImage(item.key)}
                  style={{
                    alignSelf: "center",
                    marginTop: "5px",
                  }}
                >
                  <IconTrashXFilled />
                </Button>
                <h6>{item.description}</h6>
              </div>
            ))}
          </SimpleGrid>
        ) : null}
      </Container>
    </div>
  );
}
