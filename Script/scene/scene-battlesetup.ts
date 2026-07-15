
class BattleSetupMode {

	static BEFORESETUP: any = 0;

	static TOPCOMMAND: any = 1;

	static SETUPEDIT: any = 2;

	static AFTERSETUP: any = 3;
}

class BattleSetupScene extends BaseScene {

	_setupCommandManager: any = null;

	_setupEdit: any = null;

	_straightFlowBefore: any = null;

	_straightFlowAfter: any = null;

	_wavePanel: any = null;

	_sortieSetting: any = null;

	_isSetupFinal: any = false;

	setSceneData() {
		// When entering the new map, reset the previous map setting.
		SceneManager.resetCurrentMap();
		
		// For opening event, paint on the screen in advance.
		SceneManager.setEffectAllRange(true);
		
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		this._moveCommonAnimation();
		
		if (mode === BattleSetupMode.BEFORESETUP) {
			result = this._moveBeforeSetup();
		}
		else if (mode === BattleSetupMode.TOPCOMMAND) {
			result = this._moveTopCommand();
		}
		else if (mode === BattleSetupMode.SETUPEDIT) {
			result = this._moveSetupEdit();
		}
		else if (mode === BattleSetupMode.AFTERSETUP) {
			result = this._moveAfterSetup();
		}
		
		return result;
	}

	drawSceneCycle() {
		var mode = this.getCycleMode();
		
		if (mode === BattleSetupMode.SETUPEDIT || mode === BattleSetupMode.TOPCOMMAND) {
			this._drawSortieMark();
		}
		
		if (mode === BattleSetupMode.SETUPEDIT) {
			this._setupEdit.drawSetupUnitHotPanel();
		}
		
		MapLayer.drawUnitLayer();
		
		if (mode === BattleSetupMode.SETUPEDIT) {
			this._setupEdit.drawSetupEdit();
		}
		else if (mode === BattleSetupMode.TOPCOMMAND) {
			this._setupCommandManager.drawListCommandManager();
		}
		else if (mode === BattleSetupMode.BEFORESETUP) {
			this._straightFlowBefore.drawStraightFlow();
		}
		else if (mode === BattleSetupMode.AFTERSETUP) {
			this._straightFlowAfter.drawStraightFlow();
		}
	}

	moveBackSceneCycle() {
		this._moveCommonAnimation();
		return MoveResult.CONTINUE;
	}

	endBattleSetup() {
		var list = PlayerList.getSortieList();
		
		if (list.getCount() > 0) {
			this._isSetupFinal = true;
		}
	}

	getSortieSetting() {
		return this._sortieSetting;
	}

	_prepareSceneMemberData() {
		this._setupCommandManager = createObject(SetupCommand);
		this._setupEdit = createObject(SetupEdit);
		this._straightFlowBefore = createObject(StraightFlow);
		this._straightFlowAfter = createObject(StraightFlow);
		this._wavePanel = createObject(WavePanel);
		this._sortieSetting = createObject(SortieSetting);
		this._isSetupFinal = false;
	}

	_completeSceneMemberData() {
		if (root.getSceneController().isActivatedFromSaveFile()) {
			MediaControl.resetMusicList();
		}
		
		root.getCurrentSession().setStartEndType(StartEndType.NONE);
		
		this._setupEdit.openSetupEdit();
		
		this._straightFlowBefore.setStraightFlowData(this);
		this._pushFlowBeforeEntries(this._straightFlowBefore);
		
		this._straightFlowAfter.setStraightFlowData(this);
		this._pushFlowAfterEntries(this._straightFlowAfter);
		
		this._straightFlowBefore.enterStraightFlow();
		this.changeCycleMode(BattleSetupMode.BEFORESETUP);
	}

	_moveCommonAnimation() {
		MapLayer.moveMapLayer();
		this._wavePanel.moveWavePanel();
		return MoveResult.CONTINUE;
	}

