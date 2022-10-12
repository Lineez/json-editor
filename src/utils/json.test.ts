import "jest";
import { getTypeOfValue, stringToJson } from "./json";

// typeof нормального человека
describe("typeof getter", () => {
  test("false return boolean", () => {
    expect(getTypeOfValue(false)).toBe("boolean");
  });
  test("0 return number", () => {
    expect(getTypeOfValue(0)).toBe("number");
  });
  test("test return string", () => {
    expect(getTypeOfValue("test")).toBe("string");
  });
  test("empty string return string", () => {
    expect(getTypeOfValue("")).toBe("string");
  });
  test("null return null", () => {
    expect(getTypeOfValue(null)).toBe("null");
  });
  test("undefined return undefined", () => {
    expect(getTypeOfValue(undefined)).toBe("undefined");
  });
  test("{} return object", () => {
    expect(getTypeOfValue({})).toBe("object");
  });
  test("[] return array", () => {
    expect(getTypeOfValue([])).toBe("array");
  });
});

// парсим
describe("string to json string", () => {
  test("string 'false' return value false", () => {
    expect(JSON.parse(stringToJson("false"))).toBe(false);
  });
  test("string '0' return value 0", () => {
    expect(JSON.parse(stringToJson("0"))).toBe(0);
  });
  test("string 'test' return value 'test'", () => {
    expect(JSON.parse(stringToJson("test"))).toBe("test");
  });
  test("string 'null' return value null", () => {
    expect(JSON.parse(stringToJson("null"))).toBe(null);
  });
  test("string '[]' return value []", () => {
    expect(JSON.parse(stringToJson("[]"))).toStrictEqual([]);
  });
  test("string '[1, name, false]' return value [1, 'name', false]", () => {
    expect(JSON.parse(stringToJson("[1, name, false]"))).toStrictEqual([
      1,
      "name",
      false,
    ]);
  });
  test("string '{}' return value {}", () => {
    expect(JSON.parse(stringToJson("{}"))).toStrictEqual({});
  });
  test("string '{ name: test, value: null, age: [1, name] }' return value { name: 'test', value: null, age: [1, 'name'] }", () => {
    expect(
      JSON.parse(stringToJson("{ name: test, value: null, age: [1, name] }"))
    ).toStrictEqual({ name: "test", value: null, age: [1, "name"] });
  });
});
