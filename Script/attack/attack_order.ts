
// The most important thing in the battle system is that it's already decided in advance how the unit acts.
// So whether the attack hits or not is not actually calculated at the battle (RealBattle or EasyBattle),
// but it's already been calculated at the time before entering the battle and already been defined as data.
// That's Attack Entry. And AttackOrder controls several AttackEntry.
// In the battle, AttackFlow gets AttackEntry from AttackOrder in sequence,
// so the battle continues as it has already been defined.
// The role of NormalAttackOrderBuilder is to calculate how the unit should act at the battle
// and to register it as AttackEntry at the AttackOrder.
// And when all actions have been defined, return AttackOrder to the caller.
class NormalAttackOrderBuilder extends BaseObject {

	_attackInfo: any = null;

	_order: any = null;

	_evaluatorArray: any = null;

	createAttackOrder(attackInfo?) {
		this._attackInfo = attackInfo;
		
		this._order = createObject(AttackOrder);
		this._order.resetAttackOrder();
		
		this._evaluatorArray = [];
		this._configureEvaluator(this._evaluatorArray);
		
		// Simulate the battle.
		this._startVirtualAttack();
		
		return this._order;
	}

	isDirectAttack() {
		// It's true (Direct Attack) if the units are adjacent.
		return this._attackInfo.isDirectAttack;
	}

	isMagicWeaponAttack(unit?) {
		return this._attackInfo.checkMagicWeaponAttack(unit);
	}

	_startVirtualAttack() {
		var i, j, isFinal, attackCount, src, dest;
		var virtualActive, virtualPassive, isDefaultPriority;
		var unitSrc = this._attackInfo.unitSrc;
		var unitDest = this._attackInfo.unitDest;
			
		src = VirtualAttackControl.createVirtualAttackUnit(unitSrc, unitDest, true, this._attackInfo);
		dest = VirtualAttackControl.createVirtualAttackUnit(unitDest, unitSrc, false, this._attackInfo);
		
		src.isWeaponLimitless = DamageCalculator.isWeaponLimitless(unitSrc, unitDest, src.weapon);
		dest.isWeaponLimitless = DamageCalculator.isWeaponLimitless(unitDest, unitSrc, dest.weapon);
		
		isDefaultPriority = this._isDefaultPriority(src, dest);
		if (isDefaultPriority) {
			src.isInitiative = true;
		}
		else {
			dest.isInitiative = true;
		}
		
		for (i = 0;; i++) {
			// Execute if statement and else statement alternately.
			// The order of turns will change with this, for instance, after this side attacked, the opponent attacks.
			if ((i % 2) === 0) {
				if (isDefaultPriority) {
					virtualActive = src;
					virtualPassive = dest;
				}
				else {
					virtualActive = dest;
					virtualPassive = src;
				}
			}
			else {
				if (isDefaultPriority) {
					virtualActive = dest;
					virtualPassive = src;
				}
				else {
					virtualActive = src;
					virtualPassive = dest;
				}
			}
			
			// Check if the action number left.
			if (VirtualAttackControl.isRound(virtualActive)) {
				VirtualAttackControl.decreaseRoundCount(virtualActive);
				
				attackCount = this._getAttackCount(virtualActive, virtualPassive);
			
				// Loop processing because there is a possibility to attack 2 times in a row.
				for (j = 0; j < attackCount; j++) {
					isFinal = this._setDamage(virtualActive, virtualPassive);
					if (isFinal) {
						// The battle is not continued any longer because the unit has died.
						virtualActive.roundCount = 0;
						virtualPassive.roundCount = 0;
						break;
					}
				}
			}
			
			if (virtualActive.roundCount === 0 && virtualPassive.roundCount === 0) {
				break;
			}
		}
		
		this._endVirtualAttack(src, dest);
	}

	_endVirtualAttack(virtualActive?, virtualPassive?) {
		var exp = this._calculateExperience(virtualActive, virtualPassive);
		var waitIdSrc = MotionIdControl.getWaitId(virtualActive.unitSelf, virtualActive.weapon);
		var waitIdDest = MotionIdControl.getWaitId(virtualPassive.unitSelf, virtualPassive.weapon);
		
		this._order.registerExp(exp);
		this._order.registerBaseInfo(this._attackInfo, waitIdSrc, waitIdDest);
	}

	_isDefaultPriority(virtualActive?, virtualPassive?) {
		var active = virtualActive.unitSelf;
		var passive = virtualPassive.unitSelf;
		var skilltype = SkillType.FASTATTACK;
		var skill = SkillControl.getPossessionSkill(active, skilltype);
		
		if (SkillRandomizer.isSkillInvoked(active, passive, skill)) {
			// If those who launched an attack have the skill of "Preemptive Attack", decide normal battle at that time.
			return true;
		}
		
		if (this._attackInfo.isCounterattack) {
			// If the opponent can counterattack, check if they have a skill of "Preemptive Attack".
			// If the attacker has no skill of preemptive attack, and the opponent has it instead, the opponent launches an attack.
			skill = SkillControl.getPossessionSkill(passive, skilltype);	
			if (SkillRandomizer.isSkillInvoked(passive, active, skill)) {
				// Due to no attackEntry, cannot add at this moment.
				// Save it so as to be able to add later.
				virtualPassive.skillFastAttack = skill;
				return false;
			}
		}
		
		return true;
	}

	_getAttackCount(virtualActive?, virtualPassive?) {
		var skill;
		var attackCount = virtualActive.attackCount;
		
		skill = SkillControl.getBattleSkill(virtualActive.unitSelf, virtualPassive.unitSelf, SkillType.CONTINUOUSATTACK);
		if (SkillRandomizer.isSkillInvoked(virtualActive.unitSelf, virtualPassive.unitSelf, skill)) {
			// Double the number of attack with a skill of "Continuous Attack".
			attackCount *= skill.getSkillValue();
			
			// Due to no attackEntry, cannot add at this moment.
			// Save it so as to be able to add later.
			virtualActive.skillContinuousAttack = skill;
		}
		
		return attackCount;
	}

