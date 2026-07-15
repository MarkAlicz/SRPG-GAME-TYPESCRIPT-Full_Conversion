
class PosSelectorResult {

	static SELECT: any = 0;

	static CANCEL: any = 1;

	static NONE: any = 2;
}

class PosSelectorType {

	static FREE: any = 0;

	static JUMP: any = 1;
}

class PosSelector extends BaseObject {
	_mapCursor: any;


	_unit: any = null;

	_posMenu: any = null;

	_indexArray: any = null;

	_filter: any = null;

	_posCursor: any = null;

	_selectorType: any = 0;

	_isFusionIncluded: any = false;

	_isSelfSelection: any = false;

	initialize() {
		this._mapCursor = createObject(MapCursor);
		this._posMenu = createObject(PosMenu);
		this._selectorType = this._getDefaultSelectorType();
	}

	setPosOnly(unit?, item?, indexArray?, type?) {
		this._unit = unit;
		this._indexArray = indexArray;
		MapLayer.getMapChipLight().setIndexArray(indexArray);
		this._setPosMenu(unit, item, type);
		this._posCursor = createObject(this._getObjectFromType(this._selectorType));
		this._posCursor.setParentSelector(this);
	}

	setUnitOnly(unit?, item?, indexArray?, type?, filter?) {
		this._unit = unit;
		this._indexArray = indexArray;
		this._filter = filter;
		MapLayer.getMapChipLight().setIndexArray(indexArray);
		this._setPosMenu(unit, item, type);
		this._posCursor = createObject(this._getObjectFromType(this._selectorType));
		this._posCursor.setParentSelector(this);
	}

	includeFusion() {
		this._isFusionIncluded = true;
	}

	enableSelfSelection() {
		this._isSelfSelection = true;
	}

	movePosSelector() {
		var result = PosSelectorResult.NONE;
		
		if (InputControl.isSelectAction()) {
			this._playSelectSound();
			result = PosSelectorResult.SELECT;
		}
		else if (InputControl.isCancelAction()) {
			this._playCancelSound();
			result = PosSelectorResult.CANCEL;
		}
		else {
			this._posCursor.checkCursor();
		}
		
		return result;
	}

	drawPosSelector() {
		if (this._posCursor === null) {
			return;
		}
		
		this.drawPosCursor();
		this.drawPosMenu();
		MouseControl.drawMapEdge();
	}

	drawPosCursor() {
		this._posCursor.drawCursor();
	}

	drawPosMenu() {
		this._posMenu.drawWindowManager();
	}

	setPosSelectorType(type?) {
		this._selectorType = type;
	}

	getSelectorTarget(isIndexArray?) {
		var child;
		var unit = this._posCursor.getUnitFromCursor();
		
		if (this._unit === unit) {
			if (this._isFusionIncluded) {
				child = FusionControl.getFusionChild(unit);
				if (child !== null) {
					return child;
				}
				else {
					return null;
				}
			}
			else {
				// Myself cannot be selected.
				return this._isSelfSelection ? this._unit : null;
			}
		}
		
		// Check if the unit exists at the cursor position and the unit exists within a range.
		if (unit !== null && isIndexArray) {
			// If it doesn't exist within a range, return null.
			if (!IndexArray.findUnit(this._indexArray, unit)) {
				unit = null;
			}
		}
		
		return unit;
	}

	getSelectorPos(isIndexArray?) {
		var x = this._posCursor.getX();
		var y = this._posCursor.getY();
		
		if (isIndexArray) {
			if (!IndexArray.findPos(this._indexArray, x, y)) {
				return null;
			}
		}
		
		return createPos(x, y);
	}

	setFirstPos() {
		this._posCursor.setFirstPos(this);
	}

	endPosSelector() {
		MapLayer.getMapChipLight().endLight();
	}

	getIndexArray() {
		return this._indexArray;
	}

	setNewTarget() {
		this._posMenu.changePosTarget(this.getSelectorTarget(true));
	}

	_setPosMenu(unit?, item?, type?) {
		this._posMenu.createPosMenuWindow(unit, item, type);
		this._posMenu.changePosTarget(null);
	}

	_getObjectFromType(type?) {
		var obj: any = PosJumpCursor; // reassigned to a sibling class (PosFreeCursor) in another branch
		
		if (type === PosSelectorType.JUMP) {
			obj = PosJumpCursor;
		}
		else if (type === PosSelectorType.FREE) {
			obj = PosFreeCursor;
		}
		
		return obj;
	}

	_getDefaultSelectorType() {
		return EnvironmentControl.isMouseOperation() ? PosSelectorType.FREE : PosSelectorType.JUMP;
	}

	_checkFilter(unit?, filter?) {
		var type = unit.getUnitType();
		
		if (filter & UnitFilterFlag.PLAYER) {
			if (type === UnitType.PLAYER) {
				return true;
			}
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			if (type === UnitType.ENEMY) {
				return true;
			}
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			if (type === UnitType.ALLY) {
				return true;
			}
		}
		
		return false;
	}

