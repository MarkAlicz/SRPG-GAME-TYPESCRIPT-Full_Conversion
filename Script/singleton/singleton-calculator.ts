
class AbilityCalculator {

	static getPower(unit?, weapon?) {
		var pow;
		
		if (Miscellaneous.isPhysicsBattle(weapon)) {
			// Physical attack or Bow attack.
			pow = RealBonus.getStr(unit);
		}
		else {
			// Magic attack
			pow = RealBonus.getMag(unit);
		}
		
		// Atk formula. Weapon pow + (Pow or Mag)
		return pow + weapon.getPow();
	}

	static getHit(unit?, weapon?) {
		// Hit rate formula. Weapon hit rate + (Ski * 3)
		return weapon.getHit() + (RealBonus.getSki(unit) * 3);
	}

	static getAvoid(unit?) {
		var avoid, terrain;
		var cls = unit.getClass();
		
		// Avoid is (Spd * 2)
		avoid = RealBonus.getSpd(unit) * 2;
		
		// If class type gains terrain bonus, add the avoid rate of terrain.
		if (cls.getClassType().isTerrainBonusEnabled()) {
			terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
			if (terrain !== null) {
				avoid += terrain.getAvoid();
			}
		}
		
		return avoid;
	}

	static getCritical(unit?, weapon?) {
		// Critical rate formula. Ski + Weapon critical rate
		return RealBonus.getSki(unit) + weapon.getCritical();
	}

	static getCriticalAvoid(unit?) {
		// Luk is a critical avoid rate.
		return RealBonus.getLuk(unit);
	}

	static getAgility(unit?, weapon?) {
		var agi, value, param;
		var spd = RealBonus.getSpd(unit);
		
		// Normally, agility is identical with spd.
		agi = spd;
		
		// If a weapon is not specified or the weight is not included, agility doesn't change.
		if (weapon === null || !DataConfig.isItemWeightDisplayable()) {
			return agi;
		}
		
		// If bld is enabled, decide with bld. Otherwise, decide with pow (mag).
		if (DataConfig.isBuildDisplayable()) {
			param = ParamBonus.getBld(unit);
		}
		else {
			if (Miscellaneous.isPhysicsBattle(weapon)) {
				param = ParamBonus.getStr(unit);
			}
			else {
				param = ParamBonus.getMag(unit);
			}
		}
		
		value = weapon.getWeight() - param;
		if (value > 0) {
			// If a parameter is lower than the weight, lower the agility according to the difference.
			agi -= value;
		}
		
		return agi;
	}
}

class DamageCalculator {

	static calculateDamage(active?, passive?, weapon?, isCritical?, activeTotalStatus?, passiveTotalStatus?, trueHitValue?) {
		var pow, def, damage;
		
		if (this.isHpMinimum(active, passive, weapon, isCritical, trueHitValue)) {
			return -1;
		}
		
		pow = this.calculateAttackPower(active, passive, weapon, isCritical, activeTotalStatus, trueHitValue);
		def = this.calculateDefense(active, passive, weapon, isCritical, passiveTotalStatus, trueHitValue);
		
		damage = pow - def;
		
		if (this.isHalved(active, passive, weapon, isCritical, trueHitValue)) {
			if (this.isPowerHalved()) {
				damage = Math.floor(pow / 2) - def;
			}
			else {
				damage = Math.floor(damage / 2);
			}
		}
		
		if (this.isCritical(active, passive, weapon, isCritical, trueHitValue)) {
			damage = Math.floor(damage * this.getCriticalFactor());
		}
		
		return this.validValue(active, passive, weapon, damage);
	}

	static calculateAttackPower(active?, passive?, weapon?, isCritical?, totalStatus?, trueHitValue?) {
		var pow = AbilityCalculator.getPower(active, weapon) + CompatibleCalculator.getPower(active, passive, weapon) + SupportCalculator.getPower(totalStatus);
		
		if (this.isEffective(active, passive, weapon, isCritical, trueHitValue)) {
			pow = Math.floor(pow * this.getEffectiveFactor());
		}
		
		return pow;
	}

	static calculateDefense(active?, passive?, weapon?, isCritical?, totalStatus?, trueHitValue?) {
		var def;
		
		if (this.isNoGuard(active, passive, weapon, isCritical, trueHitValue)) {
			return 0;
		}
		
		if (Miscellaneous.isPhysicsBattle(weapon)) {
			// Physical attack or Bow attack.
			def = RealBonus.getDef(passive);
		}
		else {
			// Magic attack
			def = RealBonus.getMdf(passive);
		}
		
		def += CompatibleCalculator.getDefense(passive, active, ItemControl.getEquippedWeapon(passive)) + SupportCalculator.getDefense(totalStatus);
		
		return def;
	}

