
class QuestScreenMode {

	static AUTOEVENTCHECK: any = 0;

	static SELECT: any = 1;

	static EVENT: any = 2;

	static QUESTION: any = 3;
}

class QuestScreen extends BaseScreen {

	_eventChecker: any = null;

	_questListWindow: any = null;

	_questDetailWindow: any = null;

	_questionWindow: any = null;

	_questEntryArray: any = null;

	_capsuleEvent: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === QuestScreenMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === QuestScreenMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === QuestScreenMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === QuestScreenMode.QUESTION) {
			result = this._moveQuestion();
		}
		
		return result;
	}

	drawScreenCycle() {
		var width = this._questListWindow.getWindowWidth() + this._questDetailWindow.getWindowWidth();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, this._questListWindow.getWindowHeight());
		
		this._questListWindow.drawWindow(x, y);
		this._questDetailWindow.drawWindow(x + this._questListWindow.getWindowWidth(), y);
		
		if (this.getCycleMode() === QuestScreenMode.QUESTION) {
			this._drawQuestionWindow();
		}
	}

	drawScreenBottomText(textui?) {
		var text;
		var entry = this.getCurrentQuestEntry();
		
		if (entry.isVisible) {
			text = entry.data.getDescription();
		}
		else {
			text = '';
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('Quest');
	}

	getCurrentQuestEntry() {
		return this._questEntryArray[this._questListWindow.getQuestListIndex()];
	}

	_prepareScreenMemberData(screenParam?) {
		this._eventChecker = createObject(RestAutoEventChecker);
		this._questListWindow = createWindowObject(QuestListWindow, this);
		this._questDetailWindow = createWindowObject(QuestDetailWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeScreenMemberData(screenParam?) {
		this._questEntryArray = this._getQuestArray();
		
		this._questListWindow.setWindowData();
		this._questListWindow.setQuestEntryArray(this._questEntryArray);
		
		this._questionWindow.setQuestionMessage(StringTable.Quest_Select);
		
		this._questDetailWindow.setQuestData(this._questEntryArray[0].data);
		this._questDetailWindow.setSize(Math.floor(this._questListWindow.getWindowHeight() * 1.2), this._questListWindow.getWindowHeight());
		
		this._changeEventMode();
	}

	_getQuestArray() {
		var i, quest, entry;
		var arr = [];
		var list = root.getBaseData().getRestQuestList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			quest = list.getData(i);
			if (!quest.isQuestDisplayable()) {
				continue;
			}
			
			entry = StructureBuilder.buildListEntry();
			
			entry.isAvailable = quest.isQuestAvailable();
			entry.isVisible = entry.isAvailable || !quest.isPrivateQuest();
			if (entry.isVisible) {
				entry.name = quest.getName();
			}
			else {
				entry.name = StringTable.HideData_Question;
			}
			entry.data = quest;
			
			arr.push(entry);
		}
		
		return arr;
	}

	_moveAutoEventCheck() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this.changeCycleMode(QuestScreenMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelect() {
		var input = this._questListWindow.moveWindow();
		
		if (input === ScrollbarInput.SELECT) {
			this._startQuestEvent();
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		else {
			if (this._questListWindow.isIndexChanged()) {
				this._questDetailWindow.setQuestData(this._questEntryArray[this._questListWindow.getQuestListIndex()].data);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this._startQuestion();
			return MoveResult.CONTINUE;
		}
		
		return result;
	}

	_moveQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._startQuestMap();
				return (MoveResult as any).CONTIUNE; // NOTE (JS->TS): typo in original - elsewhere in this file it's CONTINUE
			}
			else {
				this._questListWindow.enableSelectCursor(true);
				this._changeSelectMode();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_drawQuestionWindow() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	}

	_startQuestEvent() {
		var event = this._getPlaceEvent();
		var isExecuteMark = false;
		
		this._capsuleEvent.enterCapsuleEvent(event, isExecuteMark);
		this._questListWindow.enableSelectCursor(false);
		this.changeCycleMode(QuestScreenMode.EVENT);
	}

	_startQuestion() {
		if (this.getCurrentQuestEntry().isAvailable) {
			this.changeCycleMode(QuestScreenMode.QUESTION);
			this._questionWindow.setQuestionActive(true);
		}
		else {
			this._questListWindow.enableSelectCursor(true);
			this._changeSelectMode();
		}
	}

	_startQuestMap() {
		var quest = this.getCurrentQuestEntry().data;
		var map = quest.getFreeMap();
		
		root.getSceneController().startNewMap(map.getId());
		
		root.changeScene(SceneType.BATTLESETUP);
	}

	_getPlaceEvent() {
		var event;
		var entry = this.getCurrentQuestEntry();
		var quest = entry.data;
		
		if (entry.isAvailable) {
			event = quest.getEnabledEvent();
		}
		else {
			event = quest.getDisabledEvent();
		}
		
		return event;
	}

	_changeSelectMode() {
		this.changeCycleMode(QuestScreenMode.SELECT);
	}

	_changeEventMode() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.QUEST);
		if (result === EnterResult.NOTENTER) {
			this.changeCycleMode(QuestScreenMode.SELECT);
		}
		else {
			this.changeCycleMode(QuestScreenMode.AUTOEVENTCHECK);
		}
	}
}

class QuestListWindow extends BaseWindow {

	_scrollbar: any = null;

	setWindowData() {
		var count = LayoutControl.getObjectVisibleCount(DefineControl.getTextPartsHeight(), 12);
		
		this._scrollbar = createScrollbarObject(QuestListScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setActive(true);
	}

	setQuestEntryArray(objectArray?) {
		this._scrollbar.setObjectArray(objectArray);
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

	getQuestListIndex() {
		return this._scrollbar.getIndex();
	}

	isIndexChanged() {
		return this._scrollbar.checkAndUpdateIndex();
	}

	enableSelectCursor(isActive?) {
		this._scrollbar.enableSelectCursor(isActive);
	}
}

class QuestListScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var dx = 0;
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var font = textui.getFont();
		var color = object.isAvailable ? textui.getColor() : ColorValue.DISABLE;
		var handle = object.data.getIconResourceHandle();
		
		if (object.isVisible) {
			if (!handle.isNullHandle()) {
				dx = GraphicsFormat.ICON_WIDTH + 6;
				GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
			}
		}
		
		TextRenderer.drawKeywordText(x + dx, y, object.name, length, color, font);
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = true;
		
		if (!object.isVisible) {
			isSelect = false;
		}
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	getObjectWidth() {
		return DefineControl.getTextPartsWidth() + GraphicsFormat.ICON_WIDTH;
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}

class QuestDetailWindow extends BaseWindow {

	_picCache: any = null;

	_quest: any = null;

	_groupArray: any = null;

	_width: any = null;

	_height: any = null;

	setSize(width?, height?) {
		this._width = width;
		this._height = height;
	}

	setQuestData(quest?) {
		var i, count;
		
		this._quest = quest;
		
		this._picCache = null;
		
		this._groupArray = [];
		this._configureSentence(this._groupArray);
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].setParentWindow(this);
			this._groupArray[i].setCalculatorValue(this._quest);
		}
	}

	moveWindowContent() {
		var i, count;
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].moveQuestSentence();
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var isPrivate = false;
		
		if (this._quest === null) {
			isPrivate = true;
		}
		else if (!this._quest.isQuestAvailable()) {
			isPrivate = this._quest.isPrivateQuest();
		}
		
		if (isPrivate) {
			this._drawEmptyMap(x, y);
			this._drawEmptySentence(x, y);
		}
		else {
			this._drawThumbnailMap(x, y);
			this._drawSentenceZone(x, y);
		}
	}

	getQuestSentenceSpaceY() {
		return 38;
	}

	getTitlePartsCount() {
		return 5;
	}

	getWindowWidth() {
		return this._width;
	}

	getWindowHeight() {
		return this._height;
	}

	getWindowTextUI() {
		return root.queryTextUI('face_window');
	}

	_drawThumbnailMap(x?, y?) {
		var mapData = this._quest.getFreeMap();
		var cacheWidth = mapData.getMapWidth() * GraphicsFormat.MAPCHIP_WIDTH;
		var cacheHeight = mapData.getMapHeight() * GraphicsFormat.MAPCHIP_HEIGHT;
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var graphicsManager = root.getGraphicsManager();
		var alpha = this._getMapAlpha();
		
		if (this._picCache !== null) {
			if (this._picCache.isCacheAvailable()) {
				this._picCache.setAlpha(alpha);
				this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
				return;
			}
		}
		else {
			this._picCache = graphicsManager.createCacheGraphics(cacheWidth, cacheHeight);
		}
		
		graphicsManager.setRenderCache(this._picCache);
		root.drawMapAll(mapData);
		graphicsManager.resetRenderCache();
		
		this._picCache.setAlpha(alpha);
		this._picCache.drawStretchParts(x, y, width, height, 0, 0, cacheWidth, cacheHeight);
	}

	_drawSentenceZone(x?, y?) {
		var i;
		var count = this._groupArray.length;
		
		x = (x + this._width) - ((this.getTitlePartsCount() + 3) * TitleRenderer.getTitlePartsWidth());
		y += 5;
		for (i = 0; i < count; i++) {
			this._groupArray[i].drawQuestSentence(x, y);
			y += this._groupArray[i].getQuestSentenceCount() * this.getQuestSentenceSpaceY();
		}
	}

	_drawEmptyMap(x?, y?) {
		var textui = root.queryTextUI('default_window');
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var width = this.getWindowWidth() - (DefineControl.getWindowXPadding() * 2);
		var height = this.getWindowHeight() - (DefineControl.getWindowYPadding() * 2);
		var range = createRangeObject(x, y, width, height);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, StringTable.HideData_Unknown, -1, color, font);
	}

	_drawEmptySentence(x?, y?) {
	}

	_getMapAlpha() {
		return 200;
	}

	_configureSentence(groupArray?) {
		if (root.getRestPreference().isEnemyTotalEnabled()) {
			groupArray.appendObject(QuestSentence.EnemyTotal);
		}
		if (root.getRestPreference().isEnemyAverageLevelEnabled()) {
			groupArray.appendObject(QuestSentence.EnemyAverageLevel);
		}
		groupArray.appendObject(QuestSentence.Reward);
	}
}

