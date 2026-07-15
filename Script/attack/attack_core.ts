
// This object is used from the PreAttack.
class CoreAttack extends BaseObject {

	_attackParam: any = null;

	_battleType: any = 0;

	_isUnitLostEventShown: any = false;

	_attackFlow: any = null;

	_battleObject: any = null;

	_isBattleCut: any = false;

	enterCoreAttackCycle(attackParam?) {
		this._prepareMemberData(attackParam);
		return this._completeMemberData(attackParam);
	}

	moveCoreAttackCycle() {
		if (this._battleObject.isBattleSkipAllowed() && InputControl.isStartAction()) {
			this._doSkipAction();
			return MoveResult.END;
		}
		else {
			return this._battleObject.moveBattleCycle();
		}
	}

	drawCoreAttackCycle() {
		this._battleObject.drawBattleCycle();
	}

	backCoreAttackCycle() {
		if (root.getEventCommandType() !== EventCommandType.FORCEBATTLE) {
			this._battleObject.backBattleCycle();
		}
	}

	isRealBattle() {
		return this._battleType === BattleType.REAL;
	}

	getAttackFlow() {
		return this._attackFlow;
	}

	getBattleObject() {
		return this._battleObject;
	}

	isUnitLostEventShown() {
		return this._isUnitLostEventShown;
	}

	recordUnitLostEvent(isShown?) {
		this._isUnitLostEventShown = isShown;
	}

	isBattleCut() {
		return this._isBattleCut;
	}

	_prepareMemberData(attackParam?) {
		this._attackParam = attackParam;
		this._battleType = 0;
		this._isUnitLostEventShown = false;
		this._attackFlow = createObject(AttackFlow);
		this._battleObject = null;
	}

	_completeMemberData(attackParam?) {
		// NOTE (JS->TS): EnterResult only defines OK/NOTENTER - CONTINUE (a MoveResult value, 200)
		// doesn't exist on it. Evaluates to undefined at runtime, same as the original. Likely a
		// copy/paste mix-up with the MoveResult.CONTINUE 'in progress' sentinel used elsewhere in
		// this file - worth a look, not silently fixed since intent isn't obvious from code alone.
		var result: any = (EnterResult as any).CONTINUE;
		
		this._checkAttack(attackParam);
		
		if (CurrentMap.isCompleteSkipMode()) {
			// If skip the battle, battle ends at this time.
			this._finalizeAttack();
			result = EnterResult.NOTENTER;
		}
		else {
			this._playAttackStartSound();
			this._battleObject.openBattleCycle(this);
		}
		
		return result;
	}

	_checkAttack(attackParam?) {
		if (this._attackParam.attackStartType === AttackStartType.NORMAL) {
			this._startNormalAttack();
		}
		else if (this._attackParam.attackStartType === AttackStartType.FORCE) {
			this._startForceAttack();
		}
	}

	_startNormalAttack() {
		var infoBuilder = createObject(NormalAttackInfoBuilder);
		var orderBuilder = createObject(NormalAttackOrderBuilder);
		var attackInfo = infoBuilder.createAttackInfo(this._attackParam);
		var attackOrder = orderBuilder.createAttackOrder(attackInfo);
		
		return this._startCommonAttack(attackInfo, attackOrder);
	}

	_startForceAttack() {
		var infoBuilder = createObject(ForceAttackInfoBuilder);
		var orderBuilder = createObject(ForceAttackOrderBuilder);
		var attackInfo = infoBuilder.createAttackInfo(this._attackParam);
		var attackOrder = orderBuilder.createAttackOrder(attackInfo);
		
		return this._startCommonAttack(attackInfo, attackOrder);
	}

	_startCommonAttack(attackInfo?, attackOrder?) {
		this._setBattleTypeAndObject(attackInfo, attackOrder);
		this._attackFlow.setAttackInfoAndOrder(attackInfo, attackOrder, this);
	}

	_finalizeAttack() {
		this._attackFlow.finalizeAttack();
	}

	_doSkipAction() {
		this._isBattleCut = true;
		this._attackFlow.finalizeAttack();
		this._battleObject.endBattle();
		this._isBattleCut = false;
	}