	static validValue(active?, passive?, weapon?, damage?) {
		if (damage < DefineControl.getMinDamage()) {
			damage = DefineControl.getMinDamage();
		}
		
		return damage;
	}

	static isHalved(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		var result = false;
		
		if (this.isHalveAttack(active, passive, weapon, isCritical, trueHitValue)) {
			if (!this.isHalveAttackBreak(active, passive, weapon, isCritical, trueHitValue)) {
				result = true;
			}
		}
		
		return result;
	}

	static isPowerHalved() {
		return false;
	}

	static isCritical(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		return isCritical;
	}

	static isEffective(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		if (trueHitValue === TrueHitValue.EFFECTIVE) {
			return true;
		}
		
		// Check if the opponent has an "Effective Attack Invalid" skill.
		if (SkillControl.getBattleSkillFromFlag(passive, active, SkillType.INVALID, InvalidFlag.EFFECTIVE) === null) {
			// Check if the item is effective attack for the opponent unit.
			if (ItemControl.isEffectiveData(passive, weapon)) {
				return true;
			}
		}
		
		return false;
	}

	static isNoGuard(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		var option = weapon.getWeaponOption();
		
		return option === WeaponOption.NOGUARD || trueHitValue === TrueHitValue.NOGUARD;
	}

	static isHpMinimum(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		var option = weapon.getWeaponOption();
		
		return option === WeaponOption.HPMINIMUM || trueHitValue === TrueHitValue.HPMINIMUM;
	}

	static isFinish(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		return trueHitValue === TrueHitValue.FINISH;
	}

	static isHalveAttack(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		var weaponPassive = ItemControl.getEquippedWeapon(passive);
		
		if (weaponPassive !== null && weaponPassive.getWeaponOption() === WeaponOption.HALVEATTACK) {
			return true;
		}
		
		return SkillControl.getBattleSkillFromValue(passive, active, SkillType.BATTLERESTRICTION, BattleRestrictionValue.HALVEATTACK) !== null;
	}

	static isHalveAttackBreak(active?, passive?, weapon?, isCritical?, trueHitValue?) {
		if (weapon.getWeaponOption() === WeaponOption.HALVEATTACKBREAK) {
			return true;
		}
		
		return SkillControl.getBattleSkillFromFlag(active, passive, SkillType.INVALID, InvalidFlag.HALVEATTACKBREAK) !== null;
	}

	static isWeaponLimitless(active?, passive?, weapon?) {
		var skill;
		
		if (weapon === null) {
			return false;
		}
		
		// Check if "Weapon durability is unlimited" is set at the game option.
		if (DataConfig.isWeaponInfinity()) {
			return true;
		}
		
		// Check if the unit possesses the "Infinite Weapons" skill.
		skill = SkillControl.getBattleSkill(active, passive, SkillType.NOWEAPONDECREMENT);
		if (skill === null) {
			return false;
		}
		
		return ItemControl.isWeaponTypeAllowed(skill.getDataReferenceList(), weapon);
	}

	static getEffectiveFactor() {
		return DataConfig.getEffectiveFactor() / 100;
	}

	static getCriticalFactor() {
		return DataConfig.getCriticalFactor() / 100;
	}
}

class HitCalculator {

	static calculateHit(active?, passive?, weapon?, activeTotalStatus?, passiveTotalStatus?) {
		var hit, avoid, percent;
		
		if (root.isAbsoluteHit()) {
			if (passive.isImmortal()) {
				// If the opponent is immortal, hit rate cannot be 100%.
				return 99;
			}
			return 100;
		}
		
		hit = this.calculateSingleHit(active, passive, weapon, activeTotalStatus);
		avoid = this.calculateAvoid(active, passive, weapon, passiveTotalStatus);
		
		percent = hit - avoid;
		
		return this.validValue(active, passive, weapon, percent);
	}

	static calculateSingleHit(active?, passive?, weapon?, totalStatus?) {
		return AbilityCalculator.getHit(active, weapon) + CompatibleCalculator.getHit(active, passive, weapon) + SupportCalculator.getHit(totalStatus);
	}

	static calculateAvoid(active?, passive?, weapon?, totalStatus?) {
		return AbilityCalculator.getAvoid(passive) + CompatibleCalculator.getAvoid(passive, active, ItemControl.getEquippedWeapon(passive)) + SupportCalculator.getAvoid(totalStatus);
	}

