import { css } from "@emotion/react";
import { Button as ChakraButton } from "@chakra-ui/react";

const Button = ({ children, onClick, width }) => {
  return (
    <ChakraButton
      width={width}
      css={css`
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
      `}
      onClick={onClick}
    >
      {children}
    </ChakraButton>
  );
};
export default Button;