	_setBattleTypeAndObject(attackInfo?, attackOrder?) {
		var battleType = attackInfo.battleType;
		var unitSrc = this._attackParam.unit;
		var unitDest = this._attackParam.targetUnit;
		
		if (battleType === BattleType.FORCEREAL) {
			this._battleType = BattleType.REAL;
		}
		else if (battleType === BattleType.FORCEEASY) {
			this._battleType = BattleType.EASY;
		}
		else {
			// The player's battle which is not a force battle, become an easy battle if the isAllyBattleFixed returns true.
			if ((unitSrc.getUnitType() === UnitType.ALLY || unitDest.getUnitType() === UnitType.ALLY) && DataConfig.isAllyBattleFixed()) {
				this._battleType = BattleType.EASY;
			}
			else {
				this._battleType = battleType;
			}
		}
		
		if (!DataConfig.isMotionGraphicsEnabled()) {
			// It's an easy battle if the real battle is off without conditions.
			this._battleType = BattleType.EASY;
		}
		else {
			if (this._isAnimeEmpty(unitSrc, unitDest)) {
				// It's an easy battle if the animation is not set at the unit.
				this._battleType = BattleType.EASY;
			}
		}
		
		if (this._battleType === BattleType.REAL) {
			this._battleObject = createObject(RealBattle);
		}
		else {
			this._battleObject = createObject(EasyBattle);
		}
	}

	_isAnimeEmpty(unitSrc?, unitDest?) {
		var animeSrc = BattlerChecker.findBattleAnimeFromUnit(unitSrc);
		var animeDest = BattlerChecker.findBattleAnimeFromUnit(unitDest);
		
		return animeSrc === null || animeDest === null;
	}

	_playAttackStartSound() {
		if (this.isRealBattle()) {
			// Play the sound to start an attack at the real battle.
			MediaControl.soundDirect('attackstart');
		}
	}
}

class BaseAttackInfoBuilder extends BaseObject {

	createAttackInfo(attackParam?) {
		var unitSrc = attackParam.unit;
		var unitDest = attackParam.targetUnit;
		var attackInfo = StructureBuilder.buildAttackInfo();
		var terrain = PosChecker.getTerrainFromPosEx(unitDest.getMapX(), unitDest.getMapY());
		var terrainLayer = PosChecker.getTerrainFromPos(unitDest.getMapX(), unitDest.getMapY());
		var picBackground = this._getBackgroundImage(attackParam, terrain, terrainLayer);
		
		attackInfo.unitSrc = unitSrc;
		attackInfo.unitDest = unitDest;
		attackInfo.terrainLayer = terrainLayer;
		attackInfo.terrain = terrain;
		attackInfo.picBackground = picBackground;
		attackInfo.isDirectAttack = this._isDirectAttack(unitSrc, unitDest);
		attackInfo.isCounterattack = AttackChecker.isCounterattack(unitSrc, unitDest);
		
		this._setMagicWeaponAttackData(attackInfo);
		
		return attackInfo;
	}

	_isDirectAttack(unitSrc?, unitDest?) {
		var direction = PosChecker.getSideDirection(unitSrc.getMapX(), unitSrc.getMapY(), unitDest.getMapX(), unitDest.getMapY());
		
		return direction !== DirectionType.NULL;
	}

	_getBackgroundImage(attackParam?, terrain?, terrainLayer?) {
		var picBackground;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		
		// Get the background image.
		// Get it from the groundwork if the layer has no background.
		picBackground = terrainLayer.getBattleBackgroundImage(mapInfo.getMapColorIndex());
		if (picBackground === null) {
			picBackground = terrain.getBattleBackgroundImage(mapInfo.getMapColorIndex());
		}
		
		return picBackground;
	}

	_setMagicWeaponAttackData(attackInfo?) {
		attackInfo.checkMagicWeaponAttack = function(unit) {
			var result;
			
			if (unit === this.unitSrc) {
				result = this.isMagicWeaponAttackSrc;
			}
			else {
				result = this.isMagicWeaponAttackDest;
			}
			
			return result;
		};
		
		if (this._isMagicWeaponAttackAllowed(attackInfo)) {
			attackInfo.isMagicWeaponAttackSrc = this._isMotionEnabled(attackInfo, attackInfo.unitSrc);
			attackInfo.isMagicWeaponAttackDest = this._isMotionEnabled(attackInfo, attackInfo.unitDest);
		}
	}

	_isMotionEnabled(attackInfo?, unit?) {
		var midData = MotionIdControl.createEmptyMotionIdData();
		
		midData.unit = unit;
		midData.weapon = BattlerChecker.getRealBattleWeapon(unit);
		midData.cls = BattlerChecker.getRealBattleClass(unit, midData.weapon);
		midData.attackTemplateType = BattlerChecker.findAttackTemplateType(midData.cls, midData.weapon);
		
		// If they are not "Fighters", there is no concept of the "Magic Weapon Attack".
		if (midData.attackTemplateType !== AttackTemplateType.FIGHTER) {
			return false;
		}
		
		if (midData.weapon === null) {
			return false;
		}
		
		// At the equipped weapon of the "Weapon Effects", check if "Magic Weapon" is set.
		if (WeaponEffectControl.getAnime(unit, WeaponEffectAnime.MAGICWEAPON) === null) {
			return false;
		}
		
		// Check if the "Battle Motions" is set for the "Magic Weapon Attack".
		return this._getMagicWeaponAttackId(midData, false) !== MotionIdValue.NONE;
	}

