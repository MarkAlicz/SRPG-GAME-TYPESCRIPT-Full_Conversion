
class CurrentMap {

	static _width: any = 0;

	static _height: any = 0;

	static _divisionAreaArray: any = null;

	static _isSkipMode: any = false;

	static _isEnemyAccelerationEnabled: any = false;

	static prepareMap() {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		MapLayer.resetMapLayer();
		
		if (mapInfo !== null) {
			this._width = mapInfo.getMapWidth();
			this._height = mapInfo.getMapHeight();
			
			// This calling will have a meaning when reinforcements appear.
			this.prepareDivisionAreaArray();
			
			MapLayer.prepareMapLayer();
			
			MouseControl.prepareMouseControl();
			
			this._checkMapBoundaryValue(true);
			
			this.setTurnSkipMode(false);
		}
		else {
			this._width = 0;
			this._height = 0;
			this._divisionAreaArray = null;
			this._isSkipMode = false;
			this._checkMapBoundaryValue(false);
		}
	}

	static getWidth() {
		return this._width;
	}

	static getHeight() {
		return this._height;
	}

	static getSize() {
		return this._width * this._height;
	}

	static isMapInside(x?, y?) {
		if (x < 0 || x > this._width - 1) {
			return false;
		}
		
		if (y < 0 || y > this._height - 1) {
			return false;
		}
		
		return true;
	}

	static getIndex(x?, y?) {
		if (!this.isMapInside(x, y)) {
			return -1;
		}
		
		return (y * this._width) + x;
	}

	static getX(index?) {
		return Math.floor(index % this._width);
	}

	static getY(index?) {
		return Math.floor(index / this._width);
	}

	static getCol() {
		return Math.ceil(root.getGameAreaWidth() / GraphicsFormat.MAPCHIP_WIDTH);
	}

	static getRow() {
		// If the resolution is 800x600 etc., the height is indivisible by 32.
		// In this scene, round up the number.
		return Math.ceil(root.getGameAreaHeight() / GraphicsFormat.MAPCHIP_HEIGHT);
	}

	static prepareDivisionAreaArray() {
		var x, y, xEnd, yEnd, divisionArea;
		var width = CurrentMap.getWidth();
		var height = CurrentMap.getHeight();
		
		this._divisionAreaArray = [];
		
		// If a map is wide, even if display reinforcements at once, sometimes some parts cannot be seen.
		// So divide the map display range in a certain number and check if the reinforcements are within the range in order with obj.
		y = 0;
		yEnd = 0;
		for (; y < height;) {
			yEnd += this.getRow();
			if (yEnd > height) {
				yEnd = height;
			}
			
			x = 0;
			xEnd = 0;
			for (; x < width;) {
				xEnd += this.getCol();
				if (xEnd > width) {
					xEnd = width;
				}
				
				divisionArea = {};
				divisionArea.x = x;
				divisionArea.y = y;
				divisionArea.xEnd = xEnd;
				divisionArea.yEnd = yEnd;
				this._divisionAreaArray.push(divisionArea);
				
				x = xEnd;
			}
			y = yEnd;
		}
	}

	static getDivisionAreaArray() {
		return this._divisionAreaArray;
	}

	static setTurnSkipMode(isSkipMode?) {
		this._isSkipMode = isSkipMode;
		root.setEventSkipMode(isSkipMode);
	}

	static isTurnSkipMode() {
		return this._isSkipMode;
	}

	static isCompleteSkipMode() {
		return this._isSkipMode || root.isEventSkipMode();
	}

	static isEnemyAcceleration() {
		return this._isEnemyAccelerationEnabled;
	}

	static enableEnemyAcceleration(isEnabled?) {
		this._isEnemyAccelerationEnabled = isEnabled;
	}

	static _checkMapBoundaryValue(isEnabled?) {
		if (isEnabled) {
			if (!DataConfig.isMapEdgePassable()) {
				// Disable one tile if invasion of the map edge is not allowed.
				root.getCurrentSession().setMapBoundaryValue(1);
			}
		}
	}
}

class MapLayer {

