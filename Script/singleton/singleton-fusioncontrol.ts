
// Calling getUnitStyle is done by this file only.
class FusionControl {

	static catchUnit(unit?, targetUnit?, fusionData?) {
		if (!this.isFusionAllowed(unit, targetUnit, fusionData)) {
			return false;
		}
		
		unit.getUnitStyle().clearFusionInfo();
		unit.getUnitStyle().setFusionChild(targetUnit);
		unit.getUnitStyle().setFusionData(fusionData);
		
		targetUnit.getUnitStyle().clearFusionInfo();
		targetUnit.getUnitStyle().setFusionParent(unit);
		targetUnit.getUnitStyle().setFusionData(fusionData);
		
		targetUnit.setInvisible(true);
		
		this._observeUnitHp(unit, fusionData, IncreaseType.INCREASE);
		
		return true;
	}

	
	// The caller decides the unit release position.
	static releaseChild(unit?) {
		var fusionData;
		var targetUnit = this.getFusionChild(unit);
		
		if (targetUnit === null) {
			return false;
		}
		
		fusionData = unit.getUnitStyle().getFusionData();
		
		unit.getUnitStyle().clearFusionInfo();
		targetUnit.getUnitStyle().clearFusionInfo();
		
		targetUnit.setInvisible(false);
		
		this._observeUnitHp(unit, fusionData, IncreaseType.DECREASE);
		
		return true;
	}

	
	// If both the unit and targetUnit are currently fused with someone, they cannot be swapped.
	static tradeChild(unit?, targetUnit?) {
		var fusionData;
		var childUnit = this.getFusionChild(unit);
		
		if (childUnit === null) {
			return false;
		}
		
		fusionData = unit.getUnitStyle().getFusionData();
		unit.getUnitStyle().clearFusionInfo();
		
		targetUnit.getUnitStyle().clearFusionInfo();
		targetUnit.getUnitStyle().setFusionChild(childUnit);
		targetUnit.getUnitStyle().setFusionData(fusionData);
		
		childUnit.getUnitStyle().clearFusionInfo();
		childUnit.getUnitStyle().setFusionParent(targetUnit);
		childUnit.getUnitStyle().setFusionData(fusionData);
		
		childUnit.setInvisible(true);
		
		this._observeUnitHp(unit, fusionData, IncreaseType.DECREASE);
		this._observeUnitHp(targetUnit, fusionData, IncreaseType.INCREASE);
		
		return true;
	}

	static getFusionData(unit?) {
		return unit.getUnitStyle().getFusionData();
	}

	
	// Get the opponent (child) who fuses the unit.
	static getFusionChild(unit?) {
		return unit.getUnitStyle().getFusionChild();
	}

	
	// Get the opponent (parent) who fuses the unit.
	static getFusionParent(unit?) {
		return unit.getUnitStyle().getFusionParent();
	}

	
	// Check if the unit can fuse with targetUnit based on fusionData.
	static isFusionAllowed(unit?, targetUnit?, fusionData?) {
		if (!fusionData.compareUnitCapacity(unit, targetUnit)) {
			return false;
		}
		
		if (!fusionData.isSrcCondition(unit)) {
			return false;
		}
		
		if (!fusionData.isDestCondition(targetUnit)) {
			return false;
		}
		
		return true;
	}

	static isCatchable(unit?, targetUnit?, fusionData?) {
		if (this.getFusionChild(targetUnit) !== null) {
			return false;
		}
		
		if (!this.isFusionAllowed(unit, targetUnit, fusionData)) {
			return false;
		}
		
		return FilterControl.isBestUnitTypeAllowed(unit.getUnitType(), targetUnit.getUnitType(), fusionData.getFilterFlag());
	}

	static isAttackable(unit?, targetUnit?, fusionData?) {
		return this.isCatchable(unit, targetUnit, fusionData);
	}

	static isControllable(unit?, targetUnit?, fusionData?) {
		var result;
		
		if (fusionData.getFusionType() === FusionType.NORMAL) {
			result = this.isCatchable(unit, targetUnit, fusionData);
		}
		else {
			result = this.isAttackable(unit, targetUnit, fusionData);
		}
		
		return result;
	}

