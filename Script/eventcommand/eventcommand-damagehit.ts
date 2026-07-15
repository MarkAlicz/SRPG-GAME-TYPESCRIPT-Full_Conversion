
// If the unit needs to die with a purpose of the performance, 'Died' needs to be set up at the 'Remove Unit'.
// 'Reduce Damage' supposes Immortal. So even if a huge damage is specified, the unit might not die.
class DamageHitEventCommand extends BaseEventCommand {

	_damageData: any = null;

	_straightFlow: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (InputControl.isStartAction()) {
			root.setEventSkipMode(true);
			this._damageData.dynamicAnime = null;
		}
		
		if (this._damageData.dynamicAnime !== null) {
			this._damageData.dynamicAnime.moveDynamicAnime();
		}
		
		return this._straightFlow.moveStraightFlow();
	}

	drawEventCommandCycle() {
		if (this._damageData.dynamicAnime !== null) {
			this._damageData.dynamicAnime.drawDynamicAnime();
		}
		
		this._straightFlow.drawStraightFlow();
	}

	isEventCommandSkipAllowed() {
		// Skip is always not allowed by return false.
		// If the target unit has important item and stock is full,
		// check the item is necessary.
		return false;
	}

	_prepareEventCommandMemberData() {
		this._straightFlow = createObject(StraightFlow);
	}

	_checkEventCommand() {
		var targetUnit = root.getEventCommandObject().getTargetUnit();
		
		if (targetUnit === null || targetUnit.getAliveState() !== AliveType.ALIVE) {
			return false;
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		this._damageData = this._createDamageData();
		
		this._straightFlow.setStraightFlowData(this._damageData);
		this._pushFlowEntries(this._straightFlow);
		
		return this._straightFlow.enterStraightFlow();
	}

	_createDamageData() {
		var damageData: any = {};
		var eventCommandData = root.getEventCommandObject();
		var damage = eventCommandData.getDamageValue();
		var type = eventCommandData.getDamageType();
		
		damageData.launchUnit = eventCommandData.getLaunchUnit();
		damageData.targetUnit = eventCommandData.getTargetUnit();
		damageData.hit = eventCommandData.getHit();
		damageData.damage = Calculator.calculateDamageValue(damageData.targetUnit, damage, type, 0);
		damageData.isHit = this._isHit(damageData);
		damageData.curHp = this._getHp(damageData);
		damageData.dynamicAnime = null;
		
		return damageData;
	}

	_isHit(damageData?) {
		var targetUnit = damageData.targetUnit;
		var hp = targetUnit.getHp() - damageData.damage;
		var hitRate = Calculator.calculateDamageHit(targetUnit, damageData.hit);
		
		if (!Probability.getProbability(hitRate)) {
			return false;
		}
		
		if (hp <= 0) {
			if (targetUnit.isImmortal()) {
				return false;
			}
			
			var skill = SkillControl.getBattleSkillFromValue(targetUnit, null, SkillType.SURVIVAL, SurvivalValue.AVOID);
			if (skill !== null) {
				if (Probability.getInvocationProbabilityFromSkill(targetUnit, skill)) {
					return false;
				}
			}
		}
		
		return true;
	}

	_getHp(damageData?) {
		var hp = damageData.targetUnit.getHp();
		
		if (!damageData.isHit) {
			return hp;
		}
		
		// Decrease the unit HP according to damage.
		hp -= damageData.damage;
		if (hp <= 0) {
			if (this._isSurvival(damageData)) {
				// If the unit is immortal, keep HP as 1.
				return 1;
			}
			else {
				return 0;
			}
		}
		
		return hp;
	}

	_isSurvival(damageData?) {
		var skill;
		var targetUnit = damageData.targetUnit;
		var hp = targetUnit.getHp() - damageData.damage;
		
		if (hp <= 0) {
			skill = SkillControl.getBattleSkillFromValue(targetUnit, null, SkillType.SURVIVAL, SurvivalValue.SURVIVAL);
			if (skill !== null) {
				if (Probability.getInvocationProbabilityFromSkill(targetUnit, skill)) {
					return true;
				}
			}
		}
		
		return false;
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(DamageAnimeFlowEntry);
		straightFlow.pushFlowEntry(DamageShowFlowEntry);
		straightFlow.pushFlowEntry(DamageEraseFlowEntry);
		straightFlow.pushFlowEntry(DamageLastFlowEntry);
	}
}

class DamageAnimeFlowEntry extends BaseFlowEntry {

	_damageData: any = null;

	enterFlowEntry(damageData?) {
		this._damageData = damageData;
		
		if (this.isFlowSkip()) {
			return EnterResult.NOTENTER;
		}
		
		this._startDamageHitAnime();
		
		return EnterResult.OK;
	}

