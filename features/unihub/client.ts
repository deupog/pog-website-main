import { createUniHub } from "unihub-community-sdk";

const key = process.env.NEXT_PUBLIC_UNIHUB_PK;

export const unihub = key
  ? createUniHub({
      key,
      locale: "tr",
      session: "sessionStorage",
    })
  : null;
