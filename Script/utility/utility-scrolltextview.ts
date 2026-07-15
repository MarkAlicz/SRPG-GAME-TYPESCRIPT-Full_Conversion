
class ScrollTextView extends BaseObject {

	_text: any = null;

	_moveTime: any = 0;

	_nextTime: any = 0;

	_isMove: any = false;

	_scrollTextParam: any = null;

	_factoryArray: any = null;

	_blockArray: any = null;

	_isAcceleration: any = false;

	openScrollTextViewCycle(scrollTextParam?) {
		this._prepareMemberData(scrollTextParam);
		this._completeMemberData(scrollTextParam);
	}

	moveScrollTextViewCycle() {
		var i, count;
		
		// Delete a block which was displayed.
		if (this._blockArray.length > 0) {
			if (this._blockArray[0].isLastBlock()) {
				this._blockArray.shift();
			}
		}
		
		if (!this._checkMove()) {
			return MoveResult.CONTINUE;
		}
		
		// Add the elapsed time.
		this._moveTime += this.getBlockInterval();
		
		// To be regular intervals to display blocks, detect speed up with regular intervals.
		if (this._moveTime % this._getBaseTime() === 0) {
			if (this._isAcceleration) {
				if (!Miscellaneous.isGameAcceleration()) {
					this._isAcceleration = false;
				}
			}
			else {
				if (Miscellaneous.isGameAcceleration()) {
					this._isAcceleration = true;
				}
			}
		}
		
		count = this._blockArray.length;
		for (i = 0; i < count; i++) {
			this._blockArray[i].notifyTime(this._moveTime);
			this._blockArray[i].moveBlock();
		}
		
		if (count === 0) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawScrollTextViewCycle() {
		var i;
		var count = this._blockArray.length;
		
		this._drawScrollWindow();
		
		for (i = 0; i < count; i++) {
			this._blockArray[i].drawBlock();
		}
	}

	
	// Return the divisible number for _getBaseTime.
	getBlockInterval() {
		var n;
		var speedType = this._scrollTextParam.speedType;
		
		if (this._isAcceleration) {
			return 20;
		}
		
		if (speedType === SpeedType.DIRECT) {
			n = 8;
		}
		else if (speedType === SpeedType.SUPERHIGH) {
			n = 5;
		}
		else if (speedType === SpeedType.HIGH) {
			n = 4;
		}
		else if (speedType === SpeedType.NORMAL) {
			n = 2.5;
		}
		else if (speedType === SpeedType.LOW) {
			n = 2;
		}
		else {
			n = 1;
		}
		
		return n;
	}

	getMoveTime() {
		return this._moveTime;
	}

	setNextTime(nextTime?) {
		nextTime = this._nextTime;
	}

	getScrollTextParam() {
		return this._scrollTextParam;
	}

	_prepareMemberData(scrollTextParam?) {
		this._text = scrollTextParam.text;
		this._moveTime = 0;
		this._nextTime = 0;
		this._isMove = false;
		this._scrollTextParam = scrollTextParam;
		
		this._factoryArray = [];
		this._configureFactoryObject(this._factoryArray);
		
		this._blockArray = [];
	}

	_completeMemberData(scrollTextParam?) {
		var i, count, oneblock;
		var text = this._text;
		
		while (text.length !== 0) {
			// WaitBlockFactory changes this._nextTime, so initialize every time.
			this._nextTime = this._getBaseTime();
			
			// Get one line from the text.
			oneblock = this._readBlock(text);
			
			// Search an object which can process the lines which were gotten.
			count = this._factoryArray.length;
			for (i = 0; i < count; i++) {
				if (this._factoryArray[i].checkBlock(oneblock, this._blockArray, this)) {
					// If a line can be processed, exit a loop to search the next line.
					break;
				}
			}
			
			// Add the temporary elapsed time.
			this._moveTime += this._nextTime;
			
			// Get the first text on the next line.
			text = this._nextBlock(text);
		}
		
		// Initialize to call moveScrollTextViewCycle later.
		this._moveTime = 0;
	}

	_readBlock(text?) {
		var i;
		var count = text.length;
		
		for (i = 0; i < count; i++) {
			if (text.charAt(i) === '\n') {
				// Get a text which existed until the line feed.
				return text.substring(0, i);
			}
		}
		
		// If there is no line feed, this is the last line, so return it.
		return text;
	}

	_nextBlock(text?) {
		var i;
		var count = text.length;
		
		for (i = 0; i < count; i++) {
			if (text.charAt(i) === '\n') {
				// Get a text which existed until the line feed.
				return text.substring(i + 1, text.length);
			}
		}
		
		return '';
	}

	_checkMove() {
		if (!DataConfig.isHighPerformance()) {
			return true;
		}
		
		this._isMove = !this._isMove;
		
		return this._isMove;
	}

	_getBaseTime() {
		return 40;
	}

	_drawScrollWindow() {
		var textui = root.queryTextUI('messagescroll_window');
		var pic = textui.getUIImage();
		var n = this._scrollTextParam.margin;
		var x = n;
		var y = n;
		var width = root.getGameAreaWidth() - (n * 2);
		var height = root.getGameAreaHeight() - (n * 2);
		
		if (pic !== null) {
			WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		}
	}

	_configureFactoryObject(groupArray?) {
		groupArray.appendObject(BlockFactory.Picture);
		groupArray.appendObject(BlockFactory.Wait);
		
		// Text processing object has no control character such as \space.
		// So check it at the end.
		groupArray.appendObject(BlockFactory.Text);
	}
}

// BaseBlockFactory is an object to create ScrollBlock.
class BaseBlockFactory extends BaseObject {

