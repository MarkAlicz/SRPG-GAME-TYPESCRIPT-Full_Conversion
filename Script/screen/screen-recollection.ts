
class RecollectionMode {

	static TOP: any = 0;

	static EVENT: any = 1;
}

class RecollectionScreen extends BaseScreen {

	_eventArray: any = null;

	_recollectionEvent: any = null;

	_isAutoBackground: any = false;

	_scrollbar: any = null;

	_descriptionChanger: any = null;

	_isThumbnailMode: any = false;

	_baseMusicHandle: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RecollectionMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === RecollectionMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	}

	drawScreenCycle() {
		this._drawTop();
	}

	drawScreenTopText(textui?) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	}

	drawScreenBottomText(textui?) {
		this._descriptionChanger.drawBottomDescription(textui, this._scrollbar);
	}

	getScreenInteropData() {
		return root.queryScreen('Recollection');
	}

	getExtraDisplayName() {
		return this.getScreenTitleName();
	}

	getExtraDescription() {
		return StringTable.Extra_Recollection;
	}

	_prepareScreenMemberData(screenParam?) {
		this._eventArray = this._createEventArray();
		this._recollectionEvent = createObject(RecollectionEvent);
		this._isAutoBackground = false;
		this._scrollbar = createScrollbarObject(this._isThumbnailMode ? ThumbnailScrollbar : DictionaryScrollbar, this);
		this._descriptionChanger = createObject(DescriptionChanger);
		// Remember BGM so it can be played again when switching to the recollection screen.
		this._baseMusicHandle = root.getMediaManager().getActiveMusicHandle();
	}

	_completeScreenMemberData(screenParam?) {
		this._setScrollbarData();
		this._descriptionChanger.setDescriptionData();
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		
		this.changeCycleMode(RecollectionMode.TOP);
	}

	_createEventArray() {
		var i, event, handle;
		var list = root.getBaseData().getRecollectionEventList();
		var count = list.getCount();
		var eventArray = [];
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			if (event.getRecollectionEventInfo().isExtraDisplayable()) {
				eventArray.push(event);
				
				handle = event.getRecollectionEventInfo().getThumbnailResourceHandle();
				if (!handle.isNullHandle()) {
					this._isThumbnailMode = true;
				}
			}
		}
		
		return eventArray;
	}

	_setScrollbarData() {
		var dictionaryScrollbarParam = this._createDictionaryScrollbarParam();
		
		this._scrollbar.setDictionaryScrollbarParam(dictionaryScrollbarParam);
		this._scrollbar.setDictionaryFormation();
		this._scrollbar.setActive(true);
		this._scrollbar.setObjectArray(this._eventArray);
	}

	_createDictionaryScrollbarParam() {
		var dictionaryScrollbarParam = StructureBuilder.buildDictionaryScrollbarParam();
		
		dictionaryScrollbarParam.isRecollectionMode = true;
		dictionaryScrollbarParam.funcCondition = function(object, index) {
			return object.getExecutedMark() === EventExecutedType.EXECUTED;
		};
		
		return dictionaryScrollbarParam;
	}

	_moveTop() {
		var input = this._scrollbar.moveInput();
		var result = MoveResult.CONTINUE;
		
		if (input === ScrollbarInput.SELECT) {
			result = this._moveSelect();
		}
		else if (input === ScrollbarInput.CANCEL) {
			result = this._moveCancel();
		}
		else if (input === ScrollbarInput.NONE) {
			result = this._moveNone();
		}
		
		return result;
	}

	_moveSelect() {
		var event = this._scrollbar.getObject();
		
		if (this._scrollbar.isNameDisplayable(event)) {
			this._recollectionEvent.startRecollectionEvent(event);
			this.changeCycleMode(RecollectionMode.EVENT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCancel() {
		this._descriptionChanger.endDescription();
		return MoveResult.END;
	}

	_moveNone() {
		this._descriptionChanger.setDescriptionText(this._scrollbar);
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		if (this._recollectionEvent.moveRecollectionEvent() !== MoveResult.CONTINUE) {
			this._checkScreenMusic();
			this.changeCycleMode(RecollectionMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawTop() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	}

	_drawEvent() {
	}

	_checkScreenMusic() {
		var handleActive = root.getMediaManager().getActiveMusicHandle();
		
		if (!this._baseMusicHandle.isEqualHandle(handleActive)) {
			MediaControl.musicStop(MusicStopType.BACK);
		}
	}
}

class RecollectionEventMode {

	static RANDOMBACK: any = 0;

	static EVENT: any = 1;

	static BACKEND: any = 2;
}

class RecollectionEvent extends BaseObject {

	_event: any = null;

	startRecollectionEvent(event?) {
		var generator;
		
		if (event.getRecollectionEventInfo().isRandomBackground()) {
			generator = root.getEventGenerator();
			generator.backgroundChange(BackgroundChangeType.CHANGE, Miscellaneous.getRandomBackgroundHandle(), GraphicsType.EVENTBACK, BackgroundTransitionType.BLACK);
			generator.execute();
			this.changeCycleMode(RecollectionEventMode.RANDOMBACK);
		}
		else {
			event.startEvent();
			this.changeCycleMode(RecollectionEventMode.EVENT);
		}
		
		this._event = event;
	}

	moveRecollectionEvent() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RecollectionEventMode.RANDOMBACK) {
			result = this._moveRandomBack();
		}
		else if (mode === RecollectionEventMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === RecollectionEventMode.BACKEND) {
			result = this._moveBackEnd();
		}
				
		return result;
	}

	_moveRandomBack() {
		this._event.startEvent();
		this.changeCycleMode(RecollectionEventMode.EVENT);
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		var generator;
		
		if (EventCommandManager.isEventRunning(this._event)) {
			return MoveResult.CONTINUE;
		}
		
		if (!root.isEventBackgroundVisible()) {
			return MoveResult.END;
		}
		
		// Delete the random background or the background which was displayed in the event.
		generator = root.getEventGenerator();
		generator.backgroundChange(BackgroundChangeType.NONE, root.createEmptyHandle(), GraphicsType.EVENTBACK, BackgroundTransitionType.BLACK);
		generator.execute();
		
		this.changeCycleMode(RecollectionEventMode.BACKEND);
		
		return MoveResult.CONTINUE;
	}

	_moveBackEnd() {
		return MoveResult.END;
	}
}
