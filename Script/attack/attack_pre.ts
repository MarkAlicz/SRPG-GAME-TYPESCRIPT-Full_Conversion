
class PreAttackMode {

	static START: any = 0;

	static CORE: any = 1;

	static END: any = 2;
}

// The battle is started by calling PreAttack.enterPreAttackCycle.
// PreAttack leaves the specific battle processing to CoreAttack,
// and processes before the battle and after the battle on the map.
class PreAttack extends BaseObject {

	_attackParam: any = null;

	_coreAttack: any = null;

	_startStraightFlow: any = null;

	_endStraightFlow: any = null;

	enterPreAttackCycle(attackParam?) {
		this._prepareMemberData(attackParam);
		return this._completeMemberData(attackParam);
	}

	movePreAttackCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === PreAttackMode.START) {
			result = this._moveStart();
		}
		else if (mode === PreAttackMode.CORE) {
			result = this._moveCore();
		}
		else if (mode === PreAttackMode.END) {
			result = this._moveEnd();
		}
		
		return result;
	}

	drawPreAttackCycle() {
		var mode = this.getCycleMode();
		
		if (mode === PreAttackMode.START) {
			this._drawStart();
		}
		else if (mode === PreAttackMode.CORE) {
			this._drawCore();
		}
		else if (mode === PreAttackMode.END) {
			this._drawEnd();
		}
	}

	backPreAttackCycle() {
		var mode = this.getCycleMode();
		
		if (mode === PreAttackMode.CORE) {
			this._coreAttack.backCoreAttackCycle();
		}
	}

	getActiveUnit() {
		var order = this._coreAttack.getAttackFlow().getAttackOrder();
		
		return order.getActiveUnit();
	}

	getPassiveUnit() {
		var order = this._coreAttack.getAttackFlow().getAttackOrder();
		
		return order.getPassiveUnit();
	}

	isUnitLostEventShown() {
		return this._coreAttack.isUnitLostEventShown();
	}

	recordUnitLostEvent(isShown?) {
		this._coreAttack.recordUnitLostEvent(isShown);
	}

	isPosMenuDraw() {
		return this.getCycleMode() === PreAttackMode.START;
	}

	getCoreAttack() {
		return this._coreAttack;
	}

	getAttackParam() {
		return this._attackParam;
	}

	_prepareMemberData(attackParam?) {
		this._attackParam = attackParam;
		this._coreAttack = createObject(CoreAttack);
		this._startStraightFlow = createObject(StraightFlow);
		this._endStraightFlow = createObject(StraightFlow);
		
		AttackControl.setPreAttackObject(this);
		BattlerChecker.setUnit(attackParam.unit, attackParam.targetUnit);
	}

	_completeMemberData(attackParam?) {
		this._doStartAction();
		
		if (CurrentMap.isCompleteSkipMode()) {
			if (this._skipAttack()) {
				this._doEndAction();
				return EnterResult.NOTENTER;
			}
		}
		else {
			this._startStraightFlow.enterStraightFlow();
			this.changeCycleMode(PreAttackMode.START);
		}
		
		return EnterResult.OK;
	}

	_moveStart() {
		if (this._startStraightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._coreAttack.enterCoreAttackCycle(this._attackParam, false);
			this.changeCycleMode(PreAttackMode.CORE);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCore() {
		if (this._coreAttack.moveCoreAttackCycle() !== MoveResult.CONTINUE) {
			this._endStraightFlow.enterStraightFlow();
			this.changeCycleMode(PreAttackMode.END);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEnd() {
		if (this._endStraightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawStart() {
		this._startStraightFlow.drawStraightFlow();
	}

	_drawCore() {
		this._coreAttack.drawCoreAttackCycle();
	}

	_drawEnd() {
		this._endStraightFlow.drawStraightFlow();
	}

	_skipAttack() {
		// Return false if the processing cannot be skipped completely.
		// The caller who detects false, switches the mode to call movePreAttackCycle/drawPreAttackCycle.
		
		if (this._startStraightFlow.enterStraightFlow() === EnterResult.OK) {
			this.changeCycleMode(PreAttackMode.START);
			return false;
		}
		
		// This method can be completely skipped.
		// It means, when the method returns control, the battle ends.
		this._coreAttack.enterCoreAttackCycle(this._attackParam);
		
		if (this._endStraightFlow.enterStraightFlow() === EnterResult.OK) {
			this.changeCycleMode(PreAttackMode.END);
			// This mode can restart the processing.
			return false;
		}
		
		return true;
	}

	_doStartAction() {
		this._startStraightFlow.setStraightFlowData(this);
		this._pushFlowEntriesStart(this._startStraightFlow);
		
		this._endStraightFlow.setStraightFlowData(this);
		this._pushFlowEntriesEnd(this._endStraightFlow);
		
		if (this._attackParam.fusionAttackData !== null) {
			FusionControl.startFusionAttack(this._attackParam.unit, this._attackParam.fusionAttackData);
		}
	}

	_doEndAction() {
		var passive = this.getPassiveUnit();
		
		if (this._attackParam.fusionAttackData !== null) {
			FusionControl.endFusionAttack(this._attackParam.unit);
		}
		
		if (passive.getHp() === 0) {
			// If this deactivation processing is done at the time of dead setting (DamageControl.setDeathState), the state etc.,
			// cannot be specified in the condition of the dead event, so execute with this method. 
			StateControl.arrangeState(passive, null, IncreaseType.ALLRELEASE);
			MetamorphozeControl.clearMetamorphoze(passive);
		}
		
		AttackControl.setPreAttackObject(null);
		BattlerChecker.setUnit(null, null);
	}

	_pushFlowEntriesStart(straightFlow?) {
	}

	_pushFlowEntriesEnd(straightFlow?) {
		// LoserMessageFlowEntry checks the dead event.
		// This checking is done at the CoreAttack.UnitDeathFlowEntry,
		// but checking of CoreAttack can also be skipped,
		// so if the unit is dead, there's a possibility that nothing is displayed.
		// To prevent it, LoserMessageFlowEntry is prepared.
		straightFlow.pushFlowEntry(LoserMessageFlowEntry);
		
		// WeaponValidFlowEntry should be processed before DropFlowEntry.
		straightFlow.pushFlowEntry(WeaponValidFlowEntry);
		straightFlow.pushFlowEntry(DropFlowEntry);
		straightFlow.pushFlowEntry(ImportantItemFlowEntry);
		straightFlow.pushFlowEntry(ReleaseFusionFlowEntry);
		straightFlow.pushFlowEntry(CatchFusionFlowEntry);
	}
}

class LoserMessageFlowEntry extends BaseFlowEntry {

	_capsuleEvent: any = null;

	enterFlowEntry(preAttack?) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	}

	moveFlowEntry() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			// It's a countermeasure if the unit continuously dies with damage of the terrain.
			EventCommandManager.eraseMessage(MessageEraseFlag.ALL);
			return MoveResult.END;
		}
		
		return result;
	}

	_prepareMemberData(preAttack?) {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeMemberData(preAttack?) {
		var result, isEventStoppable, active;
		var isEventSkip = false;
		var unit = preAttack.getPassiveUnit();
		
		if (unit.getHp() !== 0) {
			return EnterResult.NOTENTER;
		}
		
		// Check if the dead event is displayed with CoreAttack.
		if (preAttack.isUnitLostEventShown()) {
			// If processed with CoreAttack, PreAttack doesn't need to process.
			return EnterResult.NOTENTER;
		}
		
		active = preAttack.getActiveUnit();
		if (active === null) {
			active = {};
		}
		root.getSceneController().notifyBattleEnd(active, unit);
		
		isEventStoppable = this._isEventStoppable(unit);
		if (isEventStoppable) {
			// Before skip is disabled, save the current skip state.
			isEventSkip = CurrentMap.isCompleteSkipMode();
			CurrentMap.setTurnSkipMode(false);
		}
		
		result = this._capsuleEvent.enterCapsuleEvent(UnitEventChecker.getUnitLostEvent(unit), false);
		if (result === EnterResult.NOTENTER) {
			if (isEventStoppable) {
				// Skip state is restored because it wasn't an event accompanied with image display.
				CurrentMap.setTurnSkipMode(isEventSkip);
			}
		}
		
		return result;
	}

	_isEventStoppable(unit?) {
		// The player who is not a guest can stop skip.
		return unit.getUnitType() === UnitType.PLAYER && !unit.isGuest();
	}
}

class WeaponValidFlowEntry extends BaseFlowEntry {

	enterFlowEntry(preAttack?) {
		this._checkDelete(preAttack.getActiveUnit());
		this._checkDelete(preAttack.getPassiveUnit());
		
		return EnterResult.NOTENTER;
	}

	_checkDelete(unit?) {
		var weapon = BattlerChecker.getBaseWeapon(unit);
		
		if (weapon === null) {
			return;
		}
		
		if (ItemControl.isItemBroken(weapon)) {
			ItemControl.lostItem(unit, weapon);
		
			if (unit.getUnitType() !== UnitType.PLAYER && DataConfig.isDropTrophyLinked()) {
				// The drop trophy disappears due to weapon destroyed.
				ItemControl.deleteTrophy(unit, weapon);
			}
		}
	}
}

class DropFlowEntry extends BaseFlowEntry {

	_trophyCollector: any = null;

	enterFlowEntry(preAttack?) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	}

	moveFlowEntry() {
		return this._trophyCollector.moveTrophyCollector();
	}

	_prepareMemberData(preAttack?) {
		this._trophyCollector = createObject(TrophyCollector);
	}

	_completeMemberData(preAttack?) {
		var result;
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		
		if (active !== null) {
			if (!this._isDrop(preAttack)) {
				return EnterResult.NOTENTER;
			}
		}
		
		this._startTrophyCheck(active, passive);
		result = this._enterTrophyCollector(active, passive);
		this._endTrophyCheck(active, passive);
		
		return result;
	}

	_isDrop(preAttack?) {
		var winner;
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		
		if (active.getHp() !== 0 && passive.getHp() !== 0) {
			return false;
		}
		
		if (passive.getHp() === 0) {
			winner = active;
		}
		else {
			winner = passive;
		}
		
		// No drop check is done if the winner is the enemy.
		if (winner.getUnitType() === UnitType.ENEMY || winner.getUnitType() === UnitType.ALLY) {
			return false;
		}
		
		return true;
	}

	_startTrophyCheck(winner?, loser?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(loser);
		
		if (!DamageControl.isSyncope(loser)) {
			return;
		}
		
		// At the "Fusion Attack" can steal the opponent item
		// so delete the drop trophy which links to the opponent's possession item.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(loser, i);
			if (item === null) {
				continue;
			}
			
			ItemControl.deleteTrophy(loser, item);
		}
	}

	_enterTrophyCollector(winner?, loser?) {
		var i, trophy;
		var list = loser.getDropTrophyList();
		var count = list.getCount();
		
		this._trophyCollector.prepareTrophy(winner);
		
		// Set the drop trophy as TrophyCollector.
		for (i = 0; i < count; i++) {
			trophy = list.getData(i);
			if (!this._isTrophyGettable(winner, loser, trophy)) {
				continue;
			}
			
			if ((trophy.getFlag() & TrophyFlag.ITEM) && DataConfig.isDropTrophyLinked()) {
				// If "Delete drop trophies if weapons break" is ticked,
				// weapon durability affects the drop trophy.
				this._copyItemLimit(loser, trophy);
			}
			this._trophyCollector.addTrophy(trophy);
		}
		
		return this._trophyCollector.enterTrophyCollector();
	}

	_copyItemLimit(loser?, trophy?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(loser);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(loser, i);
			if (item === null) {
				continue;
			}
			
			if (ItemControl.compareItem(item, trophy.getItem())) {
				// To inherit item durability, the drop trophy is not always in a new state to be obtained.
				trophy.setLimit(item.getLimit());
				break;
			}
		}
	}

	_endTrophyCheck(winner?, loser?) {
		var list = loser.getDropTrophyList();
		var editor = root.getCurrentSession().getTrophyEditor();
		
		editor.deleteAllTrophy(list);
	}

	_isTrophyGettable(winner?, loser?, trophy?) {
		return true;
	}
}

