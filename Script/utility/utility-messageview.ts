
class BaseMessageView extends BaseObject {

	_messageLayout: any = null;

	_activePos: any = MessagePos.NONE;

	_isNameDisplayable: any = false;

	_isWindowDisplayable: any = false;

	_faceId: any = 0;

	_illustId: any = 0;

	_name: any = null;

	_faceHandle: any = null;

	_illustImage: any = null;

	_messageAnalyzer: any = null;

	setupMessageView(messageViewParam?) {
		this._messageLayout = messageViewParam.messageLayout;
		this._activePos = messageViewParam.pos;
		this._isNameDisplayable = messageViewParam.isNameDisplayable;
		this._isWindowDisplayable = messageViewParam.isWindowDisplayable;
		
		if (this._messageLayout.isFacialExpressionEnabled()) {
			this._faceId = messageViewParam.facialExpressionId;
		}
		
		if (this._messageLayout.isCharIllustFacialExpressionEnabled()) {
			this._illustId = messageViewParam.facialExpressionId;
		}
		
		this._setupName(messageViewParam);
		this._setupFaceHandle(messageViewParam);
		this._setupIllustImage(messageViewParam);
		
		this._messageAnalyzer = this.createMessageAnalyzer(messageViewParam);
		this._messageAnalyzer.setMessageAnalyzerText(messageViewParam.text);
	}

	moveMessageView() {
		if (MessageViewControl.moveBacklog() !== MoveResult.CONTINUE) {
			return MoveResult.CONTINUE;
		}
		
		if (MessageViewControl.isHidden() || MessageViewControl.isBacklog()) {
			return MoveResult.CONTINUE;
		}
		
		return this._messageAnalyzer.moveMessageAnalyzer();
	}

	drawMessageView(isActive?, pos?) {
		var xWindow = pos.x + this._messageLayout.getWindowX();
		var yWindow = pos.y + this._messageLayout.getWindowY();
		var xText = pos.x + this._messageLayout.getTextX();
		var yText = pos.y + this._messageLayout.getTextY();
		var xCursor = pos.x + this._messageLayout.getCursorX();
		var yCursor = pos.y + this._messageLayout.getCursorY();
		var xFace = pos.x + this._messageLayout.getFaceX();
		var yFace = pos.y + this._messageLayout.getFaceY();
		var xName = pos.x + this._messageLayout.getNameX();
		var yName = pos.y + this._messageLayout.getNameY();
		
		MessageViewControl.drawBacklog();
		
		if (MessageViewControl.isHidden() || MessageViewControl.isBacklog()) {
			return;
		}
		
		this.drawMessageWindow(xWindow, yWindow);
		this._messageAnalyzer.drawMessageAnalyzer(xText, yText, xCursor, yCursor, this._messageLayout.getPageCursorUI());
		
		if (!isActive) {
			// Draw before drawFace in case face graphic extends outside of the window.
			this._drawWindowShadow(xWindow, yWindow);
		}
		
		this.drawFace(xFace, yFace, isActive);
		
		if (isActive) {
			this.drawName(xName, yName);
		}
	}

	endMessageView() {
		if (this._messageAnalyzer !== null) {
			this._messageAnalyzer.endMessageAnalyzer();
		}
	}

	eraseMessage() {
	}

	createMessageAnalyzer(messageViewParam?) {
		var messageAnalyze = createObject(MessageAnalyzer);
		var messageAnalyzerParam = this._createMessageAnalyzerParam(messageViewParam);
		
		messageAnalyze.setMessageAnalyzerParam(messageAnalyzerParam);
		
		return messageAnalyze;
	}

	drawMessageWindow(xWindow?, yWindow?) {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null || !this._isWindowDisplayable) {
			return;
		}
		
