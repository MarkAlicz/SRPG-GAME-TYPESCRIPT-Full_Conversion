// Declares the shape of the Array.prototype augmentations performed at runtime in base/base-top.ts.
// Those assignments are the actual implementation; this is only the type-level announcement so
// `someArray.appendObject(x)` etc. type-check everywhere else in the codebase.

interface Array<T> {
	appendObject(obj: new () => T): T;
	insertObject(obj: new () => T, index: number): T;
	appendWindowObject(obj: new () => T, parentObject: any): T;
	insertWindowObject(obj: new () => T, index: number, parentObject: any): T;
}