class BaseQuestSentence extends BaseObject {

	_detailWindow: any = null;

	setParentWindow(detailWindow?) {
		this._detailWindow = detailWindow;
	}

	setCalculatorValue(quest?) {
	}

	moveQuestSentence() {
		return MoveResult.CONTINUE;
	}

	drawQuestSentence(x?, y?) {
	}

	getQuestSentenceCount() {
		return 1;
	}

	_drawNumberAndText(x?, y?, text?, number?, colorIndex?) {
		var pos;
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		pos = this._getTextPos();
		TextRenderer.drawKeywordText(x + pos.x, y + pos.y, text, -1, color, font);
		
		pos = this._getNumberPos();
		NumberRenderer.drawNumberColor(x + this._getNumberSpace() + pos.x, y + pos.y, number, colorIndex, 255);
	}

	_drawTitle(x?, y?) {
		var textui = this._getSentenceTextUI();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var pic = textui.getUIImage();
		
		TitleRenderer.drawTitle(pic, x, y, width, height, this._detailWindow.getTitlePartsCount());
	}

	_getSentenceTextUI() {
		return root.queryTextUI('questreward_title');
	}

	_getNumberColorIndex() {
		return 3;
	}

	_getNumberSpace() {
		return 186;
	}

	_getTextPos() {
		return createPos(8, 19);
	}