	static isItemAllowed(unit?, targetUnit?, fusionData?) {
		return true;
	}

	
	// "Fusion Attack" which is not the item should be adjacent with each other.
	static isRangeAllowed(unit?, targetUnit?, fusionData?) {
		var i;
		var x = unit.getMapX();
		var y = unit.getMapY();
		var x2 = targetUnit.getMapX();
		var y2 = targetUnit.getMapY();
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			if (x + XPoint[i] === x2 && y + YPoint[i] === y2) {
				return true;
			}
		}
		
		return false;
	}

	static isUnitTradable(unit?) {
		var data = unit.getUnitStyle().getFusionData();
		
		if (data === null) {
			return false;
		}
		
		return data.isUnitTradable();
	}

	static isItemTradable(unit?) {
		var data = unit.getUnitStyle().getFusionData();
		
		if (data === null) {
			return false;
		}
		
		return data.isItemTradable();
	}

	static clearFusion(unit?) {
		unit.getUnitStyle().clearFusionInfo();
	}

	static getFusionAttackData(unit?) {
		return unit.getUnitStyle().getFusionAttackData();
	}

	static startFusionAttack(unit?, fusionData?) {
		unit.getUnitStyle().startFusionAttack(fusionData);
	}

	static endFusionAttack(unit?) {
		unit.getUnitStyle().endFusionAttack();
	}

	static isExperienceDisabled(unit?) {
		var fusionData = unit.getUnitStyle().getFusionAttackData();
		
		if (fusionData === null) {
			return false;
		}
		
		// If processing after release is "Fusion Attack" which is not "Erase", don't allow to obtain the exp.
		// After release, re-catch it to prevent to earn the exp unlimitedly.
		return fusionData.getFusionReleaseType() !== FusionReleaseType.ERASE;
	}

	static getLastValue(unit?, index?, n?) {
		var childValue;
		var value = n;
		var calc = null;
		var child = null;
		var fusionData = FusionControl.getFusionData(unit);
		var isChildCheck = false;
		
		// In UnitStatusScrollbar._createStatusEntry, ParamGroup.getLastValue is called.
		// The index specified for _createStatusEntry ranges from 0 to the total number of parameters(including custom parameters).
		// Parameters can be reordered in _configureUnitParameters.
		// Since reordering is possible, index 1 doesn't necessarily identify "Str",
		// so ParamGroup.getParameterType converts it to the appropriate index.
		index = ParamGroup.getParameterType(index);
		
		if (fusionData !== null) {
			// If normal fusion, get "Correction while fusion".
			calc = fusionData.getStatusCalculation();
			child = FusionControl.getFusionChild(unit);
			if (child === null) {
				calc = null;
			}
			else {
				isChildCheck = calc.isChildCheck(index);
			}
		}
		else {
			fusionData = FusionControl.getFusionAttackData(unit);
			if (fusionData !== null) {
				// If it's "Fusion Attack", get "Fusion Attack Correction".
				calc = fusionData.getAttackCalculation();
			}
		}
		
		if (calc !== null) {
			if (isChildCheck) {
				childValue = SymbolCalculator.calculateEx(child, index, calc);
				value = SymbolCalculator.calculate(n, childValue, calc.getOperatorSymbol(index));
			}
			else {
				value = SymbolCalculator.calculate(n, calc.getValue(index), calc.getOperatorSymbol(index));
			}
		}
		
		return value;
	}

	static getFusionArray(unit?) {
		var i, list, skillArray, skill, fusionData;
		var fusionArray = [];
		var refList = root.getMetaSession().getDifficulty().getFusionReferenceList();
		var count = refList.getTypeCount();
		
		// Check "Default Enabled Fusion".
		for (i = 0; i < count; i++) {
			fusionData = refList.getTypeData(i);
			if (!this._isUsed(fusionArray, fusionData)) {
				fusionArray.push(fusionData);
			}
		}
		
		list = root.getBaseData().getFusionList();
		
		// If check the fusion skill, a weapon is specified null.
		// This skill cannot be possessed as a weapon skill.
		skillArray = SkillControl.getSkillMixArray(unit, null, SkillType.FUSION, '');
		count = skillArray.length;
		for (i = 0; i < count; i++) {
			skill = skillArray[i].skill;
			fusionData = list.getDataFromId(skill.getSkillValue());
			if (fusionData !== null && !this._isUsed(fusionArray, fusionData)) {
				fusionArray.push(fusionData);
			}
		}
		
		return fusionArray;
	}

	static _isUsed(arr?, obj?) {
		var i;
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			if (arr[i].getId() === obj.getId()) {
				return true;
			}
		}
		
		return false;
	}

	static _observeUnitHp(unit?, fusionData?, increaseType?) {
		var hpPlus = this._getFusionCorrectionValue(unit, 0, fusionData);
		
		if (increaseType === IncreaseType.DECREASE) {
			hpPlus *= -1;
		}
		
		if (hpPlus !== 0) {
			unit.setHp(unit.getHp() + hpPlus);
		}
		
		// In "Stat Changes during Fusion" to lower HP, hp > mhp should not be satisfied.
		MapHpControl.updateHp(unit);
	}

	static _getFusionCorrectionValue(unit?, index?, fusionData?) {
		var value = 0;
		var calc = null;
		
		index = ParamGroup.getParameterType(index);
		
		if (fusionData !== null) {
			calc = fusionData.getStatusCalculation();
		}
		
		if (calc !== null) {
			value = SymbolCalculator.calculate(0, calc.getValue(index), calc.getOperatorSymbol(index));
		}
		
		return value;
	}
}