	static validValue(active?, passive?, weapon?, percent?) {
		if (percent < DefineControl.getMinHitPercent()) {
			percent = DefineControl.getMinHitPercent();
		}
		else if (percent > DefineControl.getMaxHitPercent()) {
			percent = DefineControl.getMaxHitPercent();
		}
		
		if (percent === 100 && passive.isImmortal()) {
			percent = 99;
		}
		
		return percent;
	}
}

class CriticalCalculator {

	static calculateCritical(active?, passive?, weapon?, activeTotalStatus?, passiveTotalStatus?) {
		var critical, avoid, percent;
		
		if (!this.isCritical(active, passive, weapon)) {
			return 0;
		}
		
		critical = this.calculateSingleCritical(active, passive, weapon, activeTotalStatus);
		avoid = this.calculateCriticalAvoid(active, passive, weapon, passiveTotalStatus);
		
		percent = critical - avoid;
		
		return this.validValue(active, passive, weapon, percent);
	}

	static calculateSingleCritical(active?, passive?, weapon?, totalStatus?) {
		return AbilityCalculator.getCritical(active, weapon) + CompatibleCalculator.getCritical(active, passive, weapon) + SupportCalculator.getCritical(totalStatus);
	}

	static calculateCriticalAvoid(active?, passive?, weapon?, totalStatus?) {
		return AbilityCalculator.getCriticalAvoid(passive) + CompatibleCalculator.getCriticalAvoid(passive, active, ItemControl.getEquippedWeapon(passive)) + SupportCalculator.getCriticalAvoid(totalStatus);
	}

	static isCritical(active?, passive?, weapon?, percent?) {
		// If the opponent has "Critical invalid" skill, critical hit cannot be activated.
		if (SkillControl.getBattleSkillFromFlag(passive, active, SkillType.INVALID, InvalidFlag.CRITICAL) !== null) {
			return false;
		}
		
		return Miscellaneous.isCriticalAllowed(active, passive);
	}

	static validValue(active?, passive?, weapon?, percent?) {
		if (percent < 0) {
			percent = 0;
		}
		else if (percent > 100) {
			percent = 100;
		}
		
		return percent;
	}
}

class Calculator {

	static calculateAttackCount(active?, passive?, weapon?) {
		return weapon.getAttackCount();
	}

	static calculateRoundCount(active?, passive?, weapon?) {
		var activeAgi;
		var passiveAgi;
		var value;
		
		if (!this.isRoundAttackAllowed(active, passive)) {
			return 1;
		}
		
		activeAgi = AbilityCalculator.getAgility(active, weapon) + this.getAgilityPlus(active, passive, weapon);
		passiveAgi = AbilityCalculator.getAgility(passive, ItemControl.getEquippedWeapon(passive));
		value = this.getDifference();
		
		return (activeAgi - passiveAgi) >= value ? 2 : 1;
	}

	static getAgilityPlus(active?, passive?, weapon?) {
		return CompatibleCalculator.getAgility(active, passive, weapon);
	}

	static getDifference(unit?) {
		return DataConfig.getRoundDifference();
	}

	static isRoundAttackAllowed(active?, passive?) {
		var option = root.getMetaSession().getDifficulty().getDifficultyOption();
		
		// Check if "Pursuit" is included in the difficulty option.
		// If no possession of "Pursuit" skill, return false.
		if (!(option & DifficultyFlag.ROUNDATTACK) && SkillControl.getBattleSkill(active, passive, SkillType.ROUNDATTACK) === null) {
			return false;
		}
		
		return true;
	}

	static isCounterattackAllowed(active?, passive?) {
		var option = root.getMetaSession().getDifficulty().getDifficultyOption();
		
		if (!(option & DifficultyFlag.COUNTERATTACK) && SkillControl.getBattleSkill(passive, active, SkillType.COUNTERATTACK) === null) {
			return false;
		}
		
		return true;
	}

	static calculateRecoveryItemPlus(unit?, targetUnit?, item?) {
		var plus = 0;
		var itemType = item.getItemType();
		
		if (itemType !== ItemType.RECOVERY && itemType !== ItemType.ENTIRERECOVERY) {
			return 0;
		}
		
		// If the item is a wand, add the user's Mag.
		if (item.isWand()) {
			plus = ParamBonus.getMag(unit);
		}
		
		return plus;
	}

	static calculateRecoveryValue(targetUnit?, recoveryValue?, recoveryType?, plus?) {
		var n = 0;
		var maxMhp = ParamBonus.getMhp(targetUnit);
		
		if (recoveryType === RecoveryType.SPECIFY) {
			n = recoveryValue + plus;
			if (n > maxMhp) {
				n = maxMhp;
			}
		}
		else if (recoveryType === RecoveryType.MAX) {
			n = maxMhp;
		}
		
		return n;
	}

