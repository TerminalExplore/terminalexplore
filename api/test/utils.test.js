const test = require("node:test");
const assert = require("node:assert/strict");
const { pickPostInput, slugify } = require("../src/utils");

test("slugify keeps latin and cyrillic words", () => {
  assert.equal(slugify("Docker и API: запуск!"), "docker-и-api-запуск");
});

test("pickPostInput normalizes booleans and generated slug", () => {
  const input = pickPostInput({ title: "My Post", published: true });
  assert.equal(input.slug, "my-post");
  assert.equal(input.published, 1);
});