	_getMagicWeaponAttackId(midData?, isCritical?) {
		midData.isCritical = isCritical;
		MotionIdControl.getMagicWeaponAttackId(midData);
		
		return midData.id;
	}

	_isMagicWeaponAttackAllowed(attackInfo?) {
		if (root.getAnimePreference().isDirectMagicWeaponAttackAllowed()) {
			// "Magic Weapon Attack" is used both at a direct time and an indirect time.
			return true;
		}
		
		// "Magic Weapon Attack" is used only at an indirect time.
		return !attackInfo.isDirectAttack;
	}
}

class NormalAttackInfoBuilder extends BaseAttackInfoBuilder {

	createAttackInfo(attackParam?) {
		var attackInfo = super.createAttackInfo(attackParam);
		
		attackInfo.battleType = EnvironmentControl.getBattleType();
		
		attackInfo.isPosBaseAttack = true;
		
		return attackInfo;
	}
}

class ForceAttackInfoBuilder extends BaseAttackInfoBuilder {

	createAttackInfo(attackParam?) {
		var forceBattleObject = attackParam.forceBattleObject;
		var attackInfo = super.createAttackInfo(attackParam);
		
		attackInfo.battleType = this._getBattleType(forceBattleObject);
		
		attackInfo.forceBattleObject = forceBattleObject;
		
		// Set the value to show the force battle.
		attackInfo.attackStartType = AttackStartType.FORCE;
		
		// Set if the exp is obtained.
		attackInfo.isExperienceEnabled = forceBattleObject.isExperienceEnabled();
		
		return attackInfo;
	}

	_getBattleType(forceBattleObject?) {
		var n, battleType;
		
		n = forceBattleObject.getBattleType();
		if (n === 0) {
			battleType = BattleType.FORCEREAL;
		}
		else if (n === 1) {
			battleType = BattleType.FORCEEASY;
		}
		else {
			battleType = EnvironmentControl.getBattleType();
		}
		
		return battleType;
	}
}


// The main object can be gotten from outside.


class AttackControl {

	static _preAttack: any = null;

	static setPreAttackObject(preAttack?) {
		this._preAttack = preAttack;
	}

	static isAttack() {
		return this._preAttack !== null;
	}

	static getPreAttackObject() {
		return this._preAttack;
	}

	static getCoreAttack() {
		return this.getPreAttackObject().getCoreAttack();
	}

	static getAttackParam() {
		return this.getPreAttackObject().getAttackParam();
	}

	static getAttackFlow() {
		return this.getCoreAttack().getAttackFlow();
	}

	static getBattleObject() {
		return this.getCoreAttack().getBattleObject();
	}

	static getAttackOrder() {
		return this.getAttackFlow().getAttackOrder();
	}

	static getAttackInfo() {
		return this.getAttackFlow().getAttackInfo();
	}

	static isRealBattle() {
		return this.getCoreAttack().isRealBattle();
	}
}


// The auxiliary object for the real battle.


class BattlerChecker {

	static _unit: any = null;

	static _weapon: any = null;

	static _targetUnit: any = null;

	static _targetWeapon: any = null;

	static findBattleAnimeFromUnit(unit?) {
		var weapon = this.getRealBattleWeapon(unit);
		var cls = this.getRealBattleClass(unit, weapon);
		
		return this.findBattleAnime(cls, weapon);
	}

	static findBattleAnime(cls?, weapon?) {
		var anime;
		
		if (weapon !== null) {
			return cls.getClassAnime(weapon.getWeaponCategoryType());
		}
		
		anime = cls.getClassAnime(WeaponCategoryType.PHYSICS);
		if (anime !== null) {
			return anime;
		}
		
		anime = cls.getClassAnime(WeaponCategoryType.SHOOT);
		if (anime !== null) {
			return anime;
		}
		
		anime = cls.getClassAnime(WeaponCategoryType.MAGIC);
		if (anime !== null) {
			return anime;
		}
		
		return null;
	}

	static findAttackTemplateTypeFromUnit(unit?) {
		var weapon = BattlerChecker.getRealBattleWeapon(unit);
		var cls = BattlerChecker.getRealBattleClass(unit, weapon);
		
		return this.findAttackTemplateType(cls, weapon);
	}

