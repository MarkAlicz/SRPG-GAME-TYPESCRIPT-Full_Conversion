
if (!(Array as any).indexOf) {
	Array.prototype.indexOf = function(value) {
		var i;
		for (i in this) {
			if (this[i] === value) {
				return i;
			}
		}
		return -1;
	};
}

Array.prototype.appendObject = function(obj) {
	this.push(createObject(obj));
};

Array.prototype.insertObject = function(obj, index) {
	this.splice(index, 0, createObject(obj));
};

Array.prototype.appendWindowObject = function(obj, parentObject) {
	this.push(createWindowObject(obj, parentObject));
};

Array.prototype.insertWindowObject = function(obj, index, parentObject) {
	this.splice(index, 0, createWindowObject(obj, parentObject));
};

// NOTE (JS->TS conversion): originally built an instance by manual prototype-chaining
// (F.prototype = o; new F()) against a plain object produced by defineObject(). Every call site
// (createObject(SomeClass), including via appendObject/insertObject/createWindowObject) is unchanged -
// `o` is now a real ES6 class, so we construct it directly with `new`. Mixin args still merge on
// afterward, initialize() still runs after construction, _masterMode probe still confirms BaseObject lineage.
var createObject = function<T extends new () => any>(o: T | null, ...mixins: object[]): InstanceType<T> | null {
	if (o === null) {
		return null;
	}
	var n: any = new o();
	for (var i = 0, len = mixins.length; i < len; ++i) {
		for (var prop in mixins[i]) {
			n[prop] = (mixins[i] as any)[prop];
		}
	}
	if (typeof n.initialize === 'function') {
		n.initialize();
	}
	if (typeof n._masterMode === 'undefined') {
		root.msg('object error');
	}
	return n;
};

var createObjectEx = function(o?, parentObject?) {
	var obj = createObject(o);
	if (obj === null) {
		return null;
	}
	// getParentInstance() is now a real inherited BaseObject member (see below) - just set the field.
	obj._parentObject = parentObject;
	return obj;
};

// The object which inherits the BaseScrollbar is needed to be created with this object.
var createScrollbarObject = function(o?, parentObject?) {
	var obj = createObjectEx(o, parentObject);
	
	parentObject.getChildScrollbar = function() {
		return obj;
	};
	
	return obj;
};

// The object which inherits the BaseWindow is needed to be created with this object.
var createWindowObject = function(o?, parentObject?) {
	return createObjectEx(o, parentObject);
};

var createRangeObject = function(x?, y?, width?, height?) {
	return {
		x: x,
		y: y,
		width: width,
		height: height
	};
};

var isRangeIn = function(x?, y?, range?) {
	if (x >= range.x && y >= range.y) {
		if (x <= range.x + range.width && y <= range.y + range.height) {
			return true;
		}
	}
	
	return false;
};

var serializeResourceHandle = function(handle?) {
	var obj: any = {};
	
	obj.type = handle.getHandleType();
	obj.id = handle.getResourceId();
	obj.colorIndex = handle.getColorIndex();
	obj.x = handle.getSrcX();
	obj.y = handle.getSrcY();
	
	return obj;
};

var deserializeResourceHandle = function(obj?) {
	return root.createResourceHandle(obj.type === ResourceHandleType.RUNTIME, obj.id, obj.colorIndex, obj.x, obj.y);
};

// Specifying null in the script API will cause an error.
// Therefore, if the variable through this function is null, a blank object will be returned.
// For example, if "None" is selected in the animation data for Resource Location, null will be returned.
var validateNull = function(data?) {
	return data !== null ? data : {};
};

var validateFont = function(data?) {
	return data !== null ? data : {};
};

var createPos = function(x?, y?) {
	var obj: any = {};
	
	if (typeof x === 'undefined') {
		obj.x = -1;
	}
	else {
		obj.x = x;
	}
	
	if (typeof y === 'undefined') {
		obj.y = -1;
	}
	else {
		obj.y = y;
	}

	return obj;
};

// NOTE (JS->TS conversion): every *static* defineObject(Parent, {members}) call site (792 of them)
// became a real `class X extends Parent {}` at compile time, so this is no longer called that way.
// It survives for ONE genuinely dynamic call site: CommandMixer._inheritBaseObject()
// (utility/utility-commandlayout.ts) calls defineObject(baseObject, ...) at runtime with baseObject
// being one of several classes chosen by the caller. Object.create(o.prototype) is the faithful
// modernization when o is a class: reaches instance methods without invoking the constructor,
// matching the original (which never called initialize() here either).
var defineObject = function(o: object | (new (...args: any[]) => any), ...mixins: object[]): any {
	var n: any = typeof o === 'function' ? Object.create(o.prototype) : Object.create(o);
	for (var i = 0, len = mixins.length; i < len; ++i) {
		for (var prop in mixins[i]) {
			n[prop] = (mixins[i] as any)[prop];
		}
	}
	return n;
};

class BaseObject {

	_masterMode: any = 0;

	// NOTE (JS->TS conversion): originally added per-instance at runtime by createObjectEx.
	// ~30 call sites assume any object built via createWindowObject/createScrollbarObject has this.
	_parentObject: any = null;

	getParentInstance(): any {
		return this._parentObject;
	}

	changeCycleMode(mode?) {
		this._masterMode = mode;
	}

	getCycleMode() {
		return this._masterMode;
	}
}
