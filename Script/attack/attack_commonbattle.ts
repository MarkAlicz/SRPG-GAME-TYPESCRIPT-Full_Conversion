
class BaseBattleTable extends BaseObject {

	_battleObject: any = null;

	_straightFlowBattleStart: any = null;

	_straightFlowBattleEnd: any = null;

	_straightFlowActionStart: any = null;

	_straightFlowActionEnd: any = null;

	_isMusicPlay: any = false;

	_isBattleStart: any = true;

	initialize() {
		this._straightFlowBattleStart = createObject(StraightFlow);
		this._straightFlowBattleEnd = createObject(StraightFlow);
		this._straightFlowActionStart = createObject(StraightFlow);
		this._straightFlowActionEnd = createObject(StraightFlow);
		
		this._straightFlowBattleStart.setStraightFlowData(this);
		this._straightFlowBattleEnd.setStraightFlowData(this);
		this._straightFlowActionStart.setStraightFlowData(this);
		this._straightFlowActionEnd.setStraightFlowData(this);
		
		this._pushFlowEntriesBattleStart(this._straightFlowBattleStart);
		this._pushFlowEntriesBattleEnd(this._straightFlowBattleEnd);
		this._pushFlowEntriesActionStart(this._straightFlowActionStart);
		this._pushFlowEntriesActionEnd(this._straightFlowActionEnd);
	}

	setBattleObject(battleObject?) {
		this._battleObject = battleObject;
	}

	getBattleObject() {
		return this._battleObject;
	}

	enterBattleStart() {
		this._straightFlowBattleStart.resetStraightFlow();
		return this._straightFlowBattleStart.enterStraightFlow();
	}

	enterBattleEnd() {
		this._straightFlowBattleEnd.resetStraightFlow();
		return this._straightFlowBattleEnd.enterStraightFlow();
	}

	enterActionStart() {
		this._straightFlowActionStart.resetStraightFlow();
		return this._straightFlowActionStart.enterStraightFlow();
	}

	enterActionEnd() {
		this._straightFlowActionEnd.resetStraightFlow();
		return this._straightFlowActionEnd.enterStraightFlow();
	}

	moveBattleStart() {
		return this._straightFlowBattleStart.moveStraightFlow();
	}

	moveBattleEnd() {
		return this._straightFlowBattleEnd.moveStraightFlow();
	}

	moveActionStart() {
		return this._straightFlowActionStart.moveStraightFlow();
	}

	moveActionEnd() {
		return this._straightFlowActionEnd.moveStraightFlow();
	}

	drawBattleStart() {
		this._straightFlowBattleStart.drawStraightFlow();
	}

	drawBattleEnd() {
		this._straightFlowBattleEnd.drawStraightFlow();
	}

	drawActionStart() {
		this._straightFlowActionStart.drawStraightFlow();
	}

	drawActionEnd() {
		this._straightFlowActionEnd.drawStraightFlow();
	}

	isMusicPlay() {
		return this._isMusicPlay;
	}

	setMusicPlayFlag(isPlay?) {
		this._isMusicPlay = isPlay;
	}

	endMusic() {
		if (this._isBattleStart && this._isMusicPlay) {
			this._saveCurrentMusicTime();
			MediaControl.musicStop(MusicStopType.BACK);
		}
		
		MediaControl.resetSoundList();
	}

	_pushFlowEntriesBattleStart(straightFlow?) {
	}

	_pushFlowEntriesBattleEnd(straightFlow?) {
	}

	_pushFlowEntriesActionStart(straightFlow?) {
	}

	_pushFlowEntriesActionEnd(straightFlow?) {
	}

	_saveCurrentMusicTime() {
	}
}


//---------------------------------------------


class EasyBattleTable extends BaseBattleTable {

	_pushFlowEntriesBattleStart(straightFlow?) {
		straightFlow.pushFlowEntry(EasyStartFlowEntry);
	}

