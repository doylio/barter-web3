import React, { FC } from "react";
import { css } from "@emotion/react";
import { Flex } from "@chakra-ui/react";

const Container: FC = ({ children }) => {
  return (
    <Flex
      width={["90%", null, null, null, "50%"]}
      height="100%"
      flexDirection="column"
      alignItems="center"
      pt="98"
      css={css`
        background: linear-gradient(168.68deg, #19072d 57.44%, #406aff 132.55%);
        border: 2px solid #ffa6fa;
        box-sizing: border-box;
        box-shadow: 0px 40px 50px rgba(255, 86, 246, 0.58);
        border-radius: 4px;
        padding: 70px;
      `}
    >
      {children}
    </Flex>
  );
};

export default Container;