	_playSelectSound() {
		MediaControl.soundDirect('commandselect');
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

class PosBaseCursor extends BaseObject {

	_mapCursor: any = null;

	_parentSelector: any = null;

	initialize() {
		this._mapCursor = createObject(MapCursor);
	}

	setParentSelector(parentSelector?) {
		this._parentSelector = parentSelector;
	}

	setFirstPos() {
	}

	checkCursor() {
	}

	drawCursor() {
		this._mapCursor.drawCursor();
	}

	getUnitFromCursor() {
		return this._mapCursor.getUnitFromCursor();
	}

	getX() {
		return this._mapCursor.getX();
	}

	getY() {
		return this._mapCursor.getY();
	}
}

class PosFreeCursor extends PosBaseCursor {

	_xPrev: any = -1;

	_yPrev: any = -1;

	setFirstPos() {
		var x, y, index;
		var indexArray = this._parentSelector.getIndexArray();
		
		if (indexArray.length !== 0) {
			index = indexArray[0];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			
			MapView.changeMapCursor(x, y);
			
			this._xPrev = -1;
			this._yPrev = -1;
		}
	}

	checkCursor() {
		var x, y;
		
		this._mapCursor.moveCursor();
		
		x = this._mapCursor.getX();
		y = this._mapCursor.getY();
		if (x !== this._xPrev || y !== this._yPrev) {
			this._parentSelector.setNewTarget();
			this._xPrev = x;
			this._yPrev = y;
		}
	}
}

class PosJumpCursor extends PosBaseCursor {

	_indexArray: any = null;

	setFirstPos() {
		var mapIndex;
		
		this._indexArray = this._parentSelector.getIndexArray();
		this._indexArray.sort(
			function(a, b) {
				return a - b;
			}
		);
		
		mapIndex = this._indexArray[0];
		MapView.changeMapCursor(CurrentMap.getX(mapIndex), CurrentMap.getY(mapIndex));
		this._parentSelector.setNewTarget();
	}

	checkCursor() {
		var mapIndex, mapCurIndex;
		var index = this._getIndexFromMapCursor();
		
		this._mapCursor.moveCursorAnimation();
		
		if (index === -1) {
			return;
		}
		
		index = this._getMoveIndex(index);
		if (index === -1) {
			return;
		}
		
		mapIndex = this._indexArray[index];
		mapCurIndex = CurrentMap.getIndex(this._mapCursor.getX(), this._mapCursor.getY());
		if (mapIndex !== mapCurIndex) {
			MapView.changeMapCursor(CurrentMap.getX(mapIndex), CurrentMap.getY(mapIndex));
			this._parentSelector.setNewTarget();
			this._playJumpSound();
		}
	}

	_getMoveIndex(index?) {
		var mapIndex, n;
		var col = CurrentMap.getWidth();
		
		if (InputControl.isInputAction(InputType.LEFT)) {
			if (--index < 0) {
				index = this._indexArray.length - 1;
			}
		}
		else if (InputControl.isInputAction(InputType.UP)) {
			mapIndex = this._indexArray[index];
			n = Math.floor(mapIndex % col);
			
			// mapIndex points the last index on the top of the current row.
			mapIndex = mapIndex - n - 1;
			index = this._getUpIndex(index, mapIndex);
		}
		else if (InputControl.isInputAction(InputType.RIGHT)) {
			if (++index > this._indexArray.length - 1) {
				index = 0;
			}
		}
		else if (InputControl.isInputAction(InputType.DOWN)) {
			mapIndex = this._indexArray[index];
			n = Math.floor(mapIndex % col);
			
			// mapIndex points the first index under the current row.
			mapIndex = mapIndex - n + col;
			index = this._getDownIndex(index, mapIndex);
		}
		else {
			index = -1;
		}
		
		return index;
	}

	_getUpIndex(index?, mapIndex?) {
		var i;
		var newIndex = -1;
		
		for (i = index; i >= 0; i--) {
			if (this._indexArray[i] < mapIndex) {
				newIndex = i;
				break;
			}
		}
		
		if (newIndex === -1) {
			newIndex = this._indexArray.length - 1;
		}
		
		return newIndex;
	}

	_getDownIndex(index?, mapIndex?) {
		var i;
		var newIndex = -1;
		var count = this._indexArray.length;
		
		for (i = index; i < count; i++) {
			if (this._indexArray[i] > mapIndex) {
				newIndex = i;
				break;
			}
		}
		
		if (newIndex === -1) {
			newIndex = 0;
		}
		
		return newIndex;
	}

	_getIndexFromMapCursor() {
		var i;
		var count = this._indexArray.length;
		var mapIndex = CurrentMap.getIndex(this._mapCursor.getX(), this._mapCursor.getY());
		var index = -1;
		
		for (i = 0; i < count; i++) {
			if (this._indexArray[i] === mapIndex) {
				index = i;
				break;
			}
		}
		
		return index;
	}

	_playJumpSound() {
		MediaControl.soundDirect('commandselect');
	}
}
