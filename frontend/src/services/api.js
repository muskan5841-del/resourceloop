import axios from "axios";

export const api = axios.create({
  baseURL: "https://resourceloop-s072.onrender.com/api",
});
