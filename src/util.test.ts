import { uniqueArray } from "./util.js";

describe("uniqueArray()", () => {
  it("removes duplicate entries", () => {
    expect(uniqueArray([1, 2, 3, 3])).to.deep.equal([1, 2, 3]);
    expect(uniqueArray(['a', 'b', 'b', 'c', 'd'])).to.deep.equal(['a', 'b', 'c', 'd']);
  });
});
