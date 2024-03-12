import { ColorSchemeScript, MantineProvider } from "@mantine/core";
import ImageUploader from "./components/ImageUploader";
import "@mantine/core/styles.css";

export default function App() {
  return (
    <>
      <ColorSchemeScript forceColorScheme="dark" />
      <MantineProvider forceColorScheme="dark">
        <ImageUploader />
      </MantineProvider>
    </>
  );
}
