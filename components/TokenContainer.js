import React, { useState, useEffect } from "react";
import {
  Flex,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";
import { css } from "@emotion/react";

const TokenContainer = ({ token, selectToken, slider = false }) => {
  const defaultValue = 0;
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    selectToken(
      token["token_address"],
      parseInt((value * parseFloat(amount)) / 100),
      token["symbol"]
    );
  }, [value]);

  if (!token) {
    return null;
  }

  const amount =
    token.decimals === "0"
      ? token.balance
      : parseFloat(token.balance) / 10 ** parseFloat(token.decimals);

  if (!slider) {
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
  }

  return (
    <Flex maxWidth="20em" flexDirection="column">
      <Text mb="3" alignSelf="flex-end">
        {parseInt((value * parseFloat(amount)) / 100)} {token.symbol}
      </Text>
      <Slider
        colorScheme="pink"
        aria-label="slider-ex-1"
        value={value}
        onChange={(val) => setValue(val)}
        defaultValue={defaultValue}
      >
        <SliderTrack>
          <SliderFilledTrack />
        </SliderTrack>
        <SliderThumb />
      </Slider>
    </Flex>
  );
};

export default TokenContainer;
