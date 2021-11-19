import React, { useState } from "react";
import {
  Flex,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
} from "@chakra-ui/react";
import { css } from "@emotion/react";

const TokenContainer = ({ token }) => {
  const defaultValue = 0;
  const [value, setValue] = useState(defaultValue);

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
    <Flex maxWidth="20em" flexDirection="column">
      <Text mb="3" alignSelf="flex-end">
        {((value * parseFloat(amount)) / 100).toFixed(2)} {token.symbol}
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