	// NOTE (JS->TS conversion): neither member is ever assigned anywhere in the original codebase.
	// _effectRangeType: read-only, harmless (same pattern as other phantom fields here).
	// _drawScreenColor: CALLED (this._drawScreenColor()) at ~line 221 - calling undefined as a
	// function throws a runtime TypeError if this path ever executes. A same-named drawScreenColor()
	// (no underscore) exists on motion objects and IS used correctly two lines later
	// (this._effectMotion.drawScreenColor()) - strongly suggesting that's the intended call.
	// Not silently rewritten since the correct receiver isn't certain; flagged for priority review.
	static _effectRangeType: any = undefined;
	static _drawScreenColor(): any { return undefined; }

	static _counter: any = null;

	static _unitRangePanel: any = null;

	static _mapChipLight: any = null;

	static _markingPanel: any = null;

	static _effectMotion: any = null;

	static prepareMapLayer() {
		this._counter = createObject(UnitCounter);
		this._unitRangePanel = createObject(UnitRangePanel);
		
		this._mapChipLight = createObject(MapChipLight);
		this._mapChipLight.setLightType(MapLightType.NORMAL);
		
		this._markingPanel = createObject(MarkingPanel);
	}

	static moveMapLayer() {
		this._counter.moveUnitCounter();
		this._unitRangePanel.moveRangePanel();
		this._mapChipLight.moveLight();
		this._markingPanel.moveMarkingPanel();
		
		return MoveResult.END;
	}

	static drawMapLayer() {
		var session;
		
		session = root.getCurrentSession();
		if (session !== null) {
			session.drawMapSet(0, 0);
			if (EnvironmentControl.isMapGrid() && root.isSystemSettings(SystemSettingsType.MAPGRID)) {
				session.drawMapGrid(0x0, 64);
			}
		}
		else {
			root.getGraphicsManager().fill(0x0);
		}
		
		this._drawColor(EffectRangeType.MAP);
	}

	static drawUnitLayer() {
		var index = this._counter.getAnimationIndex();
		var index2 = this._counter.getAnimationIndex2();
		var session = root.getCurrentSession();
		
		this._markingPanel.drawMarkingPanel();
		
		this._unitRangePanel.drawRangePanel();
		this._mapChipLight.drawLight();
		
		if (session !== null) {
			session.drawUnitSet(true, true, true, index, index2);
		}
		
		this._drawColor(EffectRangeType.MAPANDCHAR);
		
		if (this._effectRangeType === EffectRangeType.MAPANDCHAR) {
			this._drawScreenColor();
		}
	}

	static resetMapLayer() {
		// If this._map is added to the MapLayer object, initialize it with this method.
	}

	static getAnimationIndexFromUnit(unit?) {
		return this._counter.getAnimationIndexFromUnit(unit);
	}

	static getUnitRangePanel() {
		return this._unitRangePanel;
	}

	static getMapChipLight() {
		return this._mapChipLight;
	}

	static getMarkingPanel() {
		return this._markingPanel;
	}

	static setEffectMotion(motion?) {
		this._effectMotion = motion;
	}

	static _drawColor(rangeType?) {
		if (this._effectMotion === null) {
			return;
		}
		
		this._drawColorAnime(rangeType);
		
		if (this._effectMotion.getScreenEffectRangeType() === rangeType) {
			this._effectMotion.drawScreenColor();
		}
	}

	static _drawColorAnime(rangeType?) {
		if (this._effectMotion === null) {
			return;
		}
		
		if (this._effectMotion.getBackgroundAnimeRangeType() === rangeType) {
			this._effectMotion.drawBackgroundAnime();
		}
	}
}

class MapView {

	static isVisible(x?, y?) {
		return this.isVisiblePixel(x * GraphicsFormat.MAPCHIP_WIDTH, y * GraphicsFormat.MAPCHIP_HEIGHT);
	}

	static isVisiblePixel(xPixel?, yPixel?) {
		var session = root.getCurrentSession();
		var mx = session.getScrollPixelX();
		var my = session.getScrollPixelY();
		var width = root.getGameAreaWidth();
		var height = root.getGameAreaHeight();
		
		if (mx > xPixel || my > yPixel) {
			return false;
		}
		else if ((mx + width) <= xPixel || (my + height) <= yPixel) {
			return false;
		}
		
		return true;
	}