	_getNumberPos() {
		return createPos(0, 19);
	}
}

class QuestRewardType {

	static ITEM: any = 0;

	static GOLD: any = 1;

	static BONUS: any = 2;

	static TEXT: any = 3;
}

namespace QuestSentence {
export class EnemyTotal extends BaseQuestSentence {

	_value: any = 0;

	setCalculatorValue(quest?) {
		var list = quest.getFreeMap().getListFromUnitGroup(UnitGroup.ENEMY);
		
		this._value = list.getCount();
	}

	drawQuestSentence(x?, y?) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_EnemyTotal, this._value, this._getNumberColorInex());
	}

	_getNumberColorInex() {
		return 3;
	}
}

export class EnemyAverageLevel extends BaseQuestSentence {

	_value: any = 0;

	setCalculatorValue(quest?) {
		var i, unit;
		var list = quest.getFreeMap().getListFromUnitGroup(UnitGroup.ENEMY);
		var count = list.getCount();
		var totalLevel = 0;
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			totalLevel += unit.getLv();
		}
		
		this._value = Math.floor(totalLevel / count);
	}

	drawQuestSentence(x?, y?) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_AverageLevel, this._value, this._getNumberColorInex());
	}

	_getNumberColorInex() {
		return 3;
	}
}

export class Reward extends BaseQuestSentence {

