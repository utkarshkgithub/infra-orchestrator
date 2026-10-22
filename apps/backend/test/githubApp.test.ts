import { test } from "node:test";
import assert from "node:assert/strict";
import jwt from "jsonwebtoken";
import { env } from "../src/lib/env.js";
import { createAppJwt, buildCloneUrl } from "../src/lib/githubApp.js";

process.env.GITHUB_APP_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCsJTpEpYoaI7+j
R4OOJEFAOQqHPrf0Nc9HINnLyg9+9XrLOd2PV53bMg+8JZ1TS5/fAl4ls0QlWnbu
UazlxhQyGUHDfshN2TvlzH2ELj/8XoyNaatoiITjEEyeZ6C0cb6+e5eWg1lvWUix
T3x/MMpoDBljzUgSOxB0IBJvt+f+3SDYenO+i0BZsrsba/r1oRiK8vbBkUm83x5c
xXrcrBZUUvfQwLhMFWQRlki/sUjQjeeSaTPjbaLj4T+GozAB422pZCBNrWcZVCka
M36ByvkoR8IpUty+3+mwzlvdx4PhJmJkNpvHspkEBhIWZH/82Ob+05EcPbCVxieb
GS+GArzRAgMBAAECggEAC9NK22hbwkvuYDMLcHpBGT5R4NSIIniH0qUJERzCT8Bh
PRCujahBKcuYlR4oXo51XwZ0nTZhWgeK3/gwXmBrBr4BbIKLE/32RWT0wl3C+30r
PpOhuL6YElkOSltoCL0/kyo+UZKYVDPX8IY7USly3g7mt5pkdwwjpzaEzbPedf1x
yAuiPQUQl7uBNHY/XMnWNnHcWLhdrfG9af0gJPq6yEGswxSiDj6TuQF7guiHqSEU
TtrNeDcowI685cVnGgpfOnIsgISxzmCWKUMY/B2FsvTp61j6KOTn/mBdFt/PBTpR
48H+7AiKAvV7YcFJVx0Y/+EWXuvsgv29LTHfOcX3gQKBgQDnQxfhq7NNseS4UkeP
ywktOgXe5vSWl3YC6aEXI6lPosVy+9GY+aO/BQUZebdLDMrSf0Z7RD4klr/e04KR
WmxgwXFIYYbs5rMDnlpGLGQVeJ4o8w0N8tKZYK6HfCrjQy1nqJH1oQux1jdm/mis
/rFyvpPBSY59J//zSDdl4zg/2QKBgQC+j0brMtcsf0/yo2p8DYZZKR4QitlLLoqx
eK8hEpQE9cNeHx5eRuvnQxZxjdmL8XA1CS2e3I/+JZURvnuqZlRKnQlOumIqaf4H
7F3s+inxMUbVW92MRiJqn/DG5B6fpfiTH4CPEA0HDRUo611XAeHYuvS81Hy8/Jn0
eD0WMcrBuQKBgQCKkcwsf3pnspEu1LZmda0g+WRtJIwn88dVhXHt8INR4WFYPYVg
mSzBl5tvoVvvz1F0gajU0ZY+zElZlfjlaX4JF7/uM+np524aW/cRlyW9K9HxDXmk
AvynxKOvMPptxGHfe8VBnebo/0ehIg3Moqvm6kSUi6OiYKZfusTe+yBIOQKBgDmO
pzoVUh7TmX9NUrWDlEfL/pO6jKWDukqejC8uIF1bKhZ8ybxqKYjhn57O3J3DYEP0
sL3iGvAFw//nDA1M+TrMMeqAq3PqLduQzlHswcxjOOTq6YEcEfsosh4w+vr3s5wk
kL0lePnfPrvsU3YbUG8ZESEUAVVH6uyHgNP6WCapAoGAVmovsr5c2fgIaWPmRvSs
48BG6Uc0RDSPDC4y5N2YycnUMCqLtUoWc4snvQTt4STVrYItq0UPrx5XEJujd4li
QjEeAPvcoKBb0UdwKVjJ/GoGtN4IPd1aDENbSTa/92LEOyESkf3aE6YAfKg/XtlD
N1Ez+sm+02JUokOigDMB1X4=
-----END PRIVATE KEY-----`;

test("createAppJwt signs an RS256 JWT with the app's claims", () => {
  const token = createAppJwt();
  const header = JSON.parse(Buffer.from(token.split(".")[0], "base64url").toString());
  const claims = jwt.decode(token) as jwt.JwtPayload;

  assert.equal(header.alg, "RS256");
  assert.equal(claims.iss, env.GITHUB_APP_CLIENT_ID);
  assert.ok(claims.exp! - claims.iat! <= 600);
});

test("buildCloneUrl puts the token in the userinfo part", () => {
  assert.equal(
    buildCloneUrl("https://github.com/octocat/Hello-World.git", "TOK"),
    "https://x-access-token:TOK@github.com/octocat/Hello-World.git"
  );
});