	static setScroll(x?, y?) {
		return this.setScrollPixel(x * GraphicsFormat.MAPCHIP_WIDTH, y * GraphicsFormat.MAPCHIP_HEIGHT);
	}

	static setScrollPixel(xPixel?, yPixel?) {
		var pos = this.getScrollPixelPos(xPixel, yPixel);
		var session = root.getCurrentSession();
		var xScrollPrev = session.getScrollPixelX();
		var yScrollPrev = session.getScrollPixelY();
		
		session.setScrollPixelX(pos.x);
		session.setScrollPixelY(pos.y);

		return xScrollPrev !== pos.x || yScrollPrev !== pos.y;
	}

	static getScrollPixelPos(xPixel?, yPixel?) {
		var xScroll, yScroll;
		var maxWidth = CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var maxHeight = CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var areaWidth = root.getGameAreaWidth();
		var areaHeight = root.getGameAreaHeight();
		
		xScroll = xPixel - Math.floor(areaWidth / 2);
		
		if (xScroll < 0) {
			xScroll = 0;
		}
		else if (xScroll > maxWidth - areaWidth) {
			xScroll = maxWidth - areaWidth;
		}
		
		yScroll = yPixel - Math.floor(areaHeight / 2);

		if (yScroll < 0) {
			yScroll = 0;
		}
		else if (yScroll > maxHeight - areaHeight) {
			yScroll = maxHeight - areaHeight;
		}
		
		return createPos(xScroll, yScroll);
	}

	static getScrollableData() {
		var isLeft = false;
		var isTop = false;
		var isRight = false;
		var isBottom = false;
		var session = root.getCurrentSession();
		var xScroll = session.getScrollPixelX();
		var yScroll = session.getScrollPixelY();
		var maxWidth = CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var maxHeight = CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var areaWidth = root.getGameAreaWidth();
		var areaHeight = root.getGameAreaHeight();
		
		if (xScroll > 0) {
			isLeft = true;
		}
		
		if (xScroll < maxWidth - areaWidth) {
			isRight = true;
		}
		
		if (yScroll > 0) {
			isTop = true;	
		}
		
		if (yScroll < maxHeight - areaHeight) {
			isBottom = true;
		}
		
		return {
			isLeft: isLeft,
			isTop: isTop,
			isRight: isRight,
			isBottom: isBottom
		};
	}

	static changeMapCursor(x?, y?) {
		var session = root.getCurrentSession();
		
		if (session === null) {
			return;
		}
		
		session.setMapCursorX(x);
		session.setMapCursorY(y);
		
		this.setScroll(x, y);
		MouseControl.changeCursorFromMap(x, y);
	}
}

class MapHpControl {

	// ParamBonus.getMhp calls unit.saveMhp internally.
	// To avoid retrieving the unit's maximum HP too frequently, cache it with ParamBonus.getMhp.
	static updateHp(unit?) {
		var mhp = ParamBonus.getMhp(unit);
		
		// Check that the unit's current HP does not exceed its maximum HP.
		// This issue occurs when a state that reduces HP is inflicted on a unit.
		if (unit.getHp() > mhp) {
			unit.setHp(mhp);
		}
	}

	static updateHpAll() {
		var i, j, count, list, targetUnit;
		var filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				this.updateHp(targetUnit);
			}
		}
	}
}

class HpDecorationType {

	static FULL: any = 0;

	static NONFULL: any = 1;

	static HALF: any = 2;

	static QUARTER: any = 3;
}

// Notify how to draw HP to game.exe, not draw the HP.
// If drawing process itself is executed by game.exe, it's speeded up more than drawing by script.
class MapHpDecorator {

	static setupDecoration() {
		this._setupDecorationFromType(HpDecorationType.FULL);
		this._setupDecorationFromType(HpDecorationType.NONFULL);
		this._setupDecorationFromType(HpDecorationType.HALF);
		this._setupDecorationFromType(HpDecorationType.QUARTER);
	}

