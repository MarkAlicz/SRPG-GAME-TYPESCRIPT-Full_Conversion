
class UnitSelectMode {

	static SINGLE: any = 0;

	static DOUBLE: any = 1;

	static MENU: any = 2;

	static NONE: any = 3;
}

class UnitSelectWindow extends BaseWindow {

	_returnmode: any = 0;

	_scrollbar: any = null;

	_unitFirst: any = null;

	_unitSecond: any = null;

	_indexFirst: any = 0;

	_unitMenuScreen: any = null;

	setInitialList(unitList?) {
		var rowCount = LayoutControl.getObjectVisibleCount(77, 6);
		var colCount = root.getGameAreaWidth() > 1000 ? 3 : 2;
		
		this._scrollbar = createScrollbarObject(UnitSelectScrollbar, this);
		this._scrollbar.setScrollFormation(colCount, rowCount);
		this._scrollbar.setDataList(unitList);
		
		this.changeCycleMode(UnitSelectMode.NONE);
	}

	changeUnitList(unitList?) {
		this._scrollbar.setDataList(unitList);
	}

	moveWindowContent() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitSelectMode.SINGLE) {
			result = this._moveSingle();
		}
		else if (mode === UnitSelectMode.DOUBLE) {
			result = this._moveDouble();
		}
		else if (mode === UnitSelectMode.MENU) {
			result = this._moveMenu();
		}
		
		return result;
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	getRecentlyInputType() {
		return this._scrollbar.getRecentlyInputType();
	}

	cancelDoubleMode() {
		this._scrollbar.setForceSelect(-1);
		this._scrollbar.setIndex(this._indexFirst);
		this.resetSelectUnit();
	}

	resetSelectUnit() {
		this._unitFirst = null;
		this._unitSecond = null;
	}

	setSingleMode() {
		this.changeCycleMode(UnitSelectMode.SINGLE);
		this.resetSelectUnit();
	}

	setDoubleMode() {
		this.changeCycleMode(UnitSelectMode.DOUBLE);
		this.resetSelectUnit();
	}

	getFirstUnit() {
		return this._unitFirst;
	}

	getSecondUnit() {
		return this._unitSecond;
	}

	getCurrentUnit() {
		return this._scrollbar.getObject();
	}

	getUnitSelectIndex() {
		return this._scrollbar.getIndex();
	}

	setUnitSelectIndex(index?) {
		this._scrollbar.setIndex(index);
	}

	setForceSelect(index?) {
		this._scrollbar.setForceSelect(index);
	}

	setActive(isActive?) {
		this._scrollbar.setActive(isActive);
	}

	updateUnitList(unitList?) {
		this._scrollbar.setDataList(unitList);
	}

	getUnitList() {
		var obj = StructureBuilder.buildDataList();
		
		obj.setDataArray(this._scrollbar._objectArray);
		
		return obj;
	}

	isUnitMenuMode() {
		return this.getCycleMode() === UnitSelectMode.MENU;
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	_moveSingle() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			this._unitFirst = this._scrollbar.getObject();
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this.resetSelectUnit();
			result = MoveResult.END;
		}
		else if (input === ScrollbarInput.OPTION) {
			this._openMenu();
		}
		
		return result;
	}

	_moveDouble() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			if (this._unitFirst === null) {
				this._unitFirst = this._scrollbar.getObject();
				this._scrollbar.setForceSelect(this._scrollbar.getIndex());
				this._indexFirst = this._scrollbar.getIndex();
			}
			else {
				this._unitSecond = this._scrollbar.getObject();
				this._scrollbar.setForceSelect(-1);
				result = MoveResult.END;
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._unitFirst === null) {
				result = MoveResult.END;
			}
			else {
				this.cancelDoubleMode();
				this._scrollbar.setForceSelect(-1);
				this._scrollbar.setIndex(this._indexFirst);
				this.resetSelectUnit();
			}
		}
		else if (input === ScrollbarInput.OPTION) {
			this._openMenu();
		}
		
		return result;
	}

	_moveMenu() {
		var unit, index;
		
		if (SceneManager.isScreenClosed(this._unitMenuScreen)) {
			unit = this._unitMenuScreen.getCurrentTarget();
			
			index = this._scrollbar.getIndexFromObject(unit);
			
			// Set the current unit index because the unit needs to be switched when the menu is displayed.
			this._scrollbar.setIndex(index);
			
			// Get the mode back to the state before entering the menu.
			this.changeCycleMode(this._returnmode);
		}
		
		return MoveResult.CONTINUE;
	}

	_openMenu() {
		var screenParam = this._createScreenParam();
		
		this._unitMenuScreen = createObject(UnitMenuScreen);
		SceneManager.addScreen(this._unitMenuScreen, screenParam);
		
		// Save so as to get back to the previous mode when the menu is closed.
		this._returnmode = this.getCycleMode();
		
		this.changeCycleMode(UnitSelectMode.MENU);
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitMenu();
		
		screenParam.unit = this._scrollbar.getObject();
		screenParam.enummode = UnitMenuEnum.ALIVE;
		
		return screenParam;
	}
}

class UnitSelectScrollbar extends BaseScrollbar {

	_selectableArray: any = null;

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var range;
		var unit = object;
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var dx = Math.floor((this.getObjectWidth() - GraphicsFormat.CHARCHIP_WIDTH) / 2) + 16;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var alpha = this._getAlpha(unit, isSelect, index);
		
		this._drawUnitHighlight(x, y, unit, isSelect);
		
		x += dx;
		y += 10;
		unitRenderParam.alpha = alpha;
		UnitRenderer.drawDefaultUnit(unit, x, y, unitRenderParam);
		
		range = createRangeObject(x - 50, y + 30, length, 40);
		TextRenderer.drawRangeAlphaText(range, TextFormat.CENTER, unit.getName(), length, color, alpha, font);
	}

	getObjectWidth() {
		return 130;
	}

	getObjectHeight() {
		return 80;
	}

	setSelectableArray(arr?) {
		this._selectableArray = arr;
	}

	_drawUnitHighlight(x?, y?, unit?, isSelect?) {
		if (isSelect) {
			// root.getGraphicsManager().fillRange(x, y, this.getObjectWidth(), this.getObjectHeight(), 0xffffff, 128);
		}
	}

	_getAlpha(unit?, isSelect?, index?) {
		var alpha = 255;
		
		if (this._selectableArray !== null && !this._selectableArray[index]) {
			alpha = 128;
		}
		
		return alpha;
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}
