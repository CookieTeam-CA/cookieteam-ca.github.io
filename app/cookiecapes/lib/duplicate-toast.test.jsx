import { expect, mock, test } from "bun:test";
import { renderToStaticMarkup } from "react-dom/server";

const add = mock(() => {});
mock.module("@/components/ui/toast", () => ({ toast: { add } }));
mock.module("../i18n/client", () => ({ useTranslations: () => ({ t: (key, values) => values ? key.replace("{id}", String(values.id)) : key }) }));
const { useDuplicateToast } = await import("./duplicate-toast");

function Probe({ errors, expected }) {
  const notify = useDuplicateToast();
  for (const error of errors) expect(notify(error)).toBe(expected);
  return null;
}

test("duplicate toast includes an accessible link to the returned cape", () => {
  add.mockClear();
  renderToStaticMarkup(<Probe errors={[{ code: "duplicate_cape", existingCapeId: 42 }]} expected={true} />);
  expect(add).toHaveBeenCalledTimes(1);
  const options = add.mock.calls[0][0];
  expect(options.type).toBe("error");
  expect(renderToStaticMarkup(options.description)).toContain('href="/cookiecapes/capes/42"');
  expect(renderToStaticMarkup(options.description)).toContain("View cape #42");
});

test("malformed duplicate data falls back without a broken link", () => {
  add.mockClear();
  renderToStaticMarkup(<Probe errors={[null, new Error("ordinary"), { code: "other", existingCapeId: 42 }, { code: "duplicate_cape", existingCapeId: "42" }, { code: "duplicate_cape", existingCapeId: -1 }]} expected={false} />);
  expect(add).not.toHaveBeenCalled();
});