		picWindow.draw(xWindow, yWindow);
	}

	drawFace(xDest?, yDest?, isActive?) {
		var pic, xSrc, ySrc;
		var destWidth = GraphicsFormat.FACE_WIDTH;
		var destHeight = GraphicsFormat.FACE_HEIGHT;
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		var handle = this._faceHandle;
		var facialExpressionId = this._faceId;
		
		if (handle === null) {
			return;
		}
		
		pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		if (pic === null) {
			return;
		}
		
		if (root.isLargeFaceUse()) {
			destWidth = root.getLargeFaceWidth();
			destHeight = root.getLargeFaceHeight();
			if (pic.isLargeImage()) {
				srcWidth = destWidth;
				srcHeight = destHeight;
			}
		}
		
		if (facialExpressionId === 0) {
			xSrc = handle.getSrcX();
			ySrc = handle.getSrcY();
		}
		else {
			xSrc = Math.floor(facialExpressionId % 6);
			ySrc = Math.floor(facialExpressionId / 6);
		}
		
		if (this._messageLayout.isFaceReverse()) {
			pic.setReverse(true);
		}
		
		if (!isActive) {
			pic.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		}
		
		xSrc *= srcWidth;
		ySrc *= srcHeight;
		pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
	}

	drawName(x?, y?) {
		var text = this._name;
		var textui, color, font, pic;
		
		if (text === '' || !this._isNameDisplayable) {
			return;
		}
		
		textui = this._messageLayout.getNameTextUI();
		color = textui.getColor();
		font = textui.getFont();
		pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, this._getTitlePartsCount());
	}

	drawCharIllust(isActive?) {
		var pos, xCharIllust, yCharIllust;
		var image = this._illustImage;
		
		if (image === null || MessageViewControl.isHidden()) {
			return;
		}
		
		pos = this.getIllustPos(image);
		xCharIllust = pos.x + this._messageLayout.getCharIllustX();
		yCharIllust = pos.y + this._messageLayout.getCharIllustY();
		
		if (this._messageLayout.isCharIllustReverse()) {
			image.setReverse(true);
		}
		
		if (!isActive) {
			image.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		}
		
		image.draw(xCharIllust, yCharIllust);
	}

	_drawWindowShadow(xWindow?, yWindow?) {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null) {
			return;
		}
		
		// Make opacity 0 in order to draw shadow.
		picWindow.setAlpha(0);
		picWindow.setColor(this._getNonActiveColor(), this._getNonActiveAlpha());
		picWindow.draw(xWindow, yWindow);
	}

	_getNonActiveColor() {
		return 0x0;
	}

	_getNonActiveAlpha() {
		return 96;
	}

	_getTitlePartsCount() {
		return 4;
	}

	_setupName(messageViewParam?) {
		var name = '';
		
		if (messageViewParam.unit !== null) {
			name = messageViewParam.unit.getName();
		}
		else if (messageViewParam.npc !== null) {
			name = messageViewParam.npc.getName();
		}
		
		this._name = name;
	}

	_setupFaceHandle(messageViewParam?) {
		var handle = null;
		
		if (this._messageLayout.getFaceVisualType() === FaceVisualType.INVISIBLE) {
			return;
		}
		
		if (messageViewParam.unit !== null) {
			handle = messageViewParam.unit.getFaceResourceHandle();
		}
		else if (messageViewParam.npc !== null) {
			handle = messageViewParam.npc.getFaceResourceHandle();
		}
		
		this._faceHandle = handle;
	}

	_setupIllustImage(messageViewParam?) {
		var image = null;
		var facialExpressionId = this._illustId;
		
		if (this._messageLayout.getCharIllustVisualType() === CharIllustVisualType.NONE) {
			return;
		}
		
		if (messageViewParam.unit !== null) {
			image = messageViewParam.unit.getCharIllustImage(facialExpressionId);
		}
		else if (messageViewParam.npc !== null) {
			image = messageViewParam.npc.getCharIllustImage(facialExpressionId);
		}
		
		this._illustImage = image;
	}

	getTextWindowWidth() {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null) {
			return UIFormat.TEXTWINDOW_WIDTH;
		}
		
		return picWindow.getWidth();
	}

	getTextWindowHeight() {
		var textui = this._messageLayout.getWindowTextUI();
		var picWindow = textui.getUIImage();
		
		if (picWindow === null) {
			return UIFormat.TEXTWINDOW_HEIGHT;
		}
		
		return picWindow.getHeight();
	}

	getMessageSpeedType() {
		return EnvironmentControl.getMessageSpeedType();
	}

	getMessagePos() {
		var pos;
			
		if (this._activePos === MessagePos.TOP) {
			pos = this.getMessageTopPos();
		}
		else if (this._activePos === MessagePos.CENTER) {
			pos = this.getMessageCenterPos();
		}
		else if (this._activePos === MessagePos.BOTTOM) {
			pos = this.getMessageBottomPos();
		}
		else {
			pos = createPos(0, 0);
		}
		
		return pos;
	}

	getMessageTopPos() {
		var y = LayoutControl.getRelativeY(6) - 70;
		
		return createPos(this.getMessageX(), y);
	}

	getMessageCenterPos() {
		var y = Math.floor(root.getGameAreaHeight() / 2) - Math.floor(this.getTextWindowHeight() / 2);
		
		return createPos(this.getMessageX(), y);
	}

	getMessageBottomPos() {
		var y = LayoutControl.getRelativeY(6) - 70;
		
		y = root.getGameAreaHeight() - (this.getTextWindowHeight() + y);
		
		return createPos(this.getMessageX(), y);
	}

	getMessageX() {
		return LayoutControl.getCenterX(-1, this.getTextWindowWidth());
	}

	getIllustPos(image?) {
		var pos;
		var type = this._messageLayout.getCharIllustVisualType();
			
		if (type === CharIllustVisualType.LEFT) {
			pos = this.getIllustTopPos(image);
		}
		else if (type === CharIllustVisualType.CENTER) {
			pos = this.getIllustCenterPos(image);
		}
		else if (type === CharIllustVisualType.RIGHT) {
			pos = this.getIllustBottomPos(image);
		}
		else {
			pos = createPos(0, 0);
		}
		
		return pos;
	}

	getIllustTopPos(image?) {
		var x, y;
		
		// Display on right side.
		x = Math.floor(root.getGameAreaWidth() / 2);
		x += Math.floor(x / 2);
		x -= Math.floor(image.getWidth() / 2);
		
		y = this.getIllustY(image);
		
		return createPos(x, y);
	}

	getIllustCenterPos(image?) {
		var x, y;
		
		x = Math.floor(root.getGameAreaWidth() / 2);
		x -= Math.floor(image.getWidth() / 2);
		
		y = this.getIllustY(image);
		
		return createPos(x, y);
	}

	getIllustBottomPos(image?) {
		var x, y;
		
		// Display on left side
		x = Math.floor(root.getGameAreaWidth() / 2);
		x -= Math.floor(x / 2);
		x -= Math.floor(image.getWidth() / 2);
		
		y = this.getIllustY(image);
		
		return createPos(x, y);
	}

	getIllustY(image?) {
		var y;
		var baseheight = Math.floor(root.getGameAreaHeight() * 0.7);
		var height = image.getHeight();
		
		if (height > baseheight) {
			y = root.getGameAreaHeight() - baseheight;
		}
		else {
			y = root.getGameAreaHeight() - height;
		}
		
		return y;
	}

	_createMessageAnalyzerParam(messageViewParam?) {
		var textui = this._messageLayout.getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = textui.getColor();
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.voiceSoundHandle = this._messageLayout.getVoiceSoundHandle();
		messageAnalyzerParam.pageSoundHandle = this._messageLayout.getPageSoundHandle();
		messageAnalyzerParam.messageSpeedType = this.getMessageSpeedType();
		
		return messageAnalyzerParam;
	}
}

