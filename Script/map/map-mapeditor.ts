
class MapEditMode {

	static CURSORMOVE: any = 0;

	static UNITMENU: any = 1;
}

class MapEditResult {

	static UNITSELECT: any = 0;

	static MAPCHIPSELECT: any = 1;

	static MAPCHIPCANCEL: any = 2;

	static NONE: any = 3;
}

class MapEdit extends BaseObject {

	_activeIndex: any = 0;

	_prevUnit: any = null;

	_unitMenu: any = null;

	_mapCursor: any = null;

	_mapPartsCollection: any = null;

	_unitRangePanel: any = null;

	_isMarkingDisabled: any = false;

	openMapEdit() {
		this._prepareMemberData();
		this._completeMemberData();
	}

	moveMapEdit() {
		var mode = this.getCycleMode();
		var result = MapEditResult.NONE;
		
		if (mode === MapEditMode.CURSORMOVE) {
			result = this._moveCursorMove();
		}
		else if (mode === MapEditMode.UNITMENU) {
			result = this._moveUnitMenu();
		}
		
		if (result !== MapEditResult.NONE) {
			// There is a possibility that the unit can be updated with a further caller's operation,
			// so set null so that the previous unit isn't kept to be saved.
			this._prevUnit = null;
		}
		
		return result;
	}

	drawMapEdit() {
		var mode = this.getCycleMode();
		
		if (mode === MapEditMode.CURSORMOVE) {
			this._mapCursor.drawCursor();
			this._mapPartsCollection.drawMapPartsCollection();
		
			MouseControl.drawMapEdge();
		}
	}

	clearRange() {
		this._unitRangePanel.setUnit(null);
		this._prevUnit = null;
	}

	getEditTarget() {
		return this._mapCursor.getUnitFromCursor();
	}

	getEditX() {
		return this._mapCursor.getX();
	}

	getEditY() {
		return this._mapCursor.getY();
	}

	setCursorPos(x?, y?) {
		this._mapCursor.setPos(x, y);
	}

	rebuildMapPartsCollection() {
		this._mapPartsCollection.setMapCursor(this._mapCursor);
	}

	disableMarking(isMarkingDisabled?) {
		this._isMarkingDisabled = isMarkingDisabled;
	}

	_prepareMemberData() {
		this._activeIndex = 0;
		this._prevUnit = null;
		this._unitMenu = null;
		this._mapCursor = createObject(MapCursor);
		this._mapPartsCollection = createObject(MapPartsCollection);
		this._unitRangePanel = MapLayer.getUnitRangePanel();
		this._isMarkingDisabled = false;
	}

	_completeMemberData() {
		this._mapPartsCollection.setMapCursor(this._mapCursor);
		this.changeCycleMode(MapEditMode.CURSORMOVE);
	}

	_moveCursorMove() {
		var unit = this._mapCursor.getUnitFromCursor();
		var result = MapEditResult.NONE;
		
		if (InputControl.isSelectAction()) {
			result = this._selectAction(unit);
		}
		else if (InputControl.isCancelAction()) {
			result = this._cancelAction(unit);
		}
		else if (InputControl.isOptionAction()) {
			result = this._optionAction(unit);
		}
		else if (InputControl.isLeftPadAction()) {
			this._changeTarget(false);
		}
		else if (InputControl.isRightPadAction()) {
			this._changeTarget(true);
		}
		else {
			this._mapCursor.moveCursor();
			this._mapPartsCollection.moveMapPartsCollection();
			
			unit = this.getEditTarget();
			
			// Update if the unit is changed.
			if (unit !== this._prevUnit) {
				this._setUnit(unit);
			}
		}
		
		return result;
	}

	_selectAction(unit?) {
		var result;
		
		if (unit !== null) {
			result = MapEditResult.UNITSELECT;
		}
		else {
			result = MapEditResult.MAPCHIPSELECT;
		}
		
		return result;
	}

	_cancelAction(unit?) {
		var result = this._openMenu(unit);
		
		if (result === MapEditResult.MAPCHIPCANCEL) {
			if (!this._isMarkingDisabled && InputControl.getInputType() === InputType.NONE) {
				MapLayer.getMarkingPanel().startMarkingPanel();
			}
		}
		
		return result;
	}

	_optionAction(unit?) {
		return this._openMenu(unit);
	}

	_openMenu(unit?) {
		var screenParam, result;
		
		if (unit !== null) {
			// Process if cancelled on the unit. 
			screenParam = this._createScreenParam();
			this._unitMenu = createObject(UnitMenuScreen);
			SceneManager.addScreen(this._unitMenu, screenParam);
			this.changeCycleMode(MapEditMode.UNITMENU);
			
			result = MapEditResult.NONE;
		}
		else {
			// Return this value if canceled at the place where the unit doesn't exist.
			result = MapEditResult.MAPCHIPCANCEL;
		}
		
		return result;
	}

	_moveUnitMenu() {
		var unit;
		
		if (SceneManager.isScreenClosed(this._unitMenu)) {
			unit = this._unitMenu.getCurrentTarget();
			this._setFocus(unit);
			this.changeCycleMode(MapEditMode.CURSORMOVE);
		}
		
		return MapEditResult.NONE;
	}