	checkBlock(text?, arr?, parentTextView?) {
		return true;
	}
}

namespace BlockFactory {
export class Text extends BaseBlockFactory {

	checkBlock(text?, arr?, parentTextView?) {
		var obj = createObject(TextScrollBlock);
		
		obj.setBlockData(text, parentTextView);
		arr.push(obj);
		
		return true;
	}
}

export class Picture extends BaseBlockFactory {

	checkBlock(text?, arr?, parentTextView?) {
		var obj;
		var key = this.getKey();
		var c = text.match(key);
		
		if (c !== null) {
			obj = createObject(PictureScrollBlock);
			obj.setBlockData(c[1], parentTextView);
			arr.push(obj);
			
			return true;
		}
	
		return false;
	}

	getKey() {
		var key = /\\pic\[(.+)\]/;
		
		return key;
	}
}

export class Wait extends BaseBlockFactory {

	checkBlock(text?, arr?, parentTextView?) {
		var key = this.getKey();
		var c = text.match(key);
		
		if (c !== null) {
			parentTextView.setNextTime(Number(c[1]));
			return true;
		}
		
		return false;
	}

	getKey() {
		var key = /\\space\[(\d+)\]/;
		
		return key;
	}
}
}

// BaseScrollBlock is an object to move on the screen.
class BaseScrollBlock extends BaseObject {

	_x: any = 0;

	_y: any = 0;

	_top: any = 0;

	_bottom: any = 0;

	_value: any = null;

	_startTime: any = 0;

	_isStart: any = false;

	_isLast: any = false;

	_alpha: any = 0;

	_parentTextView: any = null;

	setBlockData(value?, parentTextView?) {
		var scrollTextParam = parentTextView.getScrollTextParam();
		var n = scrollTextParam.margin;
		var size = root.queryTextUI('messagescroll_window').getFont().getSize();
		
		this._top = n;
		this._bottom = root.getGameAreaHeight() - n - size;
		this._x = scrollTextParam.x;
		this._y = this._bottom;
		this._value = value;
		this._startTime = parentTextView.getMoveTime();
		this._isStart = false;
		this._isLast = false;
		this._alpha = 0;
		this._parentTextView = parentTextView;
	}

	moveBlock() {
		var zone = this._getAlphaZone();
		var blockInterval = this._parentTextView.getBlockInterval();
		var d = Math.floor(zone / blockInterval);
		var da = Math.floor(255 / d);
		
		if (this._isLast) {
			return MoveResult.END;
		}
		
		if (this._isStart) {
			// If the current position is lower than a value of top, lower the alpha value.
			if (this._y > this._bottom - zone) {
				this._alpha += da;
				if (this._alpha > 255) {
					this._alpha = 255;
				}
			}
			
			// If the current position is lower than a value of top, lower the alpha value.
			if (this._y < this._top + zone) {
				this._alpha -= da;
				if (this._alpha < 0) {
					this._alpha = 0;
				}
			}
			
			this._y -= blockInterval;
			// If the current position exceeds top-zone, it should totally be transparent, so set the end flag.
			if (this._y < this._top) {
				this._isLast = true;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawBlock() {
	}

	isLastBlock() {
		return this._isLast;
	}

	notifyTime(time?) {
		if (!this._isStart) {
			// Check if the notified time exceeds the time when the block should start moving.
			if (time >= this._startTime) {
				// Start the block moving.
				this._isStart = true;
			}
		}
	}

	_getAlphaZone() {
		return 40;
	}
}

class TextScrollBlock extends BaseScrollBlock {

	drawBlock() {
		var x, width, textui, color, font;
		var text = this._value;
		
		if (this._isStart) {
			textui = root.queryTextUI('messagescroll_window');
			color = textui.getColor();
			font = textui.getFont();
			
			if (this._x === -1) {
				width = TextRenderer.getTextWidth(text, font);
				x = LayoutControl.getCenterX(-1, width);
			}
			else {
				x = this._x;
			}
			
			TextRenderer.drawAlphaText(x, this._y, text, -1, color, this._alpha, font);
		}
	}
}

class PictureScrollBlock extends BaseScrollBlock {

	_pictureId: any = -1;

	setBlockData(value?, parentTextView?) {
		var i, data;
		var list = root.getBaseData().getGraphicsResourceList(GraphicsType.PICTURE, false);
		var count = list.getCount();
		
		super.setBlockData(value, parentTextView);
		
		for (i = 0; i < count; i++) {
			data = list.getCollectionData(i, 0);
			if (data.getName() === value) {
				// Calling getCollectionData for each piece of data, as shown in this code, is not advisable.
				// Since getCollectionData loads resources internally, having many Pictures would trigger simultaneous loading, risking memory shortages.
				// This break statement exits the loop once the target name is found, but the stronger intention is to avoid repeatedly calling getCollectionData.
				// In other words, Pictures used for message scrolling should ideally be positioned earlier in the resource sequence.
				// The current version of the DataList object does not implement a method to search for data by name.
				this._pictureId = data.getId();
				break;
			}
		}
	}

	drawBlock() {
		var x, width, pic;
		var text = this._value;
		
		if (this._isStart) {
			pic = this._getGraphics(text);
			if (pic === null) {
				return;
			}
			
			width = pic.getWidth();
			
			if (this._x === -1) {
				x = LayoutControl.getCenterX(-1, width);
			}
			else {
				x = this._x;
			}
			
			pic.setAlpha(this._alpha);
			pic.draw(x, this._y);
		}
	}

	_getGraphics(text?) {
		var list = root.getBaseData().getGraphicsResourceList(GraphicsType.PICTURE, false);
		
		return list.getCollectionDataFromId(this._pictureId, 0);
	}
}
