
class RestSceneMode {

	static OPENING: any = 0;

	static AUTOEVENTCHECK: any = 1;

	static SELECT: any = 2;

	static ENDING: any = 3;
}

class RestScene extends BaseScene {

	_restCommandManager: any = null;

	_eventChecker: any = null;

	_scrollBackground: any = null;

	_straightFlowOpening: any = null;

	_straightFlowEnding: any = null;

	_isRestFinal: any = false;

	_isBackgroundEnabled: any = false;

	setSceneData() {
		// Discard the old map information.
		SceneManager.resetCurrentMap();
		
		// For opening event, paint on the screen in advance.
		SceneManager.setEffectAllRange(true);
		
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RestSceneMode.OPENING) {
			result = this._moveOpening();
		}
		else if (mode === RestSceneMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === RestSceneMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === RestSceneMode.ENDING) {
			result = this._moveEnding();
		}
		
		this._moveCommonAnimation();
		
		return result;
	}

	drawSceneCycle() {
		var mode = this.getCycleMode();
		
		if (this._isBackgroundEnabled) {
			this._drawBackground();
			this._drawAreaName();
			this._drawCommand();
		}
		
		if (mode === RestSceneMode.OPENING) {
			this._straightFlowOpening.drawStraightFlow();
		}
		else if (mode === RestSceneMode.ENDING) {
			this._straightFlowEnding.drawStraightFlow();
		}
	}

	moveBackSceneCycle() {
		this._moveCommonAnimation();
		return MoveResult.CONTINUE;
	}

	getRestArea() {
		// If no area exists for which the condition is satisfied, getActiveRestArea returns null.
		return root.getRestPreference().getActiveRestArea();
	}

	endRest() {
		this._isRestFinal = true;
	}

	enableBackground() {
		this._isBackgroundEnabled = true;
	}

	_prepareSceneMemberData() {
		this._restCommandManager = createObject(RestCommand);
		this._eventChecker = createObject(RestAutoEventChecker);
		this._scrollBackground = createObject(ScrollBackground);
		this._straightFlowOpening = createObject(StraightFlow);
		this._straightFlowEnding = createObject(StraightFlow);
	}

	_completeSceneMemberData() {
		if (root.getSceneController().isActivatedFromSaveFile()) {
			MediaControl.resetMusicList();
		}
		
		this._restCommandManager.openListCommandManager();
		
		this._straightFlowOpening.setStraightFlowData(this);
		this._pushFlowOpeningEntries(this._straightFlowOpening);
		
		this._straightFlowEnding.setStraightFlowData(this);
		this._pushFlowEndingEntries(this._straightFlowEnding);
		
		this._changeOpening();
	}

	_changeOpening() {
		this._setBackgroundData();
		this._straightFlowOpening.enterStraightFlow();
		this.changeCycleMode(RestSceneMode.OPENING);
	}

	_setBackgroundData() {
		var area = this.getRestArea();
		
		if (area !== null) {
			this._scrollBackground.startScrollBackground(area.getBackgroundImage());
		}
	}

	_moveOpening() {
		if (this._straightFlowOpening.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._changeEventMode();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAutoEventCheck() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			// Rebuild a command because the command display is changed by the switch control in the event.
			this._rebuildRestCommand();
			this.changeCycleMode(RestSceneMode.SELECT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelect() {
		var nextmode;
		var prevmode = this._restCommandManager.getCycleMode();
		
		this._restCommandManager.moveListCommandManager();
		nextmode = this._restCommandManager.getCycleMode();
		
		// When selecting a command with a command selection mode, the screen etc. is displayed.
		// Check if the screen was canceled and got back to the command mode again.
		if (prevmode === ListCommandManagerMode.OPEN && nextmode === ListCommandManagerMode.TITLE) {
			if (this._isRestFinal) {
				this._straightFlowEnding.enterStraightFlow();
				this.changeCycleMode(RestSceneMode.ENDING);
			}
			else {
				this._changeEventMode();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEnding() {
		if (this._straightFlowEnding.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._closeMusic();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCommonAnimation() {
		this._scrollBackground.moveScrollBackground();
	}

	_drawBackground() {
		this._scrollBackground.drawScrollBackground();
	}

	_drawAreaName() {
		// Draw the location name at the upper right on the screen.
	}

	_drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === RestSceneMode.OPENING || mode === RestSceneMode.SELECT || mode === RestSceneMode.AUTOEVENTCHECK) {
			this._restCommandManager.drawListCommandManager();
		}
	}

	_changeEventMode() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), RestAutoType.TOP);
		if (result === EnterResult.NOTENTER) {
			// Rebuild a command because the command display is changed by the switch control in the event.
			this._rebuildRestCommand();
			this.changeCycleMode(RestSceneMode.SELECT);
		}
		else {
			this.changeCycleMode(RestSceneMode.AUTOEVENTCHECK);
		}
	}

	_rebuildRestCommand() {
		var index = this._restCommandManager.getCommandScrollbar().getIndex();
		
		this._restCommandManager.rebuildCommand();
		this._restCommandManager.getCommandScrollbar().setIndex(index);
	}

	_closeMusic() {
		MediaControl.resetMusicList();
	}

	_pushFlowOpeningEntries(straightFlow?) {
		straightFlow.pushFlowEntry(RestOpeningFlowEntry);
		straightFlow.pushFlowEntry(RestMusicFlowEntry);
	}

	_pushFlowEndingEntries(straightFlow?) {
		straightFlow.pushFlowEntry(RestEndingFlowEntry);
		straightFlow.pushFlowEntry(RestNextFlowEntry);
	}
}

class RestOpeningMode {

	static EVENT: any = 0;

	static FADEIN: any = 1;
}

class RestOpeningFlowEntry extends BaseFlowEntry {
	_eventChecker: any;


	_evetChecker: any = null;

	_transition: any = null;

	enterFlowEntry(restScene?) {
		this._prepareMemberData(restScene);
		return this._completeMemberData(restScene);
	}

	moveFlowEntry() {
		var result = MoveResult.END;
		var mode = this.getCycleMode();
		
		if (mode === RestOpeningMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === RestOpeningMode.FADEIN) {
			result = this._moveFadein();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		if (mode === RestOpeningMode.FADEIN) {
			this._drawFadein();
		}
	}

	_prepareMemberData(restScene?) {
		this._eventChecker = createObject(RestEventChecker);
		this._transition = createObject(SystemTransition);
	}

	_completeMemberData(restScene?) {
		var result;
		
		if (root.isOpeningEventSkip()) {
			this._eventChecker.enableAllSkip();
		}
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getOpeningEventList(), EventType.OPENING);
		if (result === EnterResult.NOTENTER) {
			this._doLastAction();
		}
		else {
			this.changeCycleMode(RestOpeningMode.EVENT);
		}
		
		return EnterResult.OK;
	}

	_moveEvent() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doLastAction();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveFadein() {
		return this._transition.moveTransition();
	}

	_drawFadein() {
		this._transition.drawTransition();
	}

	_doLastAction() {
		SceneManager.getActiveScene().enableBackground();
		
		this._resetOpeningEventList();
		
		SceneManager.setEffectAllRange(true);
		this._transition.setFadeSpeed(10);
		this._transition.setDestIn();
		this.changeCycleMode(RestOpeningMode.FADEIN);
	}

	_resetOpeningEventList() {
		var i, event;
		var list = root.getCurrentSession().getOpeningEventList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			event.setExecutedMark(EventExecutedType.FREE);
		}
	}
}

class RestMusicFlowEntry extends BaseFlowEntry {

	enterFlowEntry(restScene?) {
		this._prepareMemberData(restScene);
		return this._completeMemberData(restScene);
	}

	moveFlowEntry() {
		return MoveResult.END;
	}

	_prepareMemberData(restScene?) {
	}

	_completeMemberData(restScene?) {
		this._playSetupMusic(restScene);
		return EnterResult.NOTENTER;
	}

	_playSetupMusic(restScene?) {
		var area = restScene.getRestArea();
		
		MediaControl.clearMusicCache();
		
		if (area !== null) {
			MediaControl.musicPlayNew(area.getMusicHandle());
		}
	}
}

class RestEndingMode {

	static FADEOUT: any = 0;

	static EVENT: any = 1;
}

class RestEndingFlowEntry extends BaseFlowEntry {
	_eventChecker: any;


	_evetChecker: any = null;

	_transition: any = null;

	enterFlowEntry(restScene?) {
		this._prepareMemberData(restScene);
		return this._completeMemberData(restScene);
	}

	moveFlowEntry() {
		var result = MoveResult.END;
		var mode = this.getCycleMode();
		
		if (mode === RestEndingMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === RestEndingMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		if (mode === RestEndingMode.FADEOUT) {
			this._drawFadeout();
		}
	}

	_prepareMemberData(restScene?) {
		this._eventChecker = createObject(RestEventChecker);
		this._transition = createObject(SystemTransition);
	}

	_completeMemberData(restScene?) {
		this._transition.setDestOut();
		this._transition.setFadeSpeed(5);
		this.changeCycleMode(RestEndingMode.FADEOUT);
		
		return EnterResult.OK;
	}

	_moveFadeout() {
		var result;
		
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			result = this._eventChecker.enterEventChecker(root.getCurrentSession().getEndingEventList(), EventType.ENDING);
			if (result === EnterResult.NOTENTER) {
				this._doLastAction();
				return MoveResult.END;
			}
			else {
				this.changeCycleMode(RestEndingMode.EVENT);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doLastAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawFadeout() {
		this._transition.drawTransition();
	}

	_doLastAction() {
	}
}

class RestNextFlowEntry extends BaseFlowEntry {

	enterFlowEntry(restScene?) {
		var mapId = root.getSceneController().getNextMapId();
		
		root.getSceneController().startNewMap(mapId);
		root.changeScene(SceneType.BATTLESETUP);
		
		return EnterResult.NOTENTER;
	}
}

class RestCommand extends BaseListCommandManager {

	getPositionX() {
		return LayoutControl.getRelativeX(8);
	}

	getPositionY() {
		return LayoutControl.getRelativeY(12);
	}

	getCommandTextUI() {
		return root.queryTextUI('restcommand_title');
	}

	configureCommands(groupArray?) {
		var mixer = createObject(CommandMixer);
		
		if (this._isQuestDisplayable()) {
			mixer.pushCommand(RestCommand.Quest, CommandActionType.QUEST);
		}
		if (this._isImageTalkDisplayable()) {
			mixer.pushCommand(RestCommand.ImageTalk, CommandActionType.IMAGETALK);
		}
		if (this._isNextCommandDisplayable()) {
			mixer.pushCommand(RestCommand.Next, CommandActionType.NEXT);
		}
		
		mixer.mixCommand(CommandLayoutType.REST, groupArray, BaseListCommand);
	}

	_checkTracingScroll() {
	}

	_playCommandOpenSound() {
	}

	_isQuestDisplayable() {
		var i;
		var list = root.getBaseData().getRestQuestList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			if (list.getData(i).isQuestDisplayable()) {
				return true;
			}
		}
		
		return false;
	}

	_isImageTalkDisplayable() {
		var i, list, count;
		var session = root.getCurrentSession();
		
		if (session === null) {
			return false;
		}
		
		list = session.getTalkEventList();
		count = list.getCount();
		
		for (i = 0; i < count; i++) {
			if (list.getData(i).isEvent()) {
				return true;
			}
		}
		
		return false;
	}

	_isNextCommandDisplayable() {
		return root.getSceneController().getNextMapId() !== MapIdValue.COMPLETE;
	}
}

namespace RestCommand {
export class Quest extends BaseListCommand {

	_questScreen: any = null;

	openCommand() {
		var screenParam = this._createScreenParam();
		
		this._questScreen = createObject(QuestScreen);
		SceneManager.addScreen(this._questScreen, screenParam);
	}

	moveCommand() {
		if (SceneManager.isScreenClosed(this._questScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildQuest();
		
		return screenParam;
	}
}

export class ImageTalk extends BaseListCommand {

	_imageTalkScreen: any = null;

	openCommand() {
		var screenParam = this._createScreenParam();
		
		this._imageTalkScreen = createObject(ImageTalkScreen);
		SceneManager.addScreen(this._imageTalkScreen, screenParam);
	}

	moveCommand() {
		if (SceneManager.isScreenClosed(this._imageTalkScreen)) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildImageTalk();
		
		return screenParam;
	}
}

export class Next extends BaseListCommand {

	_questionWindow: any = null;

	openCommand() {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.Rest_Next);
		this._questionWindow.setQuestionActive(true);
	}

	moveCommand() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				SceneManager.getActiveScene().endRest();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawCommand() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		this._questionWindow.drawWindow(x, y);
	}
}
}