	_setDamage(virtualActive?, virtualPassive?) {
		var attackEntry;
		
		if (!this._isAttackContinue(virtualActive, virtualPassive)) {
			// Return false if the unit cannot attack with some reasons.
			return false;
		}
		
		attackEntry = this._createAndRegisterAttackEntry(virtualActive, virtualPassive);
		
		if (!virtualActive.isWeaponLimitless) {
			// Reduce because durability is not unlimited.
			this._decreaseWeaponLimit(virtualActive, virtualPassive, attackEntry);
		}
		
		return attackEntry.isFinish;
	}

	_isAttackContinue(virtualActive?, virtualPassive?) {
		// Cannot attack due to lack of weapons etc.
		if (!VirtualAttackControl.isAttackContinue(virtualActive)) {
			return false;
		}
		
		if (this._isSealAttack(virtualActive, virtualPassive)) {
			if (!this._isSealAttackBreak(virtualActive, virtualPassive)) {
				return false;
			}
		}
		
		return true;
	}

	_decreaseWeaponLimit(virtualActive?, virtualPassive?, attackEntry?) {
		var weaponType;
		var weapon = virtualActive.weapon;
		var isItemDecrement = false;
			
		if (weapon === null) {
			return;
		}
		
		weaponType = weapon.getWeaponType();
		
		if (weaponType.isHitDecrement()) {
			if (attackEntry.isHit) {
				// Reduce due to hit.
				isItemDecrement = true;
			}
		}
		else {
			// Reduce regardless of hit or not.
			isItemDecrement = true;
		}
		
		if (isItemDecrement) {
			attackEntry.isItemDecrement = true;
			
			// Count the number of use of weapons.
			virtualActive.weaponUseCount++;
		}
	}

	_createAndRegisterAttackEntry(virtualActive?, virtualPassive?) {
		var i, attackEntry;
		var count = this._evaluatorArray.length;
		
		// Create AttackEntry.
		attackEntry = this._order.createAttackEntry();
		
		attackEntry.isSrc = virtualActive.isSrc;
		
		attackEntry.isFirstAttack = virtualActive.isFirstAttack;
		
		this._setInitialSkill(virtualActive, virtualPassive, attackEntry);
		
		// Evaluator decides setting what value on the AttackEntry.
		// For instance, AttackEvaluator.AttackMotion decides motion when attacking,
		// and AttackEvaluator.HitCritical decides if the attack will hit.
		for (i = 0; i < count; i++) {
			this._evaluatorArray[i].setParentOrderBuilder(this);
			this._evaluatorArray[i].evaluateAttackEntry(virtualActive, virtualPassive, attackEntry);
		}
		
		// Resister AttackEntry at AttackOrder.
		this._order.registerAttackEntry(attackEntry);
		
		virtualActive.isFirstAttack = false;
		
		return attackEntry;
	}

	_setInitialSkill(virtualActive?, virtualPassive?, attackEntry?) {
		if (virtualActive.skillFastAttack !== null) {
			if (virtualActive.skillFastAttack.isSkillDisplayable()) {
				attackEntry.skillArrayActive.push(virtualActive.skillFastAttack);
			}
			virtualActive.skillFastAttack = null;
		}
		
		if (virtualActive.skillContinuousAttack !== null) {
			if (virtualActive.skillContinuousAttack.isSkillDisplayable()) {
				attackEntry.skillArrayActive.push(virtualActive.skillContinuousAttack);
			}
			virtualActive.skillContinuousAttack = null;
		}
	}

	_calculateExperience(virtualActive?, virtualPassive?) {
		var unitSrc = this._attackInfo.unitSrc;
		var unitDest = this._attackInfo.unitDest;
		var data = StructureBuilder.buildAttackExperience();
		
		if (this._isExperienceDisabled()) {
			return -1;
		}
		
		// The player obtains the exp, so comparison of UnitType.PLAYER is must.
		// The player can be unitSrc and unitDest.
		
		if (unitSrc.getUnitType() === UnitType.PLAYER && virtualActive.hp > 0) {
			// Do the setting when the attacker is the player and is not dead.
			data.active = unitSrc;
			data.activeHp = virtualActive.hp;
			data.activeDamageTotal = virtualActive.damageTotal;
			data.passive = unitDest;
			data.passiveHp = virtualPassive.hp;
			data.passiveDamageTotal = virtualPassive.damageTotal;
		}
		else if (unitDest.getUnitType() === UnitType.PLAYER && virtualPassive.hp > 0) {
			// Do the setting when the player was attacked and is not dead.
			data.active = unitDest;
			data.activeHp = virtualPassive.hp;
			data.activeDamageTotal = virtualPassive.damageTotal;
			data.passive = unitSrc;
			data.passiveHp = virtualActive.hp;
			data.passiveDamageTotal = virtualActive.damageTotal;
		}
		else {
			// Don't obtain the exp if return -1.
			return -1; 
		}
		
		return ExperienceCalculator.calculateExperience(data);
	}

	_isExperienceDisabled() {
		var unitSrc = this._attackInfo.unitSrc;
		var unitDest = this._attackInfo.unitDest;
		
		// The exp doesn't occur if the same type of units battled.
		if (unitSrc.getUnitType() === unitDest.getUnitType()) {
			return true;
		}
		
		if (!root.getCurrentSession().isMapState(MapStateType.GETEXPERIENCE)) {
			return true;
		}
		
		return FusionControl.isExperienceDisabled(unitSrc);
	}

	_isSealAttack(virtualActive?, virtualPassive?) {
		var weapon = virtualPassive.weapon;
		
		if (weapon !== null && weapon.getWeaponOption() === WeaponOption.SEALATTACK) {
			return true;
		}
		
		return SkillControl.getBattleSkillFromValue(virtualPassive.unitSelf, virtualActive.unitSelf, SkillType.BATTLERESTRICTION, BattleRestrictionValue.SEALATTACK) !== null;
	}

	_isSealAttackBreak(virtualActive?, virtualPassive?) {
		var weapon = virtualActive.weapon;
		
		if (weapon.getWeaponOption() === WeaponOption.SEALATTACKBREAK) {
			return true;
		}
		
		return SkillControl.getBattleSkillFromFlag(virtualActive.unitSelf, virtualPassive.unitSelf, SkillType.INVALID, InvalidFlag.SEALATTACKBREAK) !== null;
	}

