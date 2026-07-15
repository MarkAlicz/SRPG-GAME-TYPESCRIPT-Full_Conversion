
class MouseType {

	static MOV: any = 0;

	static LEFT: any = 1;

	static RIGHT: any = 2;

	static CENTER: any = 3;

	static DOWNWHEEL: any = 4;

	static UPWHEEL: any = 5;
}

class MouseControl {

	static _activeScrollbar: any = null;

	static _prevScrollbar: any = null;

	static _mouseLineScroll: any = null;

	static _isSideScrollX: any = false;

	static _isSideScrollY: any = false;

	static _edgeCursor: any = null;

	static initSingleton() {
		this._edgeCursor = createObject(EdgeMapSideCursor);
		this._mouseLineScroll = createObject(MouseLineScroll);
	}

	static prepareMouseControl() {
		var dx = GraphicsFormat.MAPCHIP_WIDTH * 2;
		var dy = GraphicsFormat.MAPCHIP_HEIGHT * 2;
		
		this._edgeCursor.setEdgeRange(root.getGameAreaWidth() - dx, root.getGameAreaHeight() - dy);
	}

	static isMouseMoving() {
		return this._mouseLineScroll.isMoving();
	}

	
	// Automatically move the mouse cursor to the target position.
	static moveAutoMouse() {
		this._mouseLineScroll.moveLineScroll();
		
		if (this._isSideScrollX || this._isSideScrollY) {
			this._checkSideScroll();
		}
		
		this._edgeCursor.moveCursor();
	}

	
	// Check if the mouse was moved on the map.
	static moveMapMouse(mapCursor?) {
		// Don't continue if the mouse is not moved.
		if (!root.isMouseAction(MouseType.MOV)) {
			return;
		}
		
		// The cursor position can be at the screen edge, so put the scroll check flag.
		this._isSideScrollX = true;
		this._isSideScrollY = true;
		
		// Update a map cursor to respond to the mouse position.
		this._adjustMapCursor();
	}

	
	// Check if a mouse was moved on the scroll bar.
	static moveScrollbarMouse(scrollbar?) {
		var index;
		
		// Don't continue if the mouse is not moved.
		if (!root.isMouseAction(MouseType.MOV)) {
			return InputType.NONE;
		}
		
		// Get the index of entry to match the current mouse cursor position.
		index = this.getIndexFromMouse(scrollbar);
		if (index === -1) {
			return InputType.NONE;
		}
		
		if (scrollbar.getIndex() !== index) {
			this._playHoverSound();
		}
		
		// scrollbar.setIndex is not called.
		scrollbar.getCommandCursor().setCommandCursorIndex(index);
		
		return InputType.MOUSE;
	}

	
	// Get the index of entry to respond to the current mouse cursor.
	static getIndexFromMouse(scrollbar?) {
		var i, j, x, y, xCursor, yCursor;
		var col = scrollbar.getCol();
		var rowCount = scrollbar.getRowCount();
		var width = scrollbar.getObjectWidth() + scrollbar.getSpaceX();
		var height = scrollbar.getObjectHeight() + scrollbar.getSpaceY();
		var index = 0;
		var n = (scrollbar.getScrollYValue() * scrollbar.getCol()) + scrollbar.getScrollXValue();
		var xStart = scrollbar.xRendering;
		var yStart = scrollbar.yRendering;
		
		if (!this._isMouseEnabled()) {
			return -1
		}
		
		xCursor = root.getMouseX() - root.getViewportX();
		yCursor = root.getMouseY() - root.getViewportY();
		
		for (i = 0; i < rowCount; i++) {
			y = yStart + (i * height);
			for (j = 0; j < col; j++) {
				if (index + n >= scrollbar.getObjectCount()) {
					return -1;
				}
				x = xStart + (j * width);
				if (xCursor >= x && xCursor <= x + scrollbar.getObjectWidth()) {
					if (yCursor >= y && yCursor <= y + scrollbar.getObjectHeight()) {
						return index + n;
					}
				}
				index++;
			}
		}
		
		return -1;
	}

	static pointMouse(scrollbar?) {
		// Don't continue if the mouse is not moved.
		if (!root.isMouseAction(MouseType.MOV)) {
			return InputType.NONE;
		}
		
		return this.getIndexFromMouse(scrollbar);
	}

	
	// Save the new activated scroll bar.
	static setActiveScrollbar(scrollbar?) {
		this._prevScrollbar = this._activeScrollbar;
		this._activeScrollbar = scrollbar;
	}

	static isInputAction(type?) {
		return root.isMouseAction(type);
	}

	
	// Check if entry of scroll bar was clicked.
	static isScrollbarObjectPressed(scrollbar?) {
		var index;
		
		// If not clicked, don't continue.
		if (!root.isMouseAction(MouseType.LEFT)) {
			return false;
		}
		
		index = this.getIndexFromMouse(scrollbar);
		if (index === -1) {
			// The position to click wasn't within the entry.
			return false;
		}
		
		scrollbar.getCommandCursor().setCommandCursorIndex(index);
		
		return true;
	}

