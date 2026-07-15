
// Decide when the unit list is gotten.
// No decision is made such as alive etc. at the time when the unit from the unit list is obtained.
// For DefaultList method, include the unit who is fused.
class AllUnitList {

	static getAliveList(list?) {
		var funcCondition = function(unit) {
			return unit.getAliveState() === AliveType.ALIVE && FusionControl.getFusionParent(unit) === null;
		};
		
		return this.getList(list, funcCondition);
	}

	static getAliveDefaultList(list?) {
		var funcCondition = function(unit) {
			return unit.getAliveState() === AliveType.ALIVE;
		};
		
		return this.getList(list, funcCondition);
	}

	static getDeathList(list?) {
		var funcCondition = function(unit) {
			return unit.getAliveState() === AliveType.DEATH;
		};
		
		return this.getList(list, funcCondition);
	}

	static getSortieList(list?) {
		var funcCondition = function(unit) {
			return unit.getSortieState() === SortieType.SORTIE && unit.getAliveState() === AliveType.ALIVE && FusionControl.getFusionParent(unit) === null;
		};
		
		return this.getList(list, funcCondition);
	}

	static getSortieDefaultList(list?) {
		var funcCondition = function(unit) {
			return unit.getSortieState() === SortieType.SORTIE && unit.getAliveState() === AliveType.ALIVE;
		};
		
		return this.getList(list, funcCondition);
	}

	static getSortieOnlyList(list?) {
		var funcCondition = function(unit) {
			return unit.getSortieState() === SortieType.SORTIE;
		};
		
		return this.getList(list, funcCondition);
	}

	static getList(list?, funcCondition?) {
		var i, unit, obj;
		var arr = [];
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (funcCondition(unit)) {
				arr.push(unit);
			}
		}
		
		obj = StructureBuilder.buildDataList();
		obj.setDataArray(arr);
		
		return obj;
	}
}

class PlayerList {

	static getAliveList() {
		return AllUnitList.getAliveList(this.getMainList());
	}

	static getAliveDefaultList() {
		return AllUnitList.getAliveDefaultList(this.getMainList());
	}

	static getDeathList() {
		return AllUnitList.getDeathList(this.getMainList());
	}

	static getSortieList() {
		return AllUnitList.getSortieList(this.getMainList());
	}

	static getSortieDefaultList() {
		return AllUnitList.getSortieDefaultList(this.getMainList());
	}

	static getSortieOnlyList() {
		return AllUnitList.getSortieOnlyList(this.getMainList());
	}

	static getMainList() {
		return root.getMetaSession().getTotalPlayerList();
	}
}

class EnemyList {

	static getAliveList() {
		return AllUnitList.getAliveList(this.getMainList());
	}

	static getAliveDefaultList() {
		return AllUnitList.getAliveDefaultList(this.getMainList());
	}

	static getDeathList() {
		return AllUnitList.getDeathList(this.getMainList());
	}

	static getMainList() {
		var obj;
		var session = root.getCurrentSession();
		
		if (session === null || typeof session.getEnemyList === 'undefined') {
			obj = StructureBuilder.buildDataList();
			obj.setDataArray([]);
			return obj;
		}
		
		return session.getEnemyList();
	}
}

class AllyList {

	static getAliveList() {
		return AllUnitList.getAliveList(this.getMainList());
	}

	static getAliveDefaultList() {
		return AllUnitList.getAliveDefaultList(this.getMainList());
	}

	static getDeathList() {
		return AllUnitList.getDeathList(this.getMainList());
	}

	static getMainList() {
		var obj;
		var session = root.getCurrentSession();
		
		if (session === null || typeof session.getAllyList === 'undefined') {
			obj = StructureBuilder.buildDataList();
			obj.setDataArray([]);
			return obj;
		}
		
		return session.getAllyList();
	}
}

class TurnControl {

	static turnEnd() {
		// There is a possibility to be called from the event, call getBaseScene, not getCurrentScene.
		if (root.getBaseScene() === SceneType.FREE) {
			if (root.getCurrentSession().getTurnType() === TurnType.PLAYER) {
				SceneManager.getActiveScene().getTurnObject().clearTurnTargetUnit();
			}
			
			SceneManager.getActiveScene().turnEnd();
		}
		
		this._doEndAction();
	}