	static calculateDamageItemPlus(unit?, targetUnit?, item?) {
		var damageInfo, damageType;
		var plus = 0;
		var itemType = item.getItemType();
		
		if (itemType === ItemType.DAMAGE) {
			damageInfo = item.getDamageInfo();
		}
		else {
			return 0;
		}
		
		damageType = damageInfo.getDamageType();
		if (item.isWand()) {
			if (damageType === DamageType.MAGIC) {
				plus = ParamBonus.getMag(unit);
			}
		}
		
		return plus;
	}

	static calculateDamageValue(targetUnit?, damageValue?, damageType?, plus?) {
		var n, def;
		
		// Def to be referred is different depending on DamageType.
		if (damageType === DamageType.FIXED) {
			def = 0;
		}
		else if (damageType === DamageType.PHYSICS) {
			def = RealBonus.getDef(targetUnit);
		}
		else {
			def = RealBonus.getMdf(targetUnit);
		}
		
		n = (damageValue + plus) - def;
		
		if (n < DefineControl.getMinDamage()) {
			n = DefineControl.getMinDamage();
		}
		
		return n;
	}

	static calculateDamageHit(targetUnit?, hit?) {
		var totalStatus;
		
		if (hit === 0) {
			// If hit rate is 0, an attack always hits.
			return 100;
		}
		
		totalStatus = SupportCalculator.createTotalStatus(targetUnit);
		
		hit -= HitCalculator.calculateAvoid(null, targetUnit, null, totalStatus);
		if (hit < 0) {
			hit = 0;
		}
		
		return hit;
	}

	static calculateSellPrice(item?) {
		var d;
		var gold = item.getGold() / 2;
		var limitMax = item.getLimitMax();
		
		if (limitMax === 0) {
			// Weapons that can be used infinitely (durability of 0) can be sold for half the purchasing cost.
			d = 1;
		}
		else if (limitMax === WeaponLimitValue.BROKEN) {
			// Broken weapons can only be sold for 0 gold.
			d = 0;
		}
		else {
			d = item.getLimit() / limitMax;
		}
		
		gold = Math.floor(gold * d);
		
		return gold;
	}
}

class SupportCalculator {

	static createTotalStatus(unit?) {
		var i, x, y, index, targetUnit, indexArray, count;
		var totalStatus: any = {};
		
		totalStatus.powerTotal = 0;
		totalStatus.defenseTotal = 0;
		totalStatus.hitTotal = 0;
		totalStatus.avoidTotal = 0;
		totalStatus.criticalTotal = 0;
		totalStatus.criticalAvoidTotal = 0;
		
		if (unit === null || this._isStatusDisabled()) {
			return totalStatus;
		}
		
		indexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, this._getSupportRange());
		count = indexArray.length;
		
		// Search unit2 within a certain range of targetUnit (default 3 tiles).
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null) {
				// If targetUnit is found, add support data into totalStatus.
				this._collectStatus(unit, targetUnit, totalStatus);
			}
		}
		
		this._collectSkillStatus(unit, totalStatus);
		
		return totalStatus;
	}

	static getPower(totalStatus?) {
		if (totalStatus === null) {
			return 0;
		}
		
		return totalStatus.powerTotal;
	}

	static getDefense(totalStatus?) {
		if (totalStatus === null) {
			return 0;
		}
		
		return totalStatus.defenseTotal;
	}

	static getHit(totalStatus?) {
		if (totalStatus === null) {
			return 0;
		}
		
		return totalStatus.hitTotal;
	}

	static getAvoid(totalStatus?) {
		if (totalStatus === null) {
			return 0;
		}
		
		return totalStatus.avoidTotal;
	}

	static getCritical(totalStatus?) {
		if (totalStatus === null) {
			return 0;
		}
		
		return totalStatus.criticalTotal;
	}

	static getCriticalAvoid(totalStatus?) {
		if (totalStatus === null) {
			return 0;
		}
		
		return totalStatus.criticalAvoidTotal;
	}

	static _collectStatus(unit?, targetUnit?, totalStatus?) {
		var i, data;
		var count = targetUnit.getSupportDataCount();
		
		for (i = 0; i < count; i++) {
			data = targetUnit.getSupportData(i);
			if (unit === data.getUnit() && data.isGlobalSwitchOn() && data.isVariableOn()) {
				this._addStatus(totalStatus, data.getSupportStatus());
				break;
			}
		}
	}

	static _collectSkillStatus(unit?, totalStatus?) {
		var i, j, list, count, targetUnit;
		var listArray = this._getListArray(unit);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (unit === targetUnit) {
					continue;
				}
				
				this._checkSkillStatus(targetUnit, unit, false, totalStatus);
			}
		}
		
		// If the unit itself has "Single" skill, add to the unit itself.
		this._checkSkillStatus(unit, null, true, totalStatus);
	}

	static _checkSkillStatus(unit?, targetUnit?, isSelf?, totalStatus?) {
		var i, skill, isSet, indexArray;
		var arr = SkillControl.getDirectSkillArray(unit, SkillType.SUPPORT, '');
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			isSet = false;
			
			if (isSelf) {
				if (skill.getRangeType() === SelectionRangeType.SELFONLY) {
					isSet = true;
				}
			}
			else {
				if (skill.getRangeType() === SelectionRangeType.ALL) {
					// If it's "All", always enable to support.
					isSet = true;
				}
				else if (skill.getRangeType() === SelectionRangeType.MULTI) {
					indexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, skill.getRangeValue());
					// If it's "Specify", check if the unit exists at the position in arr.
					isSet = IndexArray.findUnit(indexArray, targetUnit);
				}
			}
			
			if (isSet && this._isSupportable(unit, targetUnit, skill)) {
				this._addStatus(totalStatus, skill.getSupportStatus());
			}
		}
	}

	static _addStatus(totalStatus?, supportStatus?) {
		totalStatus.powerTotal += supportStatus.getPower();
		totalStatus.defenseTotal += supportStatus.getDefense();
		totalStatus.hitTotal += supportStatus.getHit();
		totalStatus.avoidTotal += supportStatus.getAvoid();
		totalStatus.criticalTotal += supportStatus.getCritical();
		totalStatus.criticalAvoidTotal += supportStatus.getCriticalAvoid();
	}

	static _isSupportable(unit?, targetUnit?, skill?) {
		if (targetUnit === null) {
			targetUnit = unit;
		}
		
		return skill.getTargetAggregation().isCondition(targetUnit);
	}

	static _getSupportRange() {
		return DataConfig.getSupportRange();
	}

	static _isStatusDisabled() {
		return root.getBaseScene() === SceneType.REST;
	}

	static _getListArray(unit?) {
		var filter = this._getSupportFilterFlag(unit);
		var listArray = FilterControl.getListArray(filter);
		
		this._appendGuestList(listArray, filter);
		
		return listArray;
	}

	static _getSupportFilterFlag(unit?) {
		var filter;
		var unitType = unit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.ENEMY;
		}
		else {
			filter = UnitFilterFlag.ALLY;
			// If a supportive skill including the ally as "Support" exists and if the player has the skill, use the following code.
			// filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
		}
		
		return filter;
	}

	static _appendGuestList(listArray?, filter?) {
		if (!(filter & UnitFilterFlag.PLAYER)) {
			return;
		}
		
		if (root.getBaseScene() !== SceneType.BATTLESETUP) {
			return;
		}
		
		listArray.push(root.getCurrentSession().getNonJoinedGuestList());
	}
}

class CompatibleCalculator {

	static getPower(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getPower();
	}

	static getDefense(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getDefense();
	}

	static getHit(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getHit();
	}

	static getAvoid(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getAvoid();
	}

	static getCritical(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getCritical();
	}

	static getCriticalAvoid(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getCriticalAvoid();
	}

	static getAgility(active?, passive?, weapon?) {
		var compatible = this._getCompatible(active, passive, weapon);
		
		if (compatible === null) {
			return 0;
		}
		
		return compatible.getAgility();
	}

	static _getCompatible(active?, passive?, weapon?) {
		var i, count, compatible, weaponTypeActive, weaponTypePassive;
		var weaponPassive = ItemControl.getEquippedWeapon(passive);
		
		if (weaponPassive === null || weapon === null) {
			return null;
		}
		
		weaponTypeActive = weapon.getWeaponType();
		weaponTypePassive = weaponPassive.getWeaponType();
		
		count = weaponTypeActive.getCompatibleCount();
		for (i = 0; i < count; i++) {
			compatible = weaponTypeActive.getCompatibleData(i);
			if (compatible.getSrcObject() === weaponTypePassive) {
				return compatible.getSupportStatus();
			}
		}
		
		return null;
	}
}

class ExperienceCalculator {

	static calculateExperience(data?) {
		var exp;
		
		// If the unit is dead, activeHp and passiveHp can be set minus value.
		// It means it can be stored exceeding 0.
		if (data.passiveDamageTotal === 0) {
			exp = this._getNoDamageExperience(data);
		}
		else if (data.passiveHp <= 0) {
			exp = this._getVictoryExperience(data);
		}
		else {
			exp = this._getNormalValue(data);
		}
		
		return this.getBestExperience(data.active, exp);
	}

	
	// This method is called when item is used, too.
	static getBestExperience(unit?, exp?) {
		exp = Math.floor(exp * this._getExperienceFactor(unit));
		
		if (exp > 100) {
			exp = 100;
		}
		else if (exp < 0) {
			exp = 0;
		}
		
		return exp;
	}

	static _getExperienceFactor(unit?) {
		var skill;
		var factor = 100;
		var option = root.getMetaSession().getDifficulty().getDifficultyOption();
		
		skill = SkillControl.getBestPossessionSkill(unit, SkillType.GROWTH);
		if (skill !== null) {
			factor = skill.getSkillValue();
		}
		
		if (option & DifficultyFlag.GROWTH) {
			factor *= 2;
		}
		
		return factor / 100;
	}

	static _getNoDamageExperience(data?) {
		var baseExp = 5;
		var exp = this._getExperience(data, baseExp);
		
		return this._getValidExperience(exp);
	}

	static _getVictoryExperience(data?) {
		var exp;
		var baseExp = this._getBaseExperience();
		var bonusExp = data.passive.getClass().getBonusExp();
		
		// If "Optional Exp" of the class is minus, don't obtain the exp when winning.
		// Because this is supposed to beat a leader on the final map.
		if (bonusExp < 0) {
			return 0;
		}
		
		// If the game option "Get optional exp of class when enemy is killed" is enabled, return "Optional Exp" of the class.
		if (DataConfig.isFixedExperience()) {
			return this._getValidExperience(bonusExp + this._getBonusExperience(data.passive));
		}
		
		exp = this._getExperience(data, baseExp);
		
		// If the opponent is a leader or a sub-leader, add the exp.
		exp += this._getBonusExperience(data.passive);
		
		// Add "Optional Exp" of the opponent class.
		exp += bonusExp;
		
		return this._getValidExperience(exp);
	}

	static _getNormalValue(data?) {
		var baseExp = 8;
		var exp = this._getExperience(data, baseExp);
		
		return this._getValidExperience(exp);
	}

	static _getExperience(data?, baseExp?) {
		var n;
		var lv = data.passive.getLv() - data.active.getLv();
		
		if (data.passiveHp > 0) {
			// If the opponent cannot be beaten, add the level difference.
			n = baseExp + lv;
		}
		else {
			if (lv > 0) {
				// If the level is bigger than the opponent, increase by 4 according to the difference.
				n = lv * 4;
			}
			else {
				// If the level is smaller than the opponent, decrease by 2 according to the difference (Iv is minus so decrease).
				n = lv * 2;
			}
			
			n += baseExp;
		}
		
		if (data.active.getClass().getClassRank() === data.passive.getClass().getClassRank()) {
			// Battle between low class, or high class, no adjust the exp any more.
			return n;
		}
		
		if (data.active.getClass().getClassRank() === ClassRank.LOW) {
			// Process if the low class attacked high class.
			n = Math.floor(n * (DataConfig.getLowExperienceFactor() / 100));
		}
		else {
			// Process if the high class attacked low class.
			n = Math.floor(n * (DataConfig.getHighExperienceFactor() / 100));
		}
		
		return n;
	}

	static _getValidExperience(exp?) {
		var minExp = DataConfig.getMinimumExperience();
		
		if (exp < minExp) {
			exp = minExp;
		}
		
		return exp;
	}

	static _getBonusExperience(unit?) {
		var exp = 0;
		var type = unit.getImportance();
		
		if (type === ImportanceType.LEADER) {
			exp = DataConfig.getLeaderExperience();
		}
		else if (type === ImportanceType.SUBLEADER) {
			exp = DataConfig.getSubLeaderExperience();
		}
		
		return exp;
	}

	static _getBaseExperience() {
		var difficulty = root.getMetaSession().getDifficulty();
		
		return difficulty.getBaseExperience();
	}
}

class ExperienceControl {

	static obtainExperience(unit?, getExp?) {
		var growthArray;
		
		if (!this._addExperience(unit, getExp)) {
			return null;
		}
		
		if (unit.getUnitType() === UnitType.PLAYER) {
			growthArray = this._createGrowthArray(unit);
		}
		else {
			growthArray = this._createCusotmGrowthArray(unit);
		}
		
		return growthArray;
	}

	static plusGrowth(unit?, growthArray?) {
		var i;
		var count = growthArray.length;
		
		for (i = 0; i < count; i++) {
			ParameterControl.changeParameter(unit, i, growthArray[i]);
		}
	}

	static directGrowth(unit?, getExp?) {
		var growthArray = this.obtainExperience(unit, getExp);
		
		if (growthArray !== null) {
			this.plusGrowth(unit, growthArray);
		}
	}

	static obtainData(unit?) {
		SkillChecker.addAllNewSkill(unit);
	}

	static _createGrowthArray(unit?) {
		var i, n;
		var count = ParamGroup.getParameterCount();
		var growthArray = [];
		var weapon = ItemControl.getEquippedWeapon(unit);
		
		for (i = 0; i < count; i++) {
			// Calculate the growth value (or the growth rate).
			n = ParamGroup.getGrowthBonus(unit, i) + ParamGroup.getUnitTotalGrowthBonus(unit, i, weapon);
			
			// Set the rise value.
			growthArray[i] = this._getGrowthValue(n);
		}
		
		return growthArray;
	}

	static _createCusotmGrowthArray(unit?) {
		var i, type, defIndex;
		var count = ParamGroup.getParameterCount();
		var customGrowthArray = [];
		var defaultGrowthArray = unit.getClass().getPrototypeInfo().getGrowthArray(unit.getLv());
		
		for (i = 0; i < count; i++) {
			type = ParamGroup.getParameterType(i);
			
			defIndex = -1;
			
			if (type === ParamType.MHP) {
				defIndex = 0;
			}
			else if (type === ParamType.POW) {
				defIndex = 1;
			}
			else if (type === ParamType.MAG) {
				defIndex = 2;
			}
			else if (type === ParamType.SKI) {
				defIndex = 3;
			}
			else if (type === ParamType.SPD) {
				defIndex = 4;
			}
			else if (type === ParamType.LUK) {
				defIndex = 5;
			}
			else if (type === ParamType.DEF) {
				defIndex = 6;
			}
			else if (type === ParamType.MDF) {
				defIndex = 7;
			}	
			else if (type === ParamType.MOV) {
				defIndex = 8;
			}
			else if (type === ParamType.WLV) {
				defIndex = 9;
			}
			else if (type === ParamType.BLD) {
				defIndex = 10;
			}

			if (defIndex === -1) {
				customGrowthArray[i] = 0;
			}
			else {
				customGrowthArray[i] = defaultGrowthArray[defIndex];
			}
		}
		
		return customGrowthArray;
	}

	static _getGrowthValue(n?) {
		var value, value2;
		var isMunus = false;
		
		if (n < 0) {
			n *= -1;
			isMunus = true;
		}
		
		// For instance, if n is 270, 2 rise for sure.
		// Moreover, 1 rises with a probability of 70%.
		value = Math.floor(n / 100);
		value2 = Math.floor(n % 100);
		
		if (Probability.getProbability(value2)) {
			value++;
		}
		
		if (isMunus) {
			value *= -1;
		}
		
		return value;
	}

	static _addExperience(unit?, getExp?) {
		var exp;
		var baselineExp = this._getBaselineExperience();
		
		// Add the current unit exp and the obtain exp.
		exp = unit.getExp() + getExp; 
		
		if (exp >= baselineExp) {
			// If exceed the reference value, 1 level up.
			unit.setLv(unit.getLv() + 1);
			if (unit.getLv() >= Miscellaneous.getMaxLv(unit)) {
				// If reached maximum level, the exp is 0.
				exp = 0;
			}
			else {
				// Exp falls less than the maximum exp by subtracting the maximum exp.
				exp -= baselineExp;
			}
			
			unit.setExp(exp);
		}
		else {
			unit.setExp(exp);
			
			// If no level up, return false.
			return false;
		}
		
		return true;
	}

	static _getBaselineExperience() {
		return DefineControl.getBaselineExperience();
	}
}

class RestrictedExperienceControl {

	static obtainExperience(unit?, getExp?) {
		var i, count, objectArray;
		var sum = 0;
		
		if (!ExperienceControl._addExperience(unit, getExp)) {
			return null;
		}
		
		objectArray = this._createObjectArray(unit);
		count = objectArray.length;
		for (i = 0; i < count; i++) {
			if (objectArray[i].value !== 0) {
				// Count the number of grown parameters.
				sum++;
			}
		}
		
		objectArray = this._sortObjectArray(objectArray, sum, unit);
		
		return this._getGrowthArray(objectArray);
	}

