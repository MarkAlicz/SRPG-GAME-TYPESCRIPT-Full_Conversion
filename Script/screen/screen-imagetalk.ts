
class ImageTalkMode {

	static AUTOEVENTCHECK: any = 0;

	static SELECT: any = 1;

	static EVENT: any = 2;
}

class ImageTalkScreen extends BaseScreen {

	_eventChecker: any = null;

	_imageTalkWindow: any = null;

	_capsuleEvent: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ImageTalkMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === ImageTalkMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === ImageTalkMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	}

	drawScreenCycle() {
		if (root.getRestPreference().isTalkGraphicsEnabled()) {
			this._drawTalkImage();
			this._drawBottomWindow();
		}
		else {
			this._drawCenterWindow();
		}
	}

	getScreenInteropData() {
		return root.queryScreen('ImageTalk');
	}

	_drawCenterWindow() {
		var x = LayoutControl.getCenterX(-1, this._imageTalkWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._imageTalkWindow.getWindowHeight());
		
		this._imageTalkWindow.drawWindow(x, y);
	}

	_drawBottomWindow() {
		var x = LayoutControl.getCenterX(-1, this._imageTalkWindow.getWindowWidth());
		var height = root.getGameAreaHeight();
		var dy = Math.floor(height * 0.125);
		var y = height - this._imageTalkWindow.getWindowHeight() - dy;
		
		this._imageTalkWindow.drawWindow(x, y);
	}

	_drawTalkImage() {
		var info, x, y, messagePos;
		var image = null;
		var entry = this._imageTalkWindow.getChildScrollbar().getObject();
		
		if (entry === null) {
			return;
		}
		
		info = entry.event.getRestEventInfo();
		image = info.getTalkImage();
		if (image === null) {
			return;
		}
		
		x = this._getIllustX(image);
		
		messagePos = info.getPos();
		if (messagePos === MessagePos.TOP) {
			y = this._getIllustTopY(image);
		}
		else if (messagePos === MessagePos.CENTER) {
			y = this._getIllustCenterY(image);
		}
		else {
			y = this._getIllustBottomY(image);
		}
		
		image.draw(x, y);
	}

	_getIllustX(image?) {
		return LayoutControl.getCenterX(-1, image.getWidth());
	}

	_getIllustTopY(image?) {
		return 60;
	}

	_getIllustCenterY(image?) {
		return LayoutControl.getCenterY(-1, image.getHeight());
	}

	_getIllustBottomY(image?) {
		var height = root.getGameAreaHeight();
		var y = Math.floor(height * 0.165);
		
		return y;
	}

	_prepareScreenMemberData(screenParam?) {
		this._eventChecker = createObject(RestAutoEventChecker);
		this._imageTalkWindow = createWindowObject(ImageTalkWindow, this);
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeScreenMemberData(screenParam?) {
		this._imageTalkWindow.setWindowData(this._getEventList());
		this._rebuildTalkEventList();
		this._changeEventMode();
	}

	_rebuildTalkEventList() {
		var i, count, data, entry;
		var list = this._getEventList();
		var scrollbar = this._imageTalkWindow.getChildScrollbar();
		var indexPrev = scrollbar.getIndex();
		var countPrev = scrollbar.getObjectCount();
		var xScrollPrev = scrollbar.getScrollXValue();
		var yScrollPrev = scrollbar.getScrollYValue();
		
		scrollbar.resetScrollData();
		
		// After executing the event, there is a possibility that another event may be displayed/not displayed, so rebuild it.
		count = list.getCount();
		for (i = 0; i < count; i++) {
			data = list.getData(i);
			if (this._isEvent(data)) {
				entry = {};
				entry.event = data;
				entry.isLock = false;
				scrollbar.objectSet(entry);
			}
		}
		
		scrollbar.objectSetEnd();
		
		count = scrollbar.getObjectCount();
		if (count === countPrev) {
			// Get the scroll position back.
			scrollbar.setScrollXValue(xScrollPrev);
			scrollbar.setScrollYValue(yScrollPrev);
		}
		else if (indexPrev >= count) {
			scrollbar.setIndex(0);
		}
		else {
			scrollbar.setIndex(indexPrev);
		}
	}

	_moveAutoEventCheck() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ImageTalkMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelect() {
		var input = this._imageTalkWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startTalkEvent();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._endTalkEvent();
		}
		
		return MoveResult.CONTINUE;
	}

	_startTalkEvent() {
		var entry;
		var isExecuteMark = true;
		
		entry = this._imageTalkWindow.getChildScrollbar().getObject();
		if (entry === null) {
			return;
		}
		
		// If the event has already been executed, don't continue.
		if (entry.event.getExecutedMark() === EventExecutedType.EXECUTED) {
			return;
		}	
		
		// Initialize it so that the event name can be grayish after the event ends.
		entry.isLock = true;
		
		this._capsuleEvent.enterCapsuleEvent(entry.event, isExecuteMark);
		
		this.changeCycleMode(ImageTalkMode.EVENT);
	}

	_endTalkEvent() {
		this._rebuildTalkEventList();
		this.changeCycleMode(ImageTalkMode.SELECT);
	}

	_getEventList() {
		return root.getCurrentSession().getTalkEventList();
	}

	_isEvent(event?) {
		return event.isEvent();
	}

	_changeEventMode() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.TALK);
		if (result === EnterResult.NOTENTER) {
			this.changeCycleMode(ImageTalkMode.SELECT);
		}
		else {
			this.changeCycleMode(ImageTalkMode.AUTOEVENTCHECK);
		}
	}
}

class ImageTalkWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData(eventList?) {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 4);
		
		this._scrollbar = createScrollbarObject(ImageTalkScrollbar, this);
		this._scrollbar.checkIcon(eventList);
		this._scrollbar.setScrollFormation(3, count);
		this._scrollbar.setActive(true);
	}

	moveWindowContent() {
		return this._scrollbar.moveInput();
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

	getListIndex() {
		return this._scrollbar.getIndex();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class ImageTalkScrollbar extends BaseScrollbar {

	_isIconVisible: any = false;

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		this._drawName(x, y, object, isSelect, index);
	}

	checkIcon(eventList?) {
		var i, event;
		var count = eventList.getCount();
		
		for (i = 0; i < count; i++) {
			event = eventList.getData(i);
			if (!event.getIconResourceHandle().isNullHandle()) {
				this._isIconVisible = true;
				return;
			}
		}
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = this._isSelectable(object);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	getObjectWidth() {
		var dx = this._isIconVisible ? GraphicsFormat.ICON_WIDTH + 5 : 0;
		return DefineControl.getTextPartsWidth() + dx;
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_drawName(x?, y?, object?, isSelect?, index?) {
		var format, handle;
		var textui = this.getParentTextUI();
		var color = this._getEventColor(object, textui);
		var font = textui.getFont();
		var alpha = 255;
		var length = this.getObjectWidth();
		var range = createRangeObject(x, y + 0, this.getObjectWidth(), this.getObjectHeight());
		
		if (this._isIconVisible) {
			handle = object.event.getIconResourceHandle();
			if (!handle.isNullHandle()) {
				GraphicsRenderer.drawImage(range.x, range.y, handle, GraphicsType.ICON);
			}
			range.x += GraphicsFormat.ICON_WIDTH + 5;
			length -= GraphicsFormat.ICON_WIDTH - 5;
			format = TextFormat.LEFT;
		}
		else {
			format = TextFormat.CENTER;
		}
		
		TextRenderer.drawRangeAlphaText(range, format, object.event.getName(), length, color, alpha, font);
	}

	_getEventColor(object?, textui?) {
		var color;
		
		if (object.isLock || this._isSelectable(object)) {
			color = textui.getColor();
		}
		else {
			color = ColorValue.DISABLE;
		}
		
		return color;
	}

	_isSelectable(object?) {
		if (object === null || object.event === null) {
			return false;
		}
		
		// If the event is not executed, choices are possible.
		return object.event.getExecutedMark() === EventExecutedType.FREE;
	}
}