// Manage objects inheriting BaseMessageView (this object itself does not inherit BaseMessageView).
class FaceView extends BaseObject {

	_topView: any = null;

	_centerView: any = null;

	_bottomView: any = null;

	_activePos: any = MessagePos.NONE;

	setupMessageView(messageViewParam?) {
		var pos = messageViewParam.pos;
		
		if (pos === MessagePos.TOP) {
			this._topView = createObject(FaceViewTop);
			if (messageViewParam.messageLayout === null) {
				messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.TOP);
			}
			this._topView.setupMessageView(messageViewParam);
		}
		else if (pos === MessagePos.CENTER) {
			this._centerView = createObject(FaceViewCenter);
			if (messageViewParam.messageLayout === null) {
				messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.CENTER);
			}
			this._centerView.setupMessageView(messageViewParam);
		}
		else if (pos === MessagePos.BOTTOM) {
			this._bottomView = createObject(FaceViewBottom);
			if (messageViewParam.messageLayout === null) {
				messageViewParam.messageLayout = root.getBaseData().getMessageLayoutList().getData(MessageLayout.BOTTOM);
			}
			this._bottomView.setupMessageView(messageViewParam);
		}
		
		this._activePos = pos;
	}

	moveMessageView() {
		var result = MoveResult.CONTINUE;
		
		if (this._activePos === MessagePos.TOP) {
			result = this._topView.moveMessageView();
		}
		else if (this._activePos === MessagePos.CENTER) {
			result = this._centerView.moveMessageView();
		}
		else if (this._activePos === MessagePos.BOTTOM) {
			result = this._bottomView.moveMessageView();
		}
		
		return result;
	}

	drawMessageView() {
		var view = null;
		var isActive = true;
		var isTopActive = true;
		var isCenterActive = true;
		var isBottomActive = true;
		
		if (root.isMessageBlackOutEnabled()) {
			isTopActive = this._activePos === MessagePos.TOP;
			isCenterActive = this._activePos === MessagePos.CENTER;
			isBottomActive = this._activePos === MessagePos.BOTTOM;
		}
		
		this._drawFaceViewCharIllust(isTopActive, isCenterActive, isBottomActive);
		
		if (this._isMessageWindowFixed()) {
			if (this._activePos === MessagePos.TOP) {
				view = this._topView;
				isActive = isTopActive;
			}
			else if (this._activePos === MessagePos.CENTER) {
				view = this._centerView;
				isActive = isCenterActive;
			}
			else if (this._activePos === MessagePos.BOTTOM) {
				view = this._bottomView;
				isActive = isBottomActive;
			}
			
			if (view !== null) {
				// By calling getMessageBottomPos, the window is displayed toward the bottom.
				view.drawMessageView(isActive, BaseMessageView.prototype.getMessageBottomPos.call(view));
			}
		}
		else {
			if (this._topView !== null) {
				this._topView.drawMessageView(isTopActive, this._topView.getMessagePos());
			}
			
			if (this._centerView !== null) {
				this._centerView.drawMessageView(isCenterActive, this._centerView.getMessagePos());
			}
			
			if (this._bottomView !== null) {
				this._bottomView.drawMessageView(isBottomActive, this._bottomView.getMessagePos());
			}
		}
	}

	endMessageView() {
		this.eraseMessage(MessageEraseFlag.ALL);
	}

	eraseMessage(flag?) {
		if (flag & MessageEraseFlag.TOP) {
			if (this._topView !== null) {
				this._topView.endMessageView();
				this._topView = null;
			}
		}
		
		if (flag & MessageEraseFlag.CENTER) {
			if (this._centerView !== null) {
				this._centerView.endMessageView();
				this._centerView = null;
			}
		}
		
		if (flag & MessageEraseFlag.BOTTOM) {
			if (this._bottomView !== null) {
				this._bottomView.endMessageView();
				this._bottomView = null;
			}
		}
		
		this._activePos = MessagePos.NONE;
	}

	_drawFaceViewCharIllust(isTopActive?, isCenterActive?, isBottomActive?) {
		if (this._topView !== null) {
			this._topView.drawCharIllust(isTopActive);
		}
		
		if (this._centerView !== null) {
			this._centerView.drawCharIllust(isCenterActive);
		}
		
		if (this._bottomView !== null) {
			this._bottomView.drawCharIllust(isBottomActive);
		}
	}

	_isMessageWindowFixed() {
		return root.isMessageWindowFixed();
	}
}