class ImportantItemFlowEntry extends BaseFlowEntry {

	_dynamicEvent: any = null;

	enterFlowEntry(preAttack?) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	_prepareMemberData(preAttack?) {
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(preAttack?) {
		var generator;
		var unit = preAttack.getPassiveUnit();
		
		// If it's not the player, no need to check important items.
		if (unit.getUnitType() !== UnitType.PLAYER) {
			return EnterResult.NOTENTER;
		}
		
		// Check not only HP, but also death state.
		// If injury, important items are not sent to the stock.
		if (unit.getHp() !== 0 || unit.getAliveState() !== AliveType.DEATH) {
			return EnterResult.NOTENTER;
		}
		
		generator = this._dynamicEvent.acquireEventGenerator();
		
		if (!this._checkImportantItem(unit, generator)) {
			return EnterResult.NOTENTER;
		}
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_checkImportantItem(unit?, generator?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var isDataAdd = false;
		var isSkipMode = true;
		
		// If the player unit is dead, check if the unit has important items.
		// The reason is if losing important items, there is a possibility that the game cannot be completed.
		// So if having important items, add them into a stock.
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			// Check if items are important items.
			if (item !== null && item.isImportance()) {
				// Send it to the stock only if it's not prohibited to trade.
				// Otherwise, the trade is satisfied through the items which have been set to the stock.
				if (!item.isTradeDisabled()) {
					isDataAdd = true;
					generator.stockItemChange(item, IncreaseType.INCREASE, isSkipMode);
					generator.unitItemChange(unit, item, IncreaseType.DECREASE, isSkipMode);
				}
			}
		}
		
		return isDataAdd;
	}
}

// If the enemy is beaten with "Fusion Attack", catch the unit.
class CatchFusionFlowEntry extends BaseFlowEntry {