	_configureEvaluator(groupArray?) {
		groupArray.appendObject(AttackEvaluator.HitCritical);
		groupArray.appendObject(AttackEvaluator.ActiveAction);
		groupArray.appendObject(AttackEvaluator.PassiveAction);
		
		groupArray.appendObject(AttackEvaluator.TotalDamage);
		
		// Decide motion to use for the real battle at the AttackMotion and DamageMotion.
		// attackEntry.isCritical and attackEntry.isFinish are needed to be initialized.
		groupArray.appendObject(AttackEvaluator.AttackMotion);
		groupArray.appendObject(AttackEvaluator.DamageMotion);
	}
}

class ForceAttackOrderBuilder extends NormalAttackOrderBuilder {

	_srcForceEntryCount: any = 0;

	_destForceEntryCount: any = 0;

	getForceEntryType(unit?, isSrc?) {
		var type;
		
		if (this._attackInfo.forceBattleObject === null) {
			return 0;
		}
		
		if (isSrc) {
			type = this._attackInfo.forceBattleObject.getSrcForceEntryType(this._srcForceEntryCount);
		}
		else {
			type = this._attackInfo.forceBattleObject.getDestForceEntryType(this._destForceEntryCount);
		}
		
		return type;
	}

	_setDamage(virtualActive?, virtualPassive?) {
		var result = super._setDamage(virtualActive, virtualPassive);
		
		// Count rises at the force battle.
		if (this._attackInfo.attackStartType === AttackStartType.FORCE) {
			this._increaseForceCount(virtualActive.isSrc);
		}
		
		return result;
	}

	_isExperienceDisabled() {
		// Don't continue if the exp is not obtained.
		if (!this._attackInfo.isExperienceEnabled) { 
			return true;
		}
		
		return super._isExperienceDisabled();
	}

	_increaseForceCount(isSrc?) {
		if (isSrc) {
			this._srcForceEntryCount++;
		}
		else {
			this._destForceEntryCount++;
		}
	}

	_configureEvaluator(groupArray?) {
		groupArray.appendObject(AttackEvaluator.ForceHit);
		groupArray.appendObject(AttackEvaluator.ActiveAction);
		groupArray.appendObject(AttackEvaluator.PassiveAction);
		groupArray.appendObject(AttackEvaluator.TotalDamage);
		groupArray.appendObject(AttackEvaluator.AttackMotion);
		groupArray.appendObject(AttackEvaluator.DamageMotion);
	}
}

// To decide the unit battle,
// the battle needs to be simulated in advance.
// For example, if the unit A will directly attack the unit B,
// first AttackEntry for the unit A is added in AttackOrder.
// And reduce the HP of the unit B according to the damage given,
// and count a weapon of the unit A as being used once.
// This change should be done for the unit while battling,
// so when AttackEntry is created, use the temporary object which is VirtualAttackUnit.
class VirtualAttackControl {

	static createVirtualAttackUnit(unitSelf?, targetUnit?, isSrc?, attackInfo?) {
		var isAttack;
		var virtualAttackUnit = StructureBuilder.buildVirtualAttackUnit();
		
		virtualAttackUnit.unitSelf = unitSelf;
		virtualAttackUnit.hp = unitSelf.getHp();
		virtualAttackUnit.weapon = BattlerChecker.getRealBattleWeapon(unitSelf);
		virtualAttackUnit.isSrc = isSrc;
		virtualAttackUnit.isCounterattack = attackInfo.isCounterattack;
		virtualAttackUnit.stateArray = [];
		virtualAttackUnit.totalStatus = SupportCalculator.createTotalStatus(unitSelf);
		virtualAttackUnit.isFirstAttack = true;
		
		this._setStateArray(virtualAttackUnit);
		
		if (isSrc) {
			// Suppose to enable to attack if the attacker is equipped with the weapon.
			isAttack = virtualAttackUnit.weapon !== null;
		}
		else {
			// Check if those who were attacked can counterattack.
			isAttack = virtualAttackUnit.isCounterattack;	
		}
		
		this._calculateAttackAndRoundCount(virtualAttackUnit, isAttack, targetUnit);
		
		return virtualAttackUnit;
	}

	static isRound(virtualAttackUnit?) {
		return virtualAttackUnit.roundCount > 0;
	}

	static decreaseRoundCount(virtualAttackUnit?) {
		virtualAttackUnit.roundCount--;
	}

	static isAttackContinue(virtualAttackUnit?) {
		var i, count;
		var weapon = virtualAttackUnit.weapon;
		var result = false;
		
		count = virtualAttackUnit.stateArray.length;
		for (i = 0; i < count; i++) {
			if (this._isAttackStopState(virtualAttackUnit, virtualAttackUnit.stateArray[i])) {
				// Attack cannot be continued by returning false, because the state which prohibits an attack exists.
				return false;
			}
		}		
		
		// Check if continue attack.
		// If there's no number of use of the weapon, the attack cannot continue sometimes.
		if (weapon !== null) {
			if (weapon.getLimitMax() === 0 || weapon.getLimit() === WeaponLimitValue.BROKEN) {
				// If the durability is 0 or destroyed, it can be used many times.
				result = true;
			}
			else if (weapon.getLimit() - virtualAttackUnit.weaponUseCount > 0) {
				// Number of uses of weapon at this battle is recorded at weaponUseCount.
				// If this amount minus weapon durability is greater than 0, the weapon still can be used and can attack.
				result = true;
			}
		}
		
		return result;
	}

	static _isAttackStopState(virtualAttackUnit?, state?) {
		var option, flag, weapon;
		
		if (state === null) {
			return false;
		}
		
		option = state.getBadStateOption();
		if (option === BadStateOption.NOACTION) {
			return true;
		}
		
		weapon = virtualAttackUnit.weapon;
		flag = state.getBadStateFlag();
		if (flag & BadStateFlag.PHYSICS) {
			// Not only WeaponCategoryType.PHYSICS, but also WeaponCategoryType.SHOOT is "Physical Attack".
			if (weapon !== null && weapon.getWeaponCategoryType() !== WeaponCategoryType.MAGIC) {
				return true;
			}
		}
		
		if (flag & BadStateFlag.MAGIC) {
			if (weapon !== null && weapon.getWeaponCategoryType() === WeaponCategoryType.MAGIC) {
				return true;
			}
		}
		
		return false;
	}