	static findAttackTemplateType(cls?, weapon?) {
		var classMotionFlag;
		
		if (weapon !== null) {
			return weapon.getWeaponCategoryType();
		}
		
		classMotionFlag = cls.getClassMotionFlag();
		
		if (classMotionFlag & ClassMotionFlag.FIGHTER) {
			return AttackTemplateType.FIGHTER;
		}
		
		if (classMotionFlag & ClassMotionFlag.ARCHER) {
			return AttackTemplateType.ARCHER;
		}
		
		if (classMotionFlag & ClassMotionFlag.MAGE) {
			return AttackTemplateType.MAGE;
		}
		
		return 0;
	}

	
	// The reason for saving weapons is to speed up the getRealBattleWeapon,
	// but also to prevent the weapons from not being enabled to be equipped, even though they could be equipped before.
	static setUnit(unit?, targetUnit?) {
		this._unit = unit;
		this._weapon = null;
		this._targetUnit = targetUnit;
		this._targetWeapon = null;
		
		if (unit !== null) {
			this._weapon = ItemControl.getEquippedWeapon(unit);
		}
		
		if (targetUnit !== null) {
			this._targetWeapon = ItemControl.getEquippedWeapon(targetUnit);
		}
	}

	static getBaseWeapon(unit?) {
		var weapon;
		
		if (unit === this._unit) {
			weapon = this._weapon;
		}
		else {
			weapon = this._targetWeapon;
		}
		
		return weapon;
	}

	static getRealBattleWeapon(unit?) {
		// When wanting to execute the real battle with a different weapon from the original weapon, adjust with this method.
		return this.getBaseWeapon(unit);
	}

	static getRealBattleClass(unit?, weapon?) {
		// When wanting to execute the real battle with a different class from the original class, adjust with this method.
		return unit.getClass();
	}
}

class BattlerPosChecker {

	static getRealInitialPos(motionParam?, isSrc?, order?) {
		var moveMotionId;
		
		if (!root.getAnimePreference().isMoveMotionPosInherited()) {
			// If the "move" motion position isn't inherited, the default position is used.
			return this._getDefaultPos(motionParam);
		}
		
		moveMotionId = this._getMoveId(motionParam, order);
		if (moveMotionId === MotionIdValue.NONE) {
			// If both units in the battle don't move, the default position is used.
			return this._getDefaultPos(motionParam);
		}
		
		// Get a position as a criteria of "move" motion's ID.
		return this._getAbsolutePos(motionParam, moveMotionId);
	}

	static _getDefaultPos(motionParam?) {
		var size = Miscellaneous.getFirstKeySpriteSize(motionParam.animeData, motionParam.motionId);
		var boundaryWidth = root.getAnimePreference().getBoundaryWidth();
		var boundaryHeight = root.getAnimePreference().getBoundaryHeight();
		var x = GraphicsFormat.BATTLEBACK_WIDTH - boundaryWidth;
		var y = GraphicsFormat.BATTLEBACK_HEIGHT - boundaryHeight - size.height;
		
		if (!motionParam.isRight) {
			x = boundaryWidth - size.width;
		}
		
		return createPos(x, y);
	}

	static _getAbsolutePos(motionParam?, moveMotionId?) {
		var animeData = motionParam.animeData;
		var frameIndex = 0;
		var spriteIndex = this._getSpriteIndexFromSpriteType(animeData, moveMotionId, frameIndex, SpriteType.KEY);
		var x = animeData.getSpriteX(moveMotionId, frameIndex, spriteIndex);
		var y = animeData.getSpriteY(moveMotionId, frameIndex, spriteIndex);
		
		if (!motionParam.isRight) {
			x = (GraphicsFormat.BATTLEBACK_WIDTH - GraphicsFormat.MOTION_WIDTH) - x;
		}
		
		return createPos(x, y);
	}

	static _getMoveId(motionParam?, order?) {
		var i;
		var count = 0;
		var moveMotionId = MotionIdValue.NONE;
		
		for (;;) {
			if (order.getMoveId() !== MotionIdValue.NONE && order.getActiveUnit() === motionParam.unit) {
				moveMotionId = order.getMoveId();
				break;
			}
			
			if (!order.nextOrder()) {
				break;
			}
			count++;
		}
		
		for (i = 0; i < count; i++) {
			order.prevOrder();
		}
		
		return moveMotionId;
	}

	static _getSpriteIndexFromSpriteType(animeData?, motionId?, frameIndex?, spriteType?) {
		var i;
		var count = animeData.getSpriteCount(motionId, frameIndex);
		
		for (i = 0; i < count; i++) {
			if (animeData.getSpriteType(motionId, frameIndex, i) === spriteType) {
				return i;
			}
		}
		
		return 0;
	}
}