	_pushFlowEntriesBattleEnd(straightFlow?) {
		straightFlow.pushFlowEntry(EasyEndFlowEntry);
	}

	_pushFlowEntriesActionStart(straightFlow?) {
		straightFlow.pushFlowEntry(EasyInterruptSkillFlowEntry);
	}

	_pushFlowEntriesActionEnd(straightFlow?) {
		straightFlow.pushFlowEntry(EasyDiagnosticStateFlowEntry);
	}
}

class EasyStartFlowEntry extends BaseFlowEntry {

	_attackFlow: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._attackFlow.moveStartFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._attackFlow.drawStartFlow();
	}

	_prepareMemberData(battleTable?) {
	}

	_completeMemberData(battleTable?) {
		this._attackFlow = battleTable.getBattleObject().getAttackFlow();
		this._attackFlow.startAttackFlow();
		
		// Change the background music only when it is "Continue even after Battle" by specifying false.
		BattleMusicControl.playBattleMusic(battleTable, false);
		
		return EnterResult.OK;
	}
}

class EasyEndFlowEntry extends BaseFlowEntry {

	_attackFlow: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._attackFlow.moveEndFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._attackFlow.drawEndFlow();
	}

	_prepareMemberData(battleTable?) {
	}

	_completeMemberData(battleTable?) {
		this._attackFlow = battleTable.getBattleObject().getAttackFlow();
		
		return EnterResult.OK;
	}
}

class EasyDiagnosticStateFlowEntry extends BaseFlowEntry {

	_index: any = 0;

	_effect: any = null;

	_battleTable: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._effect.isEffectLast()) {
			if (!this._checkNextState()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
	}

	_prepareMemberData(battleTable?) {
		this._index = 0;
		this._effect = null;
		this._battleTable = battleTable;
	}

	_completeMemberData(battleTable?) {
		return this._checkNextState() ? EnterResult.OK : EnterResult.NOTENTER;
	}

	_checkNextState() {
		var anime;
		var battleObject = this._battleTable.getBattleObject();
		var stateArray = battleObject.getAttackOrder().getPassiveStateArray();
		
		if (this._index >= stateArray.length) {
			return false;
		}
		
		anime = stateArray[this._index].getEasyAnime();
		if (anime === null) {
			return false;
		}
		
		this._effect = this._createEasyStateEffect(battleObject, anime);
		
		this._index++;
		
		return this._effect !== null;
	}

	_createEasyStateEffect(battleObject?, anime?) {
		var battler = battleObject.getPassiveBattler();
		var pos = LayoutControl.getMapAnimationPos(battler.getMapUnitX(), battler.getMapUnitY(), anime);
		
		return battleObject.createEasyEffect(anime, pos.x, pos.y);
	}
}

class EasyInterruptSkillFlowEntry extends BaseFlowEntry {

	_skillProjector: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		return this._skillProjector.moveProjector();
	}

	drawFlowEntry() {
		this._skillProjector.drawProjector();
	}

	_prepareMemberData(battleTable?) {
		this._skillProjector = createObject(SkillProjector);
	}

	_completeMemberData(battleTable?) {
		var battleObject = battleTable.getBattleObject();
		var activeSkillArray = battleObject.getAttackOrder().getActiveSkillArray();
		var passiveSkillArray = battleObject.getAttackOrder().getPassiveSkillArray();
		
		this._skillProjector.setupProjector(BattleType.EASY, battleObject);
		
		if (battleObject.getBattler(true).getUnit() === battleObject.getAttackOrder().getActiveUnit()) {
			if (activeSkillArray.length > 0 || passiveSkillArray.length > 0) {
				this._skillProjector.startProjector(activeSkillArray, passiveSkillArray, true);
			}
			else {
				return EnterResult.NOTENTER;
			}
		}
		else {
			if (passiveSkillArray.length > 0 || activeSkillArray.length > 0) {
				this._skillProjector.startProjector(passiveSkillArray, activeSkillArray, false);
			}
			else {
				return EnterResult.NOTENTER;
			}
		}
		
		return EnterResult.OK;
	}
}


