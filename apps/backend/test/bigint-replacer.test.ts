import { test } from "node:test";
import assert from "node:assert/strict";
import { bigIntJsonReplacer } from "../src/app.js";

test("bigIntJsonReplacer leaves numbers, strings and booleans alone", () => {
  assert.equal(bigIntJsonReplacer("a", 42), 42);
  assert.equal(bigIntJsonReplacer("a", "x"), "x");
  assert.equal(bigIntJsonReplacer("a", true), true);
  assert.equal(bigIntJsonReplacer("a", null), null);
});

test("bigIntJsonReplacer converts BigInt to number", () => {
  assert.equal(bigIntJsonReplacer("githubRepoId", 1000000000n), 1000000000);
  assert.equal(typeof bigIntJsonReplacer("githubRepoId", 1000000000n), "number");
});

test("bigIntJsonReplacer is safe to use with JSON.stringify", () => {
  const out = JSON.stringify({ githubRepoId: 1000000000n }, bigIntJsonReplacer);
  assert.equal(JSON.parse(out).githubRepoId, 1000000000);
});