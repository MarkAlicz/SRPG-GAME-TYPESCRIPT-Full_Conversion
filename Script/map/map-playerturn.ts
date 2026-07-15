
class PlayerTurnMode {

	static AUTOCURSOR: any = 0;

	static AUTOEVENTCHECK: any = 1;

	static MAP: any = 2;

	static AREA: any = 3;

	static MAPCOMMAND: any = 4;

	static UNITCOMMAND: any = 5;
}

class PlayerTurn extends BaseTurn {

	_targetUnit: any = null;

	_xCursorSave: any = 0;

	_yCursorSave: any = 0;

	_xAutoCursorSave: any = 0;

	_yAutoCursorSave: any = 0;

	_isPlayerActioned: any = false;

	_mapLineScroll: any = null;

	_mapEdit: any = null;

	_mapSequenceArea: any = null;

	_mapSequenceCommand: any = null;

	_mapCommandManager: any = null;

	_eventChecker: any = null;

	
	// It's called if the turn is switched.
	openTurnCycle() {
		this._prepareTurnMemberData();
		this._completeTurnMemberData();
	}

	moveTurnCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (this._checkAutoTurnEnd()) {
			return MoveResult.CONTINUE;
		}
		
		if (mode === PlayerTurnMode.AUTOCURSOR) {
			result = this._moveAutoCursor();
		}
		else if (mode === PlayerTurnMode.AUTOEVENTCHECK) {
			result = this._moveAutoEventCheck();
		}
		else if (mode === PlayerTurnMode.MAP) {
			result = this._moveMap();
		}
		else if (mode === PlayerTurnMode.AREA) {
			result = this._moveArea();
		}
		else if (mode === PlayerTurnMode.MAPCOMMAND) {
			result = this._moveMapCommand();
		}
		else if (mode === PlayerTurnMode.UNITCOMMAND) {
			result = this._moveUnitCommand();
		}
		
		if (this._checkAutoTurnEnd()) {
			return MoveResult.CONTINUE;
		}
		
