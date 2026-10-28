import axios from "axios";

export const api = axios.create({ baseURL: "http://localhost:5000/api" });
// Backend ready hone par: api.get("/resources"), api.post("/bookings", data)