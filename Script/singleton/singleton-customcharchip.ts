
class CustomCharChipFlag {

	static UNIT: any = 0x01;

	static GLOBAL: any = 0x02;
}

class CustomCharChipGroup {

	static _objectArray: any = null;

	static initSingleton() {
		this._objectArray = [];
		this._configureCustomCharChip(this._objectArray);
	}

	static createCustomRenderer(unit?) {
		var i, obj;
		var count = this._objectArray.length;
		var keyword = unit.getCustomCharChipKeyword();
		
		for (i = 0; i < count; i++) {
			if (this._objectArray[i].getKeyword() === keyword) {
				obj = createObject(this._objectArray[i]);
				unit.setCustomRenderer(obj);
				break;
			}
		}
	}

	static drawMenuUnit(renderer?, unit?, xPixel?, yPixel?, unitRenderParam?) {
		var cpData;
		
		if (renderer !== null) {
			cpData = this.createCustomCharChipDataFromUnit(unit, xPixel, yPixel, unitRenderParam);
			renderer.drawMenuCharChip(cpData);
		}
	}

	static createCustomCharChipDataFromUnit(unit?, xPixel?, yPixel?, unitRenderParam?) {
		var cpData: any = {};
		var terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
		
		// Constructs the same object as the object specified when the system calls drawCustomCharChip.
		cpData.xPixel = xPixel;
		cpData.yPixel = yPixel;
		cpData.unit = unit;
		cpData.cls = unit.getClass();
		cpData.terrain = terrain;
		cpData.animationIndex = unitRenderParam.animationIndex;
		cpData.direction = unitRenderParam.direction;
		cpData.alpha = unitRenderParam.alpha;
		cpData.unitType = unit.getUnitType();
		
		// Drawing is done on the menu so the wait condition is not taken into account.
		cpData.isWait = false;
		
		cpData.keyword = unit.getCustomCharChipKeyword();
		
		// The following property is set to true when drawCustomCharChip is called from the system.
		cpData.isSymbol = false;
		cpData.isHpVisible = false;
		cpData.isStateIcon = false;
		
		return cpData;
	}

	static getFlag() {
		return this._objectArray.length > 0 ? CustomCharChipFlag.UNIT : 0;
	}

	static _configureCustomCharChip(groupArray?) {
	}
}

class BaseCustomCharChip extends BaseObject {
	_waitResourceHandle: any;


	initialize() {
	}

	
	// This method is called from the system right after setCustomRenderer is called. 
	setupCustomCharChip(unit?) {
	}

	
	// This method and drawCustomCharChip are called on a regular basis when setCustomRenderer is being called on units.
	// In cases like drawing charchips as effects, this is where frames advance.
	moveCustomCharChip() {
		return MoveResult.CONTINUE;
	}

	
	// By default the system draws existing units on the map since there are so many.
	// However, this method is called instead of drawing by default if setCustomRenderer is called on units. 
	drawCustomCharChip(cpData?) {
	}

	
	// This method is called when drawing on the unit menu, movement on the map, and easy battles.
	// Even if there are multiple units who have the custom renderer applied to them,
	// this method's processing cost can be tolerated to a certain extent since the menu is only opened on one unit.
	drawMenuCharChip(cpData?) {
	}

	
	// If this method returns true, original charchips will not be drawn on the unit menu.
	isDefaultMenuUnit() {
		return true;
	}

	
	// This function does not need to be changed if there is no intention of using the class's "Conditional Show" to change the look of charchips.
	getKeyword() {
		return '';
	}

	_drawSymbol(x?, y?, cpData?) {
		if (cpData.isSymbol) {
			root.drawCharChipSymbol(x, y, cpData.unit);
		}
	}

	_drawHpGauge(x?, y?, cpData?) {
		if (cpData.isHpVisible) {
			root.drawCharChipHpGauge(x, y, cpData.unit);
		}
	}

	_drawStateIcon(x?, y?, cpData?) {
		if (cpData.isStateIcon) {
			root.drawCharChipStateIcon(x, y, cpData.unit);
		}
	}

	_drawWaitIcon(x?, y?, cpData?) {
		if (cpData.isWait) {
			GraphicsRenderer.drawImage(x, y, this._getWaitIconResourceHandle(), GraphicsType.ICON);
		}
	}

	_getWaitIconResourceHandle() {
		if (typeof this._waitResourceHandle === 'undefined') {
			this._waitResourceHandle = root.createResourceHandle(true, 10, 0, 4, 0);
		}
		
		return this._waitResourceHandle;
	}
}
