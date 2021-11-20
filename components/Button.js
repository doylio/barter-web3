import { css } from "@emotion/react";
import { Button as ChakraButton } from "@chakra-ui/react";

const Button = ({
  children,
  onClick,
  width,
  mb = 0,
  mt = 0,
  mr = 0,
  ml = 0,
  warning = false,
}) => {
  const normalStyle = css`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 60px;
    color: white;
    background: linear-gradient(
      92.23deg,
      #ff56f6 21.43%,
      #b936ee 50.63%,
      #3bace2 100%,
      #406aff 117.04%
    );
    box-shadow: 0px 4px 97px rgba(255, 86, 246, 0.51);
    backdrop-filter: blur(192px);
    border-radius: 2px;

    :hover {
      background: linear-gradient(
        92.23deg,
        #ff56f6 21.43%,
        #b936ee 50.63%,
        #3bace2 100%,
        #406aff 117.04%
      );
    }
  `;

  const warningStyle = css`
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;
    height: 60px;
    color: white;
    background: linear-gradient(
      92.23deg,
      #ff0000 12.19%,
      rgba(227, 14, 96, 0.5) 100%,
      #406aff 117.04%
    );
    box-shadow: 0px 3.3193px 80.493px rgba(255, 86, 246, 0.51);
    backdrop-filter: blur(159.326px);
    border-radius: 2px;

    :hover {
      background: linear-gradient(
        92.23deg,
        #ff0000 12.19%,
        rgba(227, 14, 96, 0.5) 100%,
        #406aff 117.04%
      );
    }
  `;

  return (
    <ChakraButton
      width={width}
      css={warning ? warningStyle : normalStyle}
      onClick={onClick}
      mr={mr}
      mb={mb}
      ml={ml}
      mt={mt}
    >
      {children}
    </ChakraButton>
  );
};
export default Button;