	_changeTarget(isNext?) {
		var unit;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		var index = this._activeIndex;
		
		for (;;) {
			if (isNext) {
				index++;
			}
			else {
				index--;
			}
			
			if (index >= count) {
				index = 0;
			}
			else if (index < 0) {
				index = count - 1;
			}
			
			unit = list.getData(index);
			if (unit === null) {
				break;
			}
			
			if (!unit.isWait())  {
				this._activeIndex = index;
				this._setUnit(unit);
				this._setFocus(unit);
				break;
			}
			
			if (index === this._activeIndex) {
				break;
			}
		}
	}

	_setUnit(unit?) {
		this._unitRangePanel.setUnit(unit);
		this._mapPartsCollection.setUnit(unit);
		this._prevUnit = unit;
	}

	_setFocus(unit?) {
		if (unit.getMapX() === this._mapCursor.getX() && unit.getMapY() === this._mapCursor.getY()) {
			return;
		}
		
		MapView.changeMapCursor(unit.getMapX(), unit.getMapY());
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._mapCursor.getUnitFromCursor();
		screenParam.enummode = UnitMenuEnum.SORTIE;
		
		return screenParam;
	}
}

class MapPartsCollection extends BaseObject {

	_mapPartsArray: any = null;

	setMapCursor(editObject?) {
		var i, count;
		
		this._mapPartsArray = [];
		this._configureMapParts(this._mapPartsArray);
		
		count = this._mapPartsArray.length;
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].setMapCursor(editObject);
		}
	}

	moveMapPartsCollection() {
		var i;
		var count = this._mapPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].moveMapParts();
		}
		
		return MoveResult.CONTINUE;
	}

	drawMapPartsCollection() {
		var i;
		var count = this._mapPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].drawMapParts();
		}
	}

	setUnit(unit?) {
		var i;
		var count = this._mapPartsArray.length;
		
		for (i = 0; i < count; i++) {
			this._mapPartsArray[i].setUnit(unit);
		}
	}

	_getWindowTextUI() {
		return root.queryTextUI('default_window');
	}

	_configureMapParts(groupArray?) {
		if (EnvironmentControl.isMapUnitWindowDetail()) {
			groupArray.appendObject(MapParts.UnitInfo);
		}
		else {
			groupArray.appendObject(MapParts.UnitInfoSmall);
		}
		groupArray.appendObject(MapParts.Terrain);
	}
}

class BaseMapParts extends BaseObject {

	_mapCursor: any = null;

	setMapCursor(object?) {
		this._mapCursor = object;
	}

	setUnit(unit?) {
	}

	moveMapParts() {
		return MoveResult.END;
	}

	drawMapParts() {
	}

	getMapPartsTarget() {
		return this._mapCursor.getUnitFromCursor();
	}

	getMapPartsX() {
		return this._mapCursor.getX();
	}

	getMapPartsY() {
		return this._mapCursor.getY();
	}

	getIntervalY() {
		return 20;
	}
}

namespace MapParts {
export class UnitInfo extends BaseMapParts {

	_mhp: any = 0;

	setUnit(unit?) {
		if (unit !== null) {
			this._mhp = ParamBonus.getMhp(unit);
		}
	}

	drawMapParts() {
		var x, y, unit;
		
		unit = this.getMapPartsTarget();
		if (unit === null) {
			return;
		}
		
		x = this._getPositionX(unit);
		y = this._getPositionY(unit);
		
		this._drawMain(x, y);
	}

	_drawMain(x?, y?) {
		var unit = this.getMapPartsTarget();
		var width = this._getWindowWidth();
		var height = this._getWindowHeight();
		var textui = this._getWindowTextUI();
		var pic = textui.getUIImage();
		
		// When select the unit, the direction is not the front.
		// But at that time, the window isn't displayed so as to show the map clearly.
		if (unit === null || unit.getDirection() !== DirectionType.NULL) {
			return;
		}
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += this._getWindowXPadding();
		y += this._getWindowYPadding();
		this._drawContent(x, y, unit, textui);
	}

	_drawContent(x?, y?, unit?, textui?) {
		UnitSimpleRenderer.drawContentEx(x, y, unit, textui, this._mhp);
	}

	_getPositionX(unit?) {
		return LayoutControl.getRelativeX(10) - 54;
	}

	_getPositionY(unit?) {
		var y = LayoutControl.getPixelY(unit.getMapY());
		var d = root.getGameAreaHeight() / 2;
		var yBase = LayoutControl.getRelativeY(10) - 28;
		var yMin = yBase;
		var yMax = root.getGameAreaHeight() - this._getWindowHeight() - yBase;
		
		return y > d ? yMin : yMax;
	}

	_getWindowWidth() {
		return ItemRenderer.getItemWindowWidth();
	}

	_getWindowHeight() {
		return DefineControl.getFaceWindowHeight();
	}

	_getWindowXPadding() {
		return DefineControl.getFaceXPadding();
	}

	_getWindowYPadding() {
		return DefineControl.getFaceYPadding();
	}

