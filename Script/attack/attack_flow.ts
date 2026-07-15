
class AttackFlowMode {

	static NONE: any = 0;

	static STARTFLOW: any = 1;

	static ATTACK: any = 2;

	static ENDFLOW: any = 3;

	static COMPLETE: any = 4;
}

class AttackFlowResult {

	static DEATH: any = 0;

	static CONTINUE: any = 1;

	static NONE: any = 2;
}

// The order of the turns in which the unit starts an attack is identical, both the RealBattle and the EasyBattle.
// These turns are structured with AttackEntry in the AttackOrder and the AttackFlow checks it. 
class AttackFlow extends BaseObject {

	_parentCoreAttack: any = null;

	_order: any = null;

	_attackInfo: any = null;

	_startStraightFlow: any = null;

	_endStraightFlow: any = null;

	setAttackInfoAndOrder(attackInfo?, order?, parentCoreAttack?) {
		this._parentCoreAttack = parentCoreAttack;
		this._order = order;
		this._attackInfo = attackInfo;
		
		this._startStraightFlow = createObject(StraightFlow);
		this._startStraightFlow.setStraightFlowData(this._parentCoreAttack);
		this._pushFlowEntriesStart(this._startStraightFlow);
		
		this._endStraightFlow = createObject(StraightFlow);
		this._endStraightFlow.setStraightFlowData(this._parentCoreAttack);
		this._pushFlowEntriesEnd(this._endStraightFlow);
	}

	startAttackFlow() {
		this._changeFirstMode();
		return EnterResult.NOTENTER;
	}