//---------------------------------------------


class RealBattleTable extends BaseBattleTable {

	_startBattleTransition: any = null;

	_endBattleTransition: any = null;

	initialize() {
		super.initialize();
		
		this._startBattleTransition = this._createStartBattleTransition();
		this._endBattleTransition = this._createEndBattleTransition();
		
		this._isBattleStart = false;
	}

	getStartBattleTransition() {
		return this._startBattleTransition;
	}

	getEndBattleTransition() {
		return this._endBattleTransition;
	}

	isBattleStart() {
		return this._isBattleStart;
	}

	setBattleStartFlag(isStart?) {
		this._isBattleStart = isStart;
		this.getBattleObject().setBattleLayoutVisible(true);
	}

	_createStartBattleTransition() {
		return createObject(BattleTransition);
	}

	_createEndBattleTransition() {
		return createObject(CloseBattleTransition);
	}

	_pushFlowEntriesBattleStart(straightFlow?) {
		straightFlow.pushFlowEntry(TransitionStartFlowEntry);
		straightFlow.pushFlowEntry(WatchLoopFlowEntry);
		straightFlow.pushFlowEntry(RealStartFlowEntry);
	}

	_pushFlowEntriesBattleEnd(straightFlow?) {
		straightFlow.pushFlowEntry(RealEndFlowEntry);
		straightFlow.pushFlowEntry(TransitionEndFlowEntry);
	}

	_pushFlowEntriesActionStart(straightFlow?) {
		straightFlow.pushFlowEntry(RealInterruptSkillFlowEntry);
		straightFlow.pushFlowEntry(RealWeaponCutinFlowEntry);
		straightFlow.pushFlowEntry(RealSkillCutinFlowEntry);
		straightFlow.pushFlowEntry(RealUnitCutinFlowEntry);
	}

	_pushFlowEntriesActionEnd(straightFlow?) {
		straightFlow.pushFlowEntry(RealDiagnosticStateFlowEntry);
	}
}

// Drawings in the drawFlowEntry is not a target to zoom.
// To be a target to zoom, call the createEffect or pushCustomEffect.
class TransitionStartFlowEntry extends BaseFlowEntry {

	_battleTable: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		this._checkMusic();
		
		if (this._battleTable.getStartBattleTransition().moveBattleTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._battleTable.getStartBattleTransition().drawBattleTransition();
	}

	_prepareMemberData(battleTable?) {
	}

	_completeMemberData(battleTable?) {
		this._battleTable = battleTable;
		this._battleTable.getStartBattleTransition().setupBattleTransition();
		
		return EnterResult.OK;
	}

	_checkMusic() {
		var isMusicPlay;
		
		if (this._battleTable.getStartBattleTransition().isSecondHalf()) {
			if (!this._battleTable.isBattleStart()) {
				isMusicPlay = BattleMusicControl.playBattleMusic(this._battleTable, true);
				this._battleTable.setMusicPlayFlag(isMusicPlay);
				this._battleTable.setBattleStartFlag(true);
			}
		}
	}
}

class TransitionEndFlowEntry extends BaseFlowEntry {

	_battleTable: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._battleTable.getEndBattleTransition().moveBattleTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._battleTable.getEndBattleTransition().drawBattleTransition();
	}

	_prepareMemberData(battleTable?) {
	}

	_completeMemberData(battleTable?) {
		this._battleTable = battleTable;
		this._battleTable.getEndBattleTransition().setupBattleTransition();
		
		return EnterResult.OK;
	}
}

// Don't execute the next FlowEntry (the unit event when it's battle) unless
// the wait motion enters the loop processing (or the final animation frame).
// Because of this, the performance such as starting to talk when holding the sword etc. is possible.
class WatchLoopFlowEntry extends BaseFlowEntry {

	_battleTable: any = null;

	_battlerRight: any = null;

	_battlerLeft: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._battlerRight.isLoopZone() && this._battlerLeft.isLoopZone()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
	}

	_prepareMemberData(battleTable?) {
		var battleObject = battleTable.getBattleObject();
		
		this._battleTable = battleTable;
		this._battlerRight = battleObject.getBattler(true);
		this._battlerLeft = battleObject.getBattler(false);
	}

	_completeMemberData(battleTable?) {
		return EnterResult.OK;
	}
}

class RealStartFlowEntry extends BaseFlowEntry {

	_attackFlow: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._attackFlow.moveStartFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._attackFlow.drawStartFlow();
	}

	_prepareMemberData(battleTable?) {
	}

	_completeMemberData(battleTable?) {
		this._attackFlow = battleTable.getBattleObject().getAttackFlow();
		this._attackFlow.startAttackFlow();
		
		return EnterResult.OK;
	}
}

class RealEndFlowEntry extends BaseFlowEntry {

	_attackFlow: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._attackFlow.moveEndFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		this._attackFlow.drawEndFlow();
	}

	_prepareMemberData(battleTable?) {
	}

	_completeMemberData(battleTable?) {
		this._attackFlow = battleTable.getBattleObject().getAttackFlow();
		
		return EnterResult.OK;
	}
}

class RealDiagnosticStateFlowEntry extends BaseFlowEntry {

	_index: any = 0;

	_effect: any = null;

	_battleTable: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._effect.isEffectLast()) {
			if (!this._checkNextState()) {
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
	}

	_prepareMemberData(battleTable?) {
		this._index = 0;
		this._effect = null;
		this._battleTable = battleTable;
	}

	_completeMemberData(battleTable?) {
		return this._checkNextState() ? EnterResult.OK : EnterResult.NOTENTER;
	}

	_checkNextState() {
		var anime;
		var battleObject = this._battleTable.getBattleObject();
		var stateArray = battleObject.getAttackOrder().getPassiveStateArray();
		
		if (this._index >= stateArray.length) {
			return false;
		}
		
		anime = stateArray[this._index].getRealAnime();
		if (anime === null) {
			return false;
		}
		
		this._effect = this._createRealStateEffect(battleObject, anime);
		
		this._index++;
		
		return this._effect !== null;
	}

	_createRealStateEffect(battleObject?, anime?) {
		var isRight;
		var battlerPassive = battleObject.getPassiveBattler();
		var pos = battlerPassive.getEffectPos(anime);
		var offsetPos = EnemyOffsetControl.getOffsetPos(battlerPassive);
		
		if (root.getAnimePreference().isEffectDefaultStyle()) {
			isRight = battleObject.getActiveBattler() === battleObject.getBattler(true);
		}
		else {
			isRight = battleObject.getPassiveBattler() === battleObject.getBattler(true);
		}
		
		return battleObject.createEffect(anime, pos.x + offsetPos.x, pos.y + offsetPos.y, isRight, false);
	}
}

class RealInterruptSkillFlowEntry extends BaseFlowEntry {

	_skillProjector: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		return this._skillProjector.moveProjector();
	}

	drawFlowEntry() {
		this._skillProjector.drawProjector();
	}

	_prepareMemberData(battleTable?) {
		this._skillProjector = createObject(SkillProjector);
	}

	_completeMemberData(battleTable?) {
		var battleObject = battleTable.getBattleObject();
		var activeSkillArray = battleObject.getAttackOrder().getActiveSkillArray();
		var passiveSkillArray = battleObject.getAttackOrder().getPassiveSkillArray();
		
		this._skillProjector.setupProjector(BattleType.REAL, battleObject);
		
		if (battleObject.getBattler(true).getUnit() === battleObject.getAttackOrder().getActiveUnit()) {
			if (activeSkillArray.length > 0 || passiveSkillArray.length > 0) {
				this._skillProjector.startProjector(activeSkillArray, passiveSkillArray, true);
			}
			else {
				return EnterResult.NOTENTER;
			}
		}
		else {
			if (passiveSkillArray.length > 0 || activeSkillArray.length > 0) {
				this._skillProjector.startProjector(passiveSkillArray, activeSkillArray, false);
			}
			else {
				return EnterResult.NOTENTER;
			}
		}
		
		return EnterResult.OK;
	}
}