	static _setStateArray(virtualAttackUnit?) {
		var i;
		var list = virtualAttackUnit.unitSelf.getTurnStateList();
		var count = list.getCount();
		
		// Set the state which is set in the unit at the array.
		for (i = 0; i < count; i++) {
			virtualAttackUnit.stateArray.push(list.getData(i).getState());
		}
	}

	static _calculateAttackAndRoundCount(virtualAttackUnit?, isAttack?, targetUnit?) {
		var weapon;
		
		if (isAttack) {
			weapon = virtualAttackUnit.weapon;
			
			// Get the number of attacks at the 1st round.
			// Normally it's 1, but returns 2 depending on the skill, and also can attack 2 times in a row.
			virtualAttackUnit.attackCount = Calculator.calculateAttackCount(virtualAttackUnit.unitSelf, targetUnit, weapon);
			
			virtualAttackUnit.roundCount = Calculator.calculateRoundCount(virtualAttackUnit.unitSelf, targetUnit, weapon);
		}
		else {
			virtualAttackUnit.attackCount = 0;
			virtualAttackUnit.roundCount = 0;
		}
	}
}

class BaseAttackEvaluator extends BaseObject {

	_parentOrderBuilder: any = null;

	setParentOrderBuilder(parentOrderBuilder?) {
		this._parentOrderBuilder = parentOrderBuilder;
	}

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
	}
}

namespace AttackEvaluator {
export class HitCritical extends BaseAttackEvaluator {

	_skill: any = null;

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
		this._skill = SkillControl.checkAndPushSkill(virtualActive.unitSelf, virtualPassive.unitSelf, attackEntry, true, SkillType.TRUEHIT);
		
		// Check if the attack will hit.
		attackEntry.isHit = this.isHit(virtualActive, virtualPassive, attackEntry);
		if (!attackEntry.isHit) {
			if (this._skill === null) {
				// Don't continue because the attack doesn't hit and skill isn't activated.
				return;
			}
			
			// Skill is activated so the attack will hit.
			attackEntry.isHit = true;
		}
		
		// Check if it's critical.
		attackEntry.isCritical = this.isCritical(virtualActive, virtualPassive, attackEntry);
		
		// Calculate damage to give.
		attackEntry.damagePassive = this.calculateDamage(virtualActive, virtualPassive, attackEntry);
		
		this._checkStateAttack(virtualActive, virtualPassive, attackEntry);
	}

	isHit(virtualActive?, virtualPassive?, attackEntry?) {
		// Calculate with probability if it hits.
		return this.calculateHit(virtualActive, virtualPassive, attackEntry);
	}

	isCritical(virtualActive?, virtualPassive?, attackEntry?) {
		var active = virtualActive.unitSelf;
		var passive = virtualPassive.unitSelf;
		
		if (!virtualActive.isInitiative && SkillControl.checkAndPushSkill(active, passive, attackEntry, true, SkillType.COUNTERATTACKCRITICAL) !== null) {
			// Return true because critical activation is done by "Critical Counterattack".
			return true;
		}
		
		// Calculate with probability if the critical activation occurs.
		return this.calculateCritical(virtualActive, virtualPassive, attackEntry);
	}

	calculateHit(virtualActive?, virtualPassive?, attackEntry?) {
		var percent = HitCalculator.calculateHit(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, virtualActive.totalStatus, virtualPassive.totalStatus);
		
		return Probability.getProbability(percent);
	}

	calculateCritical(virtualActive?, virtualPassive?, attackEntry?) {
		var percent = CriticalCalculator.calculateCritical(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, virtualActive.totalStatus, virtualPassive.totalStatus);
		
		return Probability.getProbability(percent);
	}

	calculateDamage(virtualActive?, virtualPassive?, attackEntry?) {
		var trueHitValue = 0;
		
		if (this._skill !== null) {
			trueHitValue = this._skill.getSkillValue();
		}
		
		if (DamageCalculator.isHpMinimum(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, attackEntry.isCritical, trueHitValue)) {
			// The opponent HP will be 1 if the attack hits in a way of turning the value of current HP-1 into damage. 
			return virtualPassive.hp - 1;
		}
		
		if (DamageCalculator.isFinish(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, attackEntry.isCritical, trueHitValue)) {
			return virtualPassive.hp;
		}
		
		return DamageCalculator.calculateDamage(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon, attackEntry.isCritical, virtualActive.totalStatus, virtualPassive.totalStatus, trueHitValue);
	}

	_checkStateAttack(virtualActive?, virtualPassive?, attackEntry?) {
		var i, count, skill, state;
		var arr = SkillControl.getDirectSkillArray(virtualActive.unitSelf, SkillType.STATEATTACK, '');
		
		// Check the "State Attack" skill.
		count = arr.length;
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			state = this._getState(skill);
			
			if (StateControl.isStateBlocked(virtualPassive.unitSelf, virtualActive.unitSelf, state)) {
				// Don't activate because the state is disabled.
				continue;
			}
			
			if (!SkillRandomizer.isSkillInvoked(virtualActive.unitSelf, virtualPassive.unitSelf, skill)) {
				// The activation rate of the skill wasn't satisfied.
				continue;
			}
			
			// Skill was activated at Active, so add in skillArrayActive.
			if (skill.isSkillDisplayable()) {
				attackEntry.skillArrayActive.push(skill);
			}
			
			// State is received at Passive, so add in stateArrayPassive.
			attackEntry.stateArrayPassive.push(state);
			
			// Record the state through the entire battle.
			virtualPassive.stateArray.push(state);
		}
		
		// Check "Optional State" of weapons.
		state = StateControl.checkStateInvocation(virtualActive.unitSelf, virtualPassive.unitSelf, virtualActive.weapon);
		if (state !== null) {
			attackEntry.stateArrayPassive.push(state);
			virtualPassive.stateArray.push(state);
		}
	}

	_getState(skill?) {
		var id = skill.getSkillValue();
		var list = root.getBaseData().getStateList();
		
		return list.getDataFromId(id);
	}
}

export class ForceHit extends AttackEvaluator.HitCritical {

	isHit(virtualActive?, virtualPassive?, attackEntry?) {
		var tpye = this._parentOrderBuilder.getForceEntryType(virtualActive.unitSelf, virtualActive.isSrc);
		
		if (tpye === ForceEntryType.HIT || tpye === ForceEntryType.CRITICAL) {
			// Return true because it should hit.
			return true;
		}
		else if (tpye === ForceEntryType.MISS) {
			return false;
		}
		else {
			// Refer to the default if there is no entry.
			return (new AttackEvaluator.HitCritical()).isHit(virtualActive, virtualPassive, attackEntry);
		}
	}

	isCritical(virtualActive?, virtualPassive?, attackEntry?) {
		var tpye = this._parentOrderBuilder.getForceEntryType(virtualActive.unitSelf, virtualActive.isSrc);
		
		if (tpye === ForceEntryType.CRITICAL) {
			// Return true because critical activation should occur.
			return true;
		}
		else if (tpye === ForceEntryType.HIT || tpye === ForceEntryType.MISS) {
			return false;
		}
		else {
			return (new AttackEvaluator.HitCritical()).isCritical(virtualActive, virtualPassive, attackEntry);
		}
	}
}

export class ActiveAction extends BaseAttackEvaluator {

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
		if (!attackEntry.isHit) {
			return;
		}
		
		attackEntry.damagePassiveFull = attackEntry.damagePassive;
		
		// Do final adjustment of damage at the side of being  attacked.
		attackEntry.damagePassive = this._arrangePassiveDamage(virtualActive, virtualPassive, attackEntry);
		
		// Do final adjustment of damage at the attacker. Normally,
		// the attacker has no damage occurred so damageActive is 0 in a principle.
		// If damage is minus, it's supposed to be a recovery.
		attackEntry.damageActive = this._arrangeActiveDamage(virtualActive, virtualPassive, attackEntry);
	}

	_arrangePassiveDamage(virtualActive?, virtualPassive?, attackEntry?) {
		var damagePassive = attackEntry.damagePassive;
		var value = this._getDamageGuardValue(virtualActive, virtualPassive, attackEntry);
		
		if (value !== -1) {
			value = 100 - value;
			damagePassive = Math.floor(damagePassive * (value / 100));
		}
		
		// If the opponent gets damages, and HP is less than 0.
		if (virtualPassive.hp - damagePassive < 0) {
			attackEntry.damagePassiveFull = damagePassive;
			
			// Damage to give is the opponent HP.
			// For example, if the opponent's HP is 3 and damage is 5, damage will be 3.
			damagePassive = virtualPassive.hp;
		}
		else {
			attackEntry.damagePassiveFull = damagePassive;
		}
		
		return damagePassive;
	}

	_arrangeActiveDamage(virtualActive?, virtualPassive?, attackEntry?) {
		var max;
		var active = virtualActive.unitSelf;
		var damageActive = attackEntry.damageActive;
		var damagePassive = attackEntry.damagePassive;
		var absorptionPercent = this._isAbsorption(virtualActive, virtualPassive, attackEntry);
		
		if (absorptionPercent > 0) {
			max = ParamBonus.getMhp(active);
			
			damageActive = Math.floor(damagePassive * (absorptionPercent / 100));
			
			if (virtualActive.hp + damageActive > max) {
				damageActive = max - virtualActive.hp;
			}
			
			// If damage is minus, it means recovery.
			damageActive *= -1;
		}
		else {
			damageActive = 0;
		}
		
		return damageActive;
	}

	
	// This method returns a number, not true/false, but the name remains as is for compatibility.
	_isAbsorption(virtualActive?, virtualPassive?, attackEntry?) {
		var weaponAbsorptionPercent = 0;
		var skillAbsorptionPercent = 0;
		var active = virtualActive.unitSelf;
		var passive = virtualPassive.unitSelf;
		var weapon = virtualActive.weapon;
		var skill = SkillControl.checkAndPushSkill(active, passive, attackEntry, true, SkillType.DAMAGEABSORPTION);
		
		if (skill !== null) {
			skillAbsorptionPercent = skill.getSkillValue();
		}
		
		weaponAbsorptionPercent = this._getWeaponAbsorptionPercent(weapon);
		
		// There are two types of "Damage Absorption": "Skills" and "Weapon Option".
		// The following code uses larger percentages, but there is also a way to increase the percentage by adding both.
		return Math.max(weaponAbsorptionPercent, skillAbsorptionPercent);
	}

	_getWeaponAbsorptionPercent(weapon?) {
		var weaponAbsorptionPercent = 0;
		
		if (weapon !== null && weapon.getWeaponOption() === WeaponOption.HPABSORB) {
			// The "Damage Absorption" of "Weapon Option" is 100% by default.
			weaponAbsorptionPercent = 100;
		}
		
		return weaponAbsorptionPercent;
	}

	_getDamageGuardValue(virtualActive?, virtualPassive?, attackEntry?) {
		var i, count, skill, flag;
		var value = -1;
		var arr = SkillControl.getDirectSkillArray(virtualPassive.unitSelf, SkillType.DAMAGEGUARD, '');
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			flag = skill.getSkillValue();
			
			// Check if the weapon to guard.
			if (!ItemControl.isWeaponTypeAllowed(skill.getDataReferenceList(), virtualActive.weapon)) {
				continue;
			}
			
			if (!SkillRandomizer.isSkillInvoked(virtualPassive.unitSelf, virtualActive.unitSelf, skill)) {
				// Activation rate of the skill wasn't satisfied.
				continue;
			}
			
			if (skill.isSkillDisplayable()) {
				attackEntry.skillArrayPassive.push(skill);
			}
			
			value = skill.getSkillValue();
			
			break;
		}
		
		return value;
	}
}

export class PassiveAction extends BaseAttackEvaluator {

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
		var value;
		
		if (!attackEntry.isHit) {
			return;
		}
		
		// Don't continue if no dead even if get damaged.
		if (virtualPassive.hp - attackEntry.damagePassive > 0) {
			return;
		}
		
		value = this._getSurvivalValue(virtualActive, virtualPassive, attackEntry);
		if (value === -1) {
			return;
		}
		
		if (value === SurvivalValue.SURVIVAL) {
			// Survive with HP1 by reducing 1 damage.
			attackEntry.damagePassive--;
			attackEntry.damagePassiveFull = attackEntry.damagePassive;
			
			if (attackEntry.damageActive < 0) {
				// Increase 1 because the recovery is occurred with a absorb (1 reduction of recovery amount).
				attackEntry.damageActive++;
			}
		}
		else if (value === SurvivalValue.AVOID) {
			// The opponent is immortal and cannot die, so disable the settings so far.
			attackEntry.isHit = false;
			attackEntry.isCritical = false;
			attackEntry.damagePassive = 0;
			attackEntry.damageActive = 0;
			attackEntry.damagePassiveFull = 0;
		}
	}

	_getSurvivalValue(virtualActive?, virtualPassive?, attackEntry?) {
		var skill;
		var active = virtualActive.unitSelf;
		var passive = virtualPassive.unitSelf;
		
		if (passive.isImmortal()) {
			return SurvivalValue.AVOID;
		}
		
		skill = SkillControl.checkAndPushSkill(passive, active, attackEntry, false, SkillType.SURVIVAL);
		if (skill !== null) {
			return skill.getSkillValue();
		}
		
		return -1;
	}
}

export class TotalDamage extends BaseAttackEvaluator {

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
		virtualActive.hp -= attackEntry.damageActive;
		virtualPassive.hp -= attackEntry.damagePassive;
		virtualActive.damageTotal += attackEntry.damageActive;
		virtualPassive.damageTotal += attackEntry.damagePassive;
		
		attackEntry.isFinish = this._isAttackFinish(virtualActive, virtualPassive, attackEntry);
	}

	_isAttackFinish(virtualActive?, virtualPassive?, attackEntry?) {
		// Battle ends if one of units is beaten.
		if (virtualPassive.hp <= 0 || virtualActive.hp <= 0) {
			// The state isn't activated when it's beaten.
			if (virtualPassive.hp <= 0) {
				attackEntry.stateArrayPassive = [];
			}
			
			if (virtualActive.hp <= 0) {
				attackEntry.stateArrayActive = [];
			}
			
			return true;
		}
		
		return false;
	}
}

export class AttackMotion extends BaseAttackEvaluator {

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
		var midData = this._getAttackMotionId(virtualActive, virtualPassive, attackEntry);
		
		// Get motion ID of the attack.
		attackEntry.motionIdActive = midData.id;
		attackEntry.motionActionTypeActive = midData.type;
		
		attackEntry.moveIdActive = midData.idMoveOnly;
		attackEntry.moveActionTypeActive = midData.typeMoveOnly;
	}

	_getAttackMotionId(virtualActive?, virtualPassive?, attackEntry?) {
		var midData = MotionIdControl.createMotionIdData(virtualActive, virtualPassive, attackEntry, virtualActive.motionAttackCount);
		
		// Each type of method is named "get", but set the data inside midData.
		
		if (midData.attackTemplateType === AttackTemplateType.ARCHER) {
			MotionIdControl.getBowId(midData);
		}
		else if (midData.attackTemplateType === AttackTemplateType.MAGE) {
			MotionIdControl.getMagicId(midData);
		}
		else {
			if (this._parentOrderBuilder.isMagicWeaponAttack(midData.unit)) {
				// Magic Weapon Attack
				MotionIdControl.getMagicWeaponAttackId(midData);
			}
			else {
				if (this._parentOrderBuilder.isDirectAttack()) {
					if (virtualActive.isApproach) {
						// Direct Attack
						MotionIdControl.getDirectAttackId(midData);
					}
					else {
						// Move Attack
						MotionIdControl.getMoveAttackId(midData);
						MotionIdControl.getMoveId(midData);
						virtualActive.isApproach = true;
						virtualPassive.isApproach = true;
					}
				}
				else {
					// Indirect Attack
					MotionIdControl.getIndirectAttackId(midData);
				}
			}
		}
		
		virtualActive.motionAttackCount++;
		
		return midData;
	}
}

export class DamageMotion extends BaseAttackEvaluator {

	evaluateAttackEntry(virtualActive?, virtualPassive?, attackEntry?) {
		var midData;
		
		if (attackEntry.isHit) {
			// Because attack will hit, get ID so as to turn the opponent into "Damage" motion.
			midData = this._getDamageMotionId(virtualActive, virtualPassive, attackEntry);
		}
		else {
			// Because attack will not hit, get ID so as to turn the opponent into "Avoid" motion.
			midData = this._getAvoidMotionId(virtualActive, virtualPassive, attackEntry);
		}
		
		attackEntry.motionIdPassive = midData.id;
		attackEntry.motionActionTypePassive = midData.type;
	}

	_getDamageMotionId(virtualActive?, virtualPassive?, attackEntry?) {
		var midData = MotionIdControl.createMotionIdData(virtualPassive, virtualActive, attackEntry, virtualPassive.motionDamageCount);
		
		MotionIdControl.getDamageId(midData);
	
		virtualPassive.motionDamageCount++;
		
		return midData;
	}

	_getAvoidMotionId(virtualActive?, virtualPassive?, attackEntry?) {
		var midData = MotionIdControl.createMotionIdData(virtualPassive, virtualActive, attackEntry, virtualPassive.motionAvoidCount);
		
		MotionIdControl.getAvoidId(midData);
		
		virtualPassive.motionAvoidCount++;
		
		return midData;
	}
}
}

class AttackOrder extends BaseObject {

	_attackEntryCount: any = 0;

	_attackEntryArray: any = null;

	_currentIndex: any = 0;

	_unitSrc: any = null;

	_unitDest: any = null;

	_waitIdSrc: any = 0;

	_waitIdDest: any = 0;

	_exp: any = 0;

	resetAttackOrder() {
		this._attackEntryCount = 0;
		this._attackEntryArray = [];
		this._currentIndex = 0;
	}

	registerBaseInfo(attackInfo?, waitIdSrc?, waitIdDest?) {
		this._unitSrc = attackInfo.unitSrc;
		this._unitDest = attackInfo.unitDest;
		this._waitIdSrc = waitIdSrc;
		this._waitIdDest = waitIdDest;
	}

	registerExp(exp?) {
		this._exp = exp;
	}

	createAttackEntry() {
		var attackEntry = StructureBuilder.buildAttackEntry();
		
		attackEntry.skillArrayActive = [];
		attackEntry.skillArrayPassive = [];
		attackEntry.stateArrayActive = [];
		attackEntry.stateArrayPassive = [];
		
		return attackEntry;
	}

	registerAttackEntry(attackEntry?) {
		this._attackEntryArray[this._attackEntryCount++] = attackEntry;
	}

	prevOrder() {
		if (this._currentIndex - 1 === -1) {
			return false;
		}
		
		this._currentIndex--;
		
		return true;
	}