	static getActorList() {
		var list = null;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			list = PlayerList.getSortieList();
		}
		else if (turnType === TurnType.ENEMY) {
			list = EnemyList.getAliveList();
		}
		else if (turnType === TurnType.ALLY) {
			list = AllyList.getAliveList();
		}
		
		return list;
	}

	static getTargetList() {
		var list = null;
		var turnType = root.getCurrentSession().getTurnType();
		
		if (turnType === TurnType.PLAYER) {
			list = EnemyList.getAliveList();
		}
		else if (turnType === TurnType.ENEMY) {
			list = PlayerList.getSortieList();
		}
		else if (turnType === TurnType.ALLY) {
			list = EnemyList.getAliveList();
		}
		
		return list;
	}

	static _doEndAction() {
		MapLayer.getUnitRangePanel().setUnit(null);
		MapLayer.getUnitRangePanel().setRepeatUnit(null);
	}
}

class FilterControl {

	static getNormalFilter(unitType?) {
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ALLY;
		}
		
		return filter;
	}

	static getReverseFilter(unitType?) {
		var filter = 0;
		
		if (unitType === UnitType.PLAYER) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (unitType === UnitType.ENEMY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
		}
		else if (unitType === UnitType.ALLY) {
			filter = UnitFilterFlag.ENEMY;
		}
		
		return filter;
	}

	static getBestFilter(unitType?, filterFlag?) {
		var newFlag = 0;
		
		if (unitType === UnitType.ENEMY) {
			if (filterFlag & UnitFilterFlag.PLAYER) {
				newFlag |= UnitFilterFlag.ENEMY;
			}
			if (filterFlag & UnitFilterFlag.ENEMY) {
				newFlag |= UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
			}
			
			filterFlag = newFlag;
		}
		
		return filterFlag;
	}

	static getListArray(filter?) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getSortieList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}
		
		return listArray;	
	}

	static getAliveListArray(filter?) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getAliveList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getAliveList());
		}
		
		return listArray;	
	}

	static getDeathListArray(filter?) {
		var listArray = [];
		
		if (filter & UnitFilterFlag.PLAYER) {
			listArray.push(PlayerList.getDeathList());
		}
		
		if (filter & UnitFilterFlag.ENEMY) {
			listArray.push(EnemyList.getDeathList());
		}
		
		if (filter & UnitFilterFlag.ALLY) {
			listArray.push(AllyList.getDeathList());
		}
		
		return listArray;	
	}

	static isUnitTypeAllowed(unit?, targetUnit?) {
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.PLAYER;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.ALLY;
		}
		
		return false;
	}

	static isReverseUnitTypeAllowed(unit?, targetUnit?) {
		var unitType = unit.getUnitType();
		var targetUnitType = targetUnit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			return targetUnitType === UnitType.ENEMY;
		}
		else if (unitType === UnitType.ENEMY) {
			return targetUnitType === UnitType.PLAYER || targetUnitType === UnitType.ALLY;
		}
		else if (unitType === UnitType.ALLY) {
			return targetUnitType === UnitType.ENEMY;
		}
		
		return false;
	}

	static isBestUnitTypeAllowed(unitType?, targetUnitType?, filterFlag?) {
		filterFlag = this.getBestFilter(unitType, filterFlag);
		
		if ((filterFlag & UnitFilterFlag.PLAYER) && (targetUnitType === UnitType.PLAYER)) {
			return true;
		}
		
		if ((filterFlag & UnitFilterFlag.ALLY) && (targetUnitType === UnitType.ALLY)) {
			return true;
		}
		
		if ((filterFlag & UnitFilterFlag.ENEMY) && (targetUnitType === UnitType.ENEMY)) {
			return true;
		}
		
		return false;
	}
}

class SimulationBlockerControl {

