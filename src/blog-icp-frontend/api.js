import axios from "axios";
const CANISTER_URL = "https://aihxp-bqaaa-aaaah-ariyq-cai.icp0.io/";

const api = axios.create({
  baseURL: CANISTER_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
