import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
import { theme } from "./theme";
import ImageUploader from "./components/ImageUploader";

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <ImageUploader />
    </MantineProvider>
  );
}