	static isCustomFilterApplicable(unit?) {
		var i, count;
		var arr = [];
		var groupArray = [];
		
		this._configureBlockerRule(arr);
		
		count = arr.length;
		for (i = 0; i < count; i++) {
			if (arr[i].isRuleApplicable(unit)) {
				// Only objects that apply to the rules are consolidated into a separate array.
				groupArray.push(arr[i]);
			}
		}
		
		if (groupArray.length > 0) {
			this._scanUnitList(unit, groupArray);
			return true;
		}
		
		return false;
	}

	
	// All enemies will be treated as walls if UnitFilterFlag.ENEMY is returned by ScriptCall_GetSimulationFilterFlag,
	// but sometimes it is necessary to decide which enemy is a wall individually.
	// If UnitFilterFlag.OPTIONAL is returned from this function,
	// only units set with UnitFilterFlag.OPTIONAL will be treated as walls. 
	static getCustomFilter(unit?) {
		return UnitFilterFlag.OPTIONAL;
	}

	static getDefaultFilter(unit?) {
		return FilterControl.getReverseFilter(unit.getUnitType());
	}

	static _scanUnitList(unit?, groupArray?) {
		var i, j, count, list, targetUnit;
		var filter = this._getScanFilter(unit);
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (unit === targetUnit) {
					continue;
				}
				
				if (this._isTargetBlocker(unit, targetUnit, groupArray)) {
					this._registerAsBlocker(unit, targetUnit, groupArray);
				}
			}
		}
	}

	static _isTargetBlocker(unit?, targetUnit?, groupArray?) {
		var i;
		var count = groupArray.length;
		
		for (i = 0; i < count; i++) {
			if (groupArray[i].isTargetBlocker(unit, targetUnit)) {
				return true;
			}
		}
		
		return false;
	}

	static _registerAsBlocker(unit?, targetUnit?, groupArray?) {
		// targetUnit will be treated as a wall by setting UnitFilterFlag.OPTIONAL.
		targetUnit.setOptionalFilterFlag(UnitFilterFlag.OPTIONAL);
	}

	static _getScanFilter(unit?) {
		return UnitFilterFlag.PLAYER | UnitFilterFlag.ENEMY | UnitFilterFlag.ALLY;
		
		// The following code can be used if there is no intention of treating friends (player and ally units for player) as walls.
		// In this instance, only the opposing force would be scanned, so the _scanUnitList loop would get shorter.
		// Evaluating whether the unit is a friend in isTargetBlocker would also be unnecessary.
		// return this.getDefaultFilter(unit);
	}

	static _configureBlockerRule(groupArray?) {
	}
}

class BaseBlockerRule extends BaseObject {

	isRuleApplicable(unit?) {
		// Checks whether the unit has the ability to individually treat targets as walls.
		return false;
	}

	isTargetBlocker(unit?, targetUnit?) {
		// If true is returned from this function, targetUnit is treated as a wall.
		return false;
	}
}

class SimulationCostControl {

	static initCostObjectArray(unit?) {
		var i, count, obj;
		var costObjectArray = [];
		var groupArray = [];
		
		this._configureCostRule(groupArray);
		
		count = groupArray.length;
		for (i = 0; i < count; i++) {
			obj = groupArray[i].getCostObject(unit);
			if (obj !== null) {
				costObjectArray.push(obj);
			}
		}
		
		return costObjectArray;
	}

	static combineCostObjectArray(unit?, costObjectArray?) {
		var i, count, obj, cost;
		var lastArray = [];
		
		count = costObjectArray.length;
		for (i = 0; i < count; i++) {
			// Costs with the same key are combined into one.
			this._combineCost(lastArray, costObjectArray[i]);
		}
		
		count = lastArray.length;
		for (i = 0; i < count; i++) {
			obj = lastArray[i];
			
			// If the cost exceeds the maximum value, then assign the maximum value.
			cost = this._getMaxCost(obj);
			if (obj.cost > cost) {
				obj.cost = cost;
			}
		}
		
		return lastArray;
	}

	static _combineCost(lastArray?, obj?) {
		var i;
		var count = lastArray.length;
		
		for (i = 0; i < count; i++) {
			if (lastArray[i].key === obj.key) {
				lastArray[i].cost += obj.cost;
				break;
			}
		}
		
		if (i === count) {
			lastArray.push(obj)
		}
	}

	static _getMaxCost(obj?) {
		return 2;
	}

	static _configureCostRule(groupArray?) {
	}
}

class BaseCostRule extends BaseObject {

	getCostObject(unit?) {
		var obj: any = {};
		
		// The return value must always be in this format; the MapSimulator object assumes this format.
		obj.key = '';
		obj.cost = 1;
		
		return obj;
	}
}
