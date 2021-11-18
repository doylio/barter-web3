import { extendTheme } from "@chakra-ui/react";

const config = {
  initialColorMode: "dark",
  useSystemColorMode: false,
};

const theme = extendTheme({
  fonts: {
    body: "Orbitron",
    heading: "Orbitron",
  },
  config,
});

export default theme;