class MetamorphozeControl {

	static startMetamorphoze(unit?, metamorphozeData?) {
		var mhpPrev;
		
		if (!this.isMetamorphozeAllowed(unit, metamorphozeData)) {
			return false;
		}
		
		mhpPrev = ParamBonus.getMhp(unit);
		
		unit.getUnitStyle().setMetamorphozeData(metamorphozeData);
		unit.getUnitStyle().setMetamorphozeTurn(metamorphozeData.getCancelTurn());
		
		this._addState(unit, metamorphozeData);
		
		Miscellaneous.changeHpBonus(unit, mhpPrev);
		
		return true;
	}

	static clearMetamorphoze(unit?) {
		var mhpPrev = ParamBonus.getMhp(unit);
		
		unit.getUnitStyle().clearMetamorphozeData();
		this._deleteMetamorphozeItem(unit);
		
		Miscellaneous.changeHpBonus(unit, mhpPrev);
	}

	static getMetamorphozeData(unit?) {
		return unit.getUnitStyle().getMetamorphozeData();
	}

	static getMetamorphozeTurn(unit?) {
		return unit.getUnitStyle().getMetamorphozeTurn();
	}

	static setMetamorphozeTurn(unit?, turn?) {
		unit.getUnitStyle().setMetamorphozeTurn(turn);
	}

	static isMetamorphozeAllowed(unit?, metamorphozeData?) {
		return metamorphozeData.isParameterCondition(unit) && metamorphozeData.isDataCondition(unit);
	}

	static getLastValue(unit?, index?, n?) {
		var value = n;
		var calc = null;
		var metamorphozeData = MetamorphozeControl.getMetamorphozeData(unit);
		
		if (metamorphozeData !== null) {
			calc = metamorphozeData.getStatusCalculation();
		}
		
		if (calc !== null) {
			value = SymbolCalculator.calculate(n, calc.getValue(index), calc.getOperatorSymbol(index));
		}
		
		return value;
	}

	static _addState(unit?, metamorphozeData?) {
		var i, state;
		var refList = metamorphozeData.getStateReferenceList();
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			state = refList.getTypeData(i);
			StateControl.arrangeState(unit, state, IncreaseType.INCREASE);
		}
	}

	static _deleteMetamorphozeItem(unit?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === null) {
				continue;
			}
			
			if (!item.isWeapon() && item.getItemType() === ItemType.METAMORPHOZE) {
				if (item.getLimit() === WeaponLimitValue.BROKEN) {
					UnitItemControl.cutItem(unit, i);
					break;
				}
			}
		}
	}
}