	_moveBeforeSetup() {
		if (this._straightFlowBefore.moveStraightFlow() !== MoveResult.CONTINUE) {
			if (!root.getCurrentSession().getCurrentMapInfo().isBattleSetupScreenDisplayable()) {
				// In order not to display the battle setup scene, start up immediately.
				return this._startBattle();
			}
		
			this._setupCommandManager.openListCommandManager();
			this.changeCycleMode(BattleSetupMode.TOPCOMMAND);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTopCommand() {
		if (this._setupCommandManager.moveListCommandManager() !== MoveResult.CONTINUE) {
			this.changeCycleMode(BattleSetupMode.SETUPEDIT);
		}
		else {
			if (this._isSetupFinal) {
				return this._startBattle();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSetupEdit() {
		if (this._setupEdit.moveSetupEdit() !== MoveResult.CONTINUE) {
			this._setupCommandManager.openListCommandManager();
			this.changeCycleMode(BattleSetupMode.TOPCOMMAND);
		}
		else {
			if (this._isSetupFinal) {
				return this._startBattle();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAfterSetup() {
		if (this._straightFlowAfter.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._changeFreeScene();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	
	// A process for the guest joining and a process of MapStartFlowEntry can be changed to execute when FreeAreaScene starts.
	_startBattle() {
		// Execute it before enterStraightFlow to treat the guest at the event.
		root.getCurrentSession().joinGuestUnit();
		
		if (this._straightFlowAfter.enterStraightFlow() === EnterResult.NOTENTER) {
			this._changeFreeScene();
			return MoveResult.END;
		}
		else {
			this.changeCycleMode(BattleSetupMode.AFTERSETUP);
		}
		
		return MoveResult.CONTINUE;
	}

	_changeFreeScene() {
		// Only if change scene or victory map doesn't occur in the event, execute SceneType.FREE.
		if (root.getCurrentScene() === SceneType.BATTLESETUP) {
			this._closeMusic();
			root.changeScene(SceneType.FREE);
		}
	}

	_closeMusic() {
		MediaControl.clearMusicCache();
	}

	_drawSortieMark() {
		var i, x, y;
		var arr = this._sortieSetting.getSortieArray();
		var count = arr.length;
		var pic = root.queryUI('sortie_panel');
		
		if (!root.getCurrentSession().isMapState((MapStateType as any).UNITDRAW)) { // NOTE (JS->TS): not a defined value; DRAWUNIT exists and looks like the likely intent (word-order typo)
			return;
		}
		
		for (i = 0; i < count; i++) {
			if (!arr[i].isFixed){
				x = (arr[i].x * GraphicsFormat.MAPCHIP_WIDTH) - root.getCurrentSession().getScrollPixelX();
				y = (arr[i].y * GraphicsFormat.MAPCHIP_HEIGHT) - root.getCurrentSession().getScrollPixelY();
				this._wavePanel.drawWavePanel(x, y, pic);
			}
		}
	}

	_pushFlowBeforeEntries(straightFlow?) {
		straightFlow.pushFlowEntry(OpeningEventFlowEntry);
		straightFlow.pushFlowEntry(SetupMusicFlowEntry);
		straightFlow.pushFlowEntry(AutoScrollFlowEntry);
	}

	_pushFlowAfterEntries(straightFlow?) {
		straightFlow.pushFlowEntry(MapStartFlowEntry);
	}
}

class MapStartFlowEntry extends BaseFlowEntry {

	_turnChangeMapStart: any = null;

	enterFlowEntry(battleSetupScene?) {
		this._prepareMemberData(battleSetupScene);
		return this._completeMemberData(battleSetupScene);
	}

	moveFlowEntry() {
		return this._turnChangeMapStart.moveTurnChangeCycle();
	}

	drawFlowEntry() {
		this._turnChangeMapStart.drawTurnChangeCycle();
	}

	_prepareMemberData(battleSetupScene?) {
		this._turnChangeMapStart = createObject(TurnChangeMapStart);
	}

	_completeMemberData(battleSetupScene?) {
		return this._turnChangeMapStart.enterTurnChangeCycle();
	}
}

class OpeningEventMode {

	static EVENT: any = 0;

	static FADEIN: any = 1;
}

class OpeningEventFlowEntry extends BaseFlowEntry {
	_eventChecker: any;


	_evetChecker: any = null;

	_transition: any = null;

	enterFlowEntry(battleSetupScene?) {
		this._prepareMemberData(battleSetupScene);
		return this._completeMemberData(battleSetupScene);
	}

	moveFlowEntry() {
		var result = MoveResult.END;
		var mode = this.getCycleMode();
		
		if (mode === OpeningEventMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === OpeningEventMode.FADEIN) {
			result = this._moveFadein();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		if (mode === OpeningEventMode.FADEIN) {
			this._drawFadein();
		}
	}

	_prepareMemberData(battleSetupScene?) {
		this._eventChecker = createObject(EventChecker);
		this._transition = createObject(SystemTransition);
	}

	_completeMemberData(battleSetupScene?) {
		var result;
		
		this._checkUnitParameter();
		
		if (root.isOpeningEventSkip()) {
			this._eventChecker.enableAllSkip();
		}
		
		// At the opening event, the unit is not visible with a default.
		SceneManager.getActiveScene().getSortieSetting().startSortieSetting(true);
		
		// If the script error occurs, there is a function to restart the game.
		// But call after startSortieSetting to prevent that the restarting is executed from the previous map.
		RetryControl.register();
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getOpeningEventList(), EventType.OPENING);
		if (result === EnterResult.NOTENTER) {
			this._doLastAction();
		}
		else {
			this.changeCycleMode(OpeningEventMode.EVENT);
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
		// 
		// 
		if (SceneManager._sceneType !== SceneType.BATTLESETUP) {
			return;
		}
		
		// Deactivate non visible state.
		SceneManager.getActiveScene().getSortieSetting().startSortieSetting(false);
		
		// When saving with BattleSetupScreen, and after that, the save file is loaded,
		// the opening event should be executed. So deactivate the executed mode with this method.
		this._resetOpeningEventList();
		
		this._transition.setFadeSpeed(10);
		this._transition.setDestIn();
		
		this.changeCycleMode(OpeningEventMode.FADEIN);
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

	_checkUnitParameter() {
		var i, j, list, unit, listCount, count;
		var listArray = FilterControl.getAliveListArray(UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY);
		
		listCount = listArray.length;
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				unit = list.getData(j);
				this._resetUnit(unit);
			}
		}
		
		list = root.getCurrentSession().getGuestList();
		count = list.getCount();
		for (j = 0; j < count; j++) {
			unit = list.getData(j);
			this._resetUnit(unit);
		}
	}

	
	// If came back from the map (if "Battle Setup" is selected with "Change Scene"), Battle setup scene is also executed, 
	// so if recovery is processed with this method, it means that recovery process will be also executed after coming back.
	_resetUnit(unit?) {
		if (DataConfig.isBattleSetupRecoverable() && unit.getUnitType() === UnitType.PLAYER) {
			// For the battle setup scene, if it's not the player, it's not saved, so recovery target is only the player.
			// It can correspond to the HP change such as class bonus.
			UnitProvider.recoveryPrepareUnit(unit);
		}
		
		UnitProvider.setupFirstUnit(unit);
	}
}

class SetupMusicFlowEntry extends BaseFlowEntry {

	enterFlowEntry(battleSetupScene?) {
		this._prepareMemberData(battleSetupScene);
		return this._completeMemberData(battleSetupScene);
	}

	moveFlowEntry() {
		return MoveResult.END;
	}

	_prepareMemberData(battleSetupScene?) {
	}

	_completeMemberData(battleSetupScene?) {
		if (root.getCurrentSession().getCurrentMapInfo().isBattleSetupScreenDisplayable()) {
			this._playSetupMusic();
		}
		
		return EnterResult.NOTENTER;
	}

	_playSetupMusic() {
		var map = root.getCurrentSession().getCurrentMapInfo();
		
		MediaControl.clearMusicCache();
		MediaControl.musicPlayNew(map.getBattleSetupMusicHandle());
	}
}

class AutoScrollFlowEntry extends BaseFlowEntry {

	_dynamicEvent: any = null;

	enterFlowEntry(battleSetupScene?) {
		this._prepareMemberData(battleSetupScene);
		return this._completeMemberData(battleSetupScene);
	}

	moveFlowEntry() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result !== MoveResult.CONTINUE) {
			this._setCenterPos();
		}
		
		return result;
	}

	_prepareMemberData(battleSetupScene?) {
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(battleSetupScene?) {
		var generator;
	
		if (!this._isContinue()) {
			return EnterResult.NOTENTER;
		}
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.mapScroll(SpeedType.NORMAL, true, true);
		
		// If the game starts up from the beginning without the initial members and moreover,
		// the map displays the battle setup scene, if statement can be satisfied.
		if (PlayerList.getAliveList().getCount() === 0) {
			generator.infoWindow(StringTable.BattleSetup_NoPlayer, InfoWindowType.WARNING, 0, 0, true);
			generator.sceneChange(SceneChangeType.GAMEOVER);
		}
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_isContinue() {
		// Check if the battle setup scene is not visible.
		if (!root.getCurrentSession().getCurrentMapInfo().isBattleSetupScreenDisplayable()) {
			return false;
		}
		
		if (!root.getCurrentSession().getCurrentMapInfo().isMapScroll()) {
			return false;
		}
		
		// For test play, if op event is skipped, the map scroll is also skipped.
		if (root.isOpeningEventSkip()) {
			return false;
		}
		
		return true;
	}

	_setCenterPos() {
		var session = root.getCurrentSession();
		var mx = session.getScrollPixelX();
		var my = session.getScrollPixelY();
		var width = Math.floor(root.getGameAreaWidth() / 2);
		var height = Math.floor(root.getGameAreaHeight() / 2);
		var x = Math.floor((mx + width) / GraphicsFormat.MAPCHIP_WIDTH);
		var y = Math.floor((my + height) / GraphicsFormat.MAPCHIP_HEIGHT);
		
		root.getCurrentSession().setMapCursorX(x);
		root.getCurrentSession().setMapCursorY(y);
	}
}

class SortieSetting extends BaseScreen {

	_sortiePosArray: any = null;

	
	// This method is called when the scene starts up and the op event ends.
	// If it's only the former, when changing the sortie number at the op event or the unit appears,
	// it may not reflect.
	// Meanwhile, if it's only the latter, when displaying a map at the op event,
	// the unit is not visible because the unit sortie hasn't ended.
	// Because of this, for the first calling,
	// to specify true for the argument can treat as a sortie end at the state of which the unit is not visible.
	// If so, to disable the non visible state with "Unit State Change" of the event command can make the unit always be visible.
	// For the second calling, the unit should always be visible,
	// so specify false at the argument.
	startSortieSetting(isInvisible?) {
		var i, j, list, listCount, count;
		var listArray = FilterControl.getAliveListArray(UnitFilterFlag.PLAYER);
		
		if (!this._isSortieSettingEnabled()) {
			return;
		}
		
		this._createSortiePosArray();
		this._setInitialUnitPos();
		
		listCount = listArray.length;
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				list.getData(j).setInvisible(isInvisible);
			}
		}
	}

	setSortieMark(index?) {
		var list = PlayerList.getAliveList();
		var unit = list.getData(index);
		
		if (!this.isForceSortie(unit)) {	
			if (unit.getSortieState() === SortieType.UNSORTIE) {
				this._sortieUnit(unit);
			}
			else {
				this.nonsortieUnit(unit);
			}
		}
		else {
			return false;
		}
		
		return true;
	}

	isForceSortie(unit?) {	
		var i, forceSortie;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var count = mapInfo.getForceSortieCount();
		
		for (i = 0; i < count; i++) {
			forceSortie = mapInfo.getForceSortie(i);
			if (unit === forceSortie.getUnit()) {
				return true;
			}
		}
		
		return false;
	}

	isSortie(unit?) {
		// A unit that is incapacitated cannot sortie.
		if (!DataConfig.isBattleSetupRecoverable() && unit.getHp() === ChronicInjuryHp.ZERO) {
			return false;
		}
		
		return cur_map.getSortieAggregation().isCondition(unit);
	}

	getSortieCount() {
		var i;
		var count = this._sortiePosArray.length;
		var sortieCount = 0;
		
		for (i = 0; i < count; i++) {
			if (this._sortiePosArray[i].unit !== null) {
				sortieCount++;
			}
		}
		
		return sortieCount;
	}

	getSortieArray() {
		return this._sortiePosArray;
	}

	nonsortieUnit(unit?) {
		var i;
		var count = this._sortiePosArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._sortiePosArray[i].unit === unit) {
				this._sortiePosArray[i].unit = null;
				break;
			}
		}
		
		unit.setSortieState(SortieType.UNSORTIE);
	}

	assocUnit(unit?, sortiePos?) {
		if (unit !== null) {
			unit.setMapX(sortiePos.x);
			unit.setMapY(sortiePos.y);
		}
		
		sortiePos.unit = unit;
	}

	getDefaultSortieMaxCount() {
		return cur_map.getSortieMaxCount();
	}

	_isSortieSettingEnabled() {
		return root.getCurrentSession().getCurrentMapInfo().isBattleSetupScreenDisplayable();
	}

	_createSortiePosArray() {
		var i, sortiePos;
		var count = this.getDefaultSortieMaxCount();
		
		this._sortiePosArray = [];
		
		for (i = 0; i < count; i++) {
			sortiePos = StructureBuilder.buildSortiePos();
			sortiePos.x = this._getDefaultSortiePosX(i);
			if (sortiePos.x === -1) {
				// If the original sortie number is changed to be exceeded, the process is not continued.
				break;
			}
			sortiePos.y = this._getDefaultSortiePosY(i);
			sortiePos.unit = null;
			sortiePos.isFixed = false;
			this._sortiePosArray.push(sortiePos);
		}
	}

	_setInitialUnitPos() {
		var i, unit;
		var list = PlayerList.getAliveList();
		var count = list.getCount();
		var maxCount = this._sortiePosArray.length;
		var sortieCount = 0;
		
		// If the save is executed even once on the battle setup scene on the current map, func returns false. 
		if (!root.getMetaSession().isFirstSetup()) {
			// Initialize the unit of _sortiePosArray as a reference of the current unit position.
			this._arrangeUnitPos();
			return;
		}
		
		// If the battle setup scene is displayed for the first time, the subsequent process sets the sortie state automatically.
		
		this._clearSortieList();
		
		// The unit of force sortie (the specified position) is set to be a sortie state in order.
		for (i = 0; i < count && sortieCount < maxCount; i++) {
			unit = list.getData(i);
			if (this.isForceSortie(unit)) {
				if (this._sortieFixedUnit(unit)) {
					sortieCount++;
				}
			}
		}
		
		// The unit of force sortie (the unspecified position) is set to be a sortie state in order.
		for (i = 0; i < count && sortieCount < maxCount; i++) {
			unit = list.getData(i);
			if (this.isForceSortie(unit) && unit.getSortieState() !== SortieType.SORTIE) {
				if (this._sortieForceUnit(unit)) {
					sortieCount++;
				}
			}
		}
		
		// The other units are set to be sortie states in order.
		for (i = 0; i < count && sortieCount < maxCount; i++) {
			unit = list.getData(i);
			if (unit.getSortieState() !== SortieType.SORTIE) {
				if (this._sortieUnit(unit)) {
					sortieCount++;
				}
			}
		}
	}

	_arrangeUnitPos() {
		var i, j, unit, x, y;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		var count2 = this._sortiePosArray.length;
		var arr = [];
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			x = unit.getMapX();
			y = unit.getMapY();
			for (j = 0; j < count2; j++) {
				if (this._sortiePosArray[j].x === x && this._sortiePosArray[j].y === y) {
					this._sortiePosArray[j].unit = unit;
					this._sortiePosArray[j].isFixed = this._getForceSortieNumber(unit) > 0;
					break;
				}
			}
			
			if (j === count2) {
				// If the unit position is not certain by the op event,
				// or the sortie position is changed with the project, the unit may not be set as _sortiePosArray.
				// Record such unit who cannot be set. 
				arr.push(unit);
			}
		}
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			unit = arr[i];
			for (j = 0; j < count2; j++) {
				// The position in which the unit is not set was found, so set the unit. 
				if (this._sortiePosArray[j].unit === null) {
					this._sortiePosArray[j].unit = unit;
					this._sortiePosArray[j].isFixed = this._getForceSortieNumber(unit) > 0;
					unit.setMapX(this._sortiePosArray[j].x);
					unit.setMapY(this._sortiePosArray[j].y);
					break;
				}
			}
		}
	}

	_clearSortieList() {
		var i, unit;
		var list = PlayerList.getAliveList();
		var count = list.getCount();
		
		// All units are set as no sortie states.
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			this.nonsortieUnit(unit);
		}
	}

	_sortieUnit(unit?) {
		var i;
		var count = this._sortiePosArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._sortiePosArray[i].unit === null && this.isSortie(unit)) {
				unit.setSortieState(SortieType.SORTIE);
				this.assocUnit(unit, this._sortiePosArray[i]);
				return true;
			}
		}
		
		return false;
	}

	_sortieForceUnit(unit?) {
		var i;
		var count = this._sortiePosArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._sortiePosArray[i].unit === null) {
				unit.setSortieState(SortieType.SORTIE);
				this.assocUnit(unit, this._sortiePosArray[i]);
				return true;
			}
		}
		