	static _sortObjectArray(objectArray?, sum?, unit?) {
		var i, obj;
		var n = 0;
		var count = objectArray.length;
		var max = this._getMax(unit);
		
		// Sort in descending order of the growth rate.
		this._sort(objectArray);
		
		if (sum > max) {
			// There are too many parameters grown, so reduce them.
			// Disable parameters which can grow easily first.
			for (i = 0; i < count; i++) {
				obj = objectArray[i];
				if (obj.value === 0) {
					continue;
				}
				
				obj.value = 0;
				if (++n == sum - max) {
					break;
				}
			}
		}
		else if (sum < max) {
			// There aren't many parameters grown, so increase them.
			// Make parameters, which can grow easily, grow first.
			for (i = 0; i < count; i++) {
				obj = objectArray[i];
				if (obj.value !== 0) {
					continue;
				}
				
				obj.value = ExperienceControl._getGrowthValue(100);
				if (++n == max - sum) {
					break;
				}
			}
		}
		
		return objectArray;
	}

	static _getGrowthArray(objectArray?) {
		var i, count, obj;
		var growthArray = [];
		
		count = objectArray.length;
		for (i = 0; i < count; i++) {
			growthArray[i] = 0;
		}
		
		for (i = 0; i < count; i++) {
			obj = objectArray[i];
			if (obj.value !== 0) {	
				growthArray[obj.index] = obj.value;
			}
		}
		
		return growthArray;
	}

	static _createObjectArray(unit?) {
		var i, obj;
		var count = ParamGroup.getParameterCount();
		var objectArray = [];
		var weapon = ItemControl.getEquippedWeapon(unit);
		
		for (i = 0; i < count; i++) {
			obj = {};
			obj.index = i;
			obj.percent = ParamGroup.getGrowthBonus(unit, i) + ParamGroup.getUnitTotalGrowthBonus(unit, i, weapon);
			obj.value = ExperienceControl._getGrowthValue(obj.percent);
			// For the parameters having the same growth rate, the priority of growth is determined by random numbers.
			obj.rand = root.getRandomNumber() % count;
			
			objectArray[i] = obj;
		}
		
		return objectArray;
	}

	static _sort(arr?) {
		arr.sort(
			function(obj1, obj2) {
				if (obj1.percent > obj2.percent) {
					return -1;
				}
				else if (obj1.percent < obj2.percent) {
					return 1;
				}
				else {
					// When a parameter with the same growth rate rises, the latter parameter is not given priority.
					if (obj1.rand > obj2.rand) {
						return -1;
					}
					else if (obj1.rand < obj2.rand) {
						return 1;
					}
				}
				
				return 0;
			}
		);
	}

	static _getMax(unit?) {
		// There are 3 parameters to rise.
		return 3;
	}
}

class ParameterControl {

	static changeParameter(unit?, index?, growthValue?) {
		var n;
		
		// Get the current parameter and add growth value.
		n = ParamGroup.getUnitValue(unit, index) + growthValue;
		
		n = ParamGroup.getValidValue(unit, n, index);
		
		ParamGroup.setUnitValue(unit, index, n);
		
		this.adjustParameter(unit, index, growthValue);
	}

	static adjustParameter(unit?, index?, growthValue?) {
		var hp, mhp;
		
		// Increase the current HP according to grow.
		if (index === ParamType.MHP) {
			hp = unit.getHp() + growthValue;
			unit.setHp(hp);
			mhp = ParamBonus.getMhp(unit);
			if (hp > mhp) {
				unit.setHp(mhp);
			}
			else if (hp < 1) {
				unit.setHp(1);
			}
		}
	}

	static addDoping(unit?, obj?) {
		var i, value, n;
		var count = ParamGroup.getParameterCount();
		
		for (i = 0; i < count; i++) {
			n = ParamGroup.getGrowthBonus(unit, i);
			if (n === 0 && !DataConfig.isFullDopingEnabled()) {
				continue;
			}
			value = ParamGroup.getDopingParameter(obj, i);
			this.changeParameter(unit, i, value);
		}
	}
}

class SymbolCalculator {

	static calculate(a?, b?, symbol?) {
		var n = a;
		
		if (symbol === OperatorSymbol.ADD) {
			n = a + b;
		}
		else if (symbol === OperatorSymbol.SUBTRACT) {
			n = a - b;
		}
		else if (symbol === OperatorSymbol.MULTIPLY) {
			n = a * b;
		}
		else if (symbol === OperatorSymbol.DIVIDE) {
			n = Math.floor(a / b);
		}
		else if (symbol === OperatorSymbol.MOD) {
			n = Math.floor(a % b);
		}
		else if (symbol === OperatorSymbol.ASSIGNMENT) {
			n = b;
		}
		
		return n;
	}

	static calculateEx(unit?, index?, calc?) {
		var type, n;
		
		if (unit === null) {
			return 0;
		}
		
		type = calc.getParameterType(index);
		n = ParamBonus.getBonus(unit, type);
		
		return this.calculate(n, calc.getParameterValue(index), calc.getParameterOperatorSymbol(index));
	}
}