class BaseCutinFlowEntry extends BaseFlowEntry {

	_index: any = 0;

	_effect: any = null;

	_battleTable: any = null;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._effect.isEffectLast()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
	}

	_prepareMemberData(battleTable?) {
		this._index = 0;
		this._effect = null;
		this._battleTable = battleTable;
	}

	_completeMemberData(battleTable?) {
		var anime = this._getCutinAnime(battleTable);
		
		this._effect = this._createCutin(anime);
		
		return this._effect !== null ? EnterResult.OK : EnterResult.NOTENTER;
	}

	_createCutin(anime?) {
		var pos;
		var battleObject = this._battleTable.getBattleObject();
		var battler = battleObject.getActiveBattler();
		var isRight = battler === battleObject.getBattler(true);
		
		if (anime === null || !this._isCutinAllowed()) {
			return null;
		}
		
		if (root.getAnimePreference().isCutinCentering()) {
			pos = this._getCenterPos(anime);
		}
		else {
			pos = this._getBattlerPos(anime);
		}
		
		pos.x += root.getAnimePreference().getCutinOffsetX();
		pos.y += root.getAnimePreference().getCutinOffsetY();
		
		return battleObject.createEffect(anime, pos.x, pos.y, isRight, false);
	}

	_getCenterPos(anime?) {
		var battleObject = this._battleTable.getBattleObject();
		var area = battleObject.getBattleArea();
		var size = Miscellaneous.getFirstKeySpriteSize(anime, 0);
		var x = Math.floor(area.width / 2) - Math.floor(size.width / 2);
		var y = Math.floor(area.height / 2) - Math.floor(size.height / 2);
		var pos = createPos(x, y);
		
		pos.x += battleObject.getAutoScroll().getScrollX();
		
		return pos;
	}

	_getBattlerPos(anime?) {
		var battler;
		var battleObject = this._battleTable.getBattleObject();
		
		if (this._isActiveBattler()) {
			battler = battleObject.getActiveBattler();
		}
		else {
			battler = battleObject.getPassiveBattler();
		}
		
		return battler.getEffectPos(anime);
	}

	_isCutinAllowed() {
		// There is a possibility to cut off the config.
		return true;
	}

	_getCutinAnime(battleTable?) {
		return null;
	}

	_isActiveBattler() {
		return true;
	}
}

class RealWeaponCutinFlowEntry extends BaseCutinFlowEntry {

	_getCutinAnime(battleTable?) {
		var order = battleTable.getBattleObject().getAttackOrder();
		var unit = order.getActiveUnit();
		
		if (order.isCurrentFirstAttack()) {
			// Check if the "Initial Attack Cutin" is set at the "Weapon Effects" of equipped weapons.
			return WeaponEffectControl.getAnime(unit, WeaponEffectAnime.FIRSTATTACK);
		}
		
		return null;
	}
}

class RealSkillCutinFlowEntry extends BaseCutinFlowEntry {

	_index: any = 0;

	_arr: any = null;

	_battleTable: any = null;

	_isPassiveCheck: any = false;

	enterFlowEntry(battleTable?) {
		this._prepareMemberData(battleTable);
		return this._completeMemberData(battleTable);
	}

