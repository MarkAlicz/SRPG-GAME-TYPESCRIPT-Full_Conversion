
class SupportScreenMode {

	static SENDER: any = 0;

	static RECIVER: any = 1;
}

class SupportDataSize {

	static HEIGHT: any = 56;
}

// This screen is displayed when "Display the memories screen as a Unit Icon List" is enabled in the game option.

class SupportScreen extends BaseScreen {

	_senderWindow: any = null;

	_receiverWindow: any = null;

	_descriptionChanger: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SupportScreenMode.SENDER) {
			result = this._moveSender();
		}
		else if (mode === SupportScreenMode.RECIVER) {
			result = this._moveReciver();
		}
		
		return result;
	}

	drawScreenCycle() {
		var width = this._senderWindow.getWindowWidth() + this._receiverWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._senderWindow.getWindowHeight());
		
		this._senderWindow.drawWindow(x, y);
		this._receiverWindow.drawWindow(x + this._senderWindow.getWindowWidth(), y);
	}

	drawScreenTopText(textui?) {
		TextRenderer.drawScreenTopTextCenter(this.getScreenTitleName(), textui);
	}

	drawScreenBottomText(textui?) {
		var entity, scrollbar, event;
		var text = '';
		
		if (this.getCycleMode() === SupportScreenMode.RECIVER) {
			entity = this._receiverWindow.getEntity();
			scrollbar = entity.getSubScrollbar();
			event = scrollbar.getObject();
			
			if (scrollbar.isEventEnabled(event)) {
				text = event.getDescription();
			}
		}
		
		this._descriptionChanger.drawBottomDescriptionEx(textui, text);
	}

	getScreenInteropData() {
		return root.queryScreen('SupportList');
	}

	getExtraDisplayName() {
		return this.getScreenTitleName();
	}

	getExtraDescription() {
		return StringTable.Extra_Recollection;
	}

	_prepareScreenMemberData(screenParam?) {
		this._senderWindow = createWindowObject(SupportSenderWindow, this);
		this._receiverWindow = createWindowObject(SupportReciverWindow, this);
		this._descriptionChanger = createObject(DescriptionChanger);
	}

	_completeScreenMemberData(screenParam?) {
		var receiverArray = SupportReciverBuilder.createArray();
		var senderArray = SupportSenderBuilder.createArray(receiverArray);
		
		this._receiverWindow.setWindowData();
		
		this._senderWindow.setWindowData();
		this._senderWindow.setSenderArray(senderArray);
		this._senderWindow.enableSelectCursor(true);
		
		this._receiverWindow.changeReciverList(this._senderWindow.getSender());
		this.changeCycleMode(SupportScreenMode.SENDER);
		
		this._descriptionChanger.setDescriptionData();
	}

	_moveSender() {
		var input = this._senderWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startReciverMode();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if (this._senderWindow.isIndexChanged()) {
				this._receiverWindow.changeReciverList(this._senderWindow.getSender());
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveReciver() {
		var result = this._receiverWindow.moveWindow();
		
		if (result !== MoveResult.CONTINUE) {
			this._returnSenderMode();
			return MoveResult.CONTINUE;
		}
	
		return MoveResult.CONTINUE;
	}

	_startReciverMode() {
		var entity = this._receiverWindow.getEntity();
		var sender = this._senderWindow.getSender();
		
		if (!sender.isEnabled) {
			// If isEnabled is false, it means that the unit has never belonged to the player even once.
			// If so, suppose that it cannot select and don't continue to process.
			this._playOperationBlockSound();
			return;
		}
		
		entity.startReciverEntity(true);
		this._senderWindow.enableSelectCursor(false);
		this.changeCycleMode(SupportScreenMode.RECIVER);
	}

	_returnSenderMode() {
		var entity = this._receiverWindow.getEntity();
		
		entity.startReciverEntity(false);
		this._senderWindow.enableSelectCursor(true);
		this.changeCycleMode(SupportScreenMode.SENDER);
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}
}

class SupportReciverWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = LayoutControl.getObjectVisibleCount(SupportDataSize.HEIGHT, 7);
		
		this._scrollbar = createScrollbarObject(SupportReciverScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
	}

	changeReciverList(sender?) {
		var i, entity, count;
		var arr = [];
		
		if (sender === null || !sender.isEnabled) {
			// If the unit has never belonged to the player,
			// the collaborator who the unit can support is also not displayed.
			this._scrollbar.setObjectArray([]);
			return;
		}
		
		count = sender.receiverArray.length;
		for (i = 0; i < count; i++) {
			entity = createObject(SupportReciverEntity);
			arr.push(entity);
			entity.setParentData(sender.unit, sender.receiverArray[i], this);
		}
		
		this._scrollbar.setObjectArray(arr);
	}

	moveWindowContent() {
		var object;
		var result = MoveResult.CONTINUE;
		
		object = this._scrollbar.getObject();
		if (object.getCycleMode() !== SupportReciverEntityMode.SELECT) {
			result = object.moveReciverEntity();
			// If the confirmation message etc. is displayed, to disable to input up/down, don't continue to process.
			return result;
		}
		
		if (InputControl.isCancelAction()) {
			this._playCancelSound();
			result = MoveResult.END;
		}
		else if (InputControl.isInputState(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			this._moveUpDown();
		}
		else if (InputControl.isInputState(InputType.DOWN) || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			this._moveUpDown();
		}
		else {
			this._checkTracingScrollbar();
			
			object = this._scrollbar.getObject();
			result = object.moveReciverEntity();
		}
		
		this._scrollbar.getEdgeCursor().moveCursor();
		MouseControl.checkScrollbarEdgeAction(this._scrollbar);
		
		return result;
	}

	getEntity() {
		return this._scrollbar.getObject();
	}

	drawWindowContent(x?, y?) {
		var object;
		
		this._scrollbar.drawScrollbar(x, y);
		
		object = this._scrollbar.getObject();
		if (object !== null) {
			object.drawActiveReciverEntity();
		}
	}

	getWindowTextUI() {
		return root.queryTextUI('supportlist_window');
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	_moveUpDown() {
		var object = this._scrollbar.getObject();
		
		object.getSubScrollbar().setActiveSingle(false);
		this._scrollbar.moveScrollbarCursor();
		
		object = this._scrollbar.getObject();
		object.getSubScrollbar().setActiveSingle(true);
	}

	_checkTracingScrollbar() {
		var object;
		var objectPrev = this._scrollbar.getObject();
		
		if (MouseControl.moveScrollbarMouse(this._scrollbar)) {
			objectPrev.getSubScrollbar().setActiveSingle(false);
			object = this._scrollbar.getObject();
			object.getSubScrollbar().setActiveSingle(true);
			
			MouseControl.moveScrollbarMouse(object.getSubScrollbar());
		}
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

class SupportReciverScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		object.drawReciverEntity(x, y, index === this.getIndex());
	}

	drawCursor(x?, y?, isActive?) {
	}

	getObjectWidth() {
		return 340;
	}

	getObjectHeight() {
		return SupportDataSize.HEIGHT;
	}

	getDescriptionTextUI() {
		return root.queryTextUI('extraexplanation_title');
	}
}

class SupportReciverEntityMode {

	static SELECT: any = 0;

	static QUESTION: any = 1;

	static EVENT: any = 2;
}

class SupportReciverEntity extends BaseObject {

	_senderUnit: any = null;

	_receiver: any = null;

	_scrollbar: any = null;

	_capsuleEvent: any = null;

	_questionWindow: any = null;

	_parentWindow: any = null;

	_baseMusicHandle: any = null;

	setParentData(senderUnit?, receiver?, parentWindow?) {
		this._senderUnit = senderUnit;
		this._receiver = receiver;
		
		this._scrollbar = createScrollbarObject(SupportRankScrollbar, this);
		// Row is fixed at 1. Because SupportReciverWindow detects up and down keys.
		this._scrollbar.setScrollFormation(this._getMaxCol(), 1);
		this._scrollbar.setObjectArray(receiver.eventArray);
		
		this._questionWindow = createScrollbarObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(this._getQuestionMessage());
		
		this._parentWindow = parentWindow;
		
		this._capsuleEvent = createObject(CapsuleEvent);
		
		this._baseMusicHandle = root.getMediaManager().getActiveMusicHandle();
	}

	startReciverEntity(isStart?) {
		// It's not enableSelectCursor.
		this._scrollbar.setActive(isStart);
		this.changeCycleMode(SupportReciverEntityMode.SELECT);
	}

	moveReciverEntity() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SupportReciverEntityMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === SupportReciverEntityMode.QUESTION) {
			result = this._moveQuestion();
		}
		else if (mode === SupportReciverEntityMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	}

	drawReciverEntity(x?, y?, isActive?) {
		this._drawCharChip(x, y, isActive);
		this._drawRank(x, y, isActive);
		this._drawName(x, y, isActive);
	}

	drawActiveReciverEntity() {
		if (this.getCycleMode() === SupportReciverEntityMode.QUESTION) {
			this._drawQuestion();
		}
	}

	getSubScrollbar() {
		return this._scrollbar;
	}

	_moveSelect() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			if (this._scrollbar.isEventEnabled(this._scrollbar.getObject())) {
				this._capsuleEvent.enterCapsuleEvent(this._scrollbar.getObject(), true);
				this.changeCycleMode(SupportReciverEntityMode.EVENT);
			}
			else {
				if (this._isQuestion()) {
					this._scrollbar.enableSelectCursor(false);
					this._questionWindow.setQuestionActive(true);
					this.changeCycleMode(SupportReciverEntityMode.QUESTION);
				}
				else {
					this._playOperationBlockSound();
				}
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._scrollbar.setForceSelect(-1);
			this._scrollbar.setActive(false);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._doQuestionEndAction();
				this._capsuleEvent.enterCapsuleEvent(this._scrollbar.getObject(), true);
				this.changeCycleMode(SupportReciverEntityMode.EVENT);
			}
			else {
				this._questionWindow.setQuestionActive(false);
				this._scrollbar.enableSelectCursor(true);
				this.changeCycleMode(SupportReciverEntityMode.SELECT);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._checkScreenMusic();
			this._scrollbar.enableSelectCursor(true);
			this.changeCycleMode(SupportReciverEntityMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawCharChip(x?, y?, isActive?) {
		var unit = this._getUnit();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var alpha = this._receiver.isEnabled ? 255 : 128;
		
		if (this._isReceiverDrawable()) {
			unitRenderParam.alpha = alpha;
			UnitRenderer.drawDefaultUnit(unit, x + 10, y + 10, unitRenderParam);
		}
	}

	_drawName(x?, y?, isActive?) {
		var length = 150;
		var textui = this._parentWindow.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var unit = this._getUnit();
		var name = this._receiver.isEnabled ? unit.getName() : StringTable.HideData_Question;
		
		TextRenderer.drawKeywordText(x + 220, y + 18, name, length, color, font);
	}

	_drawRank(x?, y?, isActive?) {
		x += 65;
		this._drawRankTitle(x, y - 3, '');
		this._scrollbar.drawScrollbar(x + 31, y + 15);
	}

	_drawRankTitle(x?, y?, title?) {
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y, title, color, font, TextFormat.LEFT, pic, this._getTitlePartsCount());
	}

	_getTextUI(x?, y?, title?) {
		return root.queryTextUI('supportrank_title');
	}

	_drawQuestion() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	}

	_isReceiverDrawable() {
		return true;
	}

	_getUnit() {
		if (this._senderUnit.getId() === this._receiver.unit1.getId()) {
			return this._receiver.unit2;
		}
		
		return this._receiver.unit1;
	}

	_getMaxCol() {
		return SupportReciverBuilder.getMaxRank();
	}

	_getTitlePartsCount() {
		return 3;
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}

	_isQuestion() {
		// If it's not SceneType.TITLE, use some cost to leave some space to view the event.
		return false;
	}

	_getQuestionMessage() {
		return '';
	}

	_doQuestionEndAction() {
	}

	_checkScreenMusic() {
		var handleActive = root.getMediaManager().getActiveMusicHandle();
		
		if (!this._baseMusicHandle.isEqualHandle(handleActive)) {
			MediaControl.musicStop(MusicStopType.BACK);
		}
	}
}

class SupportRankScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var alpha = this.isEventEnabled(object) ? 255 : 128;
		var colorIndex = 0;
		
		NumberRenderer.drawNumberColor(x, y, index + 1, colorIndex, alpha);
	}

	drawDescriptionLine(x?, y?) {
	}

	getObjectWidth() {
		var width = 38;
		
		if (this._col === 4) {
			width = 26;
		}
		else if (this._col === 5) {
			width = 19;
		}
		
		return width;
	}

	getObjectHeight() {
		return 24;
	}

	isEventEnabled(event?) {
		return root.getStoryPreference().isTestPlayPublic() || event.getExecutedMark() === EventExecutedType.EXECUTED;
	}
}

class SupportSenderWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = LayoutControl.getObjectVisibleCount(SupportDataSize.HEIGHT, 7);
		
		this._scrollbar = createScrollbarObject(SupportSenderScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
	}

	setSenderArray(objectArray?) {
		this._scrollbar.setObjectArray(objectArray);
	}

	moveWindowContent() {
		return this._scrollbar.moveInput();
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowTextUI() {
		return root.queryTextUI('supportlist_window');
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

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	getSender() {
		return this._scrollbar.getObject();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class SupportSenderScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength() - 40;
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = textui.getColor();
		var unit = object.unit;
		var alpha = 255;
		var name = unit.getName();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		
		if (!object.isEnabled) {
			name = StringTable.HideData_Question;
			alpha = 0;
		}
		
		unitRenderParam.alpha = alpha;
		UnitRenderer.drawDefaultUnit(unit, x + 10, y + 10, unitRenderParam);
		x += 60;
		y += 20;
		
		TextRenderer.drawKeywordText(x, y, name, length, color, font);
	}

	getDescriptionTextUI() {
		return root.queryTextUI('extraexplanation_title');
	}

	getObjectWidth() {
		var width = DefineControl.getTextPartsWidth() + 32;
		
		return DataConfig.isHighResolution() ? width + 16 : width;
	}

	getObjectHeight() {
		return SupportDataSize.HEIGHT;
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}

class SupportReciverBuilder {

	static _maxRank: any = 0;

	static createArray() {
		var i, event, info, unit1, unit2, rank, receiver;
		var list = root.getBaseData().getRecollectionEventList();
		var count = list.getCount();
		var receiverArray = [];
		
		// Build the recollection event as an array of receiver.
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			info = event.getRecollectionEventInfo();
			unit1 = info.getFirstUnit();
			unit2 = info.getSecondUnit();
			rank = info.getRank();
			
			if (unit1 === null || unit2 === null) {
				continue;
			}
			
			receiver = this._getReciver(unit1, unit2, receiverArray);
			if (receiver !== null) {
				// The receiver, which has used both unit1 and unit2, has already been created, so update only rank and event.
				receiver.rankArray.push(rank);
				receiver.eventArray.push(event);
			}
			else {
				receiver = {};
				receiver.isEnabled = false;
				receiver.unit1 = unit1;
				receiver.unit2 = unit2;
				receiver.rankArray = [];
				receiver.rankArray.push(rank);
				receiver.eventArray = [];
				receiver.eventArray.push(event);
				receiverArray.push(receiver);
			}
			
			if (this._maxRank < rank) {
				this._maxRank = rank;
			}
		}
		
		this._checkEvent(receiverArray);
		
		return receiverArray;
	}

	static getMaxRank() {
		if (this._maxRank > 5) {
			return 5;
		}
		
		if (this._maxRank < 3) {
			return 3;
		}
		
		return this._maxRank;
	}

	static _getReciver(unit1?, unit2?, receiverArray?) {
		var i, receiver;
		var count = receiverArray.length;

		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (this._compareUnit(receiver.unit1, unit1) && this._compareUnit(receiver.unit2, unit2)) {
				return receiver;
			}
			if (this._compareUnit(receiver.unit1, unit2) && this._compareUnit(receiver.unit2, unit1)) {
				return receiver;
			}
		}

		return null;
	}

	static _checkEvent(receiverArray?) {
		var i, receiver;
		var count = receiverArray.length;
		
		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (SupportUnitChecker.isRegistered(receiver.unit1) && SupportUnitChecker.isRegistered(receiver.unit2)) {
				receiver.isEnabled = true;
			}
		}
	}

	static _compareUnit(unit1?, unit2?) {
		if (unit1 === null || unit2 === null) {
			return false;
		}
		
		return unit1.getId() === unit2.getId();
	}
}

