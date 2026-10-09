export type PayDunyaConfig = {
  masterKey: string;
  privateKey: string;
  token: string;
  mode: "sandbox" | "live";
  appUrl: string;
};

export function getPayDunyaConfig(): PayDunyaConfig | null {
  const masterKey = process.env.PAYDUNYA_MASTER_KEY;
  const privateKey = process.env.PAYDUNYA_PRIVATE_KEY;
  const token = process.env.PAYDUNYA_TOKEN;
  const mode = process.env.PAYDUNYA_MODE;
  const appUrl = process.env.APP_URL;

  if (
    !masterKey ||
    !privateKey ||
    !token ||
    !appUrl ||
    (mode !== "sandbox" && mode !== "live")
  ) {
    return null;
  }

  return {
    masterKey,
    privateKey,
    token,
    mode,
    appUrl: appUrl.replace(/\/+$/, ""),
  };
}
