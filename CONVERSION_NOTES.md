# JS → TypeScript Conversion Notes

Source: SRPG Studio runtime script layer, v1.323 (157 files, ~80,400 lines).
Result: 157 `.ts` files, 0 `tsc --noEmit` errors, structure and directory layout preserved 1:1.

## Read this first: two things this is *not*

1. **Not a rewrite.** Every method body is the original source, character-for-character, except at
   the small number of specific spots noted below (super-call rewrites, phantom-field declarations,
   and the ~15 hand-annotated bugs). If you diff a `.ts` file's method bodies against the `.js`
   original, they match.
2. **Not validated against SRPG Studio's real API.** `root` (the only genuinely external identifier
   in the whole codebase) is typed from usage alone - method names are real, signatures are guessed
   (`any` everywhere). If SRPG Studio ships type definitions, swap them in; `_ambient/root-api.d.ts`
   is designed to be replaced wholesale.

## Architecture decisions

**Global scripts, not ES modules.** Zero files use `import`/`export` at the top level (except the
namespace-merge mechanics below, which are a different thing). This matches the original exactly -
SRPG Studio's loader concatenates/loads files into one shared global scope, and TypeScript treats a
file with no top-level import/export as a script, not a module, so this was the correct default
rather than a simplification.

**`defineObject(Parent, {...})` → `class X extends Parent`.** The dominant pattern (790 classes).
`defineObject`'s own two-tier model (define a prototype-shaped template, then `createObject()` an
instance from it later, running `initialize()` as a delayed constructor) is preserved exactly -
`createObject`/`createObjectEx`/`createWindowObject`/`createScrollbarObject` all still exist with
their original call sites completely unchanged. Only their *internals* changed (see below), because
once `defineObject`'s result is a real class instead of a plain object, the old
`F.prototype = o; new F()` trick breaks (it would inherit from the class itself, not its instances).

**Namespace holders → TypeScript `namespace`.** 22 places group related sub-classes as properties
(`AttackEvaluator.HitCritical`, `UnitCommand.Talk`, etc. - 161 members total). Four of those 22
(`UnitCommand`, `SetupCommand`, `RestCommand`, `MapCommand`) are *themselves* real instantiable
classes that also hold a family of sub-commands - TypeScript's class/namespace declaration merging
handles this exactly: `class UnitCommand extends BaseListCommandManager {}` plus a separate
`namespace UnitCommand { export class Talk extends UnitListCommand {} ... }`, and
`UnitCommand.Talk` keeps resolving exactly as before from every other file.

One subtlety this surfaced: the namespace block for a given holder is emitted at the position of its
*last* member's original statement, not the holder's own declaration site. Early on this was wrong -
placing it at the holder's site moved code earlier than a same-file dependency (e.g. `UnitListCommand`,
declared *after* `UnitCommand` in the original file) was actually available, which TypeScript
correctly rejected. Never moving anything earlier than its own original position fixed it.

**Object-literal singletons → classes with `static` members.** 414 of them (things like `CurrentMap`,
`TextRenderer`, `Miscellaneous`) are always-on service objects, never instantiated. `this` inside a
static method resolves to the class itself, which is exactly how these behaved as shared plain
objects - no body rewriting needed for this part.

**`createObject`/`defineObject` internals, not call sites.** 511 `createObject(...)` call sites and
1 genuinely dynamic `defineObject(...)` call site (`CommandMixer._inheritBaseObject`, which picks
its base class at runtime from a caller-supplied argument - real polymorphism, not a static pattern)
are all textually unchanged. Only the four helper functions in `base/base-top.ts` were rewritten, to
construct real classes (`new o()`) instead of manual prototype-chaining (`F.prototype = o; new F()`).
This was the one place requiring actual judgment rather than mechanical translation - see the
comments in that file for the reasoning.

**Method-borrowing sites (`ClassA.methodB.call(this, ...)`).** 45 sites call a method off another
class by reference rather than through inheritance. 43 turned out to be genuine super-calls to a
direct parent (→ `super.methodB(...)`); 2 were borrowing from an unrelated class, which needed
`.prototype` inserted (`ClassA.prototype.methodB.call(this, ...)`) because methods now live on the
prototype, not directly on the class object the way they did on the original shared prototype-role
objects. A further 4 sites called a method *without* even a `.call()` wrapper
(`AttackEvaluator.HitCritical.isHit(...)`) - fixed by giving them a freshly-constructed instance as
receiver (`(new HitCritical()).isHit(...)`), which reproduces the original's field-default state
without running `initialize()` (matching the original, which never ran it for bare defineObject
objects either).

