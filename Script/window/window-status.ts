
class StatusWindow extends BaseWindow {

	_scrollbar: any = null;

	initialize() {
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
	}

	moveWindowContent() {
		this._scrollbar.moveScrollbarContent();
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2) + 10;
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	setStatusFromUnit(unit?) {
		this._scrollbar.setStatusFromUnit(unit);
	}

	setStatusFromParam(typeArray?, paramArray?, col?, row?) {
		this._scrollbar.setStatusFromParam(typeArray, paramArray, col, row);
	}

	setStatusBonus(bonusArray?) {
		this._scrollbar.setStatusBonus(bonusArray);
	}
}

class StatusScrollbar extends BaseScrollbar {

	_statusArray: any = null;

	_cursorCounter: any = null;

	_riseCursorSrcIndex: any = 0;

	_isBonus: any = false;

	_isCursorDraw: any = false;

	initialize() {
		this._cursorCounter = createObject(CycleCounter);
		this._cursorCounter.setCounterInfo(20);
		this._cursorCounter.disableGameAcceleration();
	}

	moveScrollbarContent() {
		if (this._cursorCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
			if (this._riseCursorSrcIndex === 0) {
				this._riseCursorSrcIndex = 1;
			}
			else {
				this._riseCursorSrcIndex = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	
	// There is also a possibility in the future,
	// if the BaseUnitParameter has the moveUnitParameter/drawUnitParameter, drawing of each parameter will be flexible.
	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var statusEntry = object;
		var n = statusEntry.param;
		
		statusEntry.textui = this.getParentTextUI();
		
		this._drawStatusName(x, y, statusEntry, isSelect, index);
		
		x += this._getNumberSpace();
		
		if (statusEntry.isRenderable) {
			ParamGroup.drawUnitParameter(x, y, statusEntry, isSelect, statusEntry.index);
		}
		else {
			if (n < 0) {
				n = 0;
			}
			NumberRenderer.drawNumber(x + this._getStatusNumberOffsetX(), y, n);
		}
		
		if (statusEntry.bonus !== 0) {
			this._drawBonus(x, y, statusEntry);
		}
	}

	getObjectWidth() {
		var width = this._getBaseWidth();
		
		if (this._isBonus) {
			width += 24;
			if (this._isCursorDraw) {
				width += 16;
			}
		}
		
		return width;
	}

	getObjectHeight() {
		// It's identical as the ItemRenderer.getItemHeight value.
		return 30;
	}

	setStatusFromUnit(unit?) {
		var i, j;
		var count = ParamGroup.getParameterCount();
		var weapon = ItemControl.getEquippedWeapon(unit);
		
		this._statusArray = [];
		
		for (i = 0, j = 0; i < count; i++) {
			if (this._isParameterDisplayable(i)) {
				this._statusArray[j++] = this._createStatusEntry(unit, i, weapon);
			}
		}
		
		this.setScrollFormation(this.getDefaultCol(), this.getDefaultRow());
		this.setObjectArray(this._statusArray);
	}

	setStatusBonus(bonusArray?) {
		var i, j;
		var count = bonusArray.length;
		
		for (i = 0, j = 0; i < count; i++) {
			if (this._isParameterDisplayable(i)) {
				this._statusArray[j++].bonus = bonusArray[i];
			}
		}
	}

	enableStatusBonus(isCursorDraw?) {
		this._isBonus = true;
		this._isCursorDraw = isCursorDraw;
	}

	getDefaultCol() {
		return 3;
	}

	getDefaultRow() {
		var row = Math.ceil(this._statusArray.length / this.getDefaultCol());
		
		return row;
	}

	_createStatusEntry(unit?, index?, weapon?) {
		var statusEntry = StructureBuilder.buildStatusEntry();
		
		statusEntry.type = ParamGroup.getParameterName(index);
		statusEntry.param = ParamGroup.getClassUnitValue(unit, index);
		statusEntry.bonus = 0;
		statusEntry.index = index;
		statusEntry.isRenderable = ParamGroup.isParameterRenderable(index);
		
		return statusEntry;
	}

	_isParameterDisplayable(index?) {
		return ParamGroup.isParameterDisplayable(UnitStatusType.NORMAL, index);
	}

	_drawStatusName(x?, y?, statusEntry?, isSelect?, index?) {
		var text = statusEntry.type;
		var font = statusEntry.textui.getFont();
		var length = this._getTextLength();
		
		TextRenderer.drawKeywordText(x, y, text, length, ColorValue.KEYWORD, font);
	}

	_drawBonus(x?, y?, statusEntry?) {
		var n = statusEntry.bonus;
		
		x += 15;
	
		if (statusEntry.bonus > 0) {
			TextRenderer.drawSignText(x, y, '+');
		}
		else {
			// Adjust with the following code because the drawNumber cannot be specified minus.
			n = statusEntry.bonus * -1;
			TextRenderer.drawSignText(x, y, '-');
		}
		
		x += 30;
		NumberRenderer.drawNumber(x, y, n);
		
		if (this._isCursorDraw) {
			this._drawRiseCursor(x, y, statusEntry.bonus > 0);
		}
	}

	_drawRiseCursor(x?, y?, isPlus?) {
		var ySrc;
		var n = this._riseCursorSrcIndex;
		var pic = root.queryUI('parameter_risecursor');
		var width = UIFormat.RISECURSOR_WIDTH / 2;
		var height = UIFormat.RISECURSOR_HEIGHT / 2;
		
		if (isPlus) {
			ySrc = 0;
		}
		else {
			ySrc = 24;
		}
		
		if (pic !== null) {
			pic.drawParts(x, y, width * n, ySrc, width, height);
		}
	}

	_getNumberSpace() {
		return 70;
	}

	_getBaseWidth() {
		return 100;
	}

	_getStatusNumberOffsetX() {
		return 0;
	}

	_getTextLength() {
		return Math.floor(this.getObjectWidth() / 2);
	}
}

// Use to display the unit menu.
class UnitStatusScrollbar extends StatusScrollbar {

	getDefaultCol() {
		return 2;
	}

	_createStatusEntry(unit?, index?, weapon?) {
		var statusEntry = StructureBuilder.buildStatusEntry();
		
		statusEntry.type = ParamGroup.getParameterName(index);
		// Include items or state bonuses by calling the ParamGroup.getLastValue, not the ParamGroup.getClassUnitValue.
		statusEntry.param = ParamGroup.getLastValue(unit, index, weapon);
		statusEntry.bonus = 0;
		statusEntry.index = index;
		statusEntry.isRenderable = ParamGroup.isParameterRenderable(index);
		
		return statusEntry;
	}

	_isParameterDisplayable(index?) {
		return ParamGroup.isParameterDisplayable(UnitStatusType.UNITMENU, index);
	}
}

class ItemUseStatusScrollbar extends UnitStatusScrollbar {

	getObjectWidth() {
		return 120;
	}

	getSpaceX() {
		return 15;
	}

	_getNumberSpace() {
		return 75;
	}
}
