
class TitleSceneMode {

	static FLOW: any = 0;

	static BLACKIN: any = 1;

	static SELECT: any = 2;

	static OPEN: any = 3;
}

class TitleScene extends BaseScene {

	_commandArray: any = null;

	_scrollbar: any = null;

	_transition: any = null;

	_straightFlow: any = null;

	_scrollBackground: any = null;

	setSceneData() {
		// Paint to brighten the screen gradually.
		SceneManager.setEffectAllRange(true);
		
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === TitleSceneMode.FLOW) {
			result = this._moveFlow();
		}
		else if (mode === TitleSceneMode.BLACKIN) {
			result = this._moveBlackin();
		}
		else if (mode === TitleSceneMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === TitleSceneMode.OPEN) {
			result = this._moveOpen();
		}
		
		this._moveCommonAnimation();
		
		return result;
	}

	moveBackSceneCycle() {
		var mode = this.getCycleMode();
		
		if (mode === TitleSceneMode.FLOW) {
			this._straightFlow.moveBackStraightFlow();
		}
		
		this._moveCommonAnimation();
		
		return MoveResult.CONTINUE;
	}

	drawSceneCycle() {
		var mode = this.getCycleMode();
		
		if (mode === TitleSceneMode.FLOW) {
			this._straightFlow.drawStraightFlow();
			return;
		}
		else if (mode === TitleSceneMode.BLACKIN) {
			this._transition.drawTransition();
		}
		
		this._drawBackground();
		this._drawLogo();
		this._drawScrollbar();
		
		if (mode === TitleSceneMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === TitleSceneMode.OPEN) {
			this._drawOpen();
		}
	}

	_prepareSceneMemberData() {
		this._commandArray = [];
		this._scrollbar = createScrollbarObject(TitleScreenScrollbar, this);
		this._transition = createObject(SystemTransition);
		this._straightFlow = createObject(StraightFlow);
		this._scrollBackground = createObject(ScrollBackground);
	}

	_completeSceneMemberData() {
		this._configureTitleItem(this._commandArray);
		
		this._scrollbar.setScrollFormation(1, this._commandArray.length);
		this._scrollbar.setObjectArray(this._commandArray);
		this._setFirstIndex();
		
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		this._straightFlow.enterStraightFlow();
		
		this._setBackgroundData();
		
		this.changeCycleMode(TitleSceneMode.FLOW);
	}

	_setBackgroundData() {
		var pic = root.getSceneController().getSceneBackgroundImage(SceneType.TITLE);
		
		this._scrollBackground.startScrollBackground(pic);
	}

	_setFirstIndex() {
		var index;
		
		if (this._scrollbar.getObjectCount() === 0) {
			return;
		}
		
		// If there is a save file even one file, "Continue" is default.
		if (root.getLoadSaveManager().getSaveFileCount() > 0) {
			index = this._getIndexFromCommandAction(CommandActionType.CONTINUE);
		}
		else {
			index = this._getIndexFromCommandAction(CommandActionType.NEWGAME);
		}
		
		this._scrollbar.setIndex(index);
	}

	_getIndexFromCommandAction(commandActionType?) {
		var i, commandLayout;
		var count = this._scrollbar.getObjectCount();
		
		for (i = 0; i < count; i++) {
			commandLayout = this._scrollbar.getObjectFromIndex(i).getCommandLayout();
			if (commandLayout.getCommandActionType() === commandActionType) {
				return i;
			}
		}
		
		return 0;
	}

	_moveFlow() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			MediaControl.musicPlayNew(root.querySoundHandle('titlemusic'));
			
			this._transition.setFadeSpeed(this._getChangeSpeed());
			this._transition.setDestIn();
			this.changeCycleMode(TitleSceneMode.BLACKIN);
		}
	}

	_moveBlackin() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this._scrollbar.setActive(true);
			this.changeCycleMode(TitleSceneMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelect() {
		var object;
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			object = this._scrollbar.getObject();
			if (object !== null && object.isSelectable()) {
				object.openCommand();
				this.changeCycleMode(TitleSceneMode.OPEN);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveOpen() {
		var object = this._scrollbar.getObject();
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._scrollbar.setActive(true);
			this.changeCycleMode(TitleSceneMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCommonAnimation() {
		this._scrollBackground.moveScrollBackground();
	}

	_getChangeSpeed() {
		return 8;
	}

	_drawSelect() {
	}

	_drawOpen() {
		var object;
		
		object = this._scrollbar.getObject();
		object.drawCommand();
	}

	_drawBackground() {
		this._scrollBackground.drawScrollBackground();
	}

	_drawLogo() {
		var x, y;
		var pic = root.queryUI('gamelogo_frame');
		
		if (pic !== null) {
			x = LayoutControl.getRelativeY(8) - 60;
			y = LayoutControl.getRelativeY(6) - 40;
			pic.draw(x, y);
		}
	}

	_drawScrollbar() {
		var x, y;
		var width = this._scrollbar.getScrollbarWidth();
		var height = this._scrollbar.getScrollbarHeight();
		var dx = LayoutControl.getRelativeX(8) - 60;
		var dy = LayoutControl.getRelativeY(7);
		
		x = root.getGameAreaWidth() - width - dx;
		y = root.getGameAreaHeight() - height - dy;
		this._scrollbar.drawScrollbar(x, y);
	}

	_configureTitleItem(groupArray?) {
		var mixer = createObject(CommandMixer);
		
		mixer.pushCommand(TitleCommand.NewGame, CommandActionType.NEWGAME);
		mixer.pushCommand(TitleCommand.Continue, CommandActionType.CONTINUE);
		mixer.pushCommand(TitleCommand.EndGame, CommandActionType.ENDGAME);
		
		mixer.mixCommand(CommandLayoutType.TITLE, groupArray, BaseTitleCommand);
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(DemoFlowEntry);
	}
}

class TitleScreenScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var text = object.getCommandName();
		var textui = this.getScrollTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		if (!object.isSelectable()) {
			color = ColorValue.DISABLE;
		}
		
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, this._getTitlePartsCount());
	}

	drawDescriptionLine(x?, y?) {
	}

	playSelectSound() {
		var object = this.getObject();
		
		if (object !== null && object.isSelectable()) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	playCancelSound() {
	}

	getObjectWidth() {
		return (this._getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth();
	}

	getObjectHeight() {
		return 45;
	}

	getScrollTextUI() {
		return root.queryTextUI('openingcommand_title');
	}

	_getTitlePartsCount() {
		return 5;
	}
}

class BaseTitleCommand extends BaseCommand {

	openCommand() {
	}

	moveCommand() {
		return MoveResult.END;
	}

	drawCommand() {
	}

	isSelectable() {
		return true;
	}
}

class NewGameMode {

	static BLACKOUT: any = 0;

	static FLOW: any = 1;
}

namespace TitleCommand {
export class NewGame extends BaseTitleCommand {

	_transition: any = null;

	_straightFlow: any = null;

	openCommand() {
		this._createSubObject();
		this.changeCycleMode(NewGameMode.BLACKOUT);
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === NewGameMode.BLACKOUT) {
			result = this._moveBlackOut();
		}
		else if (mode === NewGameMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === NewGameMode.BLACKOUT) {
			this._drawBlackOut();
		}
		else if (mode === NewGameMode.FLOW) {
			this._drawFlow();
		}
	}

	isSelectable() {
		return true;
	}

	_createSubObject() {
		this._transition = createObject(FadeTransition);
		this._transition.setDestOut();
		this._transition.setFadeSpeed(5);
		
		this._straightFlow = createObject(StraightFlow);
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
	}

	_moveBlackOut() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			if (!this._changeFlow()) {
				this._doEndAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveFlow() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawBlackOut() {
		this._transition.drawTransition();
	}

	_drawFlow() {
		this._straightFlow.drawStraightFlow();
	}

	_changeFlow() {
		if (this._straightFlow.enterStraightFlow() === EnterResult.NOTENTER) {
			return false;
		}
		
		this.changeCycleMode(NewGameMode.FLOW);
		
		return true;
	}

	_doEndAction() {
		MediaControl.resetMusicList();
		
		// If this method is called, root.changeScene(SceneType.BATTLESETUP) is called inside.
		root.getSceneController().newGame();
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(DifficultyFlowEntry);
		straightFlow.pushFlowEntry(ClearPointFlowEntry);
	}
}

export class Continue extends BaseTitleCommand {

	_loadSaveScreen: any = null;

	openCommand() {
		var screenParam = this._createLoadSaveParam();
		
		this._loadSaveScreen = createObject(LoadSaveControl.getLoadScreenObject());
		SceneManager.addScreen(this._loadSaveScreen, screenParam);
	}

	moveCommand() {
		if (SceneManager.isScreenClosed(this._loadSaveScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	isSelectable() {
		return root.getLoadSaveManager().getSaveFileCount() > 0;
	}

	_createLoadSaveParam() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = true;
		
		return screenParam;
	}
}

export class EndGame extends BaseTitleCommand {

	openCommand() {
	}

	moveCommand() {
		// endGame can be called with openCommand, but it sounds as if the sound effect is interrupted.
		root.endGame();
		return MoveResult.END;
	}

	isSelectable() {
		return true;
	}
}
}

class DemoFlowEntry extends BaseFlowEntry {
	_prevSoundIndex: any;


	_demoMapEvent: any = null;

	enterFlowEntry(titleScene?) {
		this._prepareMemberData(titleScene);
		return this._completeMemberData(titleScene);
	}

	moveFlowEntry() {
		if (this._demoMapEvent.moveDemoMapEvent() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	moveBackFlowEntry() {
		// Demo is supposed to be played automatically,
		// the pressing the decision key is treated as the event ends.
		if (InputControl.isSelectAction()) {
			root.setEventSkipMode(true);
		}
		
		this._demoMapEvent.backDemoMapEvent();
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._demoMapEvent.drawDemoMapEvent();
	}

	_prepareMemberData(titleScene?) {
		this._demoMapEvent = createObject(DemoMapEvent);
	}

	_completeMemberData(titleScene?) {
		var result;
		
		this._enableSoundVolume(false);
		
		result = this._demoMapEvent.enterDemoMapEvent(this._getMapId());
		if (result === EnterResult.NOTENTER) {
			this._doEndAction();
		}
		
		return result;
	}

	_doEndAction() {
		this._enableSoundVolume(true);
	}

	_getMapId() {
		return DataConfig.getDemoMapId();
	}

	_enableSoundVolume(isOn?) {
		var arr;
		
		if (DataConfig.isDemoMapSoundEnabled()) {
			// If the sound effect is enabled with a demo map, no processing is continued.
			return;
		}
		
		if (isOn) {
			arr = this._getSoundVolumeArray();
			root.getMediaManager().setSoundVolume(arr[this._prevSoundIndex]);
		}
		else {
			this._prevSoundIndex = (new ConfigItem.SoundEffect()).getFlagValue();
			root.getMediaManager().setSoundVolume(0);
		}
	}

	_getSoundVolumeArray() {
		return (new ConfigItem.SoundEffect()).getVolumeArray();
	}
}

class DifficultyFlowEntry extends BaseFlowEntry {

	_messageAnalyzer: any = null;

	_scrollbar: any = null;

	_difficultyIndex: any = 0;

	_difficultyArray: any = null;

	enterFlowEntry(newGameCommand?) {
		this._prepareMemberData(newGameCommand);
		
		if (!this._isDifficultyEnabled()) {
			this._startSession(0);
			return EnterResult.NOTENTER;
		}
		
		return this._completeMemberData(newGameCommand);
	}

	moveFlowEntry() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this._startSession(this._scrollbar.getIndex());
			return MoveResult.END;
		}
		else if (input === ScrollbarInput.NONE) {
			this._checkIndexAndText();
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		var pic  = this.getWindowTextUI().getUIImage();
		var width = this._getWindowWidth();
		var height = this._getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		root.getGraphicsManager().fill(0x0);
		
		WindowRenderer.drawStretchWindow(x, y, width, height, pic);
		
		x += DefineControl.getWindowXPadding();
		y += DefineControl.getWindowYPadding();
		this._drawContent(x, y);
	}

	getWindowTextUI() {
		return root.queryTextUI('single_window');
	}

	_prepareMemberData(newGameCommand?) {
		this._scrollbar = createScrollbarObject(DifficultyScrollbar, this);
		this._createMessageAnalyzer();
		this._createDifficultyArray();
	}

	_completeMemberData(newGameCommand?) {
		this._setScrollbarData();
		this._checkIndexAndText();
		
		return EnterResult.OK;
	}

	_isDifficultyEnabled() {
		// If the several difficulties exist, it can be selected.
		return this._difficultyArray.length > 1;
	}

	_startSession(index?) {
		var difficulty = this._difficultyArray[index];
		
		root.getSceneController().initializeMetaSession(difficulty);
	}

	_getWindowWidth() {
		return 450;
	}

	_getWindowHeight() {
		return 200;
	}

	_createMessageAnalyzer() {
		var messageAnalyzerParam = this._createMessageAnalyzerParam();
		
		this._messageAnalyzer = createObject(MessageAnalyzer);
		this._messageAnalyzer.setMessageAnalyzerParam(messageAnalyzerParam);
		this._messageAnalyzer.setMaxRowCount(3);
	}

	_createMessageAnalyzerParam() {
		var textui = this.getWindowTextUI();
		var messageAnalyzerParam = StructureBuilder.buildMessageAnalyzerParam();
		
		messageAnalyzerParam.color = ColorValue.INFO;
		messageAnalyzerParam.font = textui.getFont();
		messageAnalyzerParam.messageSpeedType = SpeedType.DIRECT;
		
		return messageAnalyzerParam;
	}

	_createDifficultyArray() {
		var i, difficulty;
		var list = root.getBaseData().getDifficultyList();
		var count = list.getCount();
		
		this._difficultyArray = [];
		
		for (i = 0; i < count; i++) {
			difficulty = list.getData(i);
			if (difficulty.isGlobalSwitchOn()) {
				this._difficultyArray.push(difficulty);
			}
		}
		
		if (this._difficultyArray.length === 0) {
			difficulty = list.getData(0);
			this._difficultyArray.push(difficulty);
		}
	}

	_setScrollbarData() {
		var max = this._getVisibleCount();
		var count = this._difficultyArray.length;
		
		if (count > max) {
			count = max;
		}
		
		this._scrollbar.setScrollFormation(count, 1);
		this._scrollbar.setObjectArray(this._difficultyArray);
		this._scrollbar.setActive(true);
	}

	_checkIndexAndText() {
		var text;
		
		if (this._scrollbar.checkAndUpdateIndex()) {
			text = this._scrollbar.getObject().getDescription();
			this._messageAnalyzer.setMessageAnalyzerText(text);
		}
	}

	_drawContent(x?, y?) {
		this._drawTitleArea(x, y);
		this._drawDifficultyArea(x, y);
		this._drawDivisionLine(x, y);
		this._drawDescriptionArea(x, y);
	}

	_drawTitleArea(x?, y?) {
		var text = this._getSelectMessage();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var range = createRangeObject(x - 16, y, this._getWindowWidth(), 23);
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
	}

	_drawDifficultyArea(x?, y?) {
		var width = this._getWindowWidth() - this._scrollbar.getScrollbarWidth();
		var dx = Math.floor(width / 2) - DefineControl.getWindowXPadding();
		
		this._scrollbar.drawScrollbar(x + dx, y + 50);
	}

	_drawDescriptionArea(x?, y?) {
		y += 50;
		y += this._scrollbar.getScrollbarHeight() + 10;
		
		this._messageAnalyzer.drawMessageAnalyzer(x, y, -1, -1, null);
	}

	_drawDivisionLine(x?, y?) {
		var textui = root.queryTextUI('description_title');
		var pic = textui.getUIImage();
		var count = Math.floor(this._getWindowWidth() / 30) - 3;
		
		TitleRenderer.drawTitle(pic, x, y, TitleRenderer.getTitlePartsWidth(), TitleRenderer.getTitlePartsHeight(), count);
	}

	_getSelectMessage() {
		return StringTable.GameStart_DifficultySelect;
	}

	_getVisibleCount() {
		return 4;
	}
}

class DifficultyScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		var range = createRangeObject(x, y, length, this.getObjectHeight());
		
		this._drawRange(range, isSelect, index);
		TextRenderer.drawRangeText(range, TextFormat.CENTER, object.getName(), length, color, font);
	}

	drawDescriptionLine(x?, y?) {
	}

	playCancelSound() {
	}

	getObjectWidth() {
		return DefineControl.getTextPartsWidth() - 32;
	}

	getObjectHeight() {
		return DefineControl.getTextPartsHeight();
	}

	_drawRange(range?, isSelect?, index?) {
		// root.getGraphicsManager().fillRange(range.x, range.y, range.width, range.height, 0xffffff - (index * 8000), 128);
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}

class ClearPointMode {

	static INFO: any = 0;

	static QUESTION: any = 1;

	static SCREEN: any = 2;
}

class ClearPointFlowEntry extends BaseFlowEntry {

	_infoWindow: any = null;

	_questionWindow: any = null;

	_pointLayoutScreen: any = null;

	enterFlowEntry(newGameCommand?) {
		if (!this._isScreenDisplayable()) {
			return EnterResult.NOTENTER;
		}
		
		this._prepareMemberData(newGameCommand);
		return this._completeMemberData(newGameCommand);
	}

	moveFlowEntry() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === ClearPointMode.INFO) {
			result = this._moveInfo();
		}
		else if (mode === ClearPointMode.QUESTION) {
			result = this._moveQuestion();
		}
		else if (mode === ClearPointMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		root.getGraphicsManager().fill(0x0);
		
		if (mode === ClearPointMode.INFO) {
			this._drawInfo();
		}
		else if (mode === ClearPointMode.QUESTION) {
			this._drawQuestion();
		}
		else if (mode === ClearPointMode.SCREEN) {
			this._drawScreen();
		}
	}

	_prepareMemberData(newGameCommand?) {
		this._infoWindow = createWindowObject(InfoWindow, this);
		this._questionWindow = createWindowObject(QuestionWindow, this);
	}

	_completeMemberData(newGameCommand?) {
		var point = root.getExternalData().getGameClearPoint();
		var text = StringTable.GameStart_ClearPointDescription + point + StringTable.CurrencySign_Point;
		
		this._infoWindow.setInfoMessageAndType(text, InfoWindowType.INFORMATION);
		
		this.changeCycleMode(ClearPointMode.INFO);
		
		return EnterResult.OK;
	}

	_moveInfo() {
		if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._isInfoDisplayable()) {
				this._questionWindow.setQuestionMessage(StringTable.GameStart_ClearPointQuestion);
				this._questionWindow.setQuestionActive(true);
				this.changeCycleMode(ClearPointMode.QUESTION);
			}
			else {
				this._checkScreen();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveQuestion() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._checkScreen();
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveScreen() {
		if (SceneManager.isScreenClosed(this._pointLayoutScreen)) {
			this._savePoint();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawInfo() {
		var x = LayoutControl.getCenterX(-1, this._infoWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._infoWindow.getWindowHeight());
		
		this._infoWindow.drawWindow(x, y);
	}

	_drawQuestion() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		this._questionWindow.drawWindow(x, y);
	}

	_drawScreen() {
	}

	_savePoint() {
		var type = root.getBaseData().getClearPointType();
		
		if (type === ClearPointType.CARRYOVER) {
			root.getExternalData().setGameClearPoint(this._pointLayoutScreen.getGold());
		}
		else if (type === ClearPointType.ZERO) {
			root.getExternalData().setGameClearPoint(0);
		}
	}

	_checkScreen() {
		var screenParam = this._createScreenParam();
		
		this._resetMusic(screenParam);
		
		// If the background is set on the screen, it can be switched smoothly.
		SceneManager.setEffectAllRange(true);
		
		this._pointLayoutScreen = createObject(PointLayoutScreen);
		this._pointLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._pointLayoutScreen, screenParam);
		
		this.changeCycleMode(ClearPointMode.SCREEN);
		
		return true;
	}

	_resetMusic(screenParam?) {
		var interop = screenParam.shopLayout.getShopInteropData();
		
		if (!interop.getScreenMusicHandle().isNullHandle()) {
			// If the background music is set on the screen, don't restore when closing the screen.
			MediaControl.resetMusicList();
		}
	}

	_isInfoDisplayable() {
		return false;
	}

	_isScreenDisplayable() {
		var shopData = this._getShopData();
		
		if (shopData.getShopItemArray().length === 0) {
			return false;
		}
		
		// root.getSceneController().initializeMetaSession is called in DifficultyFlowEntry, which is executed before ClearPointFlowEntry.
		// This means that difficulty data is initialized within game.exe, so it can be retrieved with root.getMetaSession.
		if (!(root.getMetaSession().getDifficulty().getDifficultyOption() & DifficultyFlag.NEWGAMEPLUS)) {
			return false;
		}
		
		// The game has been cleared if value is greater than 0.
		return root.getExternalData().getGameClearPoint() > 0;
	}

	_getShopData() {
		return root.getBaseData().getPointShop();
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildBonusLayout();
		var shopData = this._getShopData();
		
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.bonusArray = shopData.getBonusNumberArray();
		
		return screenParam;
	}
}