	_getWindowTextUI() {
		return root.queryTextUI('face_window');
	}
}

export class UnitInfoSmall extends MapParts.UnitInfo {

	_mhp: any = 0;

	setUnit(unit?) {
		if (unit !== null) {
			this._mhp = ParamBonus.getMhp(unit);
		}
	}

	_drawContent(x?, y?, unit?, textui?) {
		this._drawName(x, y, unit, textui);
		this._drawInfo(x, y, unit, textui);
	}

	_drawName(x?, y?, unit?, textui?) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawText(x, y, unit.getName(), length, color, font);
	}

	_drawInfo(x?, y?, unit?, textui?) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y += this.getIntervalY();
		ContentRenderer.drawHp(x, y, unit.getHp(), this._mhp);
	}

	_getTextLength() {
		return this._getWindowWidth() - DefineControl.getWindowXPadding();
	}

	_getWindowWidth() {
		return 140;
	}

	_getWindowHeight() {
		return 72;
	}

	_getWindowXPadding() {
		return DefineControl.getWindowXPadding();
	}

	_getWindowYPadding() {
		return DefineControl.getWindowYPadding();
	}

	_getWindowTextUI() {
		return root.queryTextUI('default_window');
	}
}

export class Terrain extends BaseMapParts {

	drawMapParts() {
		var x = this._getPositionX();
		var y = this._getPositionY();
		
		this._drawMain(x, y);
	}

	_drawMain(x?, y?) {
		var xCursor = this.getMapPartsX();
		var yCursor = this.getMapPartsY();
		var terrain = PosChecker.getTerrainFromPos(xCursor, yCursor);
		var textui = this._getWindowTextUI();
		var pic = textui.getUIImage();
		
		if (terrain === null) {
			// If the terrain cannot be retrieved, exit before calling drawStretchWindow.
			// This prevents only the top edge of the window from being rendered.
			return;
		}
		
		WindowRenderer.drawStretchWindow(x, y, this._getWindowWidth(), this._getWindowHeight(), pic);
		
		x += this._getWindowXPadding();
		y += this._getWindowYPadding();
		this._drawContent(x, y, terrain);
	}

	_drawContent(x?, y?, terrain?) {
		var text;
		var textui = this._getWindowTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var length = this._getTextLength();
		
		if (terrain === null) {
			return;
		}
		
		x += 2;
		TextRenderer.drawText(x, y, terrain.getName(), length, color, font);
		
		y += this.getIntervalY();
		this._drawKeyword(x, y, root.queryCommand('avoid_capacity'), terrain.getAvoid());
		
		if (terrain.getDef() !== 0) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.DEF));
			y += this.getIntervalY();
			this._drawKeyword(x, y, text, terrain.getDef());
		}
		
		if (terrain.getMdf() !== 0) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.MDF));
			y += this.getIntervalY();
			this._drawKeyword(x, y, text, terrain.getMdf());
		}
	}

	_drawKeyword(x?, y?, text?, value?) {
		ItemInfoRenderer.drawKeyword(x, y, text);
		
		x += 45;
		if (value !== 0) {
			TextRenderer.drawSignText(x, y, value > 0 ? ' + ': ' - ');
			if (value < 0) {
				// Minus cannot be specified for drawNumber, so times -1 to be plus.
				value *= -1;
			}
		}
		x += 40;
		
		NumberRenderer.drawNumber(x, y, value);
	}

	_getPartsCount(terrain?) {
		var count = 0;
		
		count += 3;
		if (terrain.getDef() !== 0) {
			count++;
		}
		
		if (terrain.getMdf() !== 0) {
			count++;
		}
		
		return count;
	}

	_getTextLength() {
		return this._getWindowWidth() - DefineControl.getWindowXPadding();
	}

	_getPositionX(unit?) {
		var dx = LayoutControl.getRelativeX(10) - 54;
		
		return root.getGameAreaWidth() - this._getWindowWidth() - dx;
	}

	_getPositionY() {
		var x = LayoutControl.getPixelX(this.getMapPartsX());
		var dx = root.getGameAreaWidth() / 2;
		var y = LayoutControl.getPixelY(this.getMapPartsY());
		var dy = root.getGameAreaHeight() / 2;
		var yBase = LayoutControl.getRelativeY(10) - 28;
		
		if (x > dx && y < dy) {
			return root.getGameAreaHeight() - this._getWindowHeight() - yBase;
		}
		else {
			return yBase;
		}
	}

	_getWindowXPadding() {
		return DefineControl.getWindowXPadding();
	}

	_getWindowYPadding() {
		return DefineControl.getWindowYPadding();
	}

	_getWindowWidth() {
		return 140;
	}

	_getWindowHeight() {
		var xCursor = this.getMapPartsX();
		var yCursor = this.getMapPartsY();
		var terrain = PosChecker.getTerrainFromPos(xCursor, yCursor);
		
		if (terrain === null) {
			return 0;
		}
		
		return 12 + (this._getPartsCount(terrain) * this.getIntervalY());
	}

	_getWindowTextUI() {
		return root.queryTextUI('default_window');
	}
}
}
