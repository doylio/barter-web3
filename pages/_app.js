import { ChakraProvider } from "@chakra-ui/react";
import { MoralisProvider } from "react-moralis";

import theme from "../styles/theme";
import "../styles/globals.css";

console.log(process.env.NEXT_PUBLIC_REACT_APP_MORALIS_APPLICATION_ID);

function MyApp({ Component, pageProps }) {
  return (
    <MoralisProvider
      appId={process.env.NEXT_PUBLIC_REACT_APP_MORALIS_APPLICATION_ID}
      serverUrl={process.env.NEXT_PUBLIC_REACT_APP_MORALIS_SERVER_URL}
    >
      <ChakraProvider theme={theme}>
        <Component {...pageProps} />
      </ChakraProvider>
    </MoralisProvider>
  );
}

export default MyApp;