	static isRangePressed(range?) {
		// If not clicked, don't continue.
		if (!root.isMouseAction(MouseType.LEFT)) {
			return false;
		}
		
		return this.isHovering(range);
	}

	static isHovering(range?) {
		var x = root.getMouseX() - root.getViewportX();
		var y = root.getMouseY() - root.getViewportY();
		
		return isRangeIn(x, y, range);
	}

	
	// Check if the scroll cursor of the scroll bar was clicked.
	static checkScrollbarEdgeAction(scrollbar?) {
		var range;
		var scrollableData = scrollbar.getScrollableData();
		var edgeCursor = scrollbar.getEdgeCursor();
		var x = root.getMouseX() - root.getViewportX();
		var y = root.getMouseY() - root.getViewportY();
		var xStart = scrollbar.xRendering;
		var yStart = scrollbar.yRendering;
		
		// If not clicked, don't continue.
		if (!root.isMouseAction(MouseType.LEFT)) {
			return false;
		}
		
		if (scrollableData.isLeft) {
			range = edgeCursor.getLeftEdgeRange(xStart, yStart);
			if (isRangeIn(x, y, range)) {
				// Scroll because the cursor range was clicked.
				scrollbar.setScrollXValue(scrollbar.getScrollXValue() - 1);
				return true;
			}
		}
		if (scrollableData.isTop) {
			range = edgeCursor.getTopEdgeRange(xStart, yStart);
			if (isRangeIn(x, y, range)) {
				scrollbar.setScrollYValue(scrollbar.getScrollYValue() - 1);
				return true;
			}
		}
		if (scrollableData.isRight) {
			range = edgeCursor.getRightEdgeRange(xStart, yStart);
			if (isRangeIn(x, y, range)) {
				scrollbar.setScrollXValue(scrollbar.getScrollXValue() + 1);
				return true;
			}
		}
		if (scrollableData.isBottom) {
			range = edgeCursor.getBottomEdgeRange(xStart, yStart);
			if (isRangeIn(x, y, range)) {
				scrollbar.setScrollYValue(scrollbar.getScrollYValue() + 1);
				return true;
			}
		}
		
		return false;
	}

	static checkScrollbarWheel(scrollbar?) {
		var scrollableData, index;
		var isUp = MouseControl.isInputAction(MouseType.UPWHEEL);
		var isDown = MouseControl.isInputAction(MouseType.DOWNWHEEL);
		
		if (!isUp && !isDown) {
			return false;
		}
		
		scrollableData = scrollbar.getScrollableData();
		if (isUp && scrollableData.isTop) {
			scrollbar.setScrollYValue(scrollbar.getScrollYValue() - 1);
		}
		else if (isDown && scrollableData.isBottom) {
			scrollbar.setScrollYValue(scrollbar.getScrollYValue() + 1);
		}
		else {
			return false;
		}
		
		index = MouseControl.getIndexFromMouse(scrollbar);
		if (index !== -1) {
			scrollbar.getCommandCursor().setCommandCursorIndex(index);
		}
		
		return true;
	}

	
	// Shift the current mouse cursor position towards x, y.
	static changeCursorFromMap(x?, y?) {
		var session = root.getCurrentSession();
		var xPixel = (x * GraphicsFormat.MAPCHIP_WIDTH) - session.getScrollPixelX();
		var yPixel = (y * GraphicsFormat.MAPCHIP_HEIGHT) - session.getScrollPixelY();
		var dx = Math.floor(GraphicsFormat.MAPCHIP_WIDTH / 2);
		var dy = Math.floor(GraphicsFormat.MAPCHIP_HEIGHT / 2);
		
		// Add dx so that the cursor is at the center of the character.
		this._startMouseTracking(xPixel + dx, yPixel + dy);
	}

	
	// Shift the current mouse cursor position on the specified index.
	static changeCursorFromScrollbar(scrollbar?, targetIndex?) {
		var pos = this._getPosFromScrollIndex(scrollbar, targetIndex);
		
		if (pos !== null) {
			// Create the way for the cursor to move automatically.
			this._startMouseTracking(pos.x, pos.y);
		}
	}

	
	// Calculate the target position where the mouse cursor moves to, based on the drawing given by BaseScrollbar.drawScrollbar.
	static saveRenderingPos(scrollbar?) {
		// If the new scroll bar is active and differs from before, move the cursor pointing to the position of the scroll bar.
		if (this._activeScrollbar !== this._prevScrollbar && this._activeScrollbar === scrollbar) {
			this._prevScrollbar = this._activeScrollbar;
			
			this.changeCursorFromScrollbar(this._activeScrollbar, this._activeScrollbar.getIndex());
		}
	}

	
	// Display the cursor at the edge of the map if the map can be scrolled.
	static drawMapEdge() {
		var scrollableData = MapView.getScrollableData();
		var xStart = GraphicsFormat.MAPCHIP_WIDTH;
		var yStart = GraphicsFormat.MAPCHIP_HEIGHT;
		
		if (EnvironmentControl.isMouseOperation()) {
			this._edgeCursor.drawHorzCursor(xStart, yStart, scrollableData.isLeft, scrollableData.isRight);
			this._edgeCursor.drawVertCursor(xStart, yStart, scrollableData.isTop, scrollableData.isBottom);
		}
	}

