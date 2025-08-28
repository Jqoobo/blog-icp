import { HttpAgent } from "@dfinity/agent";

const CANISTER_ID = "aihxp-bqaaa-aaaah-ariyq-cai";
const HOST = "https://icp0.io";

const agent = new HttpAgent({ host: HOST });

export async function apiMutate({ method, path, data }) {
  const url = `/api${path}`;
  const body = data ? JSON.stringify(data) : "";
  const headers = [
    ["Content-Type", "application/json"],
    ["Accept", "application/json"],
  ];

  const response = await agent.call(CANISTER_ID, "http_request_update", {
    arg: {
      method,
      url,
      headers,
      body: Array.from(new TextEncoder().encode(body)),
    },
  });

  const res = response.return;
  const text = new TextDecoder().decode(new Uint8Array(res.body));
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