	moveStartFlow() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === AttackFlowMode.STARTFLOW) {
			if (this._startStraightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
				this.changeCycleMode(AttackFlowMode.ATTACK);
				result = MoveResult.END;
			}
		}
		else if (mode === AttackFlowMode.ATTACK) {
			result = MoveResult.END;
		}
		
		return result;
	}

	moveEndFlow() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === AttackFlowMode.ENDFLOW) {
			if (this._endStraightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
				this.changeCycleMode(AttackFlowMode.COMPLETE);
			}
		}
		else if (mode === AttackFlowMode.COMPLETE) {
			result = MoveResult.END;
		}
		
		return result;
	}

	drawStartFlow() {
		var mode = this.getCycleMode();
		
		if (mode === AttackFlowMode.STARTFLOW) {
			this._startStraightFlow.drawStraightFlow();
		}
	}

	drawEndFlow() {
		var mode = this.getCycleMode();
		
		if (mode === AttackFlowMode.ENDFLOW) {
			this._endStraightFlow.drawStraightFlow();
		}
	}

	checkNextAttack() {
		var result = AttackFlowResult.NONE;
		
		if (this.isBattleUnitLosted()) {
			this._changeLastMode();
			result = AttackFlowResult.DEATH;
		}
		else if (this._isBattleContinue()) {
			// If return true, it means that the AttackEntry still exists.
			// The caller detects this and continues to battle.
			result = AttackFlowResult.CONTINUE; 
		}
		else {
			// Execute if the obj doesn't exist and the battle has never ended.
			this._changeLastMode();
		}
		
		return result;
	}

	getPlayerUnit() {
		var unit = this._order.getActiveUnit();
		
		if (unit.getUnitType() === UnitType.PLAYER) {
			return unit;
		}
		
		unit = this._order.getPassiveUnit();
		if (unit.getUnitType() === UnitType.PLAYER) {
			return unit;
		}
		
		return null;
	}

	isBattleUnitLosted() {
		var active = this._order.getActiveUnit();
		var passive = this._order.getPassiveUnit();
		
		return DamageControl.isLosted(active) || DamageControl.isLosted(passive);
	}

	getAttackOrder() {
		return this._order;
	}

	getAttackInfo() {
		return this._attackInfo;
	}

	validBattle() {
		var result = this._order.isNextOrder();
		
		if (!result) {
			this._changeLastMode();
		}
		
		return result;
	}

	
	// It's called if the battle needs to be cut.
	// Execute entry of order at once.
	finalizeAttack() {
		if (!this._startStraightFlow.isFlowLast()) {
			this._startStraightFlow.enterStraightFlow();	
		}
		
		while (this._order.isNextOrder()) {
			this.executeAttackPocess();
		}
		
		if (!this._endStraightFlow.isFlowLast()) {
			this._endStraightFlow.enterStraightFlow();
		}
	}

	executeAttackPocess() {
		this._doAttackAction();
		this._order.nextOrder();
	}

	_doAttackAction() {
		var i, count, turnState;
		var order = this._order;
		var active = order.getActiveUnit();
		var passive = order.getPassiveUnit();
		var activeStateArray = order.getActiveStateArray();
		var passiveStateArray = order.getPassiveStateArray();
		var isItemDecrement = order.isCurrentItemDecrement();
		
		DamageControl.reduceHp(active, order.getActiveDamage());
		DamageControl.reduceHp(passive, order.getPassiveDamage());
		
		DamageControl.checkHp(active, passive);
		
		count = activeStateArray.length;
		for (i = 0; i < count; i++) {
			turnState = StateControl.arrangeState(active, activeStateArray[i], IncreaseType.INCREASE);
			if (turnState !== null) {
				turnState.setLocked(true);
			}
		}
		
		count = passiveStateArray.length;
		for (i = 0; i < count; i++) {
			turnState = StateControl.arrangeState(passive, passiveStateArray[i], IncreaseType.INCREASE);
			if (turnState !== null) {
				turnState.setLocked(true);
			}
		}
		
		if (isItemDecrement) {
			// Reduce the weapons for the attacker.
			// Items don't get discarded.
			// ItemControl.getEquippedWeapon is not called because there is a possibility to return null.
			// If the "Users" of the weapon is current HP, there is a possibility that HP has changed due to the battle, so the equipment decision also changes.
			ItemControl.decreaseLimit(active, BattlerChecker.getBaseWeapon(active));
		}
	}

	_isBattleContinue() {
		return this._order.isNextOrder();
	}

	_changeFirstMode() {
		if (this._startStraightFlow.enterStraightFlow() === EnterResult.OK) {
			this.changeCycleMode(AttackFlowMode.STARTFLOW);
		}
		else {
			this.changeCycleMode(AttackFlowMode.ATTACK);
		}
	}

	_changeLastMode() {
		if (this._endStraightFlow.enterStraightFlow() === EnterResult.OK) {
			this.changeCycleMode(AttackFlowMode.ENDFLOW);
		}
		else {
			this.changeCycleMode(AttackFlowMode.COMPLETE);
		}
	}

	_pushFlowEntriesStart(straightFlow?) {
		straightFlow.pushFlowEntry(UnitDeclarationFlowEntry);
	}

	_pushFlowEntriesEnd(straightFlow?) {
		straightFlow.pushFlowEntry(UnitDeathFlowEntry);
		straightFlow.pushFlowEntry(UnitSyncopeFlowEntry);
		
		// The exp processing for real battle and the exp processing for easy battle are added,
		// however, only one processing is executed.
		straightFlow.pushFlowEntry(RealExperienceFlowEntry);
		straightFlow.pushFlowEntry(EasyExperienceFlowEntry);
		
		straightFlow.pushFlowEntry(WeaponBrokenFlowEntry);
		straightFlow.pushFlowEntry(StateAutoRemovalFlowEntry);
	}
}

class UnitDeclarationFlowEntry extends BaseFlowEntry {

	_capsuleEvent: any = null;

	enterFlowEntry(coreAttack?) {
		this._prepareMemberData(coreAttack);
		return this._completeMemberData(coreAttack);
	}

	moveFlowEntry() {
		var result = MoveResult.CONTINUE;
		
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return result;
	}

	_prepareMemberData(coreAttack?) {
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeMemberData(coreAttack?) {
		var order = coreAttack.getAttackFlow().getAttackOrder();
		var battleEventData = UnitEventChecker.getUnitBattleEventData(order.getActiveUnit(), order.getPassiveUnit());
		
		// "Attacker" and "Defender" can be referenced from variables.
		root.getSceneController().notifyBattleStart(order.getActiveUnit(), order.getPassiveUnit());
		
		if (battleEventData === null) {
			return EnterResult.NOTENTER;
		}
		
		this._capsuleEvent.setBattleUnit(battleEventData.unit);
		
		if (this.isFlowSkip() || coreAttack.isBattleCut()) {
			root.setEventSkipMode(true);
		}
		
		return this._capsuleEvent.enterCapsuleEvent(battleEventData.event, true);
	}
}

class UnitDeathMode {

	static EVENT: any = 0;

	static ERASE: any = 1;
}

class UnitDeathFlowEntry extends BaseFlowEntry {

	_coreAttack: any = null;

	_eraseCounter: any = null;

	_activeUnit: any = null;

	_passiveUnit: any = null;

	_capsuleEvent: any = null;