	_arr: any = null;

	setCalculatorValue(quest?) {
		var i, reward;
		var list = quest.getRewardList();
		var count = list.getCount();
		
		this._arr = [];
		
		for (i = 0; i < count; i++) {
			reward = list.getData(i);
			if (this._isRewardEnabled(reward)) {
				this._arr.push(reward);
			}
		}
	}

	drawQuestSentence(x?, y?) {
		var i;
		var count = this._arr.length;
		
		for (i = 0; i < count; i++) {
			this._drawReward(x, y, this._arr[i]);
			y += this._detailWindow.getQuestSentenceSpaceY();
		}
	}

	getQuestSentenceCount() {
		return this._arr.length;
	}

	_drawReward(x?, y?, reward?) {
		var type = reward.getType();
		
		if (type === QuestRewardType.ITEM) {
			this._drawItem(x, y, reward);
		}
		else if (type === QuestRewardType.GOLD) {
			this._drawGold(x, y, reward);
		}
		else if (type === QuestRewardType.BONUS) {
			this._drawBonus(x, y, reward);
		}
		else if (type === QuestRewardType.TEXT) {
			this._drawText(x, y, reward);
		}
	}

	_drawItem(x?, y?, reward?) {
		var textui = this._getSentenceTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		this._drawTitle(x, y);
		y += 10;
		ItemRenderer.drawItem(x + 8, y + 8, reward.getItem(), color, font, false);
		TextRenderer.drawKeywordText(x + this._getKeywordSpace(), y - 3, StringTable.Quest_GetItem, -1, ColorValue.KEYWORD, font);
	}

	_drawGold(x?, y?, reward?) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_GetGold, reward.getGold(), this._getNumberColorInex());
	}

	_drawBonus(x?, y?, reward?) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, StringTable.Quest_GetBonus, reward.getBonus(), this._getNumberColorInex()); 
	}

	_drawText(x?, y?, reward?) {
		this._drawTitle(x, y);
		this._drawNumberAndText(x, y, reward.getText(), reward.getValue(), reward.getNumberColorIndex());
	}

	_getNumberColorInex() {
		return 1;
	}

	_getKeywordSpace() {
		return 168;
	}

	_isRewardEnabled(reward?) {
		// If the item is specified with variable, it cannot not be obtained sometimes.
		if (reward.getType() === QuestRewardType.ITEM && reward.getItem() === null) {
			return false;
		}
		
		return true;
	}
}
}