	static _checkSideScroll() {
		var n = -1;
		var session = root.getCurrentSession();
		var mx = root.getMouseX() - root.getViewportX();
		var my = root.getMouseY() - root.getViewportY();
		var sx = session.getScrollPixelX();
		var sy = session.getScrollPixelY();
		var cx = (CurrentMap.getWidth() * GraphicsFormat.MAPCHIP_WIDTH) - root.getGameAreaWidth();
		var cy = (CurrentMap.getHeight() * GraphicsFormat.MAPCHIP_HEIGHT) - root.getGameAreaHeight();
		
		if (mx <= GraphicsFormat.MAPCHIP_WIDTH) {
			if (sx > 0) {
				n = sx - Math.floor(GraphicsFormat.MAPCHIP_WIDTH / 2);
				if (n < 0) {
					n = 0;
				}
				session.setScrollPixelX(n);
			}
			else {
				this._isSideScrollX = false;
			}
		}
		else if (mx >= root.getGameAreaWidth() - GraphicsFormat.MAPCHIP_WIDTH) {
			if (sx !== cx) {
				n = sx + Math.floor(GraphicsFormat.MAPCHIP_WIDTH / 2);
				if (n > cx) {
					n = cx;
				}
				session.setScrollPixelX(n);
			}
			else {
				this._isSideScrollX = false;
			}
		}
		else {
			this._isSideScrollX = false;
		}
		
		if (my <= GraphicsFormat.MAPCHIP_HEIGHT) {
			if (sy > 0) {
				n = sy - Math.floor(GraphicsFormat.MAPCHIP_HEIGHT / 2);
				if (n < 0) {
					n = 0;
				}
				session.setScrollPixelY(n);
			}
			else {
				this._isSideScrollY = false;
			}
		}
		else if (my >= root.getGameAreaHeight() - GraphicsFormat.MAPCHIP_HEIGHT) {
			if (sy !== cy) {
				n = sy + Math.floor(GraphicsFormat.MAPCHIP_HEIGHT / 2);
				if (n > cy) {
					n = cy;
				}
				session.setScrollPixelY(n);
			}
			else {
				this._isSideScrollY = false;
			}
		}
		else {
			this._isSideScrollY = false;
		}
		
		if (this._isSideScrollX || this._isSideScrollY) {
			this._adjustMapCursor();
		}
	}

	static _adjustMapCursor() {
		var session = root.getCurrentSession();
		var xCursor = Math.floor((root.getMouseX() + session.getScrollPixelX() - root.getViewportX()) / GraphicsFormat.MAPCHIP_WIDTH);
		var yCursor = Math.floor((root.getMouseY()  + session.getScrollPixelY() - root.getViewportY()) / GraphicsFormat.MAPCHIP_HEIGHT);
		
		root.getCurrentSession().setMapCursorX(xCursor);
		root.getCurrentSession().setMapCursorY(yCursor);
	}

	
	// Get the position of the entry of the scroll bar.
	static _getPosFromScrollIndex(scrollbar?, targetIndex?) {
		var i, j, x, y;
		var col = scrollbar.getCol();
		var rowCount = scrollbar.getRowCount();
		var width = scrollbar.getObjectWidth() + scrollbar.getSpaceX();
		var height = scrollbar.getObjectHeight() + scrollbar.getSpaceY();
		var index = 0;
		var n = (scrollbar.getScrollYValue() * scrollbar.getCol()) + scrollbar.getScrollXValue();
		var xStart = scrollbar.xRendering;
		var yStart = scrollbar.yRendering;
		
		for (i = 0; i < rowCount; i++) {
			y = yStart + (i * height);
			for (j = 0; j < col; j++) {
				if (index + n >= scrollbar.getObjectCount()) {
					return null;
				}
				
				x = xStart+ (j * width);
				if (index + n === targetIndex) {
					// Point the cursor to the center of the entry.
					return createPos(x + Math.floor(width / 2), y + Math.floor(height / 2));
				}
				
				index++;
			}
		}
		
		return null;
	}

	static _isMouseEnabled() {
		if (!EnvironmentControl.isMouseOperation()) {
			return false;
		}
		
		// If the current screen state is a full screen with software, mouse input is ignored.
		if (root.getAppScreenMode() === AppScreenMode.SOFTFULLSCREEN) {
			return false;
		}
		
		return true;
	}

	static _startMouseTracking(x?, y?) {
		if (!EnvironmentControl.isMouseOperation() || !EnvironmentControl.isMouseCursorTracking()) {
			return false;
		}
		
		this._mouseLineScroll.setGoalData(root.getMouseX(), root.getMouseY(), x + root.getViewportX(), y + root.getViewportY());
	}

	static _playHoverSound() {
		// MediaControl.soundDirect('commandcursor');
	}
}
