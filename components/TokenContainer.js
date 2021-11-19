import React from "react";
import { Flex, Text } from "@chakra-ui/react";
import { css } from "@emotion/react";

const TokenContainer = ({ token }) => {
  if (!token) {
    return null;
  }

  const amount =
    token.decimals === "0"
      ? token.balance
      : (parseFloat(token.balance) / 10 ** parseFloat(token.decimals)).toFixed(
          2
        );

  return (
    <Flex
      mb="5"
      p="3"
      borderRadius={4}
      alignItems="center"
      css={css`
        background: #1e0938;
        backdrop-filter: blur(134.882px);
      `}
    >
      {token.logo && (
        <img style={{ width: "2em", marginRight: "1em" }} src={token.logo} />
      )}
      <Text fontWeight="700">
        {amount} {token.symbol}
      </Text>
    </Flex>
  );
};

export default TokenContainer;
