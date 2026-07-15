
class UnitCommand extends BaseListCommandManager {

	_exitCommand: any = null;

	_isForceFinal: any = false;

	_moveOpen() {
		var object = this._commandScrollbar.getObject();
		var result = MoveResult.CONTINUE;
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			// Don't call this._commandScrollbar.setActive.
			// Even if cancelling with , move a mouse cursor for sure.
			this._commandScrollbar.setActiveSingle(true);
			MouseControl.changeCursorFromScrollbar(this._commandScrollbar, this._commandScrollbar.getIndex());
			
			this.changeCycleMode(ListCommandManagerMode.TITLE);
			
			if (this._isForceFinal) {
				this._isForceFinal = false;
				result = MoveResult.END;
			}
		}
		
		return result;
	}

	_checkTracingScroll() {
	}

	_playCommandOpenSound() {
	}

	endCommandAction(command?) {
		this._exitCommand = command;
		this._isForceFinal = true;
	}

	setExitCommand(command?) {
		this._exitCommand = command;
	}

	getExitCommand() {
		return this._exitCommand;
	}

	isRepeatMovable() {
		var object;
		var unit = this.getListCommandUnit();
		
		if (this._exitCommand !== null) {
			object = this._exitCommand;
		}
		else {
			object = this._commandScrollbar.getObject();
		}
		
		// A command doesn't allow to move again.
		if (!object.isRepeatMoveAllowed()) {
			return false;
		}
		
		// When it's "Infinite Actions", move again doesn't occur.
		if (Miscellaneous.isPlayerFreeAction(unit)) {
			return false;
		}
		
		if (unit.getClass().getClassOption() & ClassOptionFlag.REPEATMOVE) {
			return true;
		}
		
		if (SkillControl.getPossessionSkill(unit, SkillType.REPEATMOVE) !== null) {
			return true;
		}
		
		return false;
	}

	getPositionX() {
		var width = this.getCommandScrollbar().getScrollbarWidth();
		return LayoutControl.getUnitBaseX(this.getListCommandUnit(), width);
	}

	getPositionY() {
		var height = this.getCommandScrollbar().getScrollbarHeight();
		return LayoutControl.getUnitBaseY(this.getListCommandUnit(), height);
	}

	getCommandTextUI() {
		return root.queryTextUI('unitcommand_title');
	}

	configureCommands(groupArray?) {
		this._appendTalkEvent(groupArray);
		groupArray.appendObject(UnitCommand.Attack);
		groupArray.appendObject(UnitCommand.PlaceCommand);
		groupArray.appendObject(UnitCommand.Occupation);
		groupArray.appendObject(UnitCommand.Treasure);
		groupArray.appendObject(UnitCommand.Village);
		groupArray.appendObject(UnitCommand.Shop);
		groupArray.appendObject(UnitCommand.Gate);
		this._appendUnitEvent(groupArray);
		groupArray.appendObject(UnitCommand.Quick);
		groupArray.appendObject(UnitCommand.Steal);
		groupArray.appendObject(UnitCommand.Wand);
		groupArray.appendObject(UnitCommand.Information);
		this._appendMetamorphozeCommand(groupArray);
		this._appendFusionCommand(groupArray);
		groupArray.appendObject(UnitCommand.Item);
		groupArray.appendObject(UnitCommand.Trade);
		groupArray.appendObject(UnitCommand.Stock);
		groupArray.appendObject(UnitCommand.MetamorphozeCancel);
		groupArray.appendObject(UnitCommand.Wait);
	}

	_appendUnitEvent(groupArray?) {
		var i, event, info;
		var unit = this.getListCommandUnit();
		var count = unit.getUnitEventCount();
		
		for (i = 0; i < count; i++) {
			event = unit.getUnitEvent(i);
			info = event.getUnitEventInfo();
			if (info.getUnitEventType() === UnitEventType.COMMAND && event.isEvent()) {
				groupArray.appendObject(UnitCommand.UnitEvent);
				groupArray[groupArray.length - 1].setEvent(event);
			}
		}
	}

	_appendTalkEvent(groupArray?) {
		var i, j, x, y, targetUnit, event, text, talkInfo, src, dest, isEqual;
		var unit = this.getListCommandUnit();
		var arr = EventCommonArray.createArray(root.getCurrentSession().getTalkEventList(), EventType.TALK);
		var count = arr.length;
		var textArray = [];
		
		for (i = 0; i < count; i++) {
			event = arr[i];
			talkInfo = event.getTalkEventInfo();
			src = talkInfo.getSrcUnit();
			dest = talkInfo.getDestUnit();
			
			for (j = 0; j < DirectionType.COUNT; j++) {
				x = unit.getMapX() + XPoint[j];
				y = unit.getMapY() + YPoint[j];
				targetUnit = PosChecker.getUnitFromPos(x, y);
				if (targetUnit === null) {
					continue;
				}
				
				isEqual = false;
				
				if (unit === src && targetUnit === dest) {
					isEqual = true;
				}
				else if (talkInfo.isMutual()) {
					if (unit === dest && targetUnit === src) {
						isEqual = true;
					}
				}
				
				if (isEqual && event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
					text = talkInfo.getCommandText();
					if (textArray.indexOf(text) !== -1) {
						continue;
					}
					
					textArray.push(text);
					
					groupArray.appendObject(UnitCommand.Talk);
					groupArray[groupArray.length - 1].setCommandName(text);
				}
			}
		}
	}

	_appendFusionCommand(groupArray?) {
		var i, count, arr;
		var unit = this.getListCommandUnit();
		var fusionData = FusionControl.getFusionData(unit);
		
		if (fusionData === null) {
			arr = FusionControl.getFusionArray(unit);
			count = arr.length;
			for (i = 0; i < count; i++) {
				fusionData = arr[i];
				if (fusionData.getFusionType() === FusionType.ATTACK) {
					groupArray.appendObject(UnitCommand.FusionAttack);
					groupArray[groupArray.length - 1].setFusionData(fusionData);
				}
				else {
					groupArray.appendObject(UnitCommand.FusionCatch);
					groupArray[groupArray.length - 1].setFusionData(fusionData);
				}
			}
			
			for (i = 0; i < count; i++) {
				fusionData = arr[i];
				groupArray.appendObject(UnitCommand.FusionUnitTrade);
				groupArray[groupArray.length - 1].setFusionData(fusionData);
			}
		}
		else {
			groupArray.appendObject(UnitCommand.FusionRelease);
			groupArray[groupArray.length - 1].setFusionData(fusionData);
			
			groupArray.appendObject(UnitCommand.FusionUnitTrade);
			groupArray[groupArray.length - 1].setFusionData(fusionData);
		}
	}

	_appendMetamorphozeCommand(groupArray?) {
		var i, skillEntry;
		var unit = this.getListCommandUnit();
		var arr = SkillControl.getDirectSkillArray(unit, SkillType.METAMORPHOZE, '');
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			groupArray.appendObject(UnitCommand.Metamorphoze);
			skillEntry = arr[i];
			groupArray[groupArray.length - 1].setSkill(skillEntry.skill);
		}
	}
}

class UnitListCommand extends BaseListCommand {

	getCommandTarget() {
		return this._listCommandManager.getListCommandUnit();
	}

	endCommandAction() {
		this._listCommandManager.endCommandAction(this);
	}

	setExitCommand(command?) {
		this._listCommandManager.setExitCommand(command);
	}

	rebuildCommand() {
		this._listCommandManager.rebuildCommand();
	}

	isRepeatMoveAllowed() {
		return false;
	}
}

class UnitEventCommandMode {

	static TOP: any = 0;

	static EVENT: any = 1;
}

class TalkCommandMode {

	static TOP: any = 0;

	static EVENT: any = 1;
}

class StealCommandMode {

	static SELECT: any = 0;

	static TRADE: any = 1;

	static EXP: any = 2;
}

class QuickCommandMode {

	static SELECT: any = 0;

	static QUICK: any = 1;

	static DIRECT: any = 2;

	static EXP: any = 3;
}

class ShopCommandMode {

	static EVENT: any = 0;

	static SCREEN: any = 1;
}

class AttackCommandMode {

	static TOP: any = 0;

	static SELECTION: any = 1;

	static RESULT: any = 2;
}

class WandCommandMode {

	static TOP: any = 0;

	static SELECTION: any = 1;

	static USE: any = 2;
}

class ItemCommandMode {

	static TOP: any = 0;

	static SELECTION: any = 1;

	static USE: any = 2;
}

class TradeCommandMode {

	static SELECT: any = 0;

	static TRADE: any = 1;
}

class MetamorphozeCommandMode {

	static SELECT: any = 0;

	static EVENT: any = 1;
}

