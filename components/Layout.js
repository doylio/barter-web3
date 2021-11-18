import { Flex } from "@chakra-ui/react";
import { css } from "@emotion/react";

const Layout = ({ children }) => {
  return (
    <Flex
      css={css`
        background: linear-gradient(
          190.74deg,
          rgba(32, 8, 59, 0.75) 35.07%,
          rgba(32, 8, 59, 0) 92.03%
        );
        backdrop-filter: blur(167px);
      `}
      flexDirection="column"
      height="100vh"
      width="100%"
    >
      {children}{" "}
    </Flex>
  );
};

export default Layout;