**Implicit/dynamic fields.** The original relies constantly on `this.someProp = value` inside a
method body with no prior declaration - completely normal for a plain JS object, not allowed on a
TypeScript class. Every class was scanned for `this.X = ` assignments not covered by its own or any
ancestor's declared members, and a `X: any;` field was synthesized for each. ~500+ of these across
the codebase - by far the largest single category of fix, and mechanical/low-risk once you see the
pattern. A handful of fields are *read but never assigned anywhere* in the 157 files (not caught by
the scan above, since there's no assignment to find) - those are called out individually below.

**Every parameter is optional.** JS never enforced call arity - extra arguments are silently
dropped, missing ones become `undefined`. TypeScript does enforce it by default, and several
legitimate patterns in this codebase depend on the JS behavior (base class declares a hook method
with fewer parameters than overrides use; callers pass more/fewer arguments than a callee declares).
Making every synthesized parameter optional (`param?`) reproduces the original calling convention
exactly rather than fighting it file by file.

## Bugs found in the original source

Static typing surfaced several pre-existing defects that plain JS tolerates silently. None were
fixed by guessing intent - each is cast/stubbed to preserve the *exact* original runtime behavior
(usually `undefined`), with a comment at the site. Worth a look when you have time:

- **5 accidental global variables** (missing `var`): `skill` (eventcommand-damagehit.ts), `score`
  (map-enemyturnai.ts), `data` (screen-multiclasschange.ts and utility-messageview.ts, two separate
  bugs), `cost` (singleton-unitlist.ts). Each confirmed by finding a sibling function in the same
  file that declares the same-named local correctly.
- **8 enum values referenced that don't exist**: `EnterResult.CONTINUE` (only OK/NOTENTER are real -
  CONTINUE is a `MoveResult` value, 200; looks like a copy/paste mix-up), `MoveResult.CONTIUNE`
  (typo, screen-quest.ts), `EnterResult.NOENTER` (typo for NOTENTER, utility-event.ts),
  `ReinforcementCheckerMode.MOVE` ×3 (only TOP/WAIT are real), `MapStateType.UNITDRAW` (DRAWUNIT
  exists and looks like the likely intent - word-order typo), `ItemUseScreenMode.USECHECK`,
  `ShopCurrencyWindowMode.NONE`, `MotionCategoryType.BOW`.
- **One likely runtime crash, not just a silent bug**: `MapLayer._drawScreenColor()` is *called* but
  never defined anywhere in the 157 files - calling undefined as a function throws at runtime if
  this path ever executes. A same-named `drawScreenColor()` (no underscore) exists on motion objects
  and is used correctly two lines later in the same method - strong circumstantial evidence for what
  this should have called. See `singleton/singleton-currentmap.ts` around `MapLayer`.
- **A few phantom fields**, read but never assigned anywhere: `_isChangeSuccess`
  (eventcommand-itemchange.ts), `_isSkipMode` (map-enemyturnai.ts), `_activePageIndex`
  (screen-variable.ts), `_effectRangeType` (MapLayer), `_disabledBackground` (UIBattleLayout, set
  externally via a `getUIBattleLayout()` chain rather than `this.`).
- **A template-method gap**: `isMarshalScreenCloesed()` [sic - matches the original's consistent
  misspelling], `getSignal()`, and `getKey()` are each called polymorphically from a base class but
  only ever declared on subclasses - fine in JS (every real call resolves through an actual
  subclass instance), but the base needed a stub for `this.method()` to type-check in its own body.

## What's *not* here

**The native engine API surface.** `_ambient/root-api.d.ts` covers the ~97 `root.*` methods actually
called somewhere in this codebase, typed as `(...args: any[]) => any` - names are real (scraped from
usage), signatures are not verified against anything authoritative. The objects those methods
*return* (session, unit, item, map data...) aren't typed at all. If SRPG Studio publishes real
type definitions at some point, that's the file to replace.

**One genuinely dynamic composition site.** `CommandMixer.mixCommand()` /
`_inheritBaseObject()` (utility/utility-commandlayout.ts) builds an object at runtime by choosing a
base class from a caller-supplied parameter (`BaseListCommand`, `BaseTitleCommand`, etc. - see the
four call sites in scene-battlesetup.ts, scene-title.ts, scene-rest.ts, map-mapcommand.ts). This is
real runtime polymorphism, not a pattern that reduces to a static type - `defineObject`'s dynamic
path handles it correctly, but it's worth knowing this one spot works differently from the other 792.

## Files

- `Script/**/*.ts` - the converted source, same directory layout as the original `Script/`.
- `Script/_ambient/root-api.d.ts` - ambient declaration for `root` (see above).
- `Script/_ambient/array-extensions.d.ts` - type-level announcement for the `Array.prototype`
  methods `base-top.ts` adds at runtime (`appendObject`, `insertObject`, etc.).
- `tsconfig.json` - ES5 target (matches the original interpreter), global-script mode, lenient
  typing (`strict: false` - most parameters are intentionally `any` pending real API docs).
