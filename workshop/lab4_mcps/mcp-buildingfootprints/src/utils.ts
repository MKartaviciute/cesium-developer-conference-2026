import https from "node:https";
import http from "node:http";
import type { IncomingMessage } from "node:http";

export function followRedirects(
  url: string,
  maxRedirects = 10,
): Promise<IncomingMessage> {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https://") ? https : http;
    const req = lib.get(url, (res) => {
      if (
        res.statusCode &&
        res.statusCode >= 300 &&
        res.statusCode < 400 &&
        res.headers.location
      ) {
        if (maxRedirects <= 0) {
          reject(new Error("Too many redirects"));
          return;
        }
        const next = res.headers.location.startsWith("http")
          ? res.headers.location
          : new URL(res.headers.location, url).toString();
        res.resume();
        followRedirects(next, maxRedirects - 1).then(resolve).catch(reject);
      } else {
        resolve(res);
      }
    });
    req.on("error", reject);
  });
}