	moveFlowEntry() {
		if (this._arr[this._index].isEffectLast()) {
			this._index++;
			if (this._index === this._arr.length) {
				return this._checkNextSkill();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
	}

	_prepareMemberData(battleTable?) {
		this._index = 0;
		this._arr = [];
		this._battleTable = battleTable;
	}

	_completeMemberData(battleTable?) {
		this._checkActiveSkill();
		if (this._arr.length === 0) {
			this._checkPassiveSkill();
		}
		
		return this._arr.length > 0 ? EnterResult.OK : EnterResult.NOTENTER;
	}

	_checkActiveSkill() {
		var order = this._battleTable.getBattleObject().getAttackOrder();
		var unit = order.getActiveUnit();
		var arr = order.getActiveSkillArray();
		var type = order.getActiveMotionActionType();
		var attackTemplateType = BattlerChecker.findAttackTemplateTypeFromUnit(unit);
		
		this._checkSkill(unit, arr, type, attackTemplateType);
	}

	_checkPassiveSkill() {
		var order = this._battleTable.getBattleObject().getAttackOrder();
		var unit = order.getPassiveUnit();
		var arr = order.getPassiveSkillArray();
		var type = order.getPassiveMotionActionType();
		var attackTemplateType = BattlerChecker.findAttackTemplateTypeFromUnit(unit);
		
		this._isPassiveCheck = true;
		this._checkSkill(unit, arr, type, attackTemplateType);
	}

	_checkSkill(unit?, arr?, type?, attackTemplateType?) {
		var i, skill, anime, effect;
		var count = arr.length;
		
		this._arr = [];
		this._index = 0;
		
		for (i = 0; i < count; i++) {
			skill = arr[i];
			anime = unit.getCutinAnimeFromSkill(attackTemplateType, type, skill);
			effect = this._createCutin(anime);
			if (effect !== null) {
				this._arr.push(effect);
			}
		}
	}

	_checkNextSkill() {
		if (this._isPassiveCheck) {
			return MoveResult.END;
		}
		
		this._checkPassiveSkill();
		
		return this._arr.length > 0 ? MoveResult.CONTINUE : MoveResult.END;
	}

	_isActiveBattler() {
		return !this._isPassiveCheck;
	}
}

class RealUnitCutinFlowEntry extends BaseCutinFlowEntry {

	_getCutinAnime(battleTable?) {
		var order = battleTable.getBattleObject().getAttackOrder();
		var type = order.getActiveMotionActionType();
		var unit = order.getActiveUnit();
		var attackTemplateType = BattlerChecker.findAttackTemplateTypeFromUnit(unit);
		
		if (order.isCurrentCritical() && order.isCurrentFinish()) {
			if (type === MotionFighter.CRITICALATTACK1 || type === MotionFighter.CRITICALATTACK2) {
				// If "Crt Direct Finisher" is not set in the "Battle Motions" for a class or weapon, either "Crt Direct Attack 1" or "Crt Direct Attack 2" will be referenced.
				// Similarly, "Cut-in" will also reference either "Crt Direct Attack 1" or "Crt Direct Attack 2".
				// However, there may be cases where "Crt Direct Finisher" is not set in "Battle Motions", but effects for "Crt Direct Finisher" are configured in "Cut-in".
				// In other words, this refers to scenarios where the motion for "Crt Direct Finisher" is not prepared, but the effects are.
				// In such cases, since we want "Cut-in" to reference "Crt Direct Finisher", we specify MotionFighter.CRITICALFINISHATTACK.
				type = MotionFighter.CRITICALFINISHATTACK;
			}
		}
		
		return unit.getCutinAnime(attackTemplateType, type);
	}
}

class BattleTransition extends BaseObject {

	_xTransition: any = 0;

	_xSrc: any = 0;

	setupBattleTransition() {
		this._xTransition = RealBattleArea.WIDTH;
		this._xSrc = 0 - this._getMargin();
	}

	moveBattleTransition() {
		this._xSrc += this._getScrollPixel();
		
		if (this._xSrc > 1280 + this._getMargin()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawBattleTransition() {
		root.getGraphicsManager().enableMapClipping(false);
		
		this._drawTransitionInternal();
		
		root.getGraphicsManager().enableMapClipping(true);
	}

	isSecondHalf() {
		return this._xSrc > 640;
	}

	_drawTransitionInternal() {
		var handle = root.queryGraphicsHandle('battletransition');
		var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.PICTURE);
		var x = this._xSrc;
		
		if (pic !== null) {
			pic.drawStretchParts(0, 0, root.getGameAreaWidth(), root.getGameAreaHeight(), x, 0, 640, 480);
		}
	}

	_getScrollPixel() {
		var d = this._getBasePixel();
	
		if (!DataConfig.isHighPerformance()) {
			d *= 2;
		}
		
		if (Miscellaneous.isGameAcceleration()) {
			d *= 2;
		}
		
		return d;
	}

	_getBasePixel() {
		return 40;
	}

	_getMargin() {
		return 360;
	}
}

class CloseBattleTransition extends BaseObject {

	_transition: any = null;

	setupBattleTransition() {
		this._transition = createObject(FadeTransition);
		this._transition.setFadeSpeed(8);
		this._transition.setDestOut();
	}

	moveBattleTransition() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawBattleTransition() {
		root.getGraphicsManager().enableMapClipping(false);
		
		this._transition.drawTransition();
		
		root.getGraphicsManager().enableMapClipping(true);
	}
}

class BattleMusicControl {

	static playBattleMusic(battleTable?, isForce?) {
		var handleActive;
		var data = this._getBattleMusicData(battleTable);
		var handle = data.handle;
		var isMusicPlay = false;
		
		if (handle.isNullHandle()) {
			isMusicPlay = false;
		}
		else {
			handleActive = root.getMediaManager().getActiveMusicHandle();
			if (handle.isEqualHandle(handleActive)) {
				// Don't play background music because the background music which was about to be played has already been played.
				isMusicPlay = false;
			}
			else {
				if (data.isNew) {
					MediaControl.resetMusicList();
					MediaControl.musicPlayNew(handle);
					this._restorePreviousMusicTime(handle);
					this._arrangeMapMusic(handle);
				}
				else if (isForce) {
					MediaControl.musicPlay(handle);
					this._restorePreviousMusicTime(handle);
					isMusicPlay = true;
				}
			}
		}
		
		return isMusicPlay;
	}

	static _getBattleMusicData(battleTable?) {
		var handle;
		var battleObject = battleTable.getBattleObject();
		var attackInfo = battleObject.getAttackInfo();
		var unitSrc = attackInfo.unitSrc;
		var unitDest = attackInfo.unitDest;
		var handleUnitSrc = unitSrc.getBattleMusicHandle();
		var handleUnitDest = unitDest.getBattleMusicHandle();
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var isNew = false;
		
		if (!handleUnitSrc.isNullHandle()) {
			handle = handleUnitSrc;
			isNew = unitSrc.isBattleMusicContinue();
		}
		else if (!handleUnitDest.isNullHandle()) {
			handle = handleUnitDest;
			isNew = unitDest.isBattleMusicContinue();
		}
		else {
			if (unitSrc.getUnitType() === UnitType.PLAYER) {
				// Set the player's background music if the player launched an attack.
				handle = mapInfo.getPlayerBattleMusicHandle();
			}
			else if (unitSrc.getUnitType() === UnitType.ALLY) {
				handle = mapInfo.getAllyBattleMusicHandle();
			}
			else {
				handle = mapInfo.getEnemyBattleMusicHandle();
			}
		}
		
		return {
			handle: handle,
			isNew: isNew
		};
	}

	static _arrangeMapMusic(handle?) {
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		mapInfo.setPlayerTurnMusicHandle(handle);
		mapInfo.setEnemyTurnMusicHandle(handle);
		mapInfo.setAllyTurnMusicHandle(handle);
		
		mapInfo.setPlayerBattleMusicHandle(handle);
		mapInfo.setEnemyBattleMusicHandle(handle);
		mapInfo.setAllyBattleMusicHandle(handle);
	}

	static _restorePreviousMusicTime(handle?) {
	}
}
