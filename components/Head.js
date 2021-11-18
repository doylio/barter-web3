import { default as NextHead } from "next/Head";

const Head = ({ title, description }) => {
  return (
    <NextHead>
      <title>{title}3</title>
      <meta name="description" content={description} />
      <link rel="icon" href="/favicon.ico" />
    </NextHead>
  );
};

export default Head;
