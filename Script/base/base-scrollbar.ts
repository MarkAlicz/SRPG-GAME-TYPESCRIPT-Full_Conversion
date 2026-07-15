
class ScrollbarInput {

	static SELECT: any = 0;

	static CANCEL: any = 1;

	static NONE: any = 2;

	static OPTION: any = 3;

	static START: any = 4;
}

class BaseScrollbar extends BaseObject {
	_saveScrollY: any;
	xRendering: any;
	yRendering: any;


	_col: any = 0;

	_rowCount: any = 0;

	_showRowCount: any = 0;

	_objectWidth: any = 0;

	_objectHeight: any = 0;

	_xScroll: any = 0;

	_yScroll: any = 0;

	_edgeCursor: any = null;

	_commandCursor: any = null;

	_objectArray: any = null;

	_isActive: any = false;

	_forceSelectIndex: any = -1;

	_isPageChange: any = false;

	_inputType: any = -1;

	_prevIndex: any = -1;

	initialize() {
	}

	moveInput() {
		var input;
		
		if (root.isInputAction(InputType.BTN1) || this._isScrollbarObjectPressed()) {
			this.playSelectSound();
			input = ScrollbarInput.SELECT;
		}
		else if (InputControl.isCancelAction()) {
			this.playCancelSound();
			input = ScrollbarInput.CANCEL;
		}
		else if (InputControl.isOptionAction()) {
			this.playOptionSound();
			input = ScrollbarInput.OPTION;
		}
		else if (InputControl.isStartAction()) {
			this.playStartSound();
			input = ScrollbarInput.START;
		}
		else {
			this.moveScrollbarCursor();
			input = ScrollbarInput.NONE;
		}
		
		return input;
	}

	moveScrollbarCursor() {
		var inputType = this._commandCursor.moveCursor();
		
		if (this._rowCount === 1) {
			// Processing when only horizontal entries line.
			this._xScroll = this._changeScrollValue(inputType, this._xScroll, true);
		}
		else {
			// Processing when vertical entries also line.
			this._yScroll = this._changeScrollValue(inputType, this._yScroll, false);
		}
		
		if (this._isPageChange) {
			this._checkPage(inputType);
		}
		this._edgeCursor.moveCursor();
		
		MouseControl.checkScrollbarEdgeAction(this);
		MouseControl.checkScrollbarWheel(this);
		
		this.moveScrollbarContent();
		
		if (inputType === InputType.NONE) {
			inputType = MouseControl.moveScrollbarMouse(this);
		}
		
		this._inputType = inputType;
		
		return inputType;
	}

	moveScrollbarContent() {
		return true;
	}

	drawScrollbar(xStart?, yStart?) {
		var i, j, x, y, isSelect;
		var isLast = false;
		var objectCount = this.getObjectCount();
		var width = this._objectWidth + this.getSpaceX();
		var height = this._objectHeight + this.getSpaceY();
		var index = (this._yScroll * this._col) + this._xScroll;
		
		xStart += this.getScrollXPadding();
		yStart += this.getScrollYPadding();
		
		// The data shouldn't be updated with draw functions, but exclude so as to enable to refer to the position with move functions.
		this.xRendering = xStart;
		this.yRendering = yStart;
		MouseControl.saveRenderingPos(this);
		
		for (i = 0; i < this._rowCount; i++) {
			y = yStart + (i * height);
			
			this.drawDescriptionLine(xStart, y);
			
			for (j = 0; j < this._col; j++) {
				x = xStart + (j * width);
				
				isSelect = index === this.getIndex();
				this.drawScrollContent(x, y, this._objectArray[index], isSelect, index);
				if (isSelect && this._isActive) {
					this.drawCursor(x, y, true);
				}
				
				if (index === this._forceSelectIndex) {
					this.drawCursor(x, y, false);
				}
				
				if (++index === objectCount) {
					isLast = true;
					break;
				}
			}
			if (isLast) {
				break;
			}
		}
		
		if (this._isActive) {
			this.drawEdgeCursor(xStart, yStart);
		}
	}

