import Document, { Html, Head, Main, NextScript } from "next/document";
import theme from "../styles/theme";
import { ColorModeScript } from "@chakra-ui/react";

class MyDocument extends Document {
  static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }
  render() {
    return (
      <Html>
        <Head>
          <link
            rel="preload"
            as="style"
            href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;500;600;700;800&display=swap"
          />
        </Head>
        <body>
          <ColorModeScript initialColorMode={theme.config.initialColorMode} />

          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