		return result;
	}

	drawTurnCycle() {
		var mode = this.getCycleMode();
		
		if (mode === PlayerTurnMode.AUTOCURSOR) {
			this._drawAutoCursor();
		}
		else if (mode === PlayerTurnMode.AUTOEVENTCHECK) {
			this._drawAutoEventCheck();
		}
		else if (mode === PlayerTurnMode.MAP) {
			this._drawMap();	
		}
		else if (mode === PlayerTurnMode.AREA) {
			this._drawArea();	
		}
		else if (mode === PlayerTurnMode.MAPCOMMAND) {
			this._drawMapCommand();
		}
		else if (mode === PlayerTurnMode.UNITCOMMAND) {
			this._drawUnitCommand();
		}
	}

	isPlayerActioned() {
		return this._isPlayerActioned;
	}

	recordPlayerAction(isPlayerActioned?) {
		this._isPlayerActioned = isPlayerActioned;
	}

	notifyAutoEventCheck() {
		this._changeEventMode();
	}

	isDebugMouseActionAllowed() {
		return this.getCycleMode() === PlayerTurnMode.MAP;
	}

	setCursorSave(unit?) {
		this._xCursorSave = unit.getMapX();
		this._yCursorSave = unit.getMapY();
	}

	setPosValue(unit?) {
		unit.setMapX(this._xCursorSave);
		unit.setMapY(this._yCursorSave);
		this._mapEdit.setCursorPos(unit.getMapX(), unit.getMapY());
		MapView.setScroll(unit.getMapX(), unit.getMapY());
	}

	setAutoCursorSave(isDefault?) {
		var pos, session;
		
		if (isDefault) {
			pos = this._getDefaultCursorPos();
			if (pos !== null) {
				this._xAutoCursorSave = pos.x;
				this._yAutoCursorSave = pos.y;
			}
		}
		else {
			session = root.getCurrentSession();
			this._xAutoCursorSave = session.getMapCursorX();
			this._yAutoCursorSave = session.getMapCursorY();
		}
	}

	getTurnTargetUnit() {
		return this._targetUnit;
	}

	clearTurnTargetUnit() {
		this._targetUnit = null;
	}

	isRepeatMoveMode() {
		return false;
	}

	clearPanelRange() {
		this._mapEdit.clearRange();
	}

	getMapEdit() {
		return this._mapEdit;
	}

	_prepareTurnMemberData() {
		this._targetUnit = null;
		this._xCursorSave = 0;
		this._yCursorSave = 0;
		this._isPlayerActioned = false;
		this._mapLineScroll = createObject(MapLineScroll);
		this._mapEdit = createObject(MapEdit);
		this._mapSequenceArea = createObject(MapSequenceArea);
		this._mapSequenceCommand = createObject(MapSequenceCommand);
		this._mapCommandManager = createObject(MapCommand);
		this._eventChecker = createObject(EventChecker);
		
		if (root.getCurrentSession().getTurnCount() === 1) {
			// For the first turn, don't ask whether having auto cursor, the cursor overlaps the unit.
			this.setAutoCursorSave(true);
		}
		
		this._setDefaultActiveUnit();
	}

	_completeTurnMemberData() {
		this._mapEdit.openMapEdit();
		this._changeAutoCursor();
		
		// There is a possibility that the unit appears at the event when the player's turn started, so execute marking.
		MapLayer.getMarkingPanel().updateMarkingPanel();
		
		// The MapParts.UnitInfo object holds the _mhp property to cache the maximum HP of the unit.
		// The presence of this property eliminates the need to call ParamBonus.getMhp(unit); every frame, which is expensive to call.
		// However, since _mhp is not initialized immediately after the map starts,
		// maxHp in the ContentRenderer.drawHp method will be 0 only for the frame immediately after the map starts.
		// To solve this problem, the units must be set with the following code before the draw method is called.
		this._mapEdit._setUnit(root.getCurrentSession().getActiveEventUnit());
	}

	_moveAutoCursor() {
		var x, y, pos;
		
		if (this._mapLineScroll.moveLineScroll() !== MoveResult.CONTINUE) {
			pos = this._getDefaultCursorPos();
			if (pos !== null && EnvironmentControl.isAutoCursor()) {
				x = pos.x;
				y = pos.y;
			}
			else {
				x = this._xAutoCursorSave;
				y = this._yAutoCursorSave;
			}
			MapView.changeMapCursor(x, y);
			this._changeEventMode();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAutoEventCheck() {
		if (this._eventChecker.moveEventChecker() !== MoveResult.CONTINUE) {
			this._doEventEndAction();
			MapLayer.getMarkingPanel().updateMarkingPanel();
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveMap() {
		var result = this._mapEdit.moveMapEdit();
		
		if (result === MapEditResult.UNITSELECT) {
			this._targetUnit = this._mapEdit.getEditTarget();
			if (this._targetUnit !== null) {
				if (this._targetUnit.isWait()) {
					this._mapEdit.clearRange();
					
					// Pressing the decision key on the unit who waits is treated as a map command.
					this._mapCommandManager.openListCommandManager();
					this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
				}
				else {
					// Change it to the mode which displaying the unit moving range.
					this._mapSequenceArea.openSequence(this);
					this.changeCycleMode(PlayerTurnMode.AREA);
				}
			}
		}
		else if (result === MapEditResult.MAPCHIPSELECT) {
			this._mapCommandManager.openListCommandManager();
			this.changeCycleMode(PlayerTurnMode.MAPCOMMAND);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveArea() {
		var result = this._mapSequenceArea.moveSequence();
		
		if (result === MapSequenceAreaResult.COMPLETE) {
			this._mapEdit.clearRange();
			this._mapSequenceCommand.openSequence(this);
			this.changeCycleMode(PlayerTurnMode.UNITCOMMAND);
		}
		else if (result === MapSequenceAreaResult.CANCEL) {
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveMapCommand() {
		if (this._mapCommandManager.moveListCommandManager() !== MoveResult.CONTINUE) {
			// If select the turn ends, don't execute.
			this._changeEventMode();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveUnitCommand() {
		var result = this._mapSequenceCommand.moveSequence();
		
		if (result === MapSequenceCommandResult.COMPLETE) {
			this._mapSequenceCommand.resetCommandManager();
			MapLayer.getMarkingPanel().updateMarkingPanelFromUnit(this._targetUnit);
			this._changeEventMode();
		}
		else if (result === MapSequenceCommandResult.CANCEL) {
			this._mapSequenceCommand.resetCommandManager();
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawAutoCursor() {
		MapLayer.drawUnitLayer();
	}

	_drawAutoEventCheck() {
		MapLayer.drawUnitLayer();
	}

	_drawMap() {
		MapLayer.drawUnitLayer();
		if (!root.isEventSceneActived()) {
			this._mapEdit.drawMapEdit();
		}
	}

	_drawArea() {
		MapLayer.drawUnitLayer();
		this._mapSequenceArea.drawSequence();
	}

	_drawMapCommand() {
		MapLayer.drawUnitLayer();
		this._mapCommandManager.drawListCommandManager();
	}

	_drawUnitCommand() {
		MapLayer.drawUnitLayer();
		this._mapSequenceCommand.drawSequence();
	}

	_checkAutoTurnEnd() {
		var i, unit;
		var isTurnEnd = true;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		// Don't let the turn change occur at the same time when selecting the auto turn end on the config screen.
		// There is also an intention that doesn't let the turn end at the same time when the alive is 0 at the battle.
		if (this.getCycleMode() !== PlayerTurnMode.MAP) {
			return false;
		}
		
		// Even if the auto turn is not enabled, if no alive exists, end the turn.
		if (count === 0) {
			TurnControl.turnEnd();
			return true;
		}
		
		if (!EnvironmentControl.isAutoTurnEnd()) {
			return false;
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			// If the all players cannot act due to the states, ending the turn is needed, so decide with the following code.
			if (!StateControl.isTargetControllable(unit)) {
				continue;
			}
			
			if (!unit.isWait()) {
				isTurnEnd = false;
				break;
			}
		}
		
		if (isTurnEnd) {
			this._isPlayerActioned = false;
			TurnControl.turnEnd();
		}
		
		return isTurnEnd;
	}

	_setDefaultActiveUnit() {
		var unit = PlayerList.getAliveList().getData(0);
		
		// If beaten with the turn damage, set null at the unit.
		if (unit !== null) {
			root.getCurrentSession().setActiveEventUnit(unit);
		}
	}

	_getDefaultCursorPos() {
		var i, unit;
		var targetUnit = null;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getImportance() === ImportanceType.LEADER) {
				targetUnit = unit;
				break;
			}
		}
		
		if (targetUnit === null) {
			targetUnit = list.getData(0);
		}
		
		if (targetUnit !== null) {
			return createPos(targetUnit.getMapX(), targetUnit.getMapY());
		}
		
		return null;
	}

	_changeAutoCursor() {
		var x, y;
		var pos = this._getDefaultCursorPos();
		
		if (pos !== null && EnvironmentControl.isAutoCursor()) {
			x = pos.x;
			y = pos.y;
		}
		else {
			x = this._xAutoCursorSave;
			y = this._yAutoCursorSave;
		}
		
		this._mapLineScroll.startLineScroll(x, y);
		this.changeCycleMode(PlayerTurnMode.AUTOCURSOR);
	}

	_changeEventMode() {
		var result;
		
		result = this._eventChecker.enterEventChecker(root.getCurrentSession().getAutoEventList(), EventType.AUTO);
		if (result === EnterResult.NOTENTER) {
			this._doEventEndAction();
			this.changeCycleMode(PlayerTurnMode.MAP);
		}
		else {
			this.changeCycleMode(PlayerTurnMode.AUTOEVENTCHECK);
		}
	}

	_doEventEndAction() {
		// isGameOver was called with this method because need to display a map when the lost at the battle once.
		// Other than this, also having an intention not to display the terrain window.
		if (GameOverChecker.isGameOver()) {
			GameOverChecker.startGameOver();
		}
		else {
			// Countermeasure so as to restart at the script error.
			// If it's called in func, restart when the turn starts, so it looks like restart.
			RetryControl.register();
		}
	}
}

class MapSequenceAreaMode {

	static AREA: any = 0;

	static MOVING: any = 1;
}

class MapSequenceAreaResult {

	static COMPLETE: any = 0;

	static CANCEL: any = 1;

	static NONE: any = 2;
}

class MapSequenceArea extends BaseObject {

	_parentTurnObject: any = null;

	_targetUnit: any = null;

	_mapCursor: any = null;

	_unitRangePanel: any = null;

	_mapPartsCollection: any = null;

	_prevUnit: any = null;

	_simulateMove: any = null;

	openSequence(parentTurnObject?) {
		this._prepareSequenceMemberData(parentTurnObject);
		this._completeSequenceMemberData(parentTurnObject);
	}

	moveSequence() {
		var mode = this.getCycleMode();
		var result = MapSequenceAreaResult.NONE;
		
		if (mode === MapSequenceAreaMode.AREA) {
			result = this._moveArea();
		}
		else if (mode === MapSequenceAreaMode.MOVING) {
			result = this._moveMoving();
		}
		
		return result;
	}

	drawSequence() {
		var mode = this.getCycleMode();
		
		if (mode === MapSequenceAreaMode.AREA) {
			this._drawArea();
		}
		else if (mode === MapSequenceAreaMode.MOVING) {
			this._drawMoving();
		}
	}

	_prepareSequenceMemberData(parentTurnObject?) {
		this._parentTurnObject = parentTurnObject;
		this._targetUnit = parentTurnObject.getTurnTargetUnit();
		this._mapCursor = createObject(MapCursor);
		this._unitRangePanel = MapLayer.getUnitRangePanel();
		this._mapPartsCollection = createObject(MapPartsCollection);
		this._prevUnit = null;
		this._simulateMove = createObject(SimulateMove);
	}

	_completeSequenceMemberData(parentTurnObject?) {
		this._targetUnit.setDirection(this._getDefaultDirection());
		
		this._mapCursor.setPos(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		
		if (parentTurnObject.isRepeatMoveMode()) {
			this._unitRangePanel.setRepeatUnit(this._targetUnit);	
		}
		else {
			this._unitRangePanel.setUnit(this._targetUnit);
		}
		
		this._mapPartsCollection.setMapCursor(this._mapCursor);
		
		this._playMapUnitSelectSound();
		
		this.changeCycleMode(MapSequenceAreaMode.AREA);
	}

	_moveArea() {
		var unit;
		var isMove = false;
		var isCancel = false;
		var result = MapSequenceAreaResult.NONE;
		
		if (InputControl.isSelectAction()) {
			// Check if it's fine whether the _targetUnit moves.
			if (this._isTargetMovable()) {
				isMove = true;
			}
			else {
				isCancel = true;
			}
		}
		else if (InputControl.isCancelAction()) {
			isCancel = true;
		}
		else {
			this._mapCursor.moveCursor();
			this._mapPartsCollection.moveMapPartsCollection();
			
			unit = this._mapCursor.getUnitFromCursor();
			
			// If the unit has been changed, newly update.
			if (unit !== this._prevUnit) {
				this._setUnit(unit);
			}
		}
		
		if (isMove) {
			// Check if it's fine whether move to the position where a cursor points.
			if (this._isPlaceSelectable()) {
				if (this._startMove()) {
					result = MapSequenceAreaResult.COMPLETE;
				}
				else {
					this.changeCycleMode(MapSequenceAreaMode.MOVING);
				}
			}
		}
		else if (isCancel) {
			this._doCancelAction();
			result = MapSequenceAreaResult.CANCEL;
		}
		
		return result;
	}

	_moveMoving() {
		var result = MapSequenceAreaResult.NONE;
		
		if (this._simulateMove.moveUnit() !== MoveResult.CONTINUE) {
			result = MapSequenceAreaResult.COMPLETE;
		}
		
		return result;
	}

	_drawArea() {
		this._mapCursor.drawCursor();
		this._mapPartsCollection.drawMapPartsCollection();
		MouseControl.drawMapEdge();
	}

	_drawMoving() {
		// Call after drawUnitLayer so that the moving unit can be displayed over the displayed unit.
		this._simulateMove.drawUnit();
	}

	_getDefaultDirection() {
		return DirectionType.RIGHT;
	}

	_isTargetMovable() {
		if (!StateControl.isTargetControllable(this._targetUnit)) {
			return false;
		}
		
		// The player who doesn't wait allows moving.
		return this._targetUnit.getUnitType() === UnitType.PLAYER && !this._targetUnit.isWait();
	}

	_isPlaceSelectable() {
		var x = this._mapCursor.getX();
		var y = this._mapCursor.getY();
		var isCurrentPos = this._targetUnit.getMapX() === x && this._targetUnit.getMapY() === y;
		var unit = PosChecker.getUnitFromPos(x, y);
		
		// The movable place is the position within a range or the current position.
		return (this._unitRangePanel.isMoveArea(x, y) > 0 && unit === null) || isCurrentPos;
	}

	_startMove() {
		var cource;
		var x = this._mapCursor.getX();
		var y = this._mapCursor.getY();
		var isCurrentPos = this._targetUnit.getMapX() === x && this._targetUnit.getMapY() === y;
		
		this._parentTurnObject.setCursorSave(this._targetUnit);
		
		// If select the unit current position, no need to move.
		if (isCurrentPos) {
			this._simulateMove.noMove(this._targetUnit);
			this._playMapUnitSelectSound();
			return true;
		}
		else {
			// Create a course and start moving.
			cource = this._simulateMove.createCource(this._targetUnit, x, y, this._unitRangePanel.getSimulator());
			this._simulateMove.startMove(this._targetUnit, cource);
		}
		
		return false;
	}

	_doCancelAction() {
		// Get the cursor back to the selected unit position.
		this._mapCursor.setPos(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		
		this._targetUnit.setDirection(DirectionType.NULL);
		this._playMapUnitCancelSound();
		
		MapView.setScroll(this._targetUnit.getMapX(), this._targetUnit.getMapY());
	}

	_setUnit(unit?) {
		this._mapPartsCollection.setUnit(unit);
		this._prevUnit = unit;
	}

	_playMapUnitSelectSound() {
		MediaControl.soundDirect('commandselect');
	}

	_playMapUnitCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

class MapSequenceCommandMode {

	static COMMAND: any = 0;

	static FLOW: any = 1;
}

class MapSequenceCommandResult {

	static COMPLETE: any = 0;

	static CANCEL: any = 1;

	static NONE: any = 2;
}

class MapSequenceCommand extends BaseObject {

	_parentTurnObject: any = null;

	_targetUnit: any = null;

	_unitCommandManager: any = null;

	_straightFlow: any = null;

	openSequence(parentTurnObject?) {
		this._prepareSequenceMemberData(parentTurnObject);
		this._completeSequenceMemberData(parentTurnObject);
	}

	moveSequence() {
		var mode = this.getCycleMode();
		var result = MapSequenceCommandResult.NONE;
		
		if (mode === MapSequenceCommandMode.COMMAND) {
			result = this._moveCommand();
		}
		else if (mode === MapSequenceCommandMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	}

	drawSequence() {
		var mode = this.getCycleMode();
		
		if (mode === MapSequenceCommandMode.COMMAND) {
			this._unitCommandManager.drawListCommandManager();
		}
		else if (mode === MapSequenceCommandMode.FLOW) {
			this._straightFlow.drawStraightFlow();
		}
	}

	resetCommandManager() {
		this._unitCommandManager = null;
	}

	_prepareSequenceMemberData(parentTurnObject?) {
		this._parentTurnObject = parentTurnObject;
		this._targetUnit = parentTurnObject.getTurnTargetUnit();
		this._unitCommandManager = createObject(UnitCommand);
		this._straightFlow = createObject(StraightFlow);
	}

	_completeSequenceMemberData(parentTurnObject?) {
		this._straightFlow.setStraightFlowData(parentTurnObject);
		this._pushFlowEntries(this._straightFlow);
		
		// Set the _targetUnit as the active unit at the event.
		root.getCurrentSession().setActiveEventUnit(this._targetUnit);
		
		this._unitCommandManager.setListCommandUnit(this._targetUnit);
		this._unitCommandManager.openListCommandManager();
		
		this.changeCycleMode(MapSequenceCommandMode.COMMAND);
	}

	_moveCommand() {
		var result;
		
		if (this._unitCommandManager.moveListCommandManager() !== MoveResult.CONTINUE) {
			result = this._doLastAction();
			if (result === 0) {
				this._straightFlow.enterStraightFlow();
				this.changeCycleMode(MapSequenceCommandMode.FLOW);
			}
			else if (result === 1) {
				return MapSequenceCommandResult.COMPLETE;
			}
			else {
				this._targetUnit.setMostResentMov(0);
				return MapSequenceCommandResult.CANCEL;
			}
		}
		
		return MapSequenceCommandResult.NONE;
	}

	_moveFlow() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			// Prevent the range left over if move again and auto turn end are enabled.
			this._parentTurnObject.clearPanelRange();
			return MapSequenceCommandResult.COMPLETE;
		}
		
		return MapSequenceCommandResult.NONE;
	}

	_doLastAction() {
		var i;
		var unit = null;
		var list = PlayerList.getSortieList();
		var count = list.getCount();
		
		// Check it because the unit may not exist by executing a command.
		for (i = 0; i < count; i++) {
			if (this._targetUnit === list.getData(i)) {
				unit = this._targetUnit;
				break;
			}
		}
		
		// Check if the unit doesn't die and still exists.
		if (unit !== null) {
			if (this._unitCommandManager.getExitCommand() !== null) {
				if (!this._unitCommandManager.isRepeatMovable()) {
					// If move again is not allowed, don't move again.
					this._targetUnit.setMostResentMov(ParamBonus.getMov(this._targetUnit));
				}
				
				// Set the wait state because the unit did some action.
				this._parentTurnObject.recordPlayerAction(true);
				return 0;
			}
			else {
				// Get the position and cursor back because the unit didn't act.
				this._parentTurnObject.setPosValue(unit);
			}
			
			// Face forward.
			unit.setDirection(DirectionType.NULL);
		}
		else {
			this._parentTurnObject.recordPlayerAction(true);
			return 1;
		}
		
		return 2;
	}

	_pushFlowEntries(straightFlow?) {
		// If need to do something after action ends, add an object.
		straightFlow.pushFlowEntry(RepeatMoveFlowEntry);
		straightFlow.pushFlowEntry(OneMoreFlowEntry);
		straightFlow.pushFlowEntry(UnitWaitFlowEntry);
		straightFlow.pushFlowEntry(ReactionFlowEntry);
	}
}

class RepeatMoveFlowEntry extends BaseFlowEntry {

	_mapSequenceArea: any = null;

	_playerTurn: any = null;

	enterFlowEntry(playerTurn?) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	}

	moveFlowEntry() {
		var result = this._mapSequenceArea.moveSequence();
		
		if (result === MapSequenceAreaResult.COMPLETE) {
			return MoveResult.END;
		}
		else if (result === MapSequenceAreaResult.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._mapSequenceArea.drawSequence();
	}

	
	// The following 3 methods are called by MapSequenceArea.
	getTurnTargetUnit() {
		return this._playerTurn.getTurnTargetUnit();
	}

	setCursorSave(unit?) {
		this._playerTurn.setCursorSave(unit);
	}

	isRepeatMoveMode() {
		return true;
	}

	_prepareMemberData(playerTurn?) {
		this._playerTurn = playerTurn;
		this._mapSequenceArea = createObject(MapSequenceArea);
		
		// Save before executing "Use Leftover Mov". The property is used in the OneMoreFlowEntry object.
		playerTurn.tempNormalMov = playerTurn.getTurnTargetUnit().getMostResentMov();
	}

	_completeMemberData(playerTurn?) {
		if (!this._isTargetMovable(playerTurn)) {
			return EnterResult.NOTENTER;
		}
		
		this._mapSequenceArea.openSequence(this);
		
		return EnterResult.OK;
	}

	_isTargetMovable(playerTurn?) {
		var unit = playerTurn.getTurnTargetUnit();
		
		if (!this._isTargetMovableInternal(unit)) {
			return false;
		}
		
		return unit.getMostResentMov() !== ParamBonus.getMov(unit);
	}

	_isTargetMovableInternal(unit?) {
		if (StateControl.isBadStateOption(unit, BadStateOption.NOACTION)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
			return false;
		}
		
		return true;
	}
}

class OneMoreFlowEntry extends BaseFlowEntry {

	_unitCommandManager: any = null;

	enterFlowEntry(playerTurn?) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	}

	moveFlowEntry() {
		var nextmode;
		var prevmode = this._unitCommandManager.getCycleMode();
		var result = this._unitCommandManager.moveListCommandManager();
		
		nextmode = this._unitCommandManager.getCycleMode();
		
		// Prevents the command from closing when the cancel key is accidentally pressed.
		if (prevmode === ListCommandManagerMode.OPEN && nextmode === ListCommandManagerMode.TITLE) {
			return result;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._unitCommandManager.drawListCommandManager();
	}

	_prepareMemberData(playerTurn?) {
		this._unitCommandManager = createObject(UnitCommand);
	}

	_completeMemberData(playerTurn?) {
		var unit = playerTurn.getTurnTargetUnit();
		var normalMov = playerTurn.tempNormalMov;
		
		delete playerTurn.tempNormalMov;
		
		if (typeof normalMov !== 'number') {
			return EnterResult.NOTENTER;
		}
		
		// normalMov refers to "Mov Consumed" through normal movement.
		// unit.getMostRecentMov() refers to "Mov Consumed" through "Use Leftover Mov".
		// Adding these together reveals the total movement distance.
		unit.setMostResentMov(normalMov + unit.getMostResentMov());
		
		if (!this._isTargetMovable(playerTurn)) {
			return EnterResult.NOTENTER;
		}
		
		this._unitCommandManager.setListCommandUnit(unit);
		this._unitCommandManager.openListCommandManager();
		
		return EnterResult.OK;
	}

	_isTargetMovable(playerTurn?) {
		var unit = playerTurn.getTurnTargetUnit();
		
		if (!this._isCommandAllowed(unit)) {
			return false;
		}
		
		if (!this._isTargetMovableInternal(unit)) {
			return false;
		}
		
		return unit.getMostResentMov() <= ParamBonus.getMov(unit);
	}

	_isCommandAllowed(unit?) {
		var skill = SkillControl.getPossessionSkill(unit, SkillType.REPEATMOVE);
		
		// If "Show Commands After Move" is enabled, getSkillValue returns 1.
		if (skill === null || skill.getSkillValue() !== 1) {
			// The 'Can "Move Agiain"' option in "Class Options" does not allow commands to be displayed.
			return false;
		}
		
		return true;
	}

	_isTargetMovableInternal(unit?) {
		if (StateControl.isBadStateOption(unit, BadStateOption.NOACTION)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return false;
		}
		
		if (StateControl.isBadStateOption(unit, BadStateOption.AUTO)) {
			return false;
		}
		
		return true;
	}
}

class UnitWaitFlowEntry extends BaseFlowEntry {

	_capsuleEvent: any = null;

	enterFlowEntry(playerTurn?) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	}

	moveFlowEntry() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_prepareMemberData(playerTurn?) {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeMemberData(playerTurn?) {
		var event;
		var unit = playerTurn.getTurnTargetUnit();
		
		unit.setMostResentMov(0);
		
		// Unless it's "Infinite Actions", then wait.
		if (!Miscellaneous.isPlayerFreeAction(unit)) {
			unit.setWait(true);
		}
		
		// Get a wait place event from the unit current position.
		event = this._getWaitEvent(unit);
		if (event === null) {
			return EnterResult.NOTENTER;
		}
		
		return this._capsuleEvent.enterCapsuleEvent(event, true);
	}

	_getWaitEvent(unit?) {
		var event = PosChecker.getPlaceEventFromUnit(PlaceEventType.WAIT, unit);
		
		if (event !== null && event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
			return event;
		}
		
		return null;
	}
}

class ReactionFlowEntry extends BaseFlowEntry {

	_targetUnit: any = null;

	_dynamicAnime: any = null;

	_skill: any = null;

	enterFlowEntry(playerTurn?) {
		this._prepareMemberData(playerTurn);
		return this._completeMemberData(playerTurn);
	}

	moveFlowEntry() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_prepareMemberData(playerTurn?) {
		this._targetUnit = playerTurn.getTurnTargetUnit();
		this._dynamicAnime = createObject(DynamicAnime);
	}

	_completeMemberData(playerTurn?) {
		if (!this._isReactionAllowed()) {
			return EnterResult.NOTENTER;
		}
		
		if (!this._checkReactionSkill()) {
			return EnterResult.NOTENTER;
		}
		
		this._startReactionAnime();
		
		return EnterResult.OK;
	}

	_isReactionAllowed() {
		if (this._targetUnit.getHp() === 0) {
			return false;
		}
		
		// Action again doesn't occur when it's "Infinite Actions".
		if (Miscellaneous.isPlayerFreeAction(this._targetUnit)) {
			return false;
		}
		
		return true;
	}

	_checkReactionSkill() {
		var skill;
		
		if (this._targetUnit.getReactionTurnCount() !== 0) {
			return false;
		}
		
		skill = SkillControl.getBestPossessionSkill(this._targetUnit, SkillType.REACTION);
		if (skill === null) {
			return false;
		}
		
		if (!Probability.getInvocationProbabilityFromSkill(this._targetUnit, skill)) {
			return false;
		}
		
		this._skill = skill;
		
		return true;
	}

	_doEndAction() {
		this._targetUnit.setReactionTurnCount(this._skill.getSkillValue());
		this._targetUnit.setWait(false);
		// The following code is for the enemy AI.
		this._targetUnit.setOrderMark(OrderMarkType.FREE);
	}

	_startReactionAnime() {
		var x = LayoutControl.getPixelX(this._targetUnit.getMapX());
		var y = LayoutControl.getPixelY(this._targetUnit.getMapY());
		var anime = this._getReactionAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y, anime);
	}

	_getReactionAnime() {
		return root.queryAnime('reaction');
	}
}
