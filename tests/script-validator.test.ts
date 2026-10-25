/** The validator must catch what breaks a render before audio credits are spent */
import { test } from "node:test";
import * as assert from "node:assert/strict";
import { Severity, validateScript } from "../src/script-validator";
import type { ValidationIssue } from "../src/script-validator";
import { SlideType } from "../src/types";
import type { SlideData, VideoScript } from "../src/types";
import exampleScript from "../content/video-script.json";

const base = { section: "s", narration: "Hello." };
const title: SlideData = { ...base, id: "slide-01", type: SlideType.TITLE, title: "T", subtitle: "S" };
const outro: SlideData = { ...base, id: "slide-99", type: SlideType.OUTRO, title: "T", message: "M", evolutionLine: "E" };
const script = (...middle: SlideData[]): VideoScript => ({ title: "t", slides: [title, ...middle, outro] });
const errors = (issues: ValidationIssue[]) => issues.filter((i) => i.severity === Severity.ERROR);
const noFiles = () => false;

test("a clean script has no issues", () => {
  assert.deepEqual(validateScript(script(), noFiles), []);
});

test("the shipped example script has no errors", () => {
  assert.deepEqual(errors(validateScript(exampleScript as VideoScript, noFiles)), []);
});

test("ragged table rows are errors", () => {
  const table: SlideData = { ...base, id: "slide-02", type: SlideType.TABLE, heading: "h", headers: ["a", "b"], rows: [["1", "2"], ["3"]] };
  const found = errors(validateScript(script(table), noFiles));
  assert.equal(found.length, 1);
  assert.match(found[0].message, /row 2 has 1 cells/);
});

test("missing image file and duplicate ids are errors", () => {
  const img: SlideData = { ...base, id: "slide-01", type: SlideType.IMAGE, imagePath: "pptx-slides/Slide1.PNG" };
  const messages = errors(validateScript(script(img), noFiles)).map((i) => i.message).join("|");
  assert.match(messages, /image not found/);
  assert.match(messages, /duplicate id/);
});

test("an existing image passes", () => {
  const img: SlideData = { ...base, id: "slide-02", type: SlideType.IMAGE, imagePath: "pptx-slides/Slide1.PNG" };
  assert.deepEqual(validateScript(script(img), (p) => p === "pptx-slides/Slide1.PNG"), []);
});

test("diagram edges to unknown nodes and shared cells are errors", () => {
  const diagram: SlideData = {
    ...base, id: "slide-02", type: SlideType.DIAGRAM, heading: "h",
    nodes: [{ id: "a", label: "A", row: 0, col: 0 }, { id: "b", label: "B", row: 0, col: 0 }],
    edges: [{ from: "a", to: "zzz" }],
  };
  const messages = errors(validateScript(script(diagram), noFiles)).map((i) => i.message).join("|");
  assert.match(messages, /share row 0, col 0/);
  assert.match(messages, /missing node/);
});

test("too many flow nodes and labels too long to fit are warnings", () => {
  const nodes = Array.from({ length: 7 }, (_, i) => ({ label: i === 0 ? "A label that is far too long for one box" : `N${i}` }));
  const flow: SlideData = { ...base, id: "slide-02", type: SlideType.FLOW, heading: "h", nodes };
  const issues = validateScript(script(flow), noFiles);
  assert.deepEqual(errors(issues), []);
  assert.ok(issues.some((i) => /7 flow nodes/.test(i.message)));
  assert.ok(issues.some((i) => /too long to fit/.test(i.message)));
});