	_dynamicEvent: any = null;

	enterFlowEntry(preAttack?) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	_prepareMemberData(preAttack?) {
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(preAttack?) {
		var generator;
		var active = preAttack.getActiveUnit();
		var passive = preAttack.getPassiveUnit();
		var fusionData = FusionControl.getFusionAttackData(active);
		var direction = PosChecker.getSideDirection(active.getMapX(), active.getMapY(), passive.getMapX(), passive.getMapY());
		
		if (fusionData === null) {
			return EnterResult.NOTENTER;
		}
		
		if (!DamageControl.isSyncope(passive)) {
			return EnterResult.NOTENTER;
		}
		
		DamageControl.setCatchState(passive, true);
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitFusion(active, passive, fusionData, direction, FusionActionType.CATCH, false);
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}

// If the parent unit of fusion cannot battle, the child unit is released.
class ReleaseFusionFlowEntry extends BaseFlowEntry {

	_dynamicEvent: any = null;

	enterFlowEntry(preAttack?) {
		this._prepareMemberData(preAttack);
		return this._completeMemberData(preAttack);
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	_prepareMemberData(preAttack?) {
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(preAttack?) {
		var generator, parentUnit, childUnit;
		var unit = preAttack.getPassiveUnit();
		
		if (unit.getHp() !== 0) {
			return EnterResult.NOTENTER;
		}
		
		parentUnit = FusionControl.getFusionParent(unit);
		if (parentUnit !== null) {
			// The unit is fused, so separate from the parents.
			FusionControl.releaseChild(parentUnit);
			return EnterResult.NOTENTER;
		}
		
		// The unit is not fused, so don't continue to process.
		childUnit = FusionControl.getFusionChild(unit);
		if (childUnit === null) {
			return EnterResult.NOTENTER;
		}
		
		// The unit who was caught with a "Fusion Attack" is returned to the normal state. 
		childUnit.setSyncope(false);
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.unitFusion(unit, {}, {}, DirectionType.NULL, FusionActionType.RELEASE, false);
		
		return this._dynamicEvent.executeDynamicEvent();
	}
}

class ReleaseStateFlowEntry extends BaseFlowEntry {

	enterFlowEntry(preAttack?) {
		var targetUnit = preAttack.getPassiveUnit();
		
		if (targetUnit !== null) {
			StateControl.arrangeState(targetUnit, null, IncreaseType.ALLRELEASE);
			MetamorphozeControl.clearMetamorphoze(targetUnit);
		}
		
		return EnterResult.NOTENTER;
	}

	moveFlowEntry() {
		return MoveResult.END;
	}
}

// Process with an event command "Reduce Hp" if the unit is beaten.
// At the "Remove Unit" of the event command, such a processing doesn't occur.
class DamageHitFlow extends BaseObject {

	_unit: any = null;

	_targetUnit: any = null;

	_straightFlow: any = null;

	enterDamageHitFlowCycle(unit?, targetUnit?) {
		this._unit = unit;
		this._targetUnit = targetUnit;
		this._straightFlow = createObject(StraightFlow);
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		return this._straightFlow.enterStraightFlow();
	}

	moveDamageHitFlowCycle() {
		return this._straightFlow.moveStraightFlow();
	}

	drawDamageHitFlowCycle() {
		this._straightFlow.drawStraightFlow();
	}

	
	// Each type of FlowEntry is designed to receive PreAttack,
	// so the PreAttack method is implemented.
	getActiveUnit() {
		return this._unit;
	}

	getPassiveUnit() {
		return this._targetUnit;
	}

	isUnitLostEventShown() {
		return false;
	}

	recordUnitLostEvent(isShown?) {
	}

	_pushFlowEntries(straightFlow?) {
		// It's not beating by a weapon, so WeaponValidFlowEntry is not included.
		// It's not "Fusion Attack", so CatchFusionFlowEntry is not included.
		
		straightFlow.pushFlowEntry(LoserMessageFlowEntry);
		straightFlow.pushFlowEntry(DropFlowEntry);
		straightFlow.pushFlowEntry(ImportantItemFlowEntry);
		straightFlow.pushFlowEntry(ReleaseFusionFlowEntry);
		straightFlow.pushFlowEntry(ReleaseStateFlowEntry);
	}
}