class SupportSenderBuilder {

	static createArray(receiverArray?) {
		var i, unit, sender;
		var senderArray = [];
		var list = this._getPlayerList();
		var count = list.getCount();
		
		// Build the unit as an array of sender.
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			// Check if there's something including the unit for  "Unit1" or "Unit2" of all recollection events.
			if (!this._checkUnit(unit, receiverArray)) {
				// There is no recollection event in associated with the unit, the unit is not included in the list.
				continue;
			}
			
			sender = {};
			sender.unit = unit;
			sender.receiverArray = [];
			senderArray.push(sender);
			
			// Specify the element in associated with the sender from receiverArray, and record it in sender.receiverArray.
			this._checkReciverArray(sender, receiverArray);
			
			sender.isEnabled = this._isSenderEnabled(sender);
		}
		
		return senderArray;
	}

	static _checkReciverArray(sender?, receiverArray?) {
		var i, receiver;
		var count = receiverArray.length;
		
		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (this._compareUnit(sender.unit, receiver.unit1) || this._compareUnit(sender.unit, receiver.unit2)) {
				sender.receiverArray.push(receiver);
			}
		}
	}

	static _checkUnit(unit?, receiverArray?) {
		var i, receiver;
		var count = receiverArray.length;
		
		for (i = 0; i < count; i++) {
			receiver = receiverArray[i];
			if (this._compareUnit(unit, receiver.unit1) || this._compareUnit(unit, receiver.unit2)) {
				return true;
			}
		}
		
		return false;
	}

	static _isSenderEnabled(sender?) {
		if (root.getBaseScene() === SceneType.TITLE) {
			// Check if the unit is registered at the environment file.
			// If it's not SceneType.TITLE, the unit belongs to the player, so return true without condition.
			if (!SupportUnitChecker.isRegistered(sender.unit)) {
				return false;
			}
		}
		
		return true;
	}

	static _compareUnit(unit1?, unit2?) {
		if (unit1 === null || unit2 === null) {
			return false;
		}
		
		return unit1.getId() === unit2.getId();
	}

	static _getPlayerList() {
		return root.getBaseScene() === SceneType.TITLE ? root.getBaseData().getPlayerList() : PlayerList.getMainList();
	}
}

class SupportUnitChecker {

	static isRegistered(unit?) {
		return root.getStoryPreference().isTestPlayPublic() || root.getExternalData().isUnitRegistered(unit);
	}
}
