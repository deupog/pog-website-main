import { createUniHub } from "unihub-community-sdk";

export function createUniHubClient(key: string | undefined) {
  return key
    ? createUniHub({
        key,
        locale: "tr",
        session: "sessionStorage",
      })
    : null;
}