		return false;
	}

	_sortieFixedUnit(unit?) {
		var index = this._getForceSortieNumber(unit) - 1;
		
		if (index >= 0) {
			unit.setSortieState(SortieType.SORTIE);
			this.assocUnit(unit, this._sortiePosArray[index]);
			this._sortiePosArray[index].isFixed = true;
			return true;
		}
		
		return false;
	}

	_getForceSortieNumber(unit?) {
		var i, forceUnit, forceSortie;
		var number = 0;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var count = mapInfo.getForceSortieCount();
		
		for (i = 0; i < count; i++) {
			forceSortie = mapInfo.getForceSortie(i);
			forceUnit = forceSortie.getUnit();
			if (forceUnit !== null && unit.getId() === forceUnit.getId()) {
				// If getNumber returns 0, it means that there is no specified position.
				number = forceSortie.getNumber();
				break;
			}
		}
		
		return number;
	}

	_getDefaultSortiePosX(i?) {
		return cur_map.getSortiePosX(i);
	}

	_getDefaultSortiePosY(i?) {
		return cur_map.getSortiePosY(i);
	}
}

class SetupEditMode {

	static TOP: any = 0;

	static POSCHANGE: any = 1;
}

class SetupEdit extends BaseObject {

	_targetObj: any = null;

