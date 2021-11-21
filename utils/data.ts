import axios from "axios";

export const getNFTData = async (
  contractAddresses: string[],
  ids: number[]
) => {
  let tokens: string = "";
  ids.forEach((id: number) => {
    tokens += `token_ids=${id}&`;
  });

  let addresses: string = "";
  contractAddresses.forEach((address: string) => {
    addresses += `asset_contract_addresses=${address}&`;
  });

  const url = `https://rinkeby-api.opensea.io/api/v1/assets?${tokens}${addresses}offset=0&limit=20`;
  const res = await axios.get(url);
  console.log(res.data);

  return res.data.assets;
};