	nextOrder() {
		if (!this.isNextOrder()) {
			return false;
		}
		
		this._currentIndex++;
		
		return true;
	}

	isNextOrder() {
		if (this._currentIndex === this._attackEntryArray.length) {
			return false;
		}
		
		return true;
	}

	getExp() {
		return this._exp;
	}

	getEntryCount() {
		return this._attackEntryCount;
	}

	getCurrentIndex() {
		return this._currentIndex;
	}

	setCurrentIndex(index?) {
		this._currentIndex = index;
	}

	getCurrentEntry() {
		var attackEntry;
		
		// Return the final entry for convenience if the entry has already been checked until the end.
		if (!this.isNextOrder()) {
			if (this._currentIndex === 0) {
				// It occurs when attack the opponent with a range 1 and "Seal attack" weapon from distance etc.
				// Both has no attack so create a dummy AttackEntry.
				attackEntry = this.createAttackEntry();
				attackEntry.isSrc = true;
				return attackEntry;
			}
			
			return this._attackEntryArray[this._currentIndex - 1];
		}
	
		return this._attackEntryArray[this._currentIndex];
	}

	getActiveUnit() {
		var unit;
		var attackEntry = this.getCurrentEntry();
		
		if (attackEntry.isSrc) {
			unit = this._unitSrc;
		}
		else {
			unit = this._unitDest;
		}
		
		return unit;
	}

	getPassiveUnit() {
		var unit;
		var attackEntry = this.getCurrentEntry();
		
		if (!attackEntry.isSrc) {
			unit = this._unitSrc;
		}
		else {
			unit = this._unitDest;
		}
		
		return unit;
	}

	isCurrentCritical() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.isCritical;
	}

	isCurrentHit() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.isHit;
	}

	isCurrentFinish() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.isFinish;
	}

	isCurrentFirstAttack() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.isFirstAttack;
	}

	isCurrentItemDecrement() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.isItemDecrement;
	}

	getActiveDamage() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.damageActive;
	}

	getPassiveDamage() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.damagePassive;
	}

	getPassiveFullDamage() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.damagePassiveFull;
	}

	getActiveSkillArray() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.skillArrayActive;
	}

	getPassiveSkillArray() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.skillArrayPassive;
	}

	getActiveStateArray() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.stateArrayActive;
	}

	getPassiveStateArray() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.stateArrayPassive;
	}

	getActiveMotionId() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.motionIdActive;
	}

	getPassiveMotionId() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.motionIdPassive;
	}

	getActiveMotionActionType() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.motionActionTypeActive;
	}

	getPassiveMotionActionType() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.motionActionTypePassive;
	}

	getMoveId() {
		var attackEntry = this.getCurrentEntry();
		return attackEntry.moveIdActive;
	}

	getWaitIdSrc() {
		return this._waitIdSrc;
	}

	getWaitIdDest() {
		return this._waitIdDest;
	}
}

// Normally the motion ID which is set at the class is used,
// but if the motion ID is set at the weapon, prioritize it.
class MotionIdControl {

	static createEmptyMotionIdData() {
		var midData: any = {};
	
		midData.unit = null;
		midData.weapon = null;
		midData.cls = null;
		midData.attackTemplateType = 0;
		midData.isCritical = false;
		midData.isFinish = false;
		midData.count = 0;
		midData.id = MotionIdValue.NONE;
		midData.type = -1;
		midData.idMoveOnly = MotionIdValue.NONE;
		midData.typeMoveOnly = -1;
		
		return midData;
	}

	static createMotionIdData(virtualActive?, virtualPassive?, attackEntry?, count?) {
		var midData = this.createEmptyMotionIdData();
		
		midData.unit = virtualActive.unitSelf;
		midData.weapon = virtualActive.weapon;
		midData.cls = BattlerChecker.getRealBattleClass(midData.unit, midData.weapon);
		midData.attackTemplateType = BattlerChecker.findAttackTemplateType(midData.cls, midData.weapon);
		midData.isCritical = attackEntry.isCritical;
		midData.isFinish = attackEntry.isFinish;
		midData.count = count;
		
		return midData;
	}

	static getWaitId(unit?, weapon?) {
		var collection;
		var id = -1;
		var cls = BattlerChecker.getRealBattleClass(unit, weapon);
		var attackTemplateType = BattlerChecker.findAttackTemplateType(cls, weapon);
			
		if (weapon !== null) {
			collection = weapon.getMotionIdCollection();
			id = this._getWaitIdInternal(attackTemplateType, collection);
		}
		
		if (id === MotionIdValue.NONE) {
			collection = cls.getMotionIdCollection();
			id = this._getWaitIdInternal(attackTemplateType, collection);
		}
		
		return id;
	}