	static _setupDecorationFromType(type?) {
		var obj = root.getHpDecoration(type);
		var pos = this._getPos();
		var width = 32;
		var height = 10;
		var color = this._getColor(type);
		var alpha = this._getAlpha(type);
		var strokeColor = 0xff;
		var strokeAlpha = 255;
		var hpType = EnvironmentControl.getMapUnitHpType();
		
		obj.beginDecoration();
		
		if (hpType === 0) {
			// The color and outline are set before calling addRectangle.
			obj.setFillColor(color, alpha);
			obj.setStrokeInfo(strokeColor, strokeAlpha, 1, true);
			obj.addRectangle(pos.x, pos.y, width, height);
			
			this._addHp(obj, pos, this._getNumberColorIndex(hpType));
		}
		else if (hpType === 1) {
			obj.addGauge(pos.x, pos.y, 1);
		}
		
		obj.endDecoration();
	}

	static _addHp(obj?, pos?, colorIndex?) {
		obj.addHp(pos.x, pos.y, colorIndex);
	}

	static _getColor(type?) {
		var arr = [0x00ffff, 0x00ff00, 0xffff00, 0xff0000];
		
		return arr[type];
	}

	static _getAlpha(type?) {
		return 204;
	}

	static _getNumberColorIndex(type?) {
		return 0;
	}

	static _getPos() {
		var x = 1;
		var y = 20;
		
		if (GraphicsFormat.MAPCHIP_WIDTH !== 32 || GraphicsFormat.MAPCHIP_HEIGHT !== 32) {
			x += 8;
			y += 8;
		}
		
		return {
			x: x,
			y: y
		};
	}
}

class SymbolDecorationType {

	static PLAYER: any = 0;

	static ENEMY: any = 1;

	static PARTNER: any = 2;
}

class MapSymbolDecorator {

	static setupDecoration() {
		this._setupDecorationFromType(SymbolDecorationType.PLAYER);
		this._setupDecorationFromType(SymbolDecorationType.ENEMY);
		this._setupDecorationFromType(SymbolDecorationType.PARTNER);
	}

	static _setupDecorationFromType(type?) {
		var obj = root.getSymbolDecoration(type);
		var color = this._getColor(type);
		var alpha = this._getAlpha(type);
		var pos = this._getPos();
		var width = 32;
		var height = 18;
		
		obj.beginDecoration();
		if (EnvironmentControl.isMapUnitSymbol()) {
			obj.setFillColor(color, alpha);
			obj.setLargeSize(-2, 0, 4, 6);
			obj.addEllipse(pos.x, pos.y, width, height);
		}
		obj.endDecoration();
	}

	static _getColor(type?) {
		var arr = [0x5732ec, 0xf0312d, 0x31e640];
		
		return arr[type];
	}

	static _getAlpha(type?) {
		return 140;
	}

	static _getPos() {
		var x = 0;
		var y = 20;
		
		if (GraphicsFormat.MAPCHIP_WIDTH !== 32 || GraphicsFormat.MAPCHIP_HEIGHT !== 32) {
			x += 8;
			y += 8;
		}
		
		return {
			x: x,
			y: y
		};
	}
}

class IconDecorationType {

	static STATE: any = 0;

	static FUSION: any = 1;

	static STATEORFUSION: any = 2;

	static CLASSTYPE: any = 10;

	static EQUIPWEAPON: any = 11;
}

class MapIconDecorator {

	static setupDecoration() {
		var obj = root.getIconDecoration();
		
		obj.beginDecoration();
		
		obj.setCounterMax(this._getCounterMax());
		
		this._addDecorationData(obj);
		
		obj.endDecoration();
	}

	static _addDecorationData(obj?) {
		var pos = this._getStatePos();
		
		obj.addObjectType(pos.x, pos.y, IconDecorationType.STATEORFUSION, false);
	}

	static _getStatePos() {
		return {
			x: 12,
			y: -4
		};
	}

	static _getCounterMax() {
		return 16;
	}
}