	enterFlowEntry(coreAttack?) {
		this._prepareMemberData(coreAttack);
		return this._completeMemberData(coreAttack);
	}

	moveFlowEntry() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === UnitDeathMode.EVENT) {
			result = this._moveEvent();
		}
		else if (mode === UnitDeathMode.ERASE) {
			result = this._moveErase();
		}
		
		return result;
	}

	_prepareMemberData(coreAttack?) {
		var order = coreAttack.getAttackFlow().getAttackOrder();
		
		this._coreAttack = coreAttack;
		this._eraseCounter = createObject(EraseCounter);
		this._activeUnit = order.getActiveUnit();
		this._passiveUnit = order.getPassiveUnit();
		this._capsuleEvent = createObject(CapsuleEvent);
	}

	_completeMemberData(coreAttack?) {
		// Makes it possible to reference "Battle" in the event command "Change Variables." 
		// With this, the opponent who defeated a unit can be identified in the unit event "Dead."
		root.getSceneController().notifyBattleEnd(this._activeUnit, this._passiveUnit);
		
		// Processing is not continued if both units are not beaten.
		if (!coreAttack.getAttackFlow().isBattleUnitLosted()) {
			return EnterResult.NOTENTER;
		}
		
		if (DamageControl.isSyncope(this._passiveUnit)) {
			return EnterResult.NOTENTER;
		}
		
		// UnitDeathFlowEntry is used from CoreAttack,
		// however, the skip at the CoreAttack should be accomplished,
		// so if it's currently a skip state, skip without condition.
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		// Record that dead event will be processed later.
		coreAttack.recordUnitLostEvent(true);
		
		// Check if the event doesn't exist, or could be ended. (If injuries are allowed, death events will not occur.)
		if (this._capsuleEvent.enterCapsuleEvent(UnitEventChecker.getUnitLostEvent(this._passiveUnit), false) === EnterResult.NOTENTER) {
			if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
				this._doEndAction();
				return EnterResult.NOTENTER;
			}
			else {
				this.changeCycleMode(UnitDeathMode.ERASE);
				return EnterResult.OK;
			}
		}
		
		this._playUnitDeathMusic();
		
		// Stop the "Quick" of the Enemy turn skip to see the Died message for sure.
		CurrentMap.enableEnemyAcceleration(false);
		
		this.changeCycleMode(UnitDeathMode.EVENT);
		
		return EnterResult.OK;
	}

	_moveEvent() {
		if (this._capsuleEvent.moveCapsuleEvent() !== MoveResult.CONTINUE) {
			// Delete a message which could be displayed at the unit event.
			// Prevent drawing the map unit on the message at the easy force battle. 
			EventCommandManager.eraseMessage(MessageEraseFlag.ALL);
			this.changeCycleMode(UnitDeathMode.ERASE);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveErase() {
		if (this._eraseCounter.moveEraseCounter() !== MoveResult.CONTINUE) {
			this._coreAttack.getBattleObject().eraseRoutine(0);
			this._doEndAction();
			return MoveResult.END;
		}
		else {
			this._coreAttack.getBattleObject().eraseRoutine(this._eraseCounter.getEraseAlpha());
		}
		
		return MoveResult.CONTINUE;
	}

	_doEndAction() {
	}

	_playUnitDeathMusic() {
		var handle;
		
		if (this._isDeathMusicAllowed()) {
			handle = this._getDeathMusicHandle();
			if (!handle.isNullHandle()) {
				MediaControl.musicPlay(handle);
				this._coreAttack.getBattleObject().getBattleTable().setMusicPlayFlag(true);
			}
		}
	}

	_isDeathMusicAllowed() {
		return this._passiveUnit.getUnitType() === UnitType.PLAYER && !this._passiveUnit.isGuest();
	}

	_getDeathMusicHandle() {
		return root.querySoundHandle('playerdeathmusic');
	}
}

class UnitSyncopeFlowEntry extends BaseFlowEntry {

	_coreAttack: any = null;

	_eraseCounter: any = null;

	_activeUnit: any = null;

	_passiveUnit: any = null;

	enterFlowEntry(coreAttack?) {
		this._prepareMemberData(coreAttack);
		return this._completeMemberData(coreAttack);
	}

	moveFlowEntry() {
		if (this._eraseCounter.moveEraseCounter() !== MoveResult.CONTINUE) {
			this._coreAttack.getBattleObject().eraseRoutine(0);
			this._doEndAction();
			return MoveResult.END;
		}
		else {
			this._coreAttack.getBattleObject().eraseRoutine(this._eraseCounter.getEraseAlpha());
		}
		
		return MoveResult.CONTINUE;
	}

	_prepareMemberData(coreAttack?) {
		var order = coreAttack.getAttackFlow().getAttackOrder();
		
		this._coreAttack = coreAttack;
		this._eraseCounter = createObject(EraseCounter);
		this._activeUnit = order.getActiveUnit();
		this._passiveUnit = order.getPassiveUnit();
	}

	_completeMemberData(coreAttack?) {
		if (!DamageControl.isSyncope(this._passiveUnit)) {
			return EnterResult.NOTENTER;
		}
		
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		if (!this._coreAttack.getBattleObject().isSyncopeErasing()) {
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		return EnterResult.OK;
	}

	_doEndAction() {
	}
}

class RealExperienceMode {

	static WINDOW: any = 0;

	static SCROLL: any = 1;

	static ANIME: any = 2;

	static LEVEL: any = 3;
}

class RealExperienceFlowEntry extends BaseFlowEntry {

	_coreAttack: any = null;

	_unit: any = null;

	_getExp: any = 0;

	_growthArray: any = null;

	_experienceNumberView: any = null;

	_levelupView: any = null;

	_effect: any = null;

	enterFlowEntry(coreAttack?) {
		if (this._checkLevelup()) {
			// enterFlowEntry is recalled through AttackFlow.finalizeAttack if skip occurs while exp processing.
			return EnterResult.NOTENTER;
		}
		
		this._prepareMemberData(coreAttack);
		return this._completeMemberData(coreAttack);
	}

	moveFlowEntry() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === RealExperienceMode.WINDOW) {
			result = this._moveWindow();
		}
		else if (mode === RealExperienceMode.SCROLL) {
			result = this._moveScroll();
		}
		else if (mode === RealExperienceMode.ANIME) {
			result = this._moveAnime();
		}
		else if (mode === RealExperienceMode.LEVEL) {
			result = this._moveLevel();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		if (mode === RealExperienceMode.WINDOW) {
			this._drawWindow();
		}
		else if (mode === RealExperienceMode.LEVEL) {
			this._drawLevel();
		}
	}

	_prepareMemberData(coreAttack?) {
		var attackFlow = coreAttack.getAttackFlow();
		var order = attackFlow.getAttackOrder();
		
		this._coreAttack = coreAttack;
		this._unit = attackFlow.getPlayerUnit();
		this._getExp = order.getExp();
		this._growthArray = null;
		this._experienceNumberView = createWindowObject(ExperienceNumberView, this);
		this._levelupView = createObject(LevelupView);
	}

	_completeMemberData(coreAttack?) {
		// Don't continue if the battle is not a real type.
		if (!coreAttack.isRealBattle()) {
			return EnterResult.NOTENTER;
		}
		
		if (!Miscellaneous.isExperienceEnabled(this._unit, this._getExp)) {
			return EnterResult.NOTENTER;
		}
		
		this._growthArray = ExperienceControl.obtainExperience(this._unit, this._getExp);
		
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			// Immediately give the exp when skip.
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);
		this.changeCycleMode(RealExperienceMode.WINDOW);
		
		return EnterResult.OK;
	}

	_checkLevelup() {
		if (this._coreAttack === null) {
			return false;
		}
		
		this._doEndAction();
		
		return true;
	}

	_doEndAction() {
		if (this._growthArray !== null) {
			ExperienceControl.plusGrowth(this._unit, this._growthArray);
			ExperienceControl.obtainData(this._unit);
		}
	}

	_moveWindow() {
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			if (this._growthArray !== null) {
				// Scroll if the level up.
				this._coreAttack.getBattleObject().startExperienceScroll(this._unit);
				this.changeCycleMode(RealExperienceMode.SCROLL);
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveScroll() {
		if (this._coreAttack.getBattleObject().moveAutoScroll() !== MoveResult.CONTINUE) {
			this._changeLevelAnime();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveAnime() {
		var levelupViewParam;
		
		if (this._effect.isEffectLast()) {
			levelupViewParam = this._createLevelupViewParam();
			this._levelupView.enterLevelupViewCycle(levelupViewParam);
			this.changeCycleMode(RealExperienceMode.LEVEL);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveLevel() {
		var result = this._levelupView.moveLevelupViewCycle();
		
		if (result !== MoveResult.CONTINUE) {
			this._doEndAction();
		}
		
		return result;
	}

	_drawWindow() {
		var x = LayoutControl.getCenterX(-1, this._experienceNumberView.getNumberViewWidth());
		var y = this._coreAttack.getBattleObject().getBattleArea().y + 120;
		
		this._experienceNumberView.drawNumberView(x, y);
	}

	_drawLevel() {
		this._levelupView.drawLevelupViewCycle();
	}

	_changeLevelAnime() {
		var pos;
		var animeData = root.queryAnime('reallevelup');
		var isRight = true;
		var battleObject = this._coreAttack.getBattleObject();
		var battler = battleObject.getBattler(isRight);
		
		if (battler.getUnit() !== this._unit) {
			isRight = false;
			battler = battleObject.getBattler(isRight);
		}
		
		pos = battler.getEffectPos(animeData);
		this._effect = battleObject.createEffect(animeData, pos.x, pos.y, isRight, false);
		
		this.changeCycleMode(RealExperienceMode.ANIME);
	}

	_createLevelupViewParam() {
		var levelupViewParam = StructureBuilder.buildLevelupViewParam();
		
		levelupViewParam.targetUnit = this._unit;
		levelupViewParam.getExp = this._getExp;
		levelupViewParam.xAnime = 0;
		levelupViewParam.yAnime = 0;
		levelupViewParam.anime = null;
		levelupViewParam.growthArray = this._growthArray;
		
		return levelupViewParam;
	}
}

class EasyExperienceMode {

	static WINDOW: any = 0;

	static LEVEL: any = 1;
}

class EasyExperienceFlowEntry extends BaseFlowEntry {

	_coreAttack: any = null;

	_unit: any = null;

	_getExp: any = 0;

	_growthArray: any = null;

	_experienceNumberView: any = null;

	_levelupView: any = null;

	enterFlowEntry(coreAttack?) {
		if (this._checkLevelup()) {
			return EnterResult.NOTENTER;
		}
		
		this._prepareMemberData(coreAttack);
		return this._completeMemberData(coreAttack);
	}

	moveFlowEntry() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === EasyExperienceMode.WINDOW) {
			result = this._moveWindow();
		}
		else if (mode === EasyExperienceMode.LEVEL) {
			result = this._moveLevel();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		if (mode === EasyExperienceMode.WINDOW) {
			this._drawWindow();
		}
		else if (mode === EasyExperienceMode.LEVEL) {
			this._drawLevel();
		}
	}

	_prepareMemberData(coreAttack?) {
		var attackFlow = coreAttack.getAttackFlow();
		var order = attackFlow.getAttackOrder();
		
		this._coreAttack = coreAttack;
		this._unit = attackFlow.getPlayerUnit();
		this._getExp = order.getExp();
		this._growthArray = null;
		this._experienceNumberView = createWindowObject(ExperienceNumberView, this);
		this._levelupView = createObject(LevelupView);
	}

	_completeMemberData(coreAttack?) {
		if (coreAttack.isRealBattle()) {
			return EnterResult.NOTENTER;
		}
		
		if (!Miscellaneous.isExperienceEnabled(this._unit, this._getExp)) {
			return EnterResult.NOTENTER;
		}
		
		this._growthArray = ExperienceControl.obtainExperience(this._unit, this._getExp);
		
		if (this.isFlowSkip() || this._coreAttack.isBattleCut()) {
			// Immediately give the exp when skip.
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		this._experienceNumberView.setExperienceNumberData(this._unit, this._getExp);
		this.changeCycleMode(EasyExperienceMode.WINDOW);
		
		return EnterResult.OK;
	}

	_checkLevelup() {
		if (this._coreAttack === null) {
			return false;
		}
		
		this._doEndAction();
		
		return true;
	}

	_doEndAction() {
		if (this._growthArray !== null) {
			ExperienceControl.plusGrowth(this._unit, this._growthArray);
			ExperienceControl.obtainData(this._unit);
		}
	}

	_moveWindow() {
		var levelupViewParam;
		
		if (this._experienceNumberView.moveNumberView() !== MoveResult.CONTINUE) {
			if (this._growthArray !== null) {
				levelupViewParam = this._createLevelupViewParam();
				this._levelupView.enterLevelupViewCycle(levelupViewParam);
				
				this.changeCycleMode(EasyExperienceMode.LEVEL);
			}
			else {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveLevel() {
		var result = this._levelupView.moveLevelupViewCycle();
		
		if (result !== MoveResult.CONTINUE) {
			this._doEndAction();
		}
		
		return result;
	}

	_drawWindow() {
		var x = LayoutControl.getCenterX(-1, this._experienceNumberView.getNumberViewWidth());
		var y = LayoutControl.getNotifyY();
		
		this._experienceNumberView.drawNumberView(x, y);
	}

	_drawLevel() {
		this._levelupView.drawLevelupViewCycle();
	}

	_createLevelupViewParam() {
		var levelupViewParam = StructureBuilder.buildLevelupViewParam();
		var x = LayoutControl.getPixelX(this._unit.getMapX());
		var y = LayoutControl.getPixelY(this._unit.getMapY());
		var anime = root.queryAnime('easylevelup');
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		levelupViewParam.targetUnit = this._unit;
		levelupViewParam.getExp = this._getExp;
		levelupViewParam.xAnime = pos.x;
		levelupViewParam.yAnime = pos.y;
		levelupViewParam.anime = anime;
		levelupViewParam.growthArray = this._growthArray;
		
		return levelupViewParam;
	}
}

class WeaponBrokenFlowEntry extends BaseFlowEntry {

	_dynamicEvent: any = null;

	enterFlowEntry(coreAttack?) {
		var generator;
		var attackFlow = coreAttack.getAttackFlow();
		var order = attackFlow.getAttackOrder();
		
		if (this.isFlowSkip() || coreAttack.isBattleCut()) {
			return EnterResult.NOTENTER;
		}
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		
		this._checkDelete(order.getActiveUnit(), generator);
		this._checkDelete(order.getPassiveUnit(), generator);
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	_checkDelete(unit?, generator?) {
		var weapon;
		var isCenterShow = true;
		
		weapon = BattlerChecker.getBaseWeapon(unit);
		if (weapon === null) {
			return;
		}
		
		if (ItemControl.isItemBroken(weapon)) {
			if (unit.getUnitType() === UnitType.PLAYER && DataConfig.isWeaponLostDisplayable()) {
				generator.soundPlay(this._getLostSoundHandle(), 1);
				generator.messageTitle(weapon.getName() + StringTable.ItemLost, 0, 0, isCenterShow);
			}
		}
	}

	_getLostSoundHandle() {
		return root.querySoundHandle('itemlost');
	}
}

class StateAutoRemovalFlowEntry extends BaseFlowEntry {

	enterFlowEntry(coreAttack?) {
		var attackFlow = coreAttack.getAttackFlow();
		var order = attackFlow.getAttackOrder();
		var attackInfo = attackFlow.getAttackInfo();
		var prevIndex = order.getCurrentIndex();
		
		this._checkState(attackInfo.unitSrc, order);
		this._checkState(attackInfo.unitDest, order);
		
		order.setCurrentIndex(prevIndex);
		
		return EnterResult.NOTENTER;
	}

	_checkState(unit?, order?) {
		var i, turnState, state, type;
		var list = unit.getTurnStateList();
		var count = list.getCount();
		var arr = [];
		
		for (i = 0; i < count; i++) {
			turnState = list.getData(i);
			if (turnState.isLocked()) {
				turnState.setLocked(false);
				continue;
			}
			
			state = turnState.getState();
			type = state.getAutoRemovalType();
			if (type === StateAutoRemovalType.NONE) {
				continue;
			}
			else if (type === StateAutoRemovalType.BATTLEEND) {
				arr.push(turnState);
			}
			else if (type === StateAutoRemovalType.ACTIVEDAMAGE || type === StateAutoRemovalType.PASSIVEDAMAGE) {
				if (this._checkHit(unit, order, type)) {
					arr.push(turnState);
				}
			}
		}
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			turnState = arr[i];
			this._removeState(list, turnState);
		}
	}

	_checkHit(unit?, order?, type?) {
		var i;
		var count = order.getEntryCount();
		
		for (i = 0; i < count; i++) {
			order.setCurrentIndex(i);
			if (type === StateAutoRemovalType.ACTIVEDAMAGE) {
				if (unit === order.getActiveUnit() && order.isCurrentHit()) {
					return true;
				}
			}
			else if (type === StateAutoRemovalType.PASSIVEDAMAGE) {
				if (unit === order.getPassiveUnit() && order.isCurrentHit()) {
					return true;
				}
			}
		}
		
		return false;
	}

	_removeState(list?, turnState?) {
		var count = turnState.getRemovalCount() - 1;
		
		if (count > 0) {
			turnState.setRemovalCount(count);
			return;
		}
		
		root.getDataEditor().deleteTurnStateData(list, turnState.getState());
	}
}
