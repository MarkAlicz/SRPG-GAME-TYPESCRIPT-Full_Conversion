
class BaseLineScroll extends BaseObject {

	_goalIndex: any = 0;

	_goalArray: any = null;

	setGoalData(x1?, y1?, x2?, y2?) {
		var x, y;
		var dx = x2 - x1;
		var dy = y2 - y1;
		var e = 0;
		var n = 1;
		
		if (x1 > x2) {
			dx = x1 - x2;
		}
		if (y1 > y2) {
			dy = y1 - y2;
		}
		
		x = x1;
		y = y1;
		
		this._goalArray = [];
		this._goalIndex = 0;
		
		if (dx > dy) {
			if (x < x2) {
				for (; x <= x2; x += n) {
					e += dy;
					if (e > dx) {
						e -= dx;
						if (y2 > y1) {
							y += n;
						}
						else {
							y -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
			else {
				for (; x >= x2; x -= n) {
					e += dy;
					if (e > dx){
						e -= dx;
						if (y2 > y1) {
							y += n;
						}
						else {
							y -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
		}
		else {
			if (y < y2) {
				for (; y <= y2; y += n) {
					e += dx;
					if (e > dy){
						e -= dy;
						if (x2 > x1) {
							x += n;
						}
						else {
							x -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
			else {
				for (; y >= y2; y -= n) {
					e += dx;
					if (e > dy){
						e -= dy;
						if (x2 > x1) {
							x += n;
						}
						else {
							x -= n;
						}
					}
					this._goalArray.push(createPos(x, y));
				}
			}
		}
		
		this._goalArray.push(createPos(x2, y2));
	}

	moveLineScroll() {
		var n = this._getLineInterval();
		
		if (this._goalArray === null || CurrentMap.isCompleteSkipMode()) {
			return MoveResult.END;
		}
		
		for (; this._goalIndex < this._goalArray.length; ) {
			if (this._setLinePos(this._goalArray[this._goalIndex])) {
				this._goalIndex += n;
				break;
			}
			this._goalIndex += n;
		}
		
		if (this._goalIndex >= this._goalArray.length || InputControl.isStartAction()) {
			this._setLinePos(this._goalArray[this._goalArray.length - 1]);
			this._goalArray = null;
			this._goalIndex = 0;
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	isMoving(pos?) {
		if (this._goalArray === null) {
			return false;
		}
		
		return this._goalArray.length > 0;
	}

	_setLinePos(pos?) {
		return false;
	}

	_getLineInterval() {
		return 16;
	}
}

class MapLineScroll extends BaseLineScroll {

	startLineScroll(x?, y?) {
		var x1, y1, x2, y2;
		var session = root.getCurrentSession();
		
		if (session === null) {
			return;
		}
		
		if (EnvironmentControl.getScrollSpeedType() === SpeedType.HIGH) {
			MapView.setScroll(x, y);
			return;
		}
		
		x1 = session.getScrollPixelX() + Math.floor(root.getGameAreaWidth() / 2);
		y1 = session.getScrollPixelY() + Math.floor(root.getGameAreaHeight() / 2);
		x2 = (x * GraphicsFormat.MAPCHIP_WIDTH) + Math.floor(GraphicsFormat.MAPCHIP_WIDTH / 2);
		y2 = (y * GraphicsFormat.MAPCHIP_HEIGHT) + Math.floor(GraphicsFormat.MAPCHIP_HEIGHT / 2);
		
		this.setGoalData(x1, y1, x2, y2);
	}

	_setLinePos(pos?) {
		return MapView.setScrollPixel(pos.x, pos.y);
	}

	_getLineInterval() {
		if (Miscellaneous.isGameAcceleration()) {
			return 26;
		}
		
		if (EnvironmentControl.getScrollSpeedType() === SpeedType.NORMAL) {
			return 20;
		}
		
		return 14;
	}
}

class MouseLineScroll extends BaseLineScroll {

	_setLinePos(pos?) {
		root.setMousePos(pos.x, pos.y);
		return true;
	}

	_getLineInterval() {
		return 50;
	}
}

class ScrollBackground extends BaseObject {

	_counter: any = null;

	_xScroll: any = 0;

	_yScroll: any = 0;

	_pic: any = null;

	_picCache: any = null;

	_xMax: any = 0;

	_yMax: any = 0;

	_isHorz: any = false;

	_isVert: any = false;

	initialize() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(this._getCounterMax());
	}

	startScrollBackground(pic?) {
		var c;
		
		if (pic === null) {
			this._pic = null;
			this._picCache = null;
			return;
		}
		
		if (pic === this._pic) {
			return;
		}
		
		c = pic.getName().charAt(0);
		if (c === '!') {
			this._isHorz = true;
			this._xMax = pic.getWidth();
		}
		
		if (c === '#') {
			this._isVert = true;
			this._yMax = pic.getHeight();
		}
		
		this._pic = pic;
		this._picCache = null;
	}

	moveScrollBackground() {
		if (this._counter.moveCycleCounter() === MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		if (this._isHorz) {
			this._xScroll += this._getPixel();
			if (this._xScroll >= this._xMax) {
				this._xScroll = 0;
			}
		}
		
		if (this._isVert) {
			this._yScroll += this._getPixel();
			if (this._yScroll >= this._yMax) {
				this._yScroll = 0;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawScrollBackground() {
		if (this._pic === null) {
			return;
		}
		
		if (this._picCache === null) {
			this._createBackgroundCache();
		}
		
		this._setPicInfo(this._picCache);
		
		this._picCache.drawStretchParts(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(),
			this._xScroll, this._yScroll, this._pic.getWidth(), this._pic.getHeight());
	}

	isScrollable() {
		return this._isHorz || this._isVert;
	}

	getConsolidatedImage() {
		if (this._pic === null) {
			return null;
		}
		
		if (this._picCache === null) {
			this._createBackgroundCache();
		}
		
		return this._picCache;
	}

	_createBackgroundCache() {
		var width = this._pic.getWidth();
		var height = this._pic.getHeight();
		var graphicsManager = root.getGraphicsManager();
		
		this._picCache = root.getGraphicsManager().createCacheGraphics(this._isHorz ? width * 2 : width, this._isVert ? height * 2 : height);
			
		graphicsManager.setRenderCache(this._picCache);
		
		this._pic.draw(0, 0);
		
		if (this._isHorz) {
			this._pic.draw(width, 0);
		}
		if (this._isVert) {
			this._pic.draw(0, height);
		}
		if (this._isHorz && this._isVert) {
			this._pic.draw(width, height);
		}
		
		graphicsManager.resetRenderCache();
	}

	_setPicInfo(pic?) {
	}

	_getCounterMax() {
		return -1;
	}

	_getPixel() {
		return 1;
	}
}

class ImageScrollerType {

	static HORZ: any = 0;

	static VERT: any = 1;

	static CROSS: any = 2;
}

class ImageScroller extends BaseObject {

	_imageWidth: any = 0;

	_imageHeight: any = 0;

	_displayWidth: any = 0;

	_displayHeight: any = 0;

	_space: any = 0;

	_plusValue: any = 1;

	_maxCount: any = 0;

	_type: any = false;

	_scrollCount: any = 0;

	setImageSizeAndDispaySize(width?, height?, width2?, height2?) {
		this._imageWidth = width;
		this._imageHeight = height;
		this._displayWidth = width2;
		this._displayHeight = height2;
	}

	setSpace(space?) {
		this._space = space;
	}

	setPlusValue(plusValue?) {
		this._plusValue = plusValue;
	}

	startScroll(type?) {
		if (type === ImageScrollerType.HORZ) {
			this._maxCount = this._imageWidth - this._space;
		}
		else if (type === ImageScrollerType.VERT) {
			this._maxCount = this._imageHeight - this._space;
		}
		else if (type === ImageScrollerType.CROSS) {
			this._maxCount = this._imageWidth * this._imageHeight;
		}
		
		this._type = type;
		
		this._scrollCount = this._space;
	}

	getScrollCount() {
		return this._scrollCount;
	}

	moveImageScroller() {
		this._scrollCount += this._plusValue;
		if (this._scrollCount >= this._maxCount) {
			this._scrollCount = this._space;
		}
		
		return MoveResult.CONTINUE;
	}

	drawImageScroller(x?, y?, pic?) {
		if (pic === null || this._maxCount <= 0) {
			return;
		}
		
		if (this._type === ImageScrollerType.HORZ) {
			this._drawHorizontalImage(x, y, pic);
		}
		else if (this._type === ImageScrollerType.VERT) {
			this._drawVerticalImage(x, y, pic);
		}
		else if (this._type === ImageScrollerType.CROSS) {
			this._drawCrossImage(x, y, pic);
		}
	}

	_drawHorizontalImage(x?, y?, pic?) {
		var endWidth, startWidth;
		
		if (this._scrollCount + this._displayWidth <= this._imageWidth - this._space) {
			pic.drawParts(x, y, this._scrollCount, this._space, this._displayWidth, this._displayHeight);
		}
		else {
			endWidth = this._imageWidth - this._space - this._scrollCount;
			startWidth = this._displayWidth - endWidth;
			
			pic.drawParts(x, y, this._scrollCount, this._space, endWidth, this._displayHeight);
			
			pic.drawParts(x + endWidth, y, this._space, this._space, startWidth, this._displayHeight);
		}
	}

	_drawVerticalImage(x?, y?, pic?) {
		var endHeight, startHeight;
		
		if (this._scrollCount + this._displayHeight <= this._imageHeight - this._space) {
			pic.drawParts(x, y, this._space, this._scrollCount, this._displayWidth, this._displayHeight);
		}
		else {
			endHeight = this._imageHeight - this._space - this._scrollCount;
			startHeight = this._displayHeight - endHeight;
			
			pic.drawParts(x, y, this._space, this._scrollCount, this._displayWidth, endHeight);
			
			pic.drawParts(x, y + endHeight, this._space, this._space, this._displayWidth, startHeight);
		}
	}

	_drawCrossImage(x?, y?, pic?) {
		var horzWidth1, horzWidth2, vertHeight1, vertHeight2;
		var horzOffset = (this._scrollCount % this._imageWidth) + this._space;
		var vertOffset = (this._scrollCount % this._imageHeight) + this._space;
		
		if (horzOffset + this._displayWidth > this._imageWidth + this._space) {
			horzWidth1 = this._imageWidth + this._space - horzOffset;
			horzWidth2 = this._displayWidth - horzWidth1;
		}
		else {
			horzWidth1 = this._displayWidth;
			horzWidth2 = 0;
		}
		
		if (vertOffset + this._displayHeight > this._imageHeight + this._space) {
			vertHeight1 = this._imageHeight + this._space - vertOffset;
			vertHeight2 = this._displayHeight - vertHeight1;
		}
		else {
			vertHeight1 = this._displayHeight;
			vertHeight2 = 0;
		}
		
		if (horzWidth1 > 0 && vertHeight1 > 0) {
			pic.drawParts(x, y, horzOffset - this._space, vertOffset - this._space, horzWidth1, vertHeight1);
		}
		
		if (horzWidth2 > 0) {
			pic.drawParts(horzWidth1, y, this._space, vertOffset - this._space, horzWidth2, vertHeight1);
		}
		
		if (vertHeight2 > 0) {
			pic.drawParts(x, vertHeight1, horzOffset - this._space, this._space, horzWidth1, vertHeight2);
		}
		
		if (horzWidth2 > 0 && vertHeight2 > 0) {
			pic.drawParts(horzWidth1, vertHeight1, this._space, this._space, horzWidth2, vertHeight2);
		}
	}
}