class FusionCommandMode {

	static SELECTION: any = 0;

	static ACTION: any = 1;
}

class BaseFusionCommand extends UnitListCommand {

	_posSelector: any = null;

	_dynamicEvent: any = null;

	_fusionData: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === FusionCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === FusionCommandMode.ACTION) {
			result = this._moveAction();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === FusionCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === FusionCommandMode.ACTION) {
			this._drawAction();
		}
	}

	isCommandDisplayable() {
		var indexArray = this._getFusionIndexArray(this.getCommandTarget());
		return indexArray.length !== 0;
	}

	getCommandName() {
		return '';
	}

	setFusionData(fusionData?) {
		this._fusionData = fusionData;
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.FUSION);
	}

	_prepareCommandMemberData() {
		this._posSelector = createObject(PosSelector);
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeCommandMemberData() {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getFusionIndexArray(this.getCommandTarget());
		
		if (this._isUnitSelection()) {
			this._posSelector.setUnitOnly(unit, null, indexArray, PosMenuType.Default, filter);
		}
		else {
			this._posSelector.setPosOnly(unit, null, indexArray, PosMenuType.Default);
		}
		
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(FusionCommandMode.SELECTION);
	}

	_moveSelection() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				this._changeAction();
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAction() {
		if (this._dynamicEvent.moveDynamicEvent() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawSelection() {
		this._posSelector.drawPosSelector();
	}

	_drawAction() {
	}

	_doEndAction() {
		this.endCommandAction();
	}

	_changeAction() {
		var generator = this._dynamicEvent.acquireEventGenerator();
		
		this._addFusionEvent(generator);
		this._dynamicEvent.executeDynamicEvent();
		this.changeCycleMode(FusionCommandMode.ACTION);
	}

	_addFusionEvent(generator?) {
	}

	_getFusionIndexArray(unit?) {
		return [];
	}

	_isUnitSelection() {
		return true;
	}

	_isPosSelectable() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	}

	_getUnitFilter() {
		return FilterControl.getBestFilter(this.getCommandTarget().getUnitType(), this._fusionData.getFilterFlag());
	}
}

namespace UnitCommand {
export class UnitEvent extends UnitListCommand {
	_capsuleEvent: any;


	_event: any = null;

	_mapCommonEvent: any = null;

	_questionWindow: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitEventCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === UnitEventCommandMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === UnitEventCommandMode.TOP) {
			this._drawTop();
		}
	}

	isCommandDisplayable() {
		var event = this._getEvent();
		
		return event !== null && event.isEvent();
	}

	getCommandName() {
		var event = this._getEvent();
		
		if (event === null) {
			return '';
		}
		
		return event.getUnitEventInfo().getCommandText();
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.UNITEVENT);
	}

	setEvent(event?) {
		this._event = event;
	}

	_prepareCommandMemberData() {
		this._capsuleEvent = createObject(CapsuleEvent);
		this._questionWindow = createWindowObject(QuestionWindow, this);
	}

	_completeCommandMemberData() {
		var event = this._getEvent();
		var msg = event.getUnitEventInfo().getQuestionText();
		
		if (msg !== '') {
			this._questionWindow.setQuestionMessage(msg);
			this._questionWindow.setQuestionActive(true);
			this.changeCycleMode(UnitEventCommandMode.TOP);
		}
		else {
			this._changeEvent();
		}
	}

	_moveTop() {
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._changeEvent();
				return MoveResult.CONTINUE;
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			if (!UnitEventChecker.isCancelFlag()) {
				// Cancel doesn't occur, it means that some operation is done, so end it.
				this.endCommandAction();
			}
			UnitEventChecker.setCancelFlag(false);
			return MoveResult.END;
		}
		
		return result;
	}

	_drawTop() {
		var width = this._questionWindow.getWindowWidth();
		var height = this._questionWindow.getWindowHeight();
		var x = LayoutControl.getCenterX(-1, width);
		var y = LayoutControl.getCenterY(-1, height);
		
		this._questionWindow.drawWindow(x, y);
	}

	_changeEvent() {
		var event = this._getEvent();
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
		
		UnitEventChecker.setCancelFlag(false);
		
		this.changeCycleMode(UnitEventCommandMode.EVENT);
	}

	_getEvent() {
		return this._event;
	}
}

export class PlaceCommand extends UnitListCommand {

	_capsuleEvent: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return result;
	}

	isCommandDisplayable() {
		var event = this._getEvent();
		
		return event !== null && event.getPlaceEventInfo().getPlaceCustomType() === PlaceCustomType.COMMAND &&
			(event.getPlaceEventInfo().isAlwaysVisible() ? true : event.getExecutedMark() === EventExecutedType.FREE) && event.isEvent();
	}

	getCommandName() {
		var event = this._getEvent();
		
		return event.getPlaceEventInfo().getCommandText();
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.CUSTOM);
	}

	_prepareCommandMemberData() {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeCommandMemberData() {
		var event = this._getEvent();
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
	}

	_getEvent() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.CUSTOM, this.getCommandTarget());
	}
}

export class Talk extends UnitListCommand {

	_posSelector: any = null;

	_capsuleEvent: any = null;

	_text: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === TalkCommandMode.TOP) {
			result = this._moveTopMode();
		}
		else if (mode === TalkCommandMode.EVENT) {
			result = this._moveEventMode();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === TalkCommandMode.TOP) {
			this._posSelector.drawPosSelector();
		}
	}

	isCommandDisplayable() {
		return true;
	}

	getCommandName() {
		return this._text;
	}

	setCommandName(text?) {
		this._text = text;
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.TALK);
	}

	_prepareCommandMemberData() {
		this._posSelector = createObject(PosSelector);
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeCommandMemberData() {
		var unit = this.getCommandTarget();
		var filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY | UnitFilterFlag.ENEMY;
		var indexArray = this._getTalkEventArray(unit);
		
		this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(TalkCommandMode.TOP);
	}

	_moveTopMode() {
		var unit, dest, event, recollectionEvent;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				unit = this.getCommandTarget();
				dest = this._posSelector.getSelectorTarget(false);
				event = this._getTargetEvent();
				if (event !== null) {
					this._posSelector.endPosSelector();
					this._capsuleEvent.enterCapsuleEvent(event, true);
					
					this.changeCycleMode(TalkCommandMode.EVENT);
				}
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEventMode() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_getTalkEventArray(unit?) {
		var i, x, y, targetUnit, event;
		var indexArray = [];
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null) {
				event = this._getTalkEvent(unit, targetUnit);
				if (event !== null) {
					indexArray.push(CurrentMap.getIndex(x, y));
				}
			}
		}
		
		return indexArray;
	}

	_isPosSelectable() {
		var event;
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit!== null) {
			event = this._getTalkEvent(this.getCommandTarget(), targetUnit);
			if (event !== null) {
				return targetUnit;
			}
		}
		
		return null;
	}

	_getTalkEvent(unit?, targetUnit?) {
		var i, event, talkInfo, src, dest, isEqual;
		var arr = EventCommonArray.createArray(root.getCurrentSession().getTalkEventList(), EventType.TALK);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			event = arr[i];
			talkInfo = event.getTalkEventInfo();
			src = talkInfo.getSrcUnit();
			dest = talkInfo.getDestUnit();
			
			isEqual = false;
			
			if (unit === src && targetUnit === dest) {
				isEqual = true;
			}
			else if (talkInfo.isMutual()) {
				if (unit === dest && targetUnit === src) {
					isEqual = true;
				}
			}
			
			if (isEqual && talkInfo.getCommandText() === this._text) {
				if (event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
					return event;
				}
			}
		}
		
		return null;
	}

	_getTargetEvent() {
		var unit = this.getCommandTarget();
		var dest = this._posSelector.getSelectorTarget(true);
		
		return this._getTalkEvent(unit, dest);
	}
}

export class Steal extends UnitListCommand {

	_dynamicEvent: any = null;

	_posSelector: any = null;

	_exp: any = 0;