	_mapEdit: any = null;

	_posDoubleCursor: any = null;

	openSetupEdit() {
		this._prepareMemberData();
		this._completeMemberData();
	}

	moveSetupEdit() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === SetupEditMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === SetupEditMode.POSCHANGE) {
			result = this._movePosChangeMode();
		}
		
		this._posDoubleCursor.moveCursor();
		
		return result;
	}

	drawSetupEdit() {
		this._mapEdit.drawMapEdit();
		
		if (this._targetObj !== null) {
			this._posDoubleCursor.drawCursor(this._targetObj.x, this._targetObj.y, this._mapEdit.getEditX(), this._mapEdit.getEditY());
		}
	}

	drawSetupUnitHotPanel() {
	}

	_prepareMemberData() {
		this._targetObj = null;
		this._mapEdit = createObject(MapEdit);
		this._posDoubleCursor = createObject(PosDoubleCursor);	
	}

	_completeMemberData() {
		this._mapEdit.openMapEdit();
		this.changeCycleMode(SetupEditMode.TOP);
	}

	_moveTopMode() {
		var x, y;
		var result = this._mapEdit.moveMapEdit();
		
		if (result === MapEditResult.UNITSELECT || result === MapEditResult.MAPCHIPSELECT) {
			x = this._mapEdit.getEditX();
			y = this._mapEdit.getEditY();
			this._targetObj = this._getSortieObject(x, y);
			
			if (this._targetObj !== null && !this._targetObj.isFixed) {
				this._playSelectSound();
				this._mapEdit.disableMarking(true);
				this.changeCycleMode(SetupEditMode.POSCHANGE);
			}
			else {
				this._targetObj = null;
			}
			
			if (result === MapEditResult.MAPCHIPSELECT && this._targetObj === null) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_movePosChangeMode() {
		var x, y, obj;
		var result = this._mapEdit.moveMapEdit();
		
		if (result === MapEditResult.UNITSELECT || result === MapEditResult.MAPCHIPSELECT) {
			x = this._mapEdit.getEditX();
			y = this._mapEdit.getEditY();
			obj = this._getSortieObject(x, y);
			if (obj !== null) {
				this._changePos(obj);
				this._targetObj = null;
				this._playSelectSound();
				this._mapEdit.disableMarking(false);
				this.changeCycleMode(SetupEditMode.TOP);
			}
		}
		else if (result === MapEditResult.MAPCHIPCANCEL) {
			this._targetObj = null;
			this._playCancelSound();
			this._mapEdit.disableMarking(false);
			this.changeCycleMode(SetupEditMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_getSortieObject(x?, y?) {
		var i, count;
		var sortieArray = SceneManager.getActiveScene().getSortieSetting().getSortieArray();
		
		count = sortieArray.length;
		for (i = 0 ; i < count; i++) {
			if (sortieArray[i].x === x && sortieArray[i].y === y && !sortieArray[i].isFixed) {
				return sortieArray[i];
			}
		}
		
		return null;
	}

	_changePos(obj?) {
		var targetUnit = this._targetObj.unit;
		var unit = obj.unit;
		
		SceneManager.getActiveScene().getSortieSetting().assocUnit(targetUnit, obj);
		SceneManager.getActiveScene().getSortieSetting().assocUnit(unit, this._targetObj);
	}

	_playSelectSound() {
		MediaControl.soundDirect('commandselect');
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

// The words of battle setup scene are often described,
// but actually the battle setup scene which has inherited BaseScreen doesn't exist.
// At this time, to display SetupCommand is described in words in which to display battle setup scene. 

class SetupCommand extends BaseListCommandManager {

	getPositionX() {
		return LayoutControl.getRelativeX(8);
	}

	getPositionY() {
		return LayoutControl.getRelativeY(12);
	}

	getCommandTextUI() {
		return root.queryTextUI('setupcommand_title');
	}

	configureCommands(groupArray?) {
		var mixer = createObject(CommandMixer);
		
		mixer.pushCommand(SetupCommand.UnitSortie, CommandActionType.UNITSORTIE);
		mixer.pushCommand(SetupCommand.Sortie, CommandActionType.BATTLESTART);
		
		mixer.mixCommand(CommandLayoutType.BATTLESETUP, groupArray, BaseListCommand);
	}
}

namespace SetupCommand {
export class UnitSortie extends BaseListCommand {

	_unitSortieScreen: any = null;

	openCommand() {
		var screenParam = this._createScreenParam();
	
		this._unitSortieScreen = createObject(UnitSortieScreen);
		SceneManager.addScreen(this._unitSortieScreen, screenParam);
	}

	moveCommand() {
		if (SceneManager.isScreenClosed(this._unitSortieScreen)) {
			if (this._unitSortieScreen.getResultCode() === UnitSortieResult.START) {
				SceneManager.getActiveScene().endBattleSetup();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitSortie();
		
		return screenParam;
	}
}

export class Sortie extends BaseListCommand {

	_questionWindow: any = null;

	openCommand() {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.UnitSortie_Question);
		this._questionWindow.setQuestionActive(true);
	}

	moveCommand() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				SceneManager.getActiveScene().endBattleSetup();
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
