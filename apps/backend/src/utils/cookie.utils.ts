import { CookieOptions } from "express";
import { env } from "../lib/env.js";

export const oauthStateCookieOptions: CookieOptions = {
  maxAge: 60 * 10 * 1000,
  httpOnly: true,
  secure: env.NODE_ENV === "production", //TODO: this cause issue if serving over http not https
  sameSite: "lax",
};

export const sessionCookieOptions: CookieOptions = {
  maxAge: 7 * 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
};