	_unitItemStealScreen: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === StealCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === StealCommandMode.TRADE) {
			result = this._moveTrade();
		}
		else if (mode === StealCommandMode.EXP) {
			result = this._moveExp();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === StealCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === StealCommandMode.TRADE) {
			this._drawTrade();
		}
		else if (mode === StealCommandMode.EXP) {
			this._drawExp();
		}
	}

	isCommandDisplayable() {
		var indexArray = this._getTradeArray(this.getCommandTarget());
		return indexArray.length !== 0;
	}

	getCommandName() {
		var text = '';
		var skill = SkillControl.getPossessionSkill(this.getCommandTarget(), SkillType.STEAL);
		
		if (skill !== null) {
			text = skill.getCustomKeyword();
		}
		
		return text;
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.STEAL);
	}

	_prepareCommandMemberData() {
		this._posSelector = createObject(PosSelector);
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeCommandMemberData() {
		this._changeSelect();
	}

	_moveSelect() {
		var screenParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				
				screenParam = this._createScreenParam();
				
				this._unitItemStealScreen = createObject(UnitItemStealScreen);
				SceneManager.addScreen(this._unitItemStealScreen, screenParam);
			
				this.changeCycleMode(StealCommandMode.TRADE);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTrade() {
		var unit, generator, resultCode;
		
		if (SceneManager.isScreenClosed(this._unitItemStealScreen)) {
			resultCode = this._unitItemStealScreen.getScreenResult();
			if (resultCode === UnitItemTradeResult.TRADEEND) {
				if (this._exp > 0) {
					unit = this.getCommandTarget();
					generator = this._dynamicEvent.acquireEventGenerator();
					generator.experiencePlus(unit, ExperienceCalculator.getBestExperience(unit, this._exp), false);
					this._dynamicEvent.executeDynamicEvent();
					this.changeCycleMode(StealCommandMode.EXP);
				}
				else {
					this.endCommandAction();
					return MoveResult.END;
				}
			}
			else {
				this._changeSelect();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveExp() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.endCommandAction();
		}
		
		return result;
	}

	_drawSelect() {
		this._posSelector.drawPosSelector();
	}

	_drawTrade() {
	}

	_drawExp() {
	}

	_changeSelect() {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getTradeArray(this.getCommandTarget());
		
		this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(StealCommandMode.SELECT);
	}

	_getTradeArray(unit?) {
		var i, x, y, targetUnit, skill;
		var indexArray = [];
		
		skill = SkillControl.getBestPossessionSkill(unit, SkillType.STEAL);
		if (skill === null) {
			return indexArray;
		}
		
		// There is a possibility that "Steal" occurs with the item skill and it doesn't mean that skill can be learnt after trading,
		// so save it at the variable.
		this._exp = skill.getSkillSubValue();
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && this._isTargetAllowed(targetUnit, unit, skill)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}

	_isTargetAllowed(targetUnit?, unit?, skill?) {
		if (targetUnit.getUnitType() !== UnitType.ENEMY) {
			return false;
		}
		
		if (!Miscellaneous.isStealEnabled(unit, targetUnit, skill.getSkillValue())) {
			return false;
		}
		
		if (!skill.getTargetAggregation().isCondition(targetUnit)) {
			return false;
		}
		
		return true;
	}

	_isPosSelectable() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	}

	_getUnitFilter() {
		return FilterControl.getReverseFilter(this.getCommandTarget().getUnitType());
	}

	_createScreenParam() {
		var skill = SkillControl.getBestPossessionSkill(this.getCommandTarget(), SkillType.STEAL);
		var screenParam = ScreenBuilder.buildUnitItemSteal();
		
		screenParam.unit = this.getCommandTarget();
		screenParam.targetUnit = this._posSelector.getSelectorTarget(false);
		if (skill !== null) {
			screenParam.stealFlag = skill.getSkillValue();
		}
		
		return screenParam;
	}
}

export class Quick extends UnitListCommand {
	_indexArray: any;


	_dynamicEvent: any = null;

	_dynamicAnime: any = null;

	_posSelector: any = null;

	_exp: any = 0;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === QuickCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === QuickCommandMode.QUICK) {
			result = this._moveQuick();
		}
		else if (mode === QuickCommandMode.DIRECT) {
			result = this._moveDirect();
		}
		else if (mode === QuickCommandMode.EXP) {
			result = this._moveExp();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === QuickCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === QuickCommandMode.QUICK) {
			this._drawQuick();
		}
		else if (mode === QuickCommandMode.DIRECT) {
			this._drawDirect();
		}
		else if (mode === QuickCommandMode.EXP) {
			this._drawExp();
		}
	}

	isCommandDisplayable() {
		var indexArray = this._getTradeArray(this.getCommandTarget());
		return indexArray.length !== 0;
	}

	getCommandName() {
		var text = '';
		var skill = SkillControl.getPossessionSkill(this.getCommandTarget(), SkillType.QUICK);
		
		if (skill !== null) {
			text = skill.getCustomKeyword();
		}
		
		return text;
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.QUICK);
	}

	_prepareCommandMemberData() {
		this._posSelector = createObject(PosSelector);
		this._dynamicEvent = createObject(DynamicEvent);
		this._dynamicAnime = createObject(DynamicAnime);
	}

	_completeCommandMemberData() {
		var skill;
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getTradeArray(this.getCommandTarget());
		
		skill = SkillControl.getBestPossessionSkill(this.getCommandTarget(), SkillType.QUICK);
		if (skill === null) {
			return;
		}
		
		this._exp = skill.getSkillSubValue();
		
		if (skill.getSkillValue() === 0) {
			this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
			this._posSelector.setFirstPos();
			this.changeCycleMode(QuickCommandMode.SELECT);
		}
		else {
			this._indexArray = indexArray;
			this._showAnime(this.getCommandTarget());
			this.changeCycleMode(QuickCommandMode.DIRECT);
		}
	}

	_moveSelect() {
		var screenParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				this._showAnime(this._posSelector.getSelectorTarget(true));
				this.changeCycleMode(QuickCommandMode.QUICK);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveQuick() {
		var targetUnit;
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			targetUnit = this._posSelector.getSelectorTarget(true);
			targetUnit.setWait(false);
			if (this._exp > 0) {
				this._changeExp();
			}
			else {
				this.endCommandAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveDirect() {
		var i, count, x, y, targetUnit;
		
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			count = this._indexArray.length;
			for (i = 0; i < count; i++) {
				x = CurrentMap.getX(this._indexArray[i]);
				y = CurrentMap.getY(this._indexArray[i]);
				targetUnit = PosChecker.getUnitFromPos(x, y);
				if (targetUnit !== null) {
					targetUnit.setWait(false);
				}
			}
			
			if (this._exp > 0) {
				this._changeExp();
			}
			else {
				this.endCommandAction();
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveExp() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.endCommandAction();
		}
		
		return result;
	}

	_drawSelect() {
		this._posSelector.drawPosSelector();
	}

	_drawQuick() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_drawDirect() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_drawExp() {
	}

	_changeExp() {
		var generator = this._dynamicEvent.acquireEventGenerator();
		var unit = this.getCommandTarget();
		
		generator.experiencePlus(unit, ExperienceCalculator.getBestExperience(unit, this._exp), false);
		this._dynamicEvent.executeDynamicEvent();
		this.changeCycleMode(QuickCommandMode.EXP);
	}

	_getTradeArray(unit?) {
		var i, x, y, targetUnit, skill;
		var indexArray = [];
		
		skill = SkillControl.getBestPossessionSkill(unit, SkillType.QUICK);
		if (skill === null) {
			return indexArray;
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && this._isTargetAllowed(targetUnit, unit, skill)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}

	_isTargetAllowed(targetUnit?, unit?, skill?) {
		if (!targetUnit.isWait()) {
			return false;
		}
		
		if (targetUnit.getUnitType() !== unit.getUnitType()) {
			return false;
		}
		
		if (!skill.getTargetAggregation().isCondition(targetUnit)) {
			return false;
		}
		
		return true;
	}

	_isPosSelectable() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	}

	_getUnitFilter() {
		return FilterControl.getNormalFilter(this.getCommandTarget().getUnitType());
	}

	_showAnime(unit?) {
		var x = LayoutControl.getPixelX(unit.getMapX());
		var y = LayoutControl.getPixelY(unit.getMapY());
		var anime = this._getQuickAnime(unit);
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}

	_getQuickAnime(unit?) {
		return root.queryAnime('quick');
	}
}

export class Occupation extends UnitListCommand {

	_capsuleEvent: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	isCommandDisplayable() {
		var event;
		
		// The entry of "Seize" is shown only with a leader.
		if (this.getCommandTarget().getImportance() !== ImportanceType.LEADER) {
			return false;
		}

		event = this._getEvent();
		
		return event !== null && event.getExecutedMark() === EventExecutedType.FREE && event.isEvent();
	}

	getCommandName() {
		return root.queryCommand('occupation_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.OCCUPATION);
	}

	_prepareCommandMemberData() {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeCommandMemberData() {
		var event = this._getEvent();
		var placeInfo = event.getPlaceEventInfo();
		
		if (placeInfo !== null) {
			placeInfo.startMapChipChange();
		}
		
		this._capsuleEvent.enterCapsuleEvent(event, true);
	}

	_getEvent() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.OCCUPATION, this.getCommandTarget());
	}
}

export class Village extends UnitListCommand {

	_eventTrophy: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (this._eventTrophy.moveEventTrophyCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return result;
	}

	drawCommand() {
		this._eventTrophy.drawEventTrophyCycle();
	}

	isCommandDisplayable() {
		var event = this._getEvent();
		
		return event !== null && event.getExecutedMark() === EventExecutedType.FREE && event.isEvent();
	}

	getCommandName() {
		return root.queryCommand('village_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.VILLAGE);
	}

	_prepareCommandMemberData() {
		this._eventTrophy = createObject(EventTrophy);
	}

	_completeCommandMemberData() {
		var event = this._getEvent();
		
		this._eventTrophy.enterEventTrophyCycle(this.getCommandTarget(), event);
	}

	_getEvent() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.VILLAGE, this.getCommandTarget());
	}
}

export class Information extends UnitListCommand {

	_capsuleEvent: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return result;
	}

	isCommandDisplayable() {
		var event = this._getEvent();
		
		return event !== null && event.isEvent();
	}

	getCommandName() {
		return root.queryCommand('information_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.INFRORMATION);
	}

	_prepareCommandMemberData() {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeCommandMemberData() {
		var event = this._getEvent();
		
		// Specify false so as not to be executed.
		this._capsuleEvent.enterCapsuleEvent(event, false);
	}

	_getEvent() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.INFORMATION, this.getCommandTarget());
	}
}