	getScrollableData() {
		var d;
		var isLeft = false;
		var isTop = false;
		var isRight = false;
		var isBottom = false;
		
		if (this._rowCount === 1) {
			d = this._col + this._xScroll;
			
			// If even one is scrolled, display the left-pointing cursor.
			isLeft = this._xScroll > 0;
			
			isRight = d < this._objectArray.length;
		}
		else {
			// Add a range to be seen and a range not to be seen without scroll.
			d = (this._showRowCount * this._col) + (this._col * this._yScroll);
			
			// If even one is scrolled, display the up-pointing cursor.
			isTop = this._yScroll > 0;
			
			isBottom = d < this._objectArray.length;
		}
		
		return {
			isLeft: isLeft,
			isTop: isTop,
			isRight: isRight,
			isBottom: isBottom
		};
	}

	getRecentlyInputType() {
		return this._inputType;
	}

	drawCursor(x?, y?, isActive?) {
		var pic = this.getCursorPicture();
		
		y = y - (32 - this._objectHeight) / 2;
		
		this._commandCursor.drawCursor(x, y, isActive, pic);
	}

	drawEdgeCursor(x?, y?) {
		var scrollableData = this.getScrollableData();
		
		this._edgeCursor.drawHorzCursor(x - this.getScrollXPadding(), y - this.getScrollYPadding(), scrollableData.isLeft, scrollableData.isRight);
		this._edgeCursor.drawVertCursor(x - this.getScrollXPadding(), y - this.getScrollYPadding(), scrollableData.isTop, scrollableData.isBottom);
	}