	moveFlowEntry() {
		var motion;
		var animeData = this._damageData.dynamicAnime;
		
		if (animeData === null) {
			return MoveResult.END;
		}
		
		motion = animeData.getAnimeMotion();
		if (motion === null || motion.isAttackHitFrame()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_startDamageHitAnime() {
		var targetUnit = this._damageData.targetUnit;
		var x = LayoutControl.getPixelX(targetUnit.getMapX());
		var y = LayoutControl.getPixelY(targetUnit.getMapY());
		var anime = root.getEventCommandObject().getDamageAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._damageData.dynamicAnime = createObject(DynamicAnime);
		this._damageData.dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}

class DamageShowFlowEntry extends BaseFlowEntry {

	_damageData: any = null;

	_damagePopup: any = null;

	_easyMapUnit: any = null;

	enterFlowEntry(damageData?) {
		this._damageData = damageData;
		
		if (this.isFlowSkip()) {
			return EnterResult.NOTENTER;
		}
		
		if (damageData.isHit) {
			if (this._isPopupAllowed()) {
				this._setupDamagePopup();
			}
			else {
				return EnterResult.NOTENTER;
			}
		}
		else {
			this._setupEvasion();
		}
		
		return EnterResult.OK;
	}

	moveFlowEntry() {
		if (this._damagePopup !== null) {
			if (this._damagePopup.moveEffect() !== MoveResult.CONTINUE) {
				return MoveResult.END;
			}
		}
		
		if (this._easyMapUnit !== null) {
			this._easyMapUnit.moveMapUnit();
			if (this._easyMapUnit.isActionLast()) {
				this._damageData.targetUnit.setInvisible(false);
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		if (this._damagePopup !== null) {
			this._damagePopup.drawEffect(0, 0, false);
		}
		
		if (this._easyMapUnit !== null) {
			this._easyMapUnit.drawMapUnit();
		}
	}

	_setupDamagePopup() {
		var effect = createObject(DamagePopupEffect);
		var dx = Math.floor((DamagePopup.WIDTH - GraphicsFormat.CHARCHIP_WIDTH) / 2);
		var dy = Math.floor((DamagePopup.HEIGHT - GraphicsFormat.CHARCHIP_HEIGHT) / 2);
		var targetUnit = this._damageData.targetUnit;
		var xPixel = LayoutControl.getPixelX(targetUnit.getMapX());
		var yPixel = LayoutControl.getPixelY(targetUnit.getMapY());
		
		if (yPixel >= root.getGameAreaHeight() - 32) {
			dy -= 32;
		}
		else {
			dy += 32;
		}
		dx -= 32;
		
		effect.setPos(xPixel + dx, yPixel + dy, this._damageData.damage);
		effect.setAsync(true);
		effect.setCritical(false);
		this._damagePopup = effect;
	}

	_setupEvasion() {
		var targetUnit = this._damageData.targetUnit;
		
		this._easyMapUnit = createObject(EvasionMapUnit);
		this._easyMapUnit.setupEvasionMapUnit(targetUnit, true);
		this._easyMapUnit.startEvasion(targetUnit);
		targetUnit.setInvisible(true);
	}

	_isPopupAllowed() {
		return EnvironmentControl.isDamagePopup();
	}
}

class DamageEraseFlowEntry extends BaseFlowEntry {

	_damageData: any = null;

	_eraseCounter: any = null;

	enterFlowEntry(damageData?) {
		this._damageData = damageData;
		
		if (damageData.isHit) {
			this._doAction(damageData);
		}
		
		if (this.isFlowSkip() || damageData.curHp > 0) {
			return EnterResult.NOTENTER;
		}
		
		this._damageData.targetUnit.setInvisible(true);
		
		this._eraseCounter = createObject(EraseCounter);
		
		return EnterResult.OK;
	}

	moveFlowEntry() {
		return this._eraseCounter.moveEraseCounter();
	}

	drawFlowEntry() {
		var targetUnit = this._damageData.targetUnit;
		var x = LayoutControl.getPixelX(targetUnit.getMapX());
		var y = LayoutControl.getPixelY(targetUnit.getMapY());
		var alpha = this._eraseCounter.getEraseAlpha();
		var unitRenderParam = StructureBuilder.buildUnitRenderParam();
		var colorIndex = targetUnit.getUnitType();
		var animationIndex = MapLayer.getAnimationIndexFromUnit(targetUnit);
		
		if (targetUnit.isWait()) {
			colorIndex = 3;
		}
		
		if (targetUnit.isActionStop()) {
			animationIndex = 1;
		}
		
		unitRenderParam.colorIndex = colorIndex;
		unitRenderParam.animationIndex = animationIndex;
		unitRenderParam.alpha = alpha;
		
		UnitRenderer.drawScrollUnit(targetUnit, x, y, unitRenderParam);
	}

	_doAction(damageData?) {
		var targetUnit = damageData.targetUnit;
		
		if (damageData.curHp > 0) {
			targetUnit.setHp(damageData.curHp);
		}
		else {
			targetUnit.setHp(0);
			
			// Change the state into died.
			DamageControl.setDeathState(targetUnit);
		}
	}
}

class DamageLastFlowEntry extends BaseFlowEntry {

	_damageData: any = null;

	_damageHitFlow: any = null;

	enterFlowEntry(damageData?) {
		this._damageData = damageData;
		
		if (damageData.curHp > 0) {
			return EnterResult.NOTENTER;
		}
		
		this._damageHitFlow = createObject(DamageHitFlow);
		if (this._damageHitFlow.enterDamageHitFlowCycle(this._damageData.launchUnit, this._damageData.targetUnit) === EnterResult.NOTENTER) {
			this._doEndAction();
			return EnterResult.NOTENTER;
		}
		
		// If the return EnterResult.OK, drawing process is needed, so disable skip.
		root.setEventSkipMode(false);
		
		return EnterResult.OK;
	}

	moveFlowEntry() {
		return this._damageHitFlow.moveDamageHitFlowCycle();
	}

	drawFlowEntry() {
		this._damageHitFlow.drawDamageHitFlowCycle();
	}

	_doEndAction() {
		if (root.getChainEvent(0) === null) {
			CurrentMap.setTurnSkipMode(false);
		}
	}
}