	static getMoveId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getMoveIdInternal(collection, midData);
		}
		
		if (midData.idMoveOnly === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getMoveIdInternal(collection, midData);
		}
	}

	static getMoveAttackId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getMoveAttackIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getMoveAttackIdInternal(collection, midData);
		}
	}

	static getDirectAttackId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getDirectAttackIdIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getDirectAttackIdIdInternal(collection, midData);
		}
	}

	static getIndirectAttackId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getIndirectAttackIdIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getIndirectAttackIdIdInternal(collection, midData);
		}
	}

	static getMagicWeaponAttackId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getMagicWeaponAttackIdIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getMagicWeaponAttackIdIdInternal(collection, midData);
		}
	}

	static getBowId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getBowIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getBowIdInternal(collection, midData);
		}
	}

	static getMagicId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getMagicIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getMagicIdInternal(collection, midData);
		}
	}

	static getAvoidId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getAvoidIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getAvoidIdInternal(collection, midData);
		}
	}

	static getDamageId(midData?) {
		var collection;
		
		if (midData.weapon !== null) {
			collection = midData.weapon.getMotionIdCollection();
			this._getDamageIdInternal(collection, midData);
		}
		
		if (midData.id === MotionIdValue.NONE) {
			collection = midData.cls.getMotionIdCollection();
			this._getDamageIdInternal(collection, midData);
		}
	}

	static _getWaitIdInternal(attackTemplateType?, collection?) {
		var id = MotionIdValue.NONE;
		
		if (attackTemplateType === AttackTemplateType.FIGHTER) {
			id = collection.getFighterId(MotionFighter.WAIT);
		}
		else if (attackTemplateType === AttackTemplateType.ARCHER) {
			id = collection.getArcherId(MotionArcher.WAIT);
		}
		else if (attackTemplateType === AttackTemplateType.MAGE) {
			id = collection.getMageId(MotionMage.WAIT);
		}
		
		return id;
	}

	static _getMoveIdInternal(collection?, midData?) {
		var type;
		
		if (midData.isCritical) {
			if (midData.isFinish) {
				type = MotionFighter.CRITICALFINISHMOVE;
			}
			else {
				type = MotionFighter.CRITICALMOVE;
			}
		}
		else {
			type = MotionFighter.MOVE;
		}
		
		midData.idMoveOnly = collection.getFighterId(type);
		midData.typeMoveOnly = type;
	}

	static _getMoveAttackIdInternal(collection?, midData?) {
		var type;
		
		if (midData.isCritical) {
			if (midData.isFinish) {
				type = MotionFighter.CRITICALFINISHMOVEATTACK;
			}
			else {
				type = MotionFighter.CRITICALMOVEATTACK;
			}
		}
		else {
			type = MotionFighter.MOVEATTACK;
		}
		
		midData.id = collection.getFighterId(type);
		midData.type = type;
	}

	static _getDirectAttackIdIdInternal(collection?, midData?) {
		var id, type;
		var count = midData.count;
		
		if (midData.isCritical && midData.isFinish) {
			type = MotionFighter.CRITICALFINISHATTACK;
			id = collection.getFighterId(type);
			if (id !== MotionIdValue.NONE) {
				// If "Crt Direct Finish" is set, use it.
				midData.id = id;
				midData.type = type;
				return;
			}
		}
		
		count %= 2;
		
		if (midData.isCritical) {
			if (count === 0) {
				type = MotionFighter.CRITICALATTACK1;
			}
			else {
				type = MotionFighter.CRITICALATTACK2;
			}
		}
		else {
			if (count === 0) {
				type = MotionFighter.ATTACK1;
			}
			else {
				type = MotionFighter.ATTACK2;
			}
		}
		
		midData.id = collection.getFighterId(type);
		midData.type = type;
	}

	static _getIndirectAttackIdIdInternal(collection?, midData?) {
		var type;
		
		if (midData.isCritical) {
			type = MotionFighter.CRITICALINDIRECTATTACK;
		}
		else {
			type = MotionFighter.INDIRECTATTACK;
		}
		
		midData.id = collection.getFighterId(type);
		midData.type = type;
	}

	static _getMagicWeaponAttackIdIdInternal(collection?, midData?) {
		var type;
		
		if (midData.isCritical) {
			type = MotionFighter.CRITICALMAGICATTACK;
		}
		else {
			type = MotionFighter.MAGICATTACK;
		}
		
		midData.id = collection.getFighterId(type);
		midData.type = type;
		
		if (type === MotionFighter.CRITICALMAGICATTACK && midData.id === MotionIdValue.NONE) {
			// If "Crt Magic Weapon Atk" is not set, use "Magic Weapon Attack".
			midData.id = collection.getFighterId(MotionFighter.MAGICATTACK);
		}
	}

	static _getBowIdInternal(collection?, midData?) {
		var type;
		var count = midData.count;
		
		count %= 2;
		
		if (midData.isCritical) {
			if (midData.isFinish) {
				type = MotionArcher.CRITICALFINISH;
			}
			else {
				type = MotionArcher.CRITICALBOW;
			}
		}
		else {
			if (count === 0) {
				type = MotionArcher.BOW;
			}
			else {
				type = MotionArcher.BOW2;
			}
		}
		
		midData.id = collection.getArcherId(type);
		midData.type = type;
	}

	static _getMagicIdInternal(collection?, midData?) {
		var type;
		var count = midData.count;
		
		count %= 2;
		
		if (midData.isCritical) {
			if (midData.isFinish) {
				type = MotionMage.CRITICALFINISH;
			}
			else {
				type = MotionMage.CRITICALMAGIC;
			}
		}
		else {
			if (count === 0) {
				type = MotionMage.MAGIC;
			}
			else {
				type = MotionMage.MAGIC2;
			}
		}
		
		midData.id = collection.getMageId(type);
		midData.type = type;
	}

	static _getAvoidIdInternal(collection?, midData?) {
		var id = 0;
		var type = 0;
		var count = midData.count;
		
		count %= 2;
		
		if (midData.attackTemplateType === AttackTemplateType.FIGHTER) {
			if (count === 0) {
				type = MotionFighter.AVOID1;
			}
			else {
				type = MotionFighter.AVOID2;
			}
			id = collection.getFighterId(type);
		}
		else if (midData.attackTemplateType === AttackTemplateType.ARCHER) {
			if (count === 0) {
				type = MotionArcher.AVOID1;
			}
			else {
				type = MotionArcher.AVOID2;
			}
			id = collection.getArcherId(type);
		}
		else if (midData.attackTemplateType === AttackTemplateType.MAGE) {
			if (count === 0) {
				type = MotionMage.AVOID1;
			}
			else {
				type = MotionMage.AVOID2;
			}
			id = collection.getMageId(type);
		}
		
		midData.id = id;
		midData.type = type;
	}

	static _getDamageIdInternal(collection?, midData?) {
		var id = MotionIdValue.NONE;
		var type = -1;
		
		if (midData.attackTemplateType === AttackTemplateType.FIGHTER) {
			if (midData.isFinish) {
				type = MotionFighter.FINISHDAMAGE;
			}
			else {
				type = MotionFighter.DAMAGE;
			}
			id = collection.getFighterId(type);
		}
		else if (midData.attackTemplateType === AttackTemplateType.ARCHER) {
			if (midData.isFinish) {
				type = MotionArcher.FINISHDAMAGE;
			}
			else {
				type = MotionArcher.DAMAGE;
			}
			id = collection.getArcherId(type);
		}
		else if (midData.attackTemplateType === AttackTemplateType.MAGE) {
			if (midData.isFinish) {
				type = MotionMage.FINISHDAMAGE;
			}
			else {
				type = MotionMage.DAMAGE;
			}
			id = collection.getMageId(type);
		}
		
		midData.id = id;
		midData.type = type;
	}
}