class FaceViewTop extends BaseMessageView {

}

class FaceViewCenter extends BaseMessageView {

	getMessageCenterPos() {
		// Put window on bottom if there is a character illustration displayed in the middle.
		if (this._illustImage !== null) {
			return super.getMessageBottomPos();
		}
		
		return super.getMessageCenterPos();
	}
}

class FaceViewBottom extends BaseMessageView {

}

class TeropView extends BaseMessageView {

	drawMessageView() {
		// Draw character illustration first so it does not cover the window.
		this.drawCharIllust(true);
		super.drawMessageView(true, this.getMessagePos());
	}
}

class StillView extends BaseMessageView {

	drawMessageView() {
		this.drawCharIllust(true);
		super.drawMessageView(true, this.getMessagePos());
	}
}

class MessageViewControl {

	static _isHidden: any = false;

	static _backlogWindow: any = null;

	static setHidden(isHidden?) {
		this._isHidden = isHidden;
	}

	static isHidden() {
		return this._isHidden;
	}

	static isBacklog() {
		return this._backlogWindow !== null;
	}

	static reset() {
		this._isHidden = false;
		this._backlogWindow = null;
	}

	static moveBacklog() {
		if (this._backlogWindow !== null) {
			if (this._backlogWindow.moveWindow() !== MoveResult.CONTINUE) {
				this._backlogWindow = null;
				return MoveResult.END;
			}
		}
		else if (this._isBacklogInput()) {
			this._backlogWindow = createWindowObject(BacklogWindow);
			this._backlogWindow.setWindowData();
		}
		else if (this._isMessageInput()) {
			this._isHidden = !this._isHidden;
		}
	
		return MoveResult.CONTINUE;
	}