export class Shop extends UnitListCommand {

	_capsuleEvent: any = null;

	_shopLayoutScreen: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ShopCommandMode.EVENT) {
			result = this._moveTop();
		}
		else if (mode === ShopCommandMode.SCREEN) {
			result = this._moveScreen();
		}
		
		return result;
	}

	isCommandDisplayable() { 
		var event = this._getEvent();
		
		return event !== null && Miscellaneous.isItemAccess(this.getCommandTarget()) && event.isEvent();
	}

	getCommandName() {
		return this._getEvent().getPlaceEventInfo().getShopData().getShopLayout().getCommandName();
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.SHOP);
	}

	_prepareCommandMemberData() {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeCommandMemberData() {
		var event = this._getEvent();
		
		// Specify false so as not to be executed.
		this._capsuleEvent.enterCapsuleEvent(event, false);
		this.changeCycleMode(ShopCommandMode.EVENT);
	}

	_moveTop() {
		var screenParam;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			screenParam = this._createScreenParam();
			this._shopLayoutScreen = createObject(ShopLayoutScreen);
			this._shopLayoutScreen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
			SceneManager.addScreen(this._shopLayoutScreen, screenParam);
			
			this.changeCycleMode(ShopCommandMode.SCREEN);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveScreen() {
		if (SceneManager.isScreenClosed(this._shopLayoutScreen)) {
			if (this._shopLayoutScreen.getScreenResult() === ShopLayoutResult.ACTION) {
				this.endCommandAction();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_getEvent() {
		return PosChecker.getPlaceEventFromUnit(PlaceEventType.SHOP, this.getCommandTarget());
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._getEvent().getPlaceEventInfo().getShopData();
		
		screenParam.unit = this.getCommandTarget();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.shopLayout = shopData.getShopLayout();
		
		return screenParam;
	}
}

export class Treasure extends UnitListCommand {

	_keyData: any = null;

	_keyNavigator: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		if (this._keyNavigator.moveKeyNavigator() !== MoveResult.CONTINUE) {
			if (this._keyNavigator.isUsed()) {
				this.endCommandAction();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawCommand() {
		this._keyNavigator.drawKeyNavigator();
	}

	isCommandDisplayable() {
		var skill, item;
		var requireFlag = KeyFlag.TREASURE;
		var unit = this.getCommandTarget();
		
		this._keyData = null;
		
		if (!DataConfig.isTreasureKeyEnabled()) {
			this._keyData = KeyEventChecker.buildKeyDataDefault();
		}
		
		if (this._keyData === null) {
			skill = SkillControl.getPossessionSkill(unit, SkillType.PICKING);
			if (skill !== null) {
				this._keyData = KeyEventChecker.buildKeyDataSkill(skill, requireFlag);
			}
		}
		
		if (this._keyData === null) {
			item = ItemControl.getKeyItem(unit, requireFlag);
			if (item !== null) {
				this._keyData = KeyEventChecker.buildKeyDataItem(item, requireFlag);
			}
		}
		
		if (this._keyData === null) {
			return false;
		}
		
		return KeyEventChecker.getIndexArrayFromKeyType(unit, this._keyData).length > 0;
	}

	getCommandName() {
		return root.queryCommand('treasure_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.KEY);
	}

	_prepareCommandMemberData() {
		this._keyNavigator = createObject(KeyNavigator);
	}

	_completeCommandMemberData() {
		this._keyNavigator.openKeyNavigator(this.getCommandTarget(), this._keyData);
	}
}

export class Gate extends UnitListCommand {

	_keyData: any = null;

	_keyNavigator: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		if (this._keyNavigator.moveKeyNavigator() !== MoveResult.CONTINUE) {
			if (this._keyNavigator.isUsed()) {
				this.endCommandAction();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawCommand() {
		this._keyNavigator.drawKeyNavigator();
	}

	isCommandDisplayable() {
		var skill, item;
		var requireFlag = KeyFlag.GATE;
		var unit = this.getCommandTarget();
		
		this._keyData = null;
		
		skill = SkillControl.getPossessionSkill(unit, SkillType.PICKING);
		if (skill !== null) {
			this._keyData = KeyEventChecker.buildKeyDataSkill(skill, requireFlag);
		}
		
		if (this._keyData === null) {
			item = ItemControl.getKeyItem(unit, requireFlag);
			if (item !== null) {
				this._keyData = KeyEventChecker.buildKeyDataItem(item, requireFlag);
			}
		}
		
		if (this._keyData === null) {
			return false;
		}
		
		return KeyEventChecker.getIndexArrayFromKeyType(unit, this._keyData).length > 0;
	}

	getCommandName() {
		return root.queryCommand('gate_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.KEY);
	}

	_prepareCommandMemberData() {
		this._keyNavigator = createObject(KeyNavigator);
	}

	_completeCommandMemberData() {
		this._keyNavigator.openKeyNavigator(this.getCommandTarget(), this._keyData);
	}
}

export class Attack extends UnitListCommand {
	_preAttack: any;


	_weaponSelectMenu: any = null;

	_posSelector: any = null;

	_isWeaponSelectDisabled: any = false;

	_weaponPrev: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === AttackCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === AttackCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === AttackCommandMode.RESULT) {
			result = this._moveResult();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === AttackCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === AttackCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === AttackCommandMode.RESULT) {
			this._drawResult();
		}
	}

	isCommandDisplayable() {
		return AttackChecker.isUnitAttackable(this.getCommandTarget());
	}

	getCommandName() {
		return root.queryCommand('attack_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.ATTACK);
	}

	_prepareCommandMemberData() {
		this._weaponSelectMenu = createObject(WeaponSelectMenu);
		this._posSelector = createObject(PosSelector);
		this._isWeaponSelectDisabled = this._checkWeaponSelectionDisabled();
	}

	_completeCommandMemberData() {
		if (this._isWeaponSelectDisabled) {
			this._startSelection(ItemControl.getEquippedWeapon(this.getCommandTarget()));
		}
		else {
			this._weaponSelectMenu.setMenuTarget(this.getCommandTarget());
			this._weaponPrev = this._weaponSelectMenu.getSelectWeapon();
			this.changeCycleMode(AttackCommandMode.TOP);
		}
	}

	_checkWeaponSelectionDisabled() {
		var isDisabled = false;
		
		// If "Skip weapon select menu when only have 1 weapon" is enabled and there is only one equippable weapon, disable weapon selection.
		if (DataConfig.isWeaponSelectSkippable() && this._getWeaponCount() === 1) {
			isDisabled = true;
		}
		
		return isDisabled;
	}

	_getWeaponCount() {
		var i, weapon;
		var unit = this.getCommandTarget();
		var count = UnitItemControl.getPossessionItemCount(unit);
		var weaponCount = 0;
		
		for (i = 0; i < count; i++) {
			weapon = UnitItemControl.getItem(unit, i);
			if (weapon === null) {
				continue;
			}
			
			if (ItemControl.isWeaponAvailable(unit, weapon)) {
				weaponCount++;
			}
		}
		
		return weaponCount;
	}

	_startSelection(weapon?) {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getIndexArray(unit, weapon);
		
		// Equip with the selected item.
		ItemControl.setEquippedWeapon(unit, weapon);
		
		this._posSelector.setUnitOnly(unit, weapon, indexArray, PosMenuType.Attack, filter);
		this._posSelector.setFirstPos();
		
		this.changeCycleMode(AttackCommandMode.SELECTION);
	}

	_moveTop() {
		var weapon;
		var input = this._weaponSelectMenu.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
			weapon = this._weaponSelectMenu.getSelectWeapon();
			this._startSelection(weapon);
		}
		else if (input === ScrollbarInput.CANCEL) {
			if (this._weaponPrev !== this._weaponSelectMenu.getSelectWeapon()) {
				// Rebuild the command because the equipped weapon has changed.
				// For example, if the equipped weapon includes "Steal" as "Optional Skills", "Steal" must be removed from the command.
				this.rebuildCommand();
			}
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelection() {
		var attackParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable()) {
				this._posSelector.endPosSelector();
				
				attackParam = this._createAttackParam();
				
				this._preAttack = createObject(PreAttack);
				result = this._preAttack.enterPreAttackCycle(attackParam);
				if (result === EnterResult.NOTENTER) {
					this.endCommandAction();
					return MoveResult.END;
				}
				
				this.changeCycleMode(AttackCommandMode.RESULT);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			if (this._isWeaponSelectDisabled) {
				return MoveResult.END;
			}
			
			this._weaponSelectMenu.setMenuTarget(this.getCommandTarget());
			this.changeCycleMode(AttackCommandMode.TOP);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveResult() {
		if (this._preAttack.movePreAttackCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawTop() {
		this._weaponSelectMenu.drawWindowManager();
	}

	_drawSelection() {
		this._posSelector.drawPosSelector();
	}

	_drawResult() {
		if (this._preAttack.isPosMenuDraw()) {
			// Without the following code, it flickers at the easy battle.
			this._posSelector.drawPosMenu();
		}
		
		this._preAttack.drawPreAttackCycle();
	}

	_isPosSelectable() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null;
	}

	_getUnitFilter() {
		return FilterControl.getReverseFilter(this.getCommandTarget().getUnitType());
	}

	_getIndexArray(unit?, weapon?) {
		return AttackChecker.getAttackIndexArray(unit, weapon, false);
	}

	_createAttackParam() {
		var attackParam = StructureBuilder.buildAttackParam();
		
		attackParam.unit = this.getCommandTarget();
		attackParam.targetUnit = this._posSelector.getSelectorTarget(false);
		attackParam.attackStartType = AttackStartType.NORMAL;
		
		return attackParam;
	}
}

export class Wand extends UnitListCommand {

	_itemUse: any = null;

	_itemSelection: any = null;

	_itemSelectMenu: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === WandCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === WandCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === WandCommandMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === WandCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === WandCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === WandCommandMode.USE) {
			this._drawUse();
		}
	}

	isCommandDisplayable() {
		return WandChecker.isWandUsable(this.getCommandTarget());
	}

	getCommandName() {
		return root.queryCommand('wand_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.ITEM);
	}

	_prepareCommandMemberData() {
		this._itemUse = null;
		this._itemSelection = null;
		this._itemSelectMenu = createObject(WandSelectMenu);
	}

	_completeCommandMemberData() {
		this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
		this.changeCycleMode(WandCommandMode.TOP);
	}

	_moveTop() {
		var item;
		var unit = this.getCommandTarget();
		var input = this._itemSelectMenu.moveWindowManager();
		
		if (input === ScrollbarInput.SELECT) {
			item = this._itemSelectMenu.getSelectWand();
			this._itemSelection = ItemPackageControl.getItemSelectionObject(item);
			if (this._itemSelection !== null) {
				if (this._itemSelection.enterItemSelectionCycle(unit, item) === EnterResult.NOTENTER) {
					this._useItem();
					this.changeCycleMode(WandCommandMode.USE);
				}
				else {
					this.changeCycleMode(WandCommandMode.SELECTION);
				}
			}
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelection() {
		if (this._itemSelection.moveItemSelectionCycle() !== MoveResult.CONTINUE) {
			if (this._itemSelection.isSelection()) {
				this._useItem();
				this.changeCycleMode(WandCommandMode.USE);
			}
			else {
				this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
				this.changeCycleMode(WandCommandMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveUse() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawTop() {
		this._itemSelectMenu.drawWindowManager();
	}

	_drawSelection() {
		this._itemSelection.drawItemSelectionCycle();
	}

	_drawUse() {
		this._itemUse.drawUseCycle();
	}

	_useItem() {
		var itemTargetInfo;
		var item = this._itemSelectMenu.getSelectWand();
		
		this._itemUse = ItemPackageControl.getItemUseParent(item);
		itemTargetInfo = this._itemSelection.getResultItemTargetInfo();
		
		itemTargetInfo.unit = this.getCommandTarget();
		itemTargetInfo.item = item;
		itemTargetInfo.isPlayerSideCall = true;
		this._itemUse.enterUseCycle(itemTargetInfo);
	}
}

export class Item extends UnitListCommand {

	_itemUse: any = null;

	_itemSelectMenu: any = null;

	_itemSelection: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemCommandMode.TOP) {
			result = this._moveTop();
		}
		else if (mode === ItemCommandMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === ItemCommandMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === ItemCommandMode.TOP) {
			this._drawTop();
		}
		else if (mode === ItemCommandMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === ItemCommandMode.USE) {
			this._drawUse();
		}
	}

	isCommandDisplayable() {
		return UnitItemControl.getPossessionItemCount(this.getCommandTarget()) > 0;
	}

	getCommandName() {
		return root.queryCommand('item_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.ITEM);
	}

	_prepareCommandMemberData() {
		this._itemUse = null;
		this._itemSelection = null;
		this._itemSelectMenu = createObject(ItemSelectMenu);
	}

	_completeCommandMemberData() {
		this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
		this.changeCycleMode(ItemCommandMode.TOP);
	}

	_moveTop() {
		var item;
		var unit = this.getCommandTarget();
		var result = this._itemSelectMenu.moveWindowManager();
		
		if (result === ItemSelectMenuResult.USE) {
			item = this._itemSelectMenu.getSelectItem();
			this._itemSelection = ItemPackageControl.getItemSelectionObject(item);
			if (this._itemSelection !== null) {
				if (this._itemSelection.enterItemSelectionCycle(unit, item) === EnterResult.NOTENTER) {
					this._useItem();
					this.changeCycleMode(ItemCommandMode.USE);
				}
				else {
					this.changeCycleMode(ItemCommandMode.SELECTION);
				}
			}
		}
		else if (result === ItemSelectMenuResult.CANCEL) {
			// Rebuild the command. This is because the weapons equipped on the unit may have been changed or items may have been discarded.
			this.rebuildCommand();
			
			// If the item is discarded, it's supposed that action has occurred.
			if (this._itemSelectMenu.isDiscardAction()) {
				this.endCommandAction();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSelection() {
		if (this._itemSelection.moveItemSelectionCycle() !== MoveResult.CONTINUE) {
			if (this._itemSelection.isSelection()) {
				this._useItem();
				this.changeCycleMode(ItemCommandMode.USE);
			}
			else {
				this._itemSelectMenu.setMenuTarget(this.getCommandTarget());
				this.changeCycleMode(ItemCommandMode.TOP);
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveUse() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawTop() {
		this._itemSelectMenu.drawWindowManager();
	}

	_drawSelection() {
		this._itemSelection.drawItemSelectionCycle();
	}

	_drawUse() {
		this._itemUse.drawUseCycle();
	}

	_useItem() {
		var itemTargetInfo;
		var item = this._itemSelectMenu.getSelectItem();
		
		this._itemUse = ItemPackageControl.getItemUseParent(item);
		itemTargetInfo = this._itemSelection.getResultItemTargetInfo();
		
		itemTargetInfo.unit = this.getCommandTarget();
		itemTargetInfo.item = item;
		itemTargetInfo.isPlayerSideCall = true;
		this._itemUse.enterUseCycle(itemTargetInfo);
	}
}

export class Trade extends UnitListCommand {

	_posSelector: any = null;

	_unitItemTradeScreen: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === TradeCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === TradeCommandMode.TRADE) {
			result = this._moveTrade();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === TradeCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === TradeCommandMode.TRADE) {
			this._drawTrade();
		}
	}

	isCommandDisplayable() {
		var indexArray = this._getTradeArray(this.getCommandTarget());
		return indexArray.length !== 0;
	}

	getCommandName() {
		return root.queryCommand('exchange_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.TRADE);
	}

	_prepareCommandMemberData() {
		this._posSelector = createObject(PosSelector);
	}

	_completeCommandMemberData() {
		var unit = this.getCommandTarget();
		var filter = this._getUnitFilter();
		var indexArray = this._getTradeArray(this.getCommandTarget());
		
		this._posSelector.setUnitOnly(unit, ItemControl.getEquippedWeapon(unit), indexArray, PosMenuType.Default, filter);
		this._posSelector.setFirstPos();
		this._posSelector.includeFusion();
		
		this.changeCycleMode(TradeCommandMode.SELECT);
	}

	_moveSelect() {
		var screenParam;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this._isPosSelectable() && this._isTargetEnabled()) {
				this._posSelector.endPosSelector();
				
				screenParam = this._createScreenParam();
				
				this._unitItemTradeScreen = createObject(UnitItemTradeScreen);
				SceneManager.addScreen(this._unitItemTradeScreen, screenParam);
			
				this.changeCycleMode(TradeCommandMode.TRADE);
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTrade() {
		var resultCode;
		
		if (SceneManager.isScreenClosed(this._unitItemTradeScreen)) {
			resultCode = this._unitItemTradeScreen.getScreenResult();
			if (resultCode === UnitItemTradeResult.TRADEEND) {
				// For trading items, after trading it, it isn't immediately a wait mode, but mark it with some sort of operation has been done.
				this.setExitCommand(this);
				
				// With trading items, commands which can be executed may be increased, so rebuild it.
				this.rebuildCommand();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawSelect() {
		this._posSelector.drawPosSelector();
	}

	_drawTrade() {
	}

	_getTradeArray(unit?) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		if (!Miscellaneous.isItemAccess(unit)) {
			return indexArray;
		}
		
		if (this._isFusionTradable(unit)) {
			indexArray.push(CurrentMap.getIndex(unit.getMapX(), unit.getMapY()));
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && this._isTradable(targetUnit)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}

	_isTradable(targetUnit?) {
		if (targetUnit.getUnitType() !== UnitType.PLAYER) {
			return false;
		}
		
		if (!Miscellaneous.isItemAccess(targetUnit)) {
			return false;
		}
		
		// If "Berserk" state, cannot trade the item.
		if (StateControl.isBadStateOption(targetUnit, BadStateOption.BERSERK)) {
			return false;
		}
		
		return true;
	}

	_isFusionTradable(unit?) {
		var targetUnit;
		
		if (!FusionControl.isItemTradable(unit)) {
			return false;
		}
		
		targetUnit = FusionControl.getFusionChild(unit);
		if (targetUnit === null) {
			return false;
		}
		
		return targetUnit.getUnitType() !== UnitType.ALLY;
	}

	_isPosSelectable() {
		var unit = this._posSelector.getSelectorTarget(true);
		
		return unit !== null && Miscellaneous.isItemAccess(unit);
	}

	_isTargetEnabled() {
		var unit = this.getCommandTarget();
		var child = FusionControl.getFusionChild(unit);
		
		// If the target for trading items is a fused unit, check if the fusion data allows item trading.
		if (child === this._posSelector.getSelectorTarget(true) && !FusionControl.isItemTradable(unit)) {
			return false;
		}
		
		return true;
	}

	_getUnitFilter() {
		return FilterControl.getNormalFilter(this.getCommandTarget().getUnitType());
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitItemTrade();
		
		screenParam.unit = this.getCommandTarget();
		screenParam.targetUnit = this._posSelector.getSelectorTarget(false);
		
		return screenParam;
	}
}

export class Stock extends UnitListCommand {

	_stockItemTradeScreen: any = null;

	openCommand() {
		var screenParam = this._createScreenParam();
		
		this._stockItemTradeScreen = createObject(DataConfig.isStockTradeWeaponTypeAllowed() ? CategoryStockItemTradeScreen : StockItemTradeScreen);
		SceneManager.addScreen(this._stockItemTradeScreen, screenParam);
	}

	moveCommand() {
		var resultCode;
		
		if (SceneManager.isScreenClosed(this._stockItemTradeScreen)) {
			resultCode = this._stockItemTradeScreen.getScreenResult();
			if (resultCode === StockItemTradeResult.TRADEEND) {
				// For trading the stock, after trading it, it isn't immediately a wait mode, but mark it with some sort of operation has been done.
				this.setExitCommand(this);
				
				// With trading stock, commands which can be executed may be increased, so rebuild it.
				this.rebuildCommand();
			}
			
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	isCommandDisplayable() {
		var indexArray;
		
		if (!root.getCurrentSession().isMapState(MapStateType.STOCKSHOW)) {
			return false;
		}
		
		// Check if it's the unit who can access the stock.
		if (this._isTradable(this.getCommandTarget())) {
			return true;
		}
		
		// Check if the adjacent unit can access the stock.
		indexArray = this._getStockArray(this.getCommandTarget());
		
		return indexArray.length !== 0;
	}

	getCommandName() {
		return root.queryCommand('stock_unitcommand');
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.STOCK);
	}

	_getStockArray(unit?) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		if (!Miscellaneous.isItemAccess(unit)) {
			return indexArray;
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && this._isTradable(targetUnit)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}

	_isTradable(targetUnit?) {
		return targetUnit.getUnitType() === UnitType.PLAYER && Miscellaneous.isStockAccess(targetUnit) && Miscellaneous.isItemAccess(targetUnit);
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildStockItemTrade();
		
		screenParam.unit = this.getCommandTarget();
		
		return screenParam;
	}
}

export class Wait extends UnitListCommand {

	openCommand() {
		this.endCommandAction();
	}

	moveCommand() {
		return false;
	}

	drawCommand() {
	}

	isCommandDisplayable() {
		return true;
	}

	getCommandName() {
		return root.queryCommand('wait_unitcommand');
	}

	isRepeatMoveAllowed() {
		// "Wait" mode doesn't allow to move again.
		return false;
	}
}

export class Metamorphoze extends UnitListCommand {

	_selectManager: any = null;

	_dynamicEvent: any = null;

	_metamorphozeData: any = null;

	_skill: any = null;

	openCommand() {
		this._prepareCommandMemberData();
		this._completeCommandMemberData();
	}

	moveCommand() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === MetamorphozeCommandMode.SELECT) {
			result = this._moveSelect();
		}
		else if (mode === MetamorphozeCommandMode.EVENT) {
			result = this._moveEvent();
		}
		
		return result;
	}

	drawCommand() {
		var mode = this.getCycleMode();
		
		if (mode === MetamorphozeCommandMode.SELECT) {
			this._drawSelect();
		}
		else if (mode === MetamorphozeCommandMode.EVENT) {
			this._drawEvent();
		}
	}

	isCommandDisplayable() {
		if (MetamorphozeControl.getMetamorphozeData(this.getCommandTarget()) !== null) {
			return false;
		}
		
		return this._skill !== null;
	}

	getCommandName() {
		var text = '';
		
		if (this._skill !== null) {
			text = this._skill.getCustomKeyword();
		}
		
		return text;
	}

	setSkill(skill?) {
		this._skill = skill;
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.METAMORPHOZE);
	}

	_prepareCommandMemberData() {
		this._selectManager = createObject(MetamorphozeSelectManager);
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeCommandMemberData() {
		this._selectManager.setMetamorphozeSelectData(this.getCommandTarget(), this._skill.getDataReferenceList());
		this.changeCycleMode(MetamorphozeCommandMode.SELECT);
	}

	_moveSelect() {
		if (this._selectManager.moveWindowManager() !== MoveResult.CONTINUE) {
			this._metamorphozeData = this._selectManager.getTargetMetamorphoze();
			if (this._metamorphozeData === null) {
				return MoveResult.END;
			}
			
			this._changeEvent();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEvent() {
		var result = this._dynamicEvent.moveDynamicEvent();
		
		if (result === MoveResult.END) {
			this.endCommandAction();
		}
		
		return result;
	}

	_drawSelect() {
		this._selectManager.drawWindowManager();
	}

	_drawEvent() {
	}

	_changeEvent() {
		var unit = this.getCommandTarget();
		var exp = this._skill.getSkillSubValue();
		var isSkipMode = false;
		var generator = this._dynamicEvent.acquireEventGenerator();
		
		generator.unitMetamorphoze(unit, this._metamorphozeData, MetamorphozeActionType.CHANGE, isSkipMode);
		
		if (exp !== 0) {
			generator.experiencePlus(unit, ExperienceCalculator.getBestExperience(unit, exp), isSkipMode);
		}
		
		this._dynamicEvent.executeDynamicEvent();
		
		this.changeCycleMode(MetamorphozeCommandMode.EVENT);
	}
}

export class MetamorphozeCancel extends UnitListCommand {

	_dynamicEvent: any = null;

	openCommand() {
		var generator;
		var isSkipMode = false;
		
		this._dynamicEvent = createObject(DynamicEvent);
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitMetamorphoze(this.getCommandTarget(), {}, MetamorphozeActionType.CANCEL, isSkipMode);
		this._dynamicEvent.executeDynamicEvent();
	}

	moveCommand() {
		if (this._dynamicEvent.moveDynamicEvent() !== MoveResult.CONTINUE) {
			this.endCommandAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawCommand() {
	}

	isCommandDisplayable() {
		var metamorphozeData = MetamorphozeControl.getMetamorphozeData(this.getCommandTarget());
		
		if (metamorphozeData === null) {
			return false;
		}
		
		return !!(metamorphozeData.getCancelFlag() & MetamorphozeCancelFlag.MANUAL);
	}

	getCommandName() {
		var metamorphozeData = MetamorphozeControl.getMetamorphozeData(this.getCommandTarget());
		
		return metamorphozeData.getCancelManualName();
	}

	isRepeatMoveAllowed() {
		return DataConfig.isUnitCommandMovable(RepeatMoveType.METAMORPHOZE);
	}
}

export class FusionAttack extends UnitCommand.Attack {

	_fusionData: any = null;

	isCommandDisplayable() {
		var i, item, indexArray;
		var unit = this.getCommandTarget();
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item)) {
				indexArray = this._getIndexArray(unit, item);
				if (indexArray.length !== 0) {
					return true;
				}
			}
		}
		
		return false;
	}

	getCommandName() {
		return this._fusionData.getCatchName();
	}

	setFusionData(fusionData?) {
		this._fusionData = fusionData;
	}

	_prepareCommandMemberData() {
		UnitCommand.Attack.prototype._prepareCommandMemberData.call(this);
		this._weaponSelectMenu = createObject(FusionWeaponSelectMenu);
	}

	_completeCommandMemberData() {
		if (!this._isWeaponSelectDisabled) {
			// When the status is shown with PosMenu before battle starts,
			// correction of "Fusion Attack" should be added, so call it at this time.
			FusionControl.startFusionAttack(this.getCommandTarget(), this._fusionData);
		}
		UnitCommand.Attack.prototype._completeCommandMemberData.call(this);
	}

	_moveTop() {
		var result = UnitCommand.Attack.prototype._moveTop.call(this);
		
		if (result !== MoveResult.CONTINUE) {
			if (!this._isWeaponSelectDisabled) {
				FusionControl.endFusionAttack(this.getCommandTarget());
			}
		}
		
		return result;
	}

	_startSelection(weapon?) {
		if (this._isWeaponSelectDisabled) {
			// If "Skip weapon select menu when only have 1 weapon" is enabled, the startFusionAttack method is called in the _startSelection.
			FusionControl.startFusionAttack(this.getCommandTarget(), this._fusionData);
		}
		
		UnitCommand.Attack.prototype._startSelection.call(this, weapon);
	}

	_moveSelection() {
		var result = UnitCommand.Attack.prototype._moveSelection.call(this);
		
		if (result !== MoveResult.CONTINUE) {
			if (this._isWeaponSelectDisabled) {
				// There may be cases where the "Fusion Attack" command is selected, but then canceled and the regular "Attack" command is selected.
				// Assuming this case, clear the fusion data with the endFusionAttack method so that it does not remain.
				FusionControl.endFusionAttack(this.getCommandTarget());
			}
		}
		
		return result;
	}

	_getIndexArray(unit?, weapon?) {
		return AttackChecker.getFusionAttackIndexArray(unit, weapon, this._fusionData);
	}

	_createAttackParam() {
		var attackParam = UnitCommand.Attack.prototype._createAttackParam.call(this);
		
		attackParam.fusionAttackData = this._fusionData;
		
		return attackParam;
	}
}

export class FusionCatch extends BaseFusionCommand {

	getCommandName() {
		return this._fusionData.getCatchName();
	}

	_addFusionEvent(generator?) {
		var unit = this.getCommandTarget();
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		generator.unitFusion(unit, targetUnit, this._fusionData, DirectionType.NULL, FusionActionType.CATCH, false);
	}

	_getFusionIndexArray(unit?) {
		var i, x, y, targetUnit;
		var indexArray = [];
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && FusionControl.isCatchable(unit, targetUnit, this._fusionData)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}
}

export class FusionRelease extends BaseFusionCommand {

	getCommandName() {
		return this._fusionData.getReleaseName();
	}

	_completeCommandMemberData() {
		if (this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE) {
			this._changeAction();
		}
		else {
			super._completeCommandMemberData();
		}
	}

	_addFusionEvent(generator?) {
		var direction;
		var unit = this.getCommandTarget();
		
		if (this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE) {
			direction = this._getEraseDirection(unit);
		}
		else {
			direction = this._getNormalDirection(unit);
		}
		
		generator.unitFusion(unit, {}, {}, direction, FusionActionType.RELEASE, false);
	}

	_getFusionIndexArray(unit?) {
		var i, x, y, targetUnit;
		var indexArray = [];
		var child = FusionControl.getFusionChild(unit);
		
		if (child === null) {
			return indexArray;
		}
		
		if (this._fusionData.getFusionReleaseType() === FusionReleaseType.ERASE) {
			return [0];
		}
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			if (!this._isPosEnabled(x, y)) {
				continue;
			}
			
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null && PosChecker.getMovePointFromUnit(x, y, child) !== 0) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
		}
		
		return indexArray;
	}

	_isUnitSelection() {
		return false;
	}

	_isPosSelectable() {
		var pos = this._posSelector.getSelectorPos(true);
		
		return pos !== null;
	}

	_getNormalDirection(unit?) {
		var i, x, y;
		var pos = this._posSelector.getSelectorPos(true);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			if (x === pos.x && y === pos.y) {
				return i;
			}
		}
		
		return DirectionType.NULL;
	}

	_getEraseDirection(unit?) {
		var i, x, y, targetUnit, direction;
		var indexArray = [];
		var child = FusionControl.getFusionChild(unit);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null && PosChecker.getMovePointFromUnit(x, y, child) !== 0) {
				return i;
			}
		}
		
		if (CurrentMap.isMapInside(unit.getMapX() - 1, unit.getMapY())) {
			direction = DirectionType.LEFT;
		}
		else {
			direction = DirectionType.RIGHT;
		}
		
		return direction;
	}

	_isPosEnabled(x?, y?) {
		var xMin, yMin;
		var session = root.getCurrentSession();
		
		if (session === null) {
			return false;
		}
		
		xMin = this._getBoundaryX(session);
		yMin = this._getBoundaryY(session);
		
		if (x < xMin || y < yMin) {
			return false;
		}
		
		if (x > CurrentMap.getWidth() - 1 - xMin || y > CurrentMap.getHeight() - 1 - yMin) {
			return false;
		}
		
		return true;
	}

	_getBoundaryX(session?) {
		return session.getMapBoundaryValue();
	}

	_getBoundaryY(session?) {
		return session.getMapBoundaryValue();
	}

	isCommandDisplayable() {
		if (!super.isCommandDisplayable()) {
			return false;
		}
		
		return this._isCommandDisplayableInternal();
	}

	_isCommandDisplayableInternal(): any {
		var point;
		var unit = this.getCommandTarget();
		
		if (FusionControl.getFusionData(unit).getMetamorphozeData() === null) {
			return true;
		}
		
		// Temporarily disable "Transformation".
		// This will make the unit's current class be judged as its original class, not the class modified by "Transformation".
		// Using this method allows you to temporarily clear "Transformation" and avoid the hassle of resetting it.
		unit.getUnitStyle().enableMetamorphozeData(false);

		// Assume that "Transformation" is specified under "Skills and Transformation" in "Fusion Settings".
		// In this case, the unit switches to a specific class during fusion,
		// but the current accessible position may not necessarily be accessible by the pre-transformation class.
		// For example, suppose "Transformation" changes the unit to "Flying", but its original class is "Normal".
		// In this scenario, if fusion is canceled in a position only accessible by "Flying",
		// the unit may become unable to move when reverting to its original class.
		// Therefore, verify whether the current position is accessible by the original class.
		point = PosChecker.getMovePointFromUnit(unit.getMapX(), unit.getMapY(), unit);

		// Since the accessibility information has been obtained, re-enable "Transformation".
		unit.getUnitStyle().enableMetamorphozeData(true);
		
		return point !== 0;
	}
}

export class FusionUnitTrade extends BaseFusionCommand {

	getCommandName() {
		return this._fusionData.getTradeName();
	}

	_doEndAction() {
		this.setExitCommand(this);
		this.rebuildCommand();
	}

	_addFusionEvent(generator?) {
		var unit = this.getCommandTarget();
		var targetUnit = this._posSelector.getSelectorTarget(true);
		var child = FusionControl.getFusionChild(unit);
		
		if (child !== null) {
			generator.unitFusion(unit, targetUnit, {}, DirectionType.NULL, FusionActionType.TRADE, false);
		}
		else {
			generator.unitFusion(targetUnit, unit, {}, DirectionType.NULL, FusionActionType.TRADE, false);
		}
	}

	_getFusionIndexArray(unit?) {
		var i, x, y, targetUnit, targetChild;
		var indexArray = [];
		var child = FusionControl.getFusionChild(unit);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null) {
				continue;
			}
			
			// Check if targetUnit can receive a child (the unit catches it).
			if (child !== null && this._isTradable(targetUnit, child)) {
				indexArray.push(CurrentMap.getIndex(x, y));
			}
			else {
				targetChild = FusionControl.getFusionChild(targetUnit);
				// Check if the unit can receive targetChild (targetUnit catches it).
				if (targetChild !== null && this._isTradable(unit, targetChild)) {
					indexArray.push(CurrentMap.getIndex(x, y));
				}
			}
		}
		
		return indexArray;
	}

	_isTradable(unit?, targetUnit?) {
		if (!this._fusionData.isUnitTradable()) {
			return false;
		}
		
		if (FusionControl.getFusionChild(unit) !== null) {
			return false;
		}
		
		if (FusionControl.getFusionData(targetUnit) !== this._fusionData) {
			return false;
		}
		
		return FusionControl.isControllable(unit, targetUnit, this._fusionData);
	}

	_getUnitFilter() {
		var i, x, y, targetUnit, targetChild;
		var filterFlag = 0;
		var unit = this.getCommandTarget();
		var child = FusionControl.getFusionChild(unit);
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = unit.getMapX() + XPoint[i];
			y = unit.getMapY() + YPoint[i];
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit === null) {
				continue;
			}
			
			if (child !== null && this._isTradable(targetUnit, child)) {
				filterFlag |= FusionControl.getFusionData(unit).getFilterFlag();
			}
			else {
				targetChild = FusionControl.getFusionChild(targetUnit);
				if (targetChild !== null && this._isTradable(unit, targetChild)) {
					filterFlag |= FusionControl.getFusionData(targetUnit).getFilterFlag();
				}
			}
		}
		
		return FilterControl.getBestFilter(unit.getUnitType(), filterFlag);
	}
}
}

class KeyNavigatorMode {

	static SELECTION: any = 0;

	static FLOW: any = 1;
}

class KeyNavigator extends BaseObject {
	_posSelector: any;


	_unit: any = null;

	_keyData: any = null;

	_requireFlag: any = 0;

	_isUsed: any = false;

	_itemSelection: any = null;

	_straightFlow: any = null;

	_placeEvent: any = null;

	openKeyNavigator(unit?, keyData?) {
		this._prepareMemberData(unit, keyData);
		this._completeMemberData(unit, keyData);
	}

	moveKeyNavigator() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === KeyNavigatorMode.SELECTION) {
			result = this._moveSelection();
		}
		else if (mode === KeyNavigatorMode.FLOW) {
			result = this._moveFlow();
		}
		
		return result;
	}

	drawKeyNavigator() {
		var mode = this.getCycleMode();
		
		if (mode === KeyNavigatorMode.SELECTION) {
			this._drawSelection();
		}
		else if (mode === KeyNavigatorMode.FLOW) {
			this._drawFlow();
		}
	}

	isUsed() {
		return this._isUsed;
	}

	getUnit() {
		return this._unit;
	}

	getRequireFlag() {
		return this._requireFlag;
	}

	getPlaceEvent() {
		return this._placeEvent;
	}

	getKeyData() {
		return this._keyData;
	}

	_prepareMemberData(unit?, keyData?) {
		this._unit = unit;
		this._keyData = keyData;
		this._posSelector = createObject(PosSelector);
		this._straightFlow = createObject(StraightFlow);
	}

	_completeMemberData(unit?, keyData?) {
		var indexArray;
		
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		if (keyData.rangeType === SelectionRangeType.SELFONLY) {
			this._isUsed = true;
			this._placeEvent = KeyEventChecker.getKeyEvent(unit.getMapX(), unit.getMapY(), keyData);
			this._straightFlow.enterStraightFlow();
			this.changeCycleMode(KeyNavigatorMode.FLOW);
		}
		else {
			indexArray = KeyEventChecker.getIndexArrayFromKeyType(unit, keyData);
			this._posSelector.setPosOnly(unit, null, indexArray, PosMenuType.Default);
			this._posSelector.setFirstPos();
			this.changeCycleMode(KeyNavigatorMode.SELECTION);
		}
	}

	_moveSelection() {
		var event;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			event = this._getTargetEvent();
			if (event !== null) {
				this._posSelector.endPosSelector();
				
				this._isUsed = true;
				this._placeEvent = event;
				result = this._straightFlow.enterStraightFlow();
				if (result === EnterResult.NOTENTER) {
					return MoveResult.END;
				}
				else {
					this.changeCycleMode(KeyNavigatorMode.FLOW);
				}
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	}

	_moveFlow() {
		return this._straightFlow.moveStraightFlow();
	}

	_drawSelection() {
		this._posSelector.drawPosSelector();
	}

	_drawFlow() {
		this._straightFlow.drawStraightFlow();
	}

	_getTargetEvent() {
		var pos = this._posSelector.getSelectorPos(true);
		
		if (pos === null) {
			return null;
		}
		
		return KeyEventChecker.getKeyEvent(pos.x, pos.y, this._keyData);
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(KeyAnimeFlowEntry);
		straightFlow.pushFlowEntry(KeyTrophyFlowEntry);
		straightFlow.pushFlowEntry(KeyExpFlowEntry);
	}
}

// Display an animation which is set at the key item.
class KeyAnimeFlowEntry extends BaseFlowEntry {

	_dynamicAnime: any = null;

	enterFlowEntry(keyNavigator?) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	}

	moveFlowEntry() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_prepareMemberData(keyNavigator?) {
		this._dynamicAnime = createObject(DynamicAnime);
	}

	_completeMemberData(keyNavigator?) {
		var animeData, pos;
		var keyData = keyNavigator.getKeyData();
		
		if (keyData.item === null) {
			return EnterResult.NOTENTER;
		}
		
		animeData = keyData.item.getItemAnime();
		if (animeData === null) {
			return EnterResult.NOTENTER;
		}
		
		pos = this._getPlaceAnimePos(keyNavigator, animeData);
		this._dynamicAnime.startDynamicAnime(animeData, pos.x, pos.y);
		
		return EnterResult.OK;
	}

	_getPlaceAnimePos(keyNavigator?, animeData?) {
		var info = keyNavigator.getPlaceEvent().getPlaceEventInfo();
		var x = LayoutControl.getPixelX(info.getX());
		var y = LayoutControl.getPixelY(info.getY());
		
		return LayoutControl.getMapAnimationPos(x, y, animeData);
	}
}

// Get the trophy.
class KeyTrophyFlowEntry extends BaseFlowEntry {

	_eventTrophy: any = null;

	enterFlowEntry(keyNavigator?) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	}

	moveFlowEntry() {
		return this._eventTrophy.moveEventTrophyCycle();
	}

	drawFlowEntry() {
		this._eventTrophy.drawEventTrophyCycle();
	}

	_prepareMemberData(keyNavigator?) {
		this._eventTrophy = createObject(EventTrophy);
	}

	_completeMemberData(keyNavigator?) {
		var unit = keyNavigator.getUnit();
		var keyData = keyNavigator.getKeyData();
		
		if (keyData.item !== null) {
			ItemControl.decreaseItem(unit, keyData.item);
		}
		
		return this._eventTrophy.enterEventTrophyCycle(unit, keyNavigator.getPlaceEvent());
	}
}

// Obtain the exp which is set at the key item.
class KeyExpFlowEntry extends BaseFlowEntry {
	_keyNavigator: any;


	_dynamicEvent: any = null;

	enterFlowEntry(keyNavigator?) {
		this._prepareMemberData(keyNavigator);
		return this._completeMemberData(keyNavigator);
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	drawFlowEntry() {
	}

	_prepareMemberData(keyNavigator?) {
		this._keyNavigator = keyNavigator;
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(keyNavigator?) {
		var generator, exp;
		var unit = keyNavigator.getUnit();
		var keyData = keyNavigator.getKeyData();
		var isSkipMode = false;
		
		if (keyData.item === null) {
			return EnterResult.NOTENTER;
		}
		
		exp = ExperienceCalculator.getBestExperience(unit, keyData.item.getExp());
		if (exp === 0) {
			return EnterResult.NOTENTER;
		}
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.experiencePlus(unit, exp, isSkipMode);
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}
