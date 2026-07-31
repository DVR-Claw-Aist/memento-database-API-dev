**English** | [Русский](README_RU.md)

# Utility Journal Wizard — Memento Database

## Files

- `memento.d.ts` — type declarations for the core Memento JS API (Library, Entry, File, SQL, Http, Email, System, Dialog, Notification, Intent).
- `memento-ui.d.ts` — type declarations for the UI API (ui(), text, layout, button, edit, checkbox, choiceBox, image, pages, findByTag).
- `jsconfig.json` — WebStorm settings for type checking in `.js` files.
- `tsconfig.json` — the same for VSCode and `tsc`.
- `.eslintrc.json` — ESLint rules for Memento engine limitations (bans `class`/spread, flags `const` inside `for`-loop bodies).
- `package.json` — npm metadata (a `private: true` marker, no dependencies).

> Memento automation scripts are not part of this repository —
> it contains only type declarations and IDE settings.

## Using in WebStorm

At the top of a `.js` script:

```js
/// <reference path="./memento.d.ts" />
/// <reference path="./memento-ui.d.ts" />
```

Put `jsconfig.json` and `.eslintrc.json` in the project root — WebStorm picks them up automatically.

## Language spec (verified empirically on a real Memento engine)

Despite the wiki stating "JavaScript 1.7", the Rhino engine in practice supports most of ES6.

Confirmed working:
- `let` / `const`
- arrow functions
- template literals
- destructuring
- Promise
- `for...of`
- `Array.includes`
- `Object.assign`

Confirmed NOT working (EvaluatorException):
- `class` (`"identifier is a reserved word: class"`)
- spread / rest `...` (`"syntax error"`)

Modules (`import`/`export`) were not tested separately — they are architecturally inapplicable, since Memento executes one script file as a whole.

Rule: use `.concat()` instead of spread, and plain functions and objects instead of `class` (avoiding prototype inheritance where possible).

## Known environment quirks (found empirically)

### `const` inside a `for`-loop body — DO NOT use

**Symptom:** if you declare `const` inside a `for (let i = ...; ...; ...) { ... }` body (e.g., `const refs = someArray[i].refs;`), on the second and subsequent iterations the variable value may not update and "stick" to the value from the first iteration. Externally this looks like a bug in UI elements (e.g., a choiceBox/checkbox always shows the selection from the first page), even though the UI elements and the data are perfectly correct — the issue is that the reference variable to the object's `refs` was not updated between iterations.

**Rule:** for any variable declared inside a `for`-loop body — use `let`, never `const`. `const` may only be used for values declared once outside the loop, or inside a function that is called anew on each iteration (the function has its own full scope per call, so the problem does not manifest).

```js
// WRONG
for (let i = 0; i < items.length; i++) {
    const refs = items[i].refs; // may "stick" to the first iteration
}

// RIGHT
for (let i = 0; i < items.length; i++) {
    let refs = items[i].refs;
}
```

This limitation is specific to the particular Rhino version used in Memento — modern JS engines (V8, SpiderMonkey, etc.) create a full block scope on each iteration and do not have this problem. `.d.ts` files (TypeScript declarations) cannot prohibit or highlight this error by design — it is not about API types but about a syntactic usage pattern of the language. Highlighting is configured via ESLint (`.eslintrc.json`, the `no-restricted-syntax` rule).

### `find()` is full-text search, not a link filter

`libByName(...).find(query)` searches by text match (the equivalent of the search in the Memento UI), not by the "child record → parent record" link. Using `find(house_ID)` to search for the flats of a house can, in some cases, return the wrong records (false text matches).

```js
// if the "Flats" library has a field of type Link to Entry to the house:
const flats_Of_house = libByName('Flats').linksTo(house);

// if there is no Link to Entry, only a text field:
const flats_Of_house = libByName('Flats').entries().filter((flat) => flat.field('house_id') === house_ID);
```

### `ui().edit()` without initial text — `.text` returns `undefined`, not `''`

If `ui().edit()` is created without an argument and the user has not entered any text, reading `.text` will return `undefined`, not an empty string. In scripts, guard everywhere when reading: `refs.someEdit.text || ''`.

## Development workflow (WebStorm/VSCode → Memento emulator)

Writing and debugging a script directly in the code input field in Memento is inconvenient — no proper autocomplete, error highlighting, or change history. The working scheme is to write code in the IDE, while keeping only a tiny loader inside Memento (in the trigger/script) that re-reads the file from disk on each run:

```
WebStorm (or VSCode, etc.) → file watcher → Memento emulator → code executes
```

That is, any other `.js` file of the project is edited in the IDE as usual, with full autocomplete via `.d.ts`. And directly in the Memento script (the very window where trigger code is normally pasted) only this lives:

```js
let f = file("my_script.js");
var code = f.readAll();     // Reads the entire file into a single text string
f.close()
eval(code);                            // Executes the read JavaScript code
```

How it works:
- `file("my_script.js")` opens the file by name in the folder Memento uses for scripts (see `memento.d.ts` → `file()`) — in the desktop version you must specify the full path to the file.
- `readAll()` reads all lines of the file at once and closes the read stream;
- `eval(code)` executes this text as JavaScript in the current Memento script context — so the whole code edited in the IDE actually runs as if it were pasted directly into the trigger body.
  IMPORTANT! Permissions must be enabled! Depending on the task: file reading (mandatory with this approach), access to other libraries, file writing, network requests.

Practical benefit: if the IDE is set to auto-save (or a file watcher syncs the file into the folder visible to the emulator/device), saving the file in WebStorm is enough — the next time the trigger runs in Memento it picks up the updated code, with no manual copying of the script text into the Memento UI.

Important: the loader itself (`file()`/`eval()`) stays in the Memento code field — not the other way around; don't confuse these two roles, otherwise the `.d.ts` autocomplete in the IDE will work for the small loader instead of the wizard's real code.