	static drawBacklog() {
		var x, y;
		
		if (this._backlogWindow === null) {
			return;
		}
		
		x = LayoutControl.getCenterX(-1, this._backlogWindow.getWindowWidth());
		y = LayoutControl.getCenterY(-1, this._backlogWindow.getWindowHeight());
		
		this._backlogWindow.drawWindow(x, y);
	}

	static _isBacklogInput() {
		return InputControl.isInputAction(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL);
	}

	static _isMessageInput() {
		return InputControl.isInputAction(InputType.LEFT) || InputControl.isInputAction(InputType.RIGHT);
	}
}

class BacklogWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = this._getVisibleBacklogObjectCount();
		
		this._scrollbar = createScrollbarObject(BacklogScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
		
		this._setBacklogObject();
		this._setFirstIndex();
	}

	moveWindowContent() {
		var data;
		
		if (InputControl.isInputAction(InputType.DOWN) || InputControl.isInputState(InputType.DOWN)) {
			if (this._scrollbar.getIndex() === this._scrollbar.getObjectCount() - 1) {
				return MoveResult.END;
			}
		}
		else if (MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			data = this._scrollbar.getScrollableData();
			if (!data.isBottom) {
				return MoveResult.END;
			}
		}
		else if (InputControl.isStartAction()) {
			return MoveResult.END;
		}
		
		this._scrollbar.moveInput();
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowTextUI() {
		return root.queryTextUI('backlog_window');
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	_getVisibleBacklogObjectCount() {
		return Math.floor(root.getGameAreaHeight() / 70);
	}

	_setFirstIndex() {
		var count = this._scrollbar.getObjectCount();
		
		this._scrollbar.setIndex(count - 1);
	}

	_setBacklogObject() {
		var i, j, arr, count2, command;
		var object: any = {};
		var count = root.getBacklogCommandCount();
		
		for (i = 0; i < count; i++) {
			command = root.getBacklogCommand(i);
			arr = this._getBacklogText(command);
			count2 = arr.length;
			for (j = 0; j < count2; j++) {
				if ((j % 3) === 0) {
					object = {};
					object.backlogCommand = command;
					object.textArray = [];
					object.voiceName = '';
					this._scrollbar.objectSet(object);
				}
				
				object.textArray.push(arr[j]);
			}
		}
	
		this._scrollbar.objectSetEnd();
		
		this._checkVoice();
	}

	_getBacklogText(object?) {
		var i, j, c, count;
		var text = object.getText();
		var arr = [];
		var replacer = createObject(VariableReplacer);
		var parser = createObject(TextParser);
		var parserInfo = StructureBuilder.buildParserInfo();
		
		// Exclude control characters for voice.
		parserInfo.isVoiceIncluded = false;
		
		text = replacer.startReplace(text);
		text = parser.startReplace(text, parserInfo);
		count = text.length;
		
		for (i = 0, j = 0; i < count; i++) {
			c = text.charAt(i);
			if (c === '\n') {
				arr.push(text.substring(j, i));
				j = i + 1;
			}
			else if (i === count - 1) {
				arr.push(text.substring(j, i + 1));
			}
		}
		
		return arr;
	}

	_checkVoice() {
		var i, object;
		var count = this._scrollbar.getObjectCount();
		
		// Does not continue if the voice folder is not configured.
		if (this._getVoiceCategory() === '') {
			return;
		}
		
		for (i = 0; i < count; i++) {
			object = this._scrollbar.getObjectFromIndex(i);
			object.voiceName = this._getVoiceName(object);
		}
	}

	_getVoiceName(object?) {
		var i, c;
		var name = '';
		var count = object.textArray.length;
		
		for (i = 0; i < count; i++) {
			c = object.textArray[i].match(this._getKey());
			if (c !== null && c[1] !== '') {
				name = c[1];
			}
			
			object.textArray[i] = object.textArray[i].replace(this._getKey(), '');
		}
		
		return name;
	}

	_getKey() {
		var key = /\\vo\[(.+?)\]/;
		
		return key;
	}

	_getVoiceCategory() {
		return DataConfig.getVoiceCategoryName();
	}
}

class BacklogScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		this._drawName(x, y, object);
		this._drawMessage(x, y, object);
		this._drawFace(x, y, object);
		this._drawVoiceIcon(x, y, object);
	}

	getObjectWidth() {
		return 550;
	}

	getObjectHeight() {
		return 70;
	}

	playSelectSound() {
		var fileName;
		var object = this.getObject();
		var ext = ['ogg', 'mp3', 'wav'];
		
		if (object.voiceName === '') {
			return;
		}
		
		root.getMaterialManager().voiceStop(1, false);
		
		fileName = object.voiceName + '.' + ext[this._getVoiceExtIndex()];
		root.getMaterialManager().voicePlay(this._getVoiceCategory(), fileName, 1);
	}

	playCancelSound() {
	}

	_drawName(xDest?, yDest?, object?) {
		var range;
		var textui = this._getNameTextUI();
		var color = this._getNameColor(object.backlogCommand, textui);
		var font = textui.getFont();
		var name = this._getNameText(object.backlogCommand);
		
		if (!root.isLargeFaceUse()) {
			return;
		}
		
		range = createRangeObject(xDest, yDest, 120, this.getObjectHeight());
		TextRenderer.drawRangeText(range, TextFormat.CENTER, name, -1, color, font);
	}

	_drawMessage(xDest?, yDest?, object?) {
		var i;
		var length = -1;
		var textui = this._getMessageTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var textArray = object.textArray;
		var count = textArray.length;
		
		xDest += 160;
		for (i = 0; i < count; i++) {
			TextRenderer.drawKeywordText(xDest, yDest + (i * 20), textArray[i], length, color, font);
		}
	}

	_drawFace(xDest?, yDest?, object?) {
		var pic, xSrc, ySrc;
		var destWidth = GraphicsFormat.FACE_WIDTH;
		var destHeight = 67;
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		var handle = this._getFaceResourceHandle(object.backlogCommand);
		var facialExpressionId = object.backlogCommand.getFacialExpressionId();
		var messageLayout = root.getDefaultMessageLayout(object.backlogCommand.getCommandType());
		
		if (handle === null || root.isLargeFaceUse()) {
			return;
		}
		
		pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		if (pic === null) {
			return;
		}
		
		// Even in the backlog, refer to the "Enable Expression (Face)" in the message layout.
		if (facialExpressionId === 0 || (messageLayout !== null && !messageLayout.isFacialExpressionEnabled())) {
			xSrc = handle.getSrcX();
			ySrc = handle.getSrcY();
		}
		else {
			xSrc = Math.floor(facialExpressionId % 6);
			ySrc = Math.floor(facialExpressionId / 6);
		}
		
		xSrc *= GraphicsFormat.FACE_WIDTH;
		ySrc *= GraphicsFormat.FACE_HEIGHT;
		pic.setAlpha(this._getFaceAlpha());
		pic.drawStretchParts(xDest + 25, yDest - 2, destWidth, destHeight, xSrc, ySrc + 5, srcWidth, srcHeight);
	}

	_drawVoiceIcon(xDest?, yDest?, object?) {
		var handle = root.queryGraphicsHandle('voiceicon');
		
		if (object.voiceName === '') {
			return;
		}
		
		xDest += 510;
		yDest += 20;
		GraphicsRenderer.drawImage(xDest, yDest, handle, GraphicsType.ICON);
	}

	_getNameColor(command?, textui?) {
		var raceId;
		var color = textui.getColor();
		var unit = command.getUnit();
		
		if (unit === null) {
			return color;
		}
		
		raceId = this._getRaceId(unit);
		if (raceId === 0) {
			color = this._getFirstRaceColor();
		}
		else if (raceId === 1) {
			color = this._getSecondRaceColor();
		}
		
		return color;
	}

	_getRaceId(unit?) {
		var i, raceId, data;
		var refList = unit.getClass().getRaceReferenceList();
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			data = refList.getTypeData(i);
			raceId = data.getId();
			if (raceId === 0 || raceId === 1) {
				return raceId;
			}
		}
		
		return -1;
	}

	_getNameText(command?) {
		var object = this._getTargetObject(command);
		
		if (object === null) {
			return '';
		}
		
		return object.getName();
	}

	_getNameTextUI() {
		return root.queryTextUI('default_window');
	}

	_getMessageTextUI() {
		return this.getParentTextUI();
	}

	_getFaceResourceHandle(command?) {
		var object = this._getTargetObject(command);
		
		if (object === null) {
			return root.createEmptyHandle();
		}
		
		return object.getFaceResourceHandle();
	}

	_getTargetObject(command?) {
		var unit = command.getUnit();
		
		if (unit !== null) {
			return unit;
		}
		
		return command.getNpc();
	}

	_getFaceAlpha() {
		return 150;
	}

	_getFirstRaceColor() {
		return 0x30c0f5;
	}

	_getSecondRaceColor() {
		return 0xf0a5f0;
	}

	_getVoiceCategory() {
		return DataConfig.getVoiceCategoryName();
	}

	_getVoiceExtIndex() {
		return DataConfig.getVoiceExtIndex();
	}
}