	drawDescriptionLine(x?, y?) {
		var count;
		var textui = this.getDescriptionTextUI();
		var pic = textui.getUIImage();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var obj = this._getDescriptionLinePos();
		
		if (pic !== null) {
			count = Math.floor(this.getScrollbarWidth() / width) + obj.count;
			TitleRenderer.drawTitle(pic, x + obj.x, y + this._objectHeight + obj.y, width, height, count);
		}
	}

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
	}

	setScrollFormation(col?, showRowCount?) {
		this._objectArray = [];
		this.setScrollFormationInternal(col, showRowCount);
	}

	setScrollFormationInternal(col?, showRowCount?) {
		this._commandCursor = createObject(CommandCursor);
		
		this._col = col;
		this._showRowCount = showRowCount;
		
		this._objectWidth = this.getObjectWidth();
		this._objectHeight = this.getObjectHeight();
		
		this._edgeCursor = createObject(EdgeCursor);
		this._edgeCursor.setEdgeRange(this.getScrollbarWidth(), this.getScrollbarHeight());
	}

	resetScrollData() {
		this._objectArray = [];
		this._xScroll = 0;
		this._yScroll = 0;
		this._rowCount = 0;
	}

	objectSet(obj?) {
		this._objectArray.push(obj);
	}

	objectSetEnd() {
		var objectCount = this._objectArray.length;
		
		if (this._col === 1) {
			this._commandCursor.setCursorUpDown(objectCount);
		}
		else if (this._showRowCount === 1) {
			this._commandCursor.setCursorLeftRight(objectCount);
		}
		else {
			this._commandCursor.setCursorCross(objectCount, this._col);
		}
		
		this._rowCount = Math.ceil(objectCount / this._col);
		if (this._rowCount > this._showRowCount) {
			this._rowCount = this._showRowCount;
		}
		
		// Check if the number of previous index doesn't exceed the new count.
		this._commandCursor.validate(); 
	}

	setObjectArray(objectArray?) {
		var i;
		var length = objectArray.length;
		
		this.resetScrollData();
		
		for (i = 0; i < length; i++) {
			this.objectSet(objectArray[i]);
		}
		
		this.objectSetEnd();
	}

	setDataList(list?) {
		var i, count, data;
		
		this.resetScrollData();
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			this.objectSet(data);
		}
		
		this.objectSetEnd();
	}

	cut(index?) {
		this._objectArray.splice(index, 1);
	}

	getIndex() {
		return this._commandCursor.getCommandCursorIndex();
	}

	setIndex(index?) {
		var pos;
		
		this._commandCursor.setCommandCursorIndex(index);
		
		if (this._rowCount === 1) {
			// Processing when only horizontal entries line.
			pos = index + 1;
			if (pos > this._col) {
				this._xScroll = pos - this._col;
			}
			else {
				this._xScroll = 0;
			}
		}
		else {
			// Processing when vertical entries also line.
			pos = Math.floor(index / this._col) + 1;
			if (pos > this._rowCount) {
				this._yScroll = pos - this._rowCount;
			}
			else {
				this._yScroll = 0;
			}
		}
	}

	getObject() {
		return this.getObjectFromIndex(this.getIndex());
	}

	getObjectFromIndex(index?) {
		if (this._objectArray === null || this._objectArray.length === 0) {
			return null;
		}
		
		return this._objectArray[index];
	}

	getIndexFromObject(object?) {
		var i;
		var count = this._objectArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._objectArray[i] === object) {
				return i;
			}
		}
		
		return -1;
	}

	getObjectCount() {
		return this._objectArray.length;
	}

	getCol() {
		return this._col;
	}

	getRowCount() {
		return this._rowCount;
	}

	getShowRowCount() {
		return this._showRowCount;
	}

	getCursorPicture() {
		return root.queryUI('menu_selectCursor');
	}

	enableSelectCursor(isActive?) {
		if (isActive) {
			this.setForceSelect(-1);
		}
		else {
			this.setForceSelect(this.getIndex());
		}
		
		this.setActive(isActive);
	}

	setActive(isActive?) {
		if (isActive) {
			MouseControl.setActiveScrollbar(this);
		}
		
		this._isActive = isActive;
	}

	setActiveSingle(isActive?) {
		this._isActive = isActive;
	}

	setForceSelect(index?) {
		this._forceSelectIndex = index;
	}

	getForceSelectIndex() {
		return this._forceSelectIndex;
	}

	enablePageChange() {
		this._isPageChange = true;
	}

	getScrollXValue() {
		return this._xScroll;
	}

	getScrollYValue() {
		return this._yScroll;
	}

	setScrollXValue(x?) {
		this._xScroll = x;
	}

	setScrollYValue(y?) {
		this._yScroll = y;
	}

	getScrollXPadding() {
		return 0;
	}

	getScrollYPadding() {
		return 0;
	}

	getSpaceX() {
		return 0;
	}

	getSpaceY() {
		return 0;
	}

	getObjectWidth() {
		return 0;
	}

	getObjectHeight() {
		return 0;
	}

	getScrollbarWidth() {
		return (this._col * this._objectWidth) + ((this._col - 1) * this.getSpaceX());
	}

	getScrollbarHeight() {
		return (this._showRowCount * this._objectHeight) + ((this._showRowCount - 1) * this.getSpaceY());
	}

	getParentTextUI() {
		return this.getParentInstance().getWindowTextUI();
	}

	getDescriptionTextUI() {
		return root.queryTextUI('description_title');
	}

	playSelectSound() {
		MediaControl.soundDirect('commandselect');
	}

	playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}

	playPageCursorSound() {
		MediaControl.soundDirect('commandcursor');
	}

	playOptionSound() {
		// Sound effect related to the 'Option' can have an appropriate one depending on the time, so don't implement here.
	}

	playStartSound() {
		// Sound effect related to the 'Start' can have an appropriate one depending on the time, so don't implement here.
	}

	getEdgeCursor() {
		return this._edgeCursor;
	}

	getCommandCursor() {
		return this._commandCursor;
	}

	saveScroll() {
		this._saveScrollY = this._yScroll;
	}

	restoreScroll() {
		if ((this._saveScrollY - 1) + this._showRowCount <= this.getIndex()) {
			// To prevent cursor from disappearing, don't lower the scroll value.
		}
		else if (this._saveScrollY > 0) {
			this._saveScrollY--;
		}
		
		this._yScroll = this._saveScrollY;
	}

	checkAndUpdateIndex() {
		var index = this.getIndex();
		var isChanged = this._prevIndex !== index;
		
		if (isChanged) {
			this._prevIndex = index;
		}
		
		return isChanged;
	}

	resetPreviousIndex() {
		this._prevIndex = -1;
	}

	_changeScrollValue(input?, scrollValue?, isHorz?) {
		var showRange, div, pos, max;
		var objectCount = this._objectArray.length;
		
		if (isHorz) {
			showRange = this._col;
			div = 1;
			pos = this._commandCursor.getCommandCursorIndex();
		}
		else {
			showRange = this._showRowCount;
			div = this._col;
			pos = Math.floor(this._commandCursor.getCommandCursorIndex() / this._col);
		}
		
		if (input === DirectionType.LEFT || input === DirectionType.TOP) {
			if (pos + 1 === scrollValue) {
				// Scroll because it reached the top of the display range.
				scrollValue--;
			}
			else if (this._commandCursor.getCommandCursorIndex() === objectCount - 1) {
				// The index is the maximum value, so the scroll value is also the maximum value.
				max = objectCount - (showRange * div);
				if (max < 0) {
					scrollValue = 0;
				}
				else {
					scrollValue = Math.ceil(max / div);
				}
			}
		}
		else if (input === DirectionType.RIGHT || input === DirectionType.BOTTOM) {
			if (pos === showRange + scrollValue) {
				// Scroll because it reached the bottom of the display range.
				scrollValue++;
			}
			else if (this._commandCursor.getCommandCursorIndex() === 0) {
				// Because the index value is the initial value, the scroll value is also the initial value.
				scrollValue = 0;
			}
		}
		
		return scrollValue;
	}

	_checkPage(inputType?) {
		var d;
		var isChange = false;
		var index = this.getIndex();
		var yScroll = this.getScrollYValue();
		var showRowCount = this.getShowRowCount();
		
		if (inputType === InputType.LEFT) {
			if (this.getObjectCount() > showRowCount) {
				d = this._getPageValue(yScroll, showRowCount * -1);
				yScroll -= d;
				index -= d;
				isChange = true;
			}
		}
		else if (inputType === InputType.RIGHT) {
			if (this.getObjectCount() > showRowCount) {
				d = this._getPageValue(yScroll, showRowCount);
				yScroll += d;
				index += d;
				isChange = true;
			}
		}
		
		if (isChange) {
			if (index !== this.getIndex()) {
				this.setIndex(index);
				this.setScrollYValue(yScroll);
				this.playPageCursorSound();
			}
		}
	}

	_getPageValue(yScroll?, n?) {
		var d;
		var yMin = 0;
		var yMax = this.getObjectCount() - this.getShowRowCount();
		
		if (n < 0 && yScroll === yMin) {
			// Move to the last page.
			return -yMax;
		}
		else if (n > 0 && yScroll === yMax) {
			// Move to the first page.
			return -yMax;
		}
		
		d = yScroll + n;
		if (yMin >= d) {
			d = yScroll;
		}
		else if (yMax < d) {
			d = yMax - yScroll;
		}
		else {
			d = this.getShowRowCount();
		}
		
		return d;
	}

	_isScrollbarObjectPressed() {
		return MouseControl.isScrollbarObjectPressed(this);
	}

	_getDescriptionLinePos() {
		return {
			count: -1,
			x: -14,	
			y: -47
		};
	}
}
