
// To create AI means to create object inherit 3 objects of BaseCombinationCollector,
// BaseAIScorer, and BaseAutoAction.
// For instance, to combine AI to use command type skill,
// CombinationCollector.Skill, AIScorer.Skill, and SkillAutoAction exist.

class BaseCombinationCollector extends BaseObject {

	collectCombination(misc?) {
	}

	_setUnitRangeCombination(misc?, filter?, rangeMetrics?) {
		var i, j, indexArray, list, targetUnit, targetCount, score, combination, aggregation;
		var unit = misc.unit;
		var filterNew = this._arrangeFilter(unit, filter);
		var listArray = this._getTargetListArray(filterNew, misc);
		var listCount = listArray.length;
		
		if (misc.item !== null && !misc.item.isWeapon()) {
			aggregation = misc.item.getTargetAggregation();
		}
		else if (misc.skill !== null) {
			aggregation = misc.skill.getTargetAggregation();
		}
		else {
			aggregation = null;
		}
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			targetCount = list.getCount();
			for (j = 0; j < targetCount; j++) {
				targetUnit = list.getData(j);
				if (unit === targetUnit) {
					continue;
				}
				
				if (!this._isTargetAllowed(aggregation, targetUnit)) {
					continue;
				}
				
				score = this._checkTargetScore(unit, targetUnit);
				if (score < 0) {
					continue;
				}
				
				// Calculate a series of ranges based on the current position of targetUnit (not myself, but the opponent).
				indexArray = IndexArray.createRangeIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), rangeMetrics);
				
				misc.targetUnit = targetUnit;
				misc.indexArray = indexArray;
				misc.rangeMetrics = rangeMetrics;
				
				// Get an array to store the position to move from a series of ranges.
				misc.costArray = this._createCostArray(misc);
				
				if (misc.costArray.length !== 0) {
					// There is a movable position, so create a combination.
					combination = this._createAndPushCombination(misc);
					combination.plusScore = score;
				}
			}
		}
	}

	_setPlaceRangeCombination(misc?, filter?, rangeMetrics?) {
		var i, x, y, event, indexArray, combination, flag, placeInfo;
		var list = root.getCurrentSession().getPlaceEventList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			if (event.getExecutedMark() === EventExecutedType.EXECUTED || !event.isEvent()) {
				continue;
			}
			
			placeInfo = event.getPlaceEventInfo();
			flag = placeInfo.getPlaceEventFilterFlag();
			if (!(flag & filter)) {
				continue;
			}
			
			x = placeInfo.getX();
			y = placeInfo.getY();
			indexArray = IndexArray.createRangeIndexArray(x, y, rangeMetrics);
			
			misc.targetUnit = null;
			misc.indexArray = indexArray;
			misc.rangeMetrics = rangeMetrics;
			
			misc.costArray = this._createCostArray(misc);
			if (misc.costArray.length !== 0) {
				// There is a movable position, so create a combination.
				combination = this._createAndPushCombination(misc);
				combination.targetPos = createPos(x, y);
				// Aim the place event in a priority.
				combination.isPriority = true;
			}
		}
	}

	_setSingleRangeCombination(misc?) {
		var aggregation;
		
		if (misc.item !== null && !misc.item.isWeapon()) {
			aggregation = misc.item.getTargetAggregation();
		}
		else if (misc.skill !== null) {
			aggregation = misc.skill.getTargetAggregation();
		}
		else {
			aggregation = null;
		}
		
		// If the single item is set for the "Fixed Targets", decide if it's available to use for myself.
		if (aggregation !== null && !aggregation.isCondition(misc.unit)) {
			return;
		}
		
		misc.targetUnit = misc.unit;
		misc.indexArray = misc.simulator.getSimulationIndexArray();
		misc.rangeMetrics = StructureBuilder.buildRangeMetrics();
		misc.costArray = this._createCostArray(misc);
		this._createAndPushCombination(misc);
	}

	_setPlaceKeyCombination(misc?, obj?, keyFlag?) {
		var rangeMetrics, rangeValueGate, rangeTypeGate, rangeValueTreasure, rangeTypeTreasure;
		
		if (KeyEventChecker.isPairKey(obj)) {
			rangeValueGate = 1;
			rangeTypeGate = SelectionRangeType.MULTI;
			rangeValueTreasure = 0;
			rangeTypeTreasure = SelectionRangeType.SELFONLY;
		}
		else {
			rangeValueGate = obj.getRangeValue();
			rangeTypeGate = obj.getRangeType();
			rangeValueTreasure = obj.getRangeValue();
			rangeTypeTreasure = obj.getRangeType();
		}
		
		if (keyFlag & KeyFlag.GATE) {
			rangeMetrics = StructureBuilder.buildRangeMetrics();
			rangeMetrics.endRange = rangeValueGate;
			rangeMetrics.rangeType = rangeTypeGate;
			this._setPlaceRangeCombination(misc, PlaceEventFilterFlag.GATE, rangeMetrics);
		}
		
		if (keyFlag & KeyFlag.TREASURE) {
			rangeMetrics = StructureBuilder.buildRangeMetrics();
			rangeMetrics.endRange = rangeValueTreasure;
			rangeMetrics.rangeType = rangeTypeTreasure;
			this._setPlaceRangeCombination(misc, PlaceEventFilterFlag.TREASURE, rangeMetrics);
		}
	}

	_getTargetListArray(filter?, misc?) {
		var i, unit, arr, count, flag, list;
		
		if (misc.blockList === null) {
			return FilterControl.getListArray(filter);
		}
		
		arr = [];
		count = misc.blockList.getCount();
		for (i = 0; i < count; i++) {
			unit = misc.blockList.getData(i);
			flag = FilterControl.getNormalFilter(unit.getUnitType());
			if (flag & filter) {
				arr.push(unit);
			}
		}
		
		list = StructureBuilder.buildDataList();
		list.setDataArray(arr);
		
		return [list];
	}

	_arrangeFilter(unit?, filter?) {
		// If it's "Berserk" state, the opponent becomes opposite.
		if (!StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return filter;
		}
		
		if (filter & UnitFilterFlag.PLAYER) {
			filter = UnitFilterFlag.ENEMY;
		}
		else if (filter & UnitFilterFlag.ENEMY) {
			filter = UnitFilterFlag.PLAYER | UnitFilterFlag.ALLY;
		}
		else if (filter & UnitFilterFlag.ALLY) {
			filter = UnitFilterFlag.ENEMY;
		}
		
		return filter;
	}

	_createCostArray(misc?) {
		var i;
		var simulator = misc.simulator;
		var count = misc.indexArray.length;
		
		misc.costArray = [];
			
		if (count === CurrentMap.getSize()) {
			count = simulator.getLoopCount();
			for (i = 0; i < count; i++) {
				misc.posIndex = simulator.getPosIndexFromLoopIndex(i);
				misc.movePoint = simulator.getMovePointFromLoopIndex(i);
				this._createCostArrayInternal(misc);
			}
		}
		else {
			for (i = 0; i < count; i++) {
				misc.posIndex = misc.indexArray[i];
				misc.movePoint = simulator.getSimulationMovePoint(misc.posIndex);
				this._createCostArrayInternal(misc);
			}
		}
		
		return misc.costArray;
	}

	_createCostArrayInternal(misc?) {
		var x, y, posUnit;
		var posIndex = misc.posIndex;
		var movePoint = misc.movePoint;
		
		if (movePoint === AIValue.MAX_MOVE) {
			return;
		}
		
		x = CurrentMap.getX(posIndex);
		y = CurrentMap.getY(posIndex);
		if (misc.isForce) {
			this._createAndPushCost(misc);
		}
		else {
			// There is a possibility that the player exists at the position (the player is processed to be passable).
			// So check if the unit who is not myself exists.
			posUnit = PosChecker.getUnitFromPos(x, y);
			if (posUnit === null || posUnit === misc.unit) {
				// Create the cost because it can move to this position.
				// The cost includes a target position to move and necessary steps to move.
				this._createAndPushCost(misc);
			}
			else {
				this._createAndPushCostUnused(misc);
			}
		}
	}

	_createAndPushCost(misc?) {
		var costData = StructureBuilder.buildCostData();
		
		costData.posIndex = misc.posIndex;
		costData.movePoint = misc.movePoint;
		misc.costArray.push(costData);
	}

	_createAndPushCostUnused(misc?) {
		var costData = StructureBuilder.buildCostData();
		
		costData.posIndex = misc.posIndex;
		costData.movePoint = misc.movePoint;
		misc.costArrayUnused.push(costData);
	}

	_createAndPushCombination(misc?) {
		var item = misc.item;
		var skill = misc.skill;
		var targetUnit = misc.targetUnit;
		var combination = StructureBuilder.buildCombination();
		
		if (misc.isForce) {
			item = null;
			skill = null;
			targetUnit = null;
		}
		
		// Set with which item to act.
		combination.item = item;
		
		// Set with which skill to act.
		combination.skill = skill;
		
		// Set for which unit to act (for instance, attack or recovery).
		combination.targetUnit = targetUnit;
		
		// Set in which position is used (for instance, position to use the item).
		combination.targetPos = null;
		
		combination.rangeMetrics = misc.rangeMetrics;
		
		// An array to store the cost.
		combination.costArray = misc.costArray;
		
		// Set with which route to go through for a goal.
		combination.cource = [];
		
		// The following 2 correct values are decided with def object.
		// At this time, set 0 as a dummy because cannot decide at this time.
		
		// Set in which position to act.
		combination.posIndex = 0;
		
		// How many steps are needed to move the position of index.
		combination.movePoint = 0;
		
		combination.simulator = misc.simulator;
		
		misc.combinationArray.push(combination);
		
		return combination;
	}

	_isTargetAllowed(aggregation?, targetUnit?) {
		if (aggregation !== null && !aggregation.isCondition(targetUnit)) {
			return false;
		}
		
		return !targetUnit.isInvisible();
	}

	_checkTargetScore(unit?, targetUnit?) {
		var score = 0;
		var pattern = unit.getAIPattern();
		var type = pattern.getLockonType();
		var isCondition = pattern.isUnitCondition(targetUnit) || pattern.isDataCondition(targetUnit);
		
		if (type === LockonType.INCLUDE) {
			if (isCondition) {
				return 1000;
			}
			
			score = -1;
		}
		else if (type === LockonType.PRIORITY) {
			if (isCondition) {
				return 700;
			}
		}
		else if (type === LockonType.EXCLUDE) {
			if (isCondition) {
				return -1;
			}
		}
		
		return score;
	}
}

namespace CombinationCollector {
export class Weapon extends BaseCombinationCollector {

	collectCombination(misc?) {
		var i, weapon, filter, rangeMetrics;
		var unit = misc.unit;
		var itemCount = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < itemCount; i++) {
			weapon = UnitItemControl.getItem(unit, i);
			if (weapon === null) {
				continue;
			}
			
			// If it's not a weapon, or cannot equip with a weapon, don't continue.
			if (!weapon.isWeapon() || !this._isWeaponEnabled(unit, weapon, misc)) {
				continue;
			}
			
			misc.item = weapon;
			
			rangeMetrics = StructureBuilder.buildRangeMetrics();
			rangeMetrics.startRange = weapon.getStartRange();
			rangeMetrics.endRange = weapon.getEndRange();
			
			filter = this._getWeaponFilter(unit);
			this._checkSimulator(misc);
			this._setUnitRangeCombination(misc, filter, rangeMetrics);
		}
	}

	_checkSimulator(misc?) {
	}

	_getWeaponFilter(unit?) {
		return FilterControl.getReverseFilter(unit.getUnitType());
	}

	_isWeaponEnabled(unit?, item?, misc?) {
		if (misc.disableFlag & AIDisableFlag.WEAPON) {
			return false;
		}
		
		return ItemControl.isWeaponAvailable(unit, item);
	}
}

export class Item extends BaseCombinationCollector {

	collectCombination(misc?) {
		var i, item, filter, obj, actionTargetType;
		var unit = misc.unit;
		var itemCount = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < itemCount; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item === null) {
				continue;
			}
			
			// Don't continue if it's not an item or cannot use the item.
			if (item.isWeapon() || !this._isItemEnabled(unit, item, misc)) {
				continue;
			}
			
			obj = ItemPackageControl.getItemAIObject(item);
			if (obj === null) {
				continue;
			}
			
			// It depends on the item about what the item is used for.
			// The recovery item is used for the specific unit, but if it's a key, it's used a specific place. 
			actionTargetType = obj.getActionTargetType(unit, item);
			
			misc.item = item;
			misc.actionTargetType = actionTargetType;
			
			this._setCombination(misc);
		}
	}

	_setCombination(misc?) {
		var actionTargetType = misc.actionTargetType;
		
		if (actionTargetType === ActionTargetType.UNIT) {
			this._setUnitCombination(misc);
		}
		else if (actionTargetType === ActionTargetType.SINGLE) {
			this._setSingleRangeCombination(misc);
		}
		else if (actionTargetType === ActionTargetType.KEY) {
			this._setKeyCombination(misc);
		}
		else if (actionTargetType === ActionTargetType.ENTIRERECOVERY) {
			this._setEntireRecoveryCombination(misc);
		}
		else if (actionTargetType === ActionTargetType.RESURRECTION) {
			this._setResurrectionCombination(misc);
		}
	}

	_setUnitCombination(misc?) {
		var filter, rangeValue, rangeType, rangeMetrics;
		var unit = misc.unit;
		var item = misc.item;
		var obj = ItemPackageControl.getItemAIObject(item);
		
		if (obj === null) {
			return;
		}
		
		filter = obj.getUnitFilter(unit, item);
		
		obj = this._getRangeObjectInternal(item);
		
		rangeMetrics = StructureBuilder.buildRangeMetrics();
		rangeMetrics.endRange = obj.rangeValue;
		rangeMetrics.rangeType = obj.rangeType;
			
		this._setUnitRangeCombination(misc, filter, rangeMetrics);
	}

	_setKeyCombination(misc?) {
		this._setPlaceKeyCombination(misc, misc.item, misc.item.getKeyInfo().getKeyFlag());
	}

	_setEntireRecoveryCombination(misc?) {
		misc.targetUnit = null;
		
		misc.indexArray = misc.simulator.getSimulationIndexArray();
		misc.rangeMetrics = StructureBuilder.buildRangeMetrics();
		misc.costArray = this._createCostArray(misc);
		this._createAndPushCombination(misc);
	}

	_setResurrectionCombination(misc?) {
		var i, targetUnit, indexArray, score, combination;
		var arr = ResurrectionControl.getTargetArray(misc.unit, misc.item);
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			targetUnit = arr[i];
			if (misc.unit === targetUnit) {
				continue;
			}
			
			score = this._checkTargetScore(misc.unit, targetUnit);
			if (score < 0) {
				continue;
			}
			
			indexArray = misc.simulator.getSimulationIndexArray();
			
			misc.indexArray = indexArray;
			misc.targetUnit = targetUnit;
			misc.costArray = this._createCostArray(misc);
			combination = this._createAndPushCombination(misc);
			combination.plusScore = score;
		}
	}

	_isItemEnabled(unit?, item?, misc?) {
		if (misc.disableFlag & AIDisableFlag.ITEM) {
			return false;
		}
		
		// At the AI, don't use ItemPackageControl.getItemAvailabilityObject.
		return ItemControl.isItemUsable(unit, item);
	}

	_getRangeObjectInternal(item?) {
		var obj = ItemRangeControl.getRangeObject(item);
		
		if (item.getItemType() === ItemType.QUICK && obj.rangeType === SelectionRangeType.SELFONLY) {
			// Even if the scope is set to single, it is treated as range 1.
			obj.rangeValue = 1;
			obj.rangeType = SelectionRangeType.MULTI;
		}
		
		return obj;
	}
}

export class Skill extends BaseCombinationCollector {

	collectCombination(misc?) {
		var i, skillEntry, skill;
		var unit = misc.unit;
		var arr = SkillControl.getSkillMixArray(unit, null, -1, '');
		var count = arr.length;
		
		// Weapon skill is not included in arr.
		for (i = 0; i < count; i++) {
			skillEntry = arr[i];
			if (!this._isSkillEnabled(unit, skillEntry.skill, misc)) {
				continue;
			}
			
			misc.skill = skillEntry.skill;
			this._setCombination(misc);
		}
	}

	_setCombination(misc?) {
		var skillType = misc.skill.getSkillType();
		
		if (skillType === SkillType.STEAL) {
			this._setStealCombination(misc);
		}
		else if (skillType === SkillType.QUICK) {
			this._setQuickCombination(misc);
		}
		else if (skillType === SkillType.PICKING) {
			this._setPickingCombination(misc);
		}
		else if (skillType === SkillType.METAMORPHOZE) {
			this._setMetamorphozeCombination(misc);
		}
	}

	_setStealCombination(misc?) {
		var filter = FilterControl.getReverseFilter(misc.unit.getUnitType());
		
		this._setUnitCombination(misc, filter);
	}

	_setQuickCombination(misc?) {
		var filter = FilterControl.getNormalFilter(misc.unit.getUnitType());
		
		this._setUnitCombination(misc, filter);
	}

	_setPickingCombination(misc?) {
		this._setPlaceKeyCombination(misc, misc.skill, misc.skill.getSkillValue());
	}

	_setMetamorphozeCombination(misc?) {
		this._setSingleRangeCombination(misc);
	}

	_setUnitCombination(misc?, filter?) {
		var rangeMetrics;
		var skill = misc.skill;
		
		rangeMetrics = StructureBuilder.buildRangeMetrics();
		rangeMetrics.endRange = skill.getRangeValue();
		rangeMetrics.rangeType = skill.getRangeType();
			
		this._setUnitRangeCombination(misc, filter, rangeMetrics);
	}

	_isSkillEnabled(unit?, skill?, misc?) {
		if (misc.disableFlag & AIDisableFlag.SKILL) {
			return false;
		}
		
		return true;
	}
}
}


//------------------------------------------------------


// Create a table of enemy units that will take an action on enemy phase and any support information they have.
class AIFirstStage_UnitSupportStatusTable {

	static _table: any = [];

	static resetTable() {
		this._table = [];
	}

	static registerUnit(unit?) {
		var i;
		var length = this._table.length;
		
		// Check whether all enemy AI should take supports into account or not.
		if (!this._isSupportStatusAllowed()) {
			return;
		}
		
		// Check whether the current enemy unit should take supports affecting themselves into account.
		if (!this._isUnitAllowed(unit)) {
			return;
		}
		
		for (i = 0; i < length; i++) {
			if (this._table[i].unit === unit) {
				break;
			}
		}
		
		if (i === length) {
			var obj: any = {};
			obj.unit = unit;
			obj.totalStatus = this._createStatus(unit);
			this._table.push(obj);
		}
	}

	static getTotalStatus(unit?) {
		var i;
		var status = null;
		var length = this._table.length;
		
		for (i = 0; i < length; i++) {
			if (this._table[i].unit === unit) {
				status = this._table[i].totalStatus;
				break;
			}
		}
		
		return status;
	}

	static getAvoidScore(unit?) {
		var i, count, obj;
		var score = 0;
		var totalStatus = this.getTotalStatus(unit);
		
		if (totalStatus === null) {
			return score;
		}
		
		count = totalStatus.avoidArray.length;
		for (i = 0; i < count; i++) {
			obj = totalStatus.avoidArray[i];
			if (IndexArray.findUnit(obj.indexArray, unit)) {
				score = obj.avoid;
			}
		}
		
		return score;
	}

	static _createStatus(unit?) {
		var totalStatus: any = {};
		
		totalStatus.powerTotal = 0;
		totalStatus.defenseTotal = 0;
		totalStatus.hitTotal = 0;
		totalStatus.avoidTotal = 0;
		totalStatus.criticalTotal = 0;
		totalStatus.criticalAvoidTotal = 0;
		totalStatus.avoidArray = [];
		
		// Perform a check to see if units have support skills that target themselves.
		this._checkSelfSupportSkill(unit, totalStatus);
		
		// Perform a check to see if there is an enemy with support skills (possibly covering the entire map).
		this._checkFriendSupportSkill(unit, totalStatus);
		
		return totalStatus;
	}

	static _checkSelfSupportSkill(unit?, totalStatus?) {
		var i, skill;
		var temporaryWeapon = UnitItemControl.getItem(unit, 0);
		var arr = SkillControl.getSkillMixArray(unit, temporaryWeapon, SkillType.SUPPORT, '');
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			if (skill.getRangeType() === SelectionRangeType.SELFONLY) {
				this._addStatus(totalStatus, skill.getSupportStatus());
			}
		}
	}

	static _checkFriendSupportSkill(unit?, totalStatus?) {
		var i, j, list, count, targetUnit;
		var listArray = SupportCalculator._getListArray(unit);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (unit === targetUnit) {
					continue;
				}
				this._checkFriendSupportSkillInternal(targetUnit, unit, totalStatus);
			}
		}
	}

	static _checkFriendSupportSkillInternal(unit?, targetUnit?, totalStatus?) {
		var i, skill, isSet, indexArray, rangeType;
		var arr = SkillControl.getDirectSkillArray(unit, SkillType.SUPPORT, '');
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			isSet = false;
			indexArray = [];
			
			rangeType = skill.getRangeType();
			if (rangeType === SelectionRangeType.ALL) {
				isSet = true;
			}
			else if (rangeType === SelectionRangeType.MULTI) {
				indexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, skill.getRangeValue());
				isSet = IndexArray.findUnit(indexArray, targetUnit);
			}
			
			if (isSet && SupportCalculator._isSupportable(unit, targetUnit, skill)) {
				this._addAvoidArray(totalStatus, skill, indexArray);
				this._addStatus(totalStatus, skill.getSupportStatus());
			}
		}
	}

	static _addAvoidArray(totalStatus?, skill?, indexArray?) {
		var supportStatus, avoid, obj;
		
		if (indexArray.length === 0) {
			return;
		}
		
		supportStatus = skill.getSupportStatus();
		avoid = supportStatus.getAvoid();
		if (avoid === 0) {
			return;
		}
		
		obj = {};
		obj.indexArray = indexArray;
		obj.avoid = avoid;
		
		totalStatus.avoidArray.push(obj);
	}

	static _addStatus(totalStatus?, supportStatus?) {
		totalStatus.powerTotal += supportStatus.getPower();
		totalStatus.defenseTotal += supportStatus.getDefense();
		totalStatus.hitTotal += supportStatus.getHit();
		totalStatus.avoidTotal += supportStatus.getAvoid();
		totalStatus.criticalTotal += supportStatus.getCritical();
		totalStatus.criticalAvoidTotal += supportStatus.getCriticalAvoid();
	}

	static _isSupportStatusAllowed() {
		// Returning false means support skill checks are not performed, so processing is faster.
		return DataConfig.isAISupportStatusAllowed();
	}

	static _isUnitAllowed(unit?) {
		return true;
	}
}

// Create a table of targets (player and ally army units) that exist on enemy phase and the support information those targets possess.
// Normally, when Target A receives support from Target B and Target B is defeated, the support information that Target A receives should change,
// but it will remain the same.
class AIFirstStage_TargetUnitSupportStatusTable {

	static _table: any = [];

	static resetTable() {
		this._table = [];
	}

	static registerUnit(targetUnit?) {
		var i;
		var length = this._table.length;
		
		// Check whether enemy AI should take targets' supports into account.
		if (!this._isSupportStatusAllowed()) {
			return;
		}
		
		// Check whether this target's supports should be taken into account.
		if (!this._isUnitAllowed(targetUnit)) {
			return;
		}
		
		for (i = 0; i < length; i++) {
			if (this._table[i].targetUnit === targetUnit) {
				break;
			}
		}
		
		if (i === length) {
			var obj: any = {};
			obj.targetUnit = targetUnit;
			obj.totalStatus = this._createStatus(targetUnit);
			this._table.push(obj);
		}
	}

	static getTotalStatus(targetUnit?) {
		var i;
		var status = null;
		var length = this._table.length;
		
		for (i = 0; i < length; i++) {
			if (this._table[i].targetUnit === targetUnit) {
				status = this._table[i].totalStatus;
				break;
			}
		}
		
		return status;
	}

	static _createStatus(targetUnit?) {
		// On enemy phase, targets (player and ally army units) won't move from their current location, so calling the method below will suffice.
		return SupportCalculator.createTotalStatus(targetUnit);
	}

	static _isSupportStatusAllowed() {
		// Returning false means support skill checks are not performed, so processing is faster.
		return DataConfig.isAISupportStatusAllowed();
	}

	static _isUnitAllowed(targetUnit?) {
		// Ally Army units normally do not have supports set, so they are ignored.
		return targetUnit.getUnitType() === UnitType.PLAYER;
	}
}


//------------------------------------------------------


class BaseAIScorer extends BaseObject {

	getScore(unit?, combination?) {
		return 0;
	}

	_getPlusScore(unit?, combination?) {
		return combination.plusScore;
	}
}

namespace AIScorer {
export class Weapon extends BaseAIScorer {

	getScore(unit?, combination?) {
		var prevItemIndex;
		var score = 0;
		
		if (combination.item === null || !combination.item.isWeapon()) {
			return 0;
		}
		
		// Equip with combination.item temporarily.
		prevItemIndex = this._setTemporaryWeapon(unit, combination);
		if (prevItemIndex === -1) {
			return 0;
		}
		
		if (this._isScoreCalculationDisabled(unit, combination)) {
			this._resetTemporaryWeapon(unit, combination, prevItemIndex);
			return -1;
		}
		
		AIFirstStage_UnitSupportStatusTable.registerUnit(unit);
		AIFirstStage_TargetUnitSupportStatusTable.registerUnit(combination.targetUnit);
		
		score = this._getTotalScore(unit, combination);
		
		// Deactivate to equip with combination.item.
		this._resetTemporaryWeapon(unit, combination, prevItemIndex);
		
		if (score < 0) {
			return -1;
		}
		
		return score + this._getPlusScore(unit, combination);
	}

	_isScoreCalculationDisabled(unit?, combination?) {
		return false;
	}

	_getTotalScore(unit?, combination?) {
		var n;
		var score = 0;
		
		n = this._getDamageScore(unit, combination);
		if (n === 0 && !DataConfig.isAIDamageZeroAllowed()) {
			return -1;
		}
		score += n;
		
		n = this._getHitScore(unit, combination);
		if (n === 0 && !DataConfig.isAIHitZeroAllowed()) {
			return -1;
		}
		score += n;
		
		score += this._getCriticalScore(unit, combination);
		score += this._getStateScore(unit, combination);
		
		// If given damage is 7, the hit rate is 80 and the critical rate is 10, score is total 60.
		// 42 (7 * 6)
		// 16 (80 / 5)
		// 2 (10 / 5)
		// 6 is a return value of Miscellaneous.convertAIValue.
		
		return score;
	}

	_getDamageScore(unit?, combination?) {
		var damage;
		var score = 0;
		var hp = combination.targetUnit.getHp();
		var isDeath = false;
		
		damage = this._getDamage(unit, combination);
		
		hp -= damage;
		if (hp <= 0) {
			isDeath = true;
		}
		
		score = Miscellaneous.convertAIValue(damage);
		
		// Greatly increase the score if the target can be defeated.
		if (isDeath) {
			score += 50;
		}
		else {
			// Targets missing a larger portion of their HP are prioritized. Base score is 10.
			score += Math.floor(10 * (1 - (hp / ParamBonus.getMhp(combination.targetUnit))));
		}
		
		return score;
	}

	_getDamage(unit?, combination?) {
		var damage, roundAttackCount;
		var option = combination.item.getWeaponOption();
		
		if (option === WeaponOption.HPMINIMUM) {
			return combination.targetUnit.getHp() - 1;
		}
		
		damage = DamageCalculator.calculateDamage(unit, combination.targetUnit, combination.item, false, this._getSupportStatus(unit), this._getTargetSupportStatus(combination.targetUnit), 0);
		
		roundAttackCount = Calculator.calculateRoundCount(unit, combination.targetUnit, combination.item);
		roundAttackCount *= Calculator.calculateAttackCount(unit, combination.targetUnit, combination.item);
		damage *= roundAttackCount;
		
		return damage;
	}

	_getHitScore(unit?, combination?) {
		var hit = HitCalculator.calculateHit(unit, combination.targetUnit, combination.item, this._getSupportStatus(unit), this._getTargetSupportStatus(combination.targetUnit));
		
		if (hit === 0) {
			return 0;
		}
		
		// Lower the number if the hit rate is prioritized.
		return Math.ceil(hit / 5);
	}

	_getCriticalScore(unit?, combination?) {
		var crt = CriticalCalculator.calculateCritical(unit, combination.targetUnit, combination.item, this._getSupportStatus(unit), this._getTargetSupportStatus(combination.targetUnit));
		
		if (crt === 0) {
			return 0;
		}
		
		return Math.ceil(crt / 5);
	}

	_getStateScore(unit?, combination?) {
		var state = combination.item.getStateInvocation().getState();
		var score;
		var score;
		
		if (state === null) {
			return 0;
		}
		
		score = StateScoreChecker.getScore(unit, combination.targetUnit, state);
		if (score < 0) {
			return 0;
		}
		
		return score;
	}

	_setTemporaryWeapon(unit?, combination?) {
		var itemHead = UnitItemControl.getItem(unit, 0);
		var prevItemIndex = UnitItemControl.getIndexFromItem(unit, combination.item);
		
		UnitItemControl.setItem(unit, 0, combination.item);
		UnitItemControl.setItem(unit, prevItemIndex, itemHead);
		
		return prevItemIndex;
	}

	_resetTemporaryWeapon(unit?, combination?, prevItemIndex?) {
		var itemHead = UnitItemControl.getItem(unit, 0);
		var item = UnitItemControl.getItem(unit, prevItemIndex);
		
		UnitItemControl.setItem(unit, prevItemIndex, itemHead);
		UnitItemControl.setItem(unit, 0, item);
	}

	_getSupportStatus(unit?) {
		return AIFirstStage_UnitSupportStatusTable.getTotalStatus(unit);
	}

	_getTargetSupportStatus(targetUnit?) {
		return AIFirstStage_TargetUnitSupportStatusTable.getTotalStatus(targetUnit);
	}
}

export class Item extends BaseAIScorer {

	getScore(unit?, combination?) {
		var obj;
		var item = combination.item;
		var score = 0;
		
		if (item === null || item.isWeapon()) {
			return score;
		}
		
		obj = ItemPackageControl.getItemAIObject(item);
		if (obj === null) {
			return score;
		}
		
		score = obj.getItemScore(unit, combination);
		if (score < 0) {
			return -1;
		}
		
		return score + this._getPlusScore(unit, combination);
	}
}

export class Skill extends BaseAIScorer {

	getScore(unit?, combination?) {
		var obj;
		var skill = combination.skill;
		var score = 0;
		
		if (skill === null) {
			return score;
		}
		
		obj = this._getAIObject(unit, combination);
		if (obj === null) {
			return score;
		}
		
		score = obj.getItemScore(unit, combination);
		if (score < 0) {
			return -1;
		}
		
		return score + this._getPlusScore(unit, combination);
	}

	_getAIObject(unit?, combination?) {
		var obj;
		var skillType = combination.skill.getSkillType();
		
		if (skillType === SkillType.STEAL) {
			obj = StealItemAI;
		}
		else if (skillType === SkillType.QUICK) {
			obj = QuickItemAI;
		}
		else if (skillType === SkillType.PICKING) {
			obj = KeyItemAI;
		}
		else if (skillType === SkillType.METAMORPHOZE) {
			obj = MetamorphozeItemAI;
		}
		else {
			obj = null;
		}
		
		return createObject(obj);
	}
}

export class Counterattack extends BaseAIScorer {

	getScore(unit?, combination?) {
		var index, x, y;
		var score = 50;
		
		if (combination.item === null) {
			return 0;
		}
		
		if (!combination.item.isWeapon()) {
			// The unit attacks with item, not a weapon, so there is no possibility to receive counterattack.
			// According to the advantage, add the score.
			return score;
		}
		else {
			index = combination.posIndex;
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			
			if (AttackChecker.isCounterattackPos(unit, combination.targetUnit, x, y)) {
				// Don't add the score because the unit has a possibility to get counterattack by targetUnit.
				return 0;
			}
			
			return score;
		}	
	}
}

export class Avoid extends BaseAIScorer {

	getScore(unit?, combination?) {
		var score;
		var x = unit.getMapX();
		var y = unit.getMapY();
		var index = combination.posIndex;
		
		// Change the unit current position temporarily.
		unit.setMapX(CurrentMap.getX(index));
		unit.setMapY(CurrentMap.getY(index));
		
		// The avoid rate is score, so tend to move to the advantageous terrain.
		score = this._getBaseScore(unit, combination);
		
		score += this._plusScore(unit, combination);
		
		// If score is minus, don't act, so prevent it.
		if (score < 0) {
			score = 0;
		}
		
		unit.setMapX(x);
		unit.setMapY(y);
		
		return score;
	}

	_getBaseScore(unit?, combination?) {
		return AbilityCalculator.getAvoid(unit);
	}

	_plusScore(unit?, combination?) {
		return AIFirstStage_UnitSupportStatusTable.getAvoidScore(unit);
	}
}
}


//------------------------------------------------------


class BaseAutoAction extends BaseObject {

	setAutoActionInfo(unit?, combination?) {
	}

	enterAutoAction() {
		return EnterResult.NOTENTER;
	}

	moveAutoAction() {
		return MoveResult.END;
	}

	drawAutoAction() {
	}

	isSkipMode() {
		return CurrentMap.isTurnSkipMode();
	}

	isSkipAllowed() {
		return true;
	}
}

class WeaponAutoActionMode {

	static CURSORSHOW: any = 0;

	static PREATTACK: any = 1;
}

class WeaponAutoAction extends BaseAutoAction {
	_waitCounter: any;


	_unit: any = null;

	_targetUnit: any = null;

	_weapon: any = null;

	_preAttack: any = null;

	_autoActionCursor: any = null;

	setAutoActionInfo(unit?, combination?) {
		this._unit = unit;
		this._targetUnit = combination.targetUnit;
		this._weapon = combination.item;
		this._preAttack = createObject(PreAttack);
		this._waitCounter = createObject(CycleCounter);
		this._autoActionCursor = createObject(AutoActionCursor);
		
		ItemControl.setEquippedWeapon(this._unit, this._weapon);
	}

	enterAutoAction() {
		var isSkipMode = this.isSkipMode();
		
		if (isSkipMode) {
			if (this._enterAttack() === EnterResult.NOTENTER) {
				return EnterResult.NOTENTER;
			}
			
			this.changeCycleMode(WeaponAutoActionMode.PREATTACK);
		}
		else {
			this._changeCursorShow();
			this.changeCycleMode(WeaponAutoActionMode.CURSORSHOW);
		}
		
		return EnterResult.OK;
	}

	moveAutoAction() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === WeaponAutoActionMode.CURSORSHOW) {
			result = this._moveCursorShow();
		}
		else if (mode === WeaponAutoActionMode.PREATTACK) {
			result = this._movePreAttack();
		}
		
		return result;
	}

	drawAutoAction() {
		var mode = this.getCycleMode();
		
		if (mode === WeaponAutoActionMode.CURSORSHOW) {
			this._drawCurosrShow();
		}
		else if (mode === WeaponAutoActionMode.PREATTACK) {
			this._drawPreAttack();
		}
	}

	isSkipAllowed() {
		var mode = this.getCycleMode();
		
		if (mode === WeaponAutoActionMode.PREATTACK) {
			return false;
		}
	
		return true;
	}

	_moveCursorShow() {
		var isSkipMode = this.isSkipMode();
		
		if (isSkipMode || this._autoActionCursor.moveAutoActionCursor() !== MoveResult.CONTINUE) {
			if (isSkipMode) {
				this._autoActionCursor.endAutoActionCursor();
			}
			
			if (this._enterAttack() === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
		
			this.changeCycleMode(WeaponAutoActionMode.PREATTACK);
		}
		
		return MoveResult.CONTINUE;
	}

	_movePreAttack() {
		if (this._preAttack.movePreAttackCycle() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawCurosrShow() {
		this._autoActionCursor.drawAutoActionCursor();
	}

	_drawPreAttack() {
		this._preAttack.drawPreAttackCycle();
	}

	_changeCursorShow() {
		this._autoActionCursor.setAutoActionPos(this._targetUnit.getMapX(), this._targetUnit.getMapY(), true);
	}

	_enterAttack() {
		var attackParam = this._createAttackParam();
		
		return this._preAttack.enterPreAttackCycle(attackParam);
	}

	_createAttackParam() {
		var attackParam = StructureBuilder.buildAttackParam();
		
		attackParam.unit = this._unit;
		attackParam.targetUnit = this._targetUnit;
		attackParam.attackStartType = AttackStartType.NORMAL;
		
		return attackParam;
	}
}

class ItemAutoActionMode {

	static CURSORSHOW: any = 0;

	static ITEMUSE: any = 1;
}

class ItemAutoAction extends BaseAutoAction {

	_unit: any = null;

	_item: any = null;

	_targetUnit: any = null;

	_targetItem: any = null;

	_targetPos: any = null;

	_autoActionCursor: any = null;

	_itemUse: any = null;

	setAutoActionInfo(unit?, combination?) {
		this._unit = unit;
		this._item = combination.item;
		this._targetUnit = combination.targetUnit;
		this._targetItem = combination.targetItem;
		this._targetPos = combination.targetPos;
		this._autoActionCursor = createObject(AutoActionCursor);
		this._itemUse = ItemPackageControl.getItemUseParent(this._item);
	}

	enterAutoAction() {
		if (this.isSkipMode() || !this._isPosVisible()) {
			if (this._enterItemUse() === EnterResult.NOTENTER) {
				return EnterResult.NOTENTER;
			}
			
			this.changeCycleMode(ItemAutoActionMode.ITEMUSE);
		}
		else {
			if (this._targetPos !== null) {
				this._autoActionCursor.setAutoActionPos(this._targetPos.x, this._targetPos.y, false);
			}
			else {
				this._autoActionCursor.setAutoActionPos(this._targetUnit.getMapX(), this._targetUnit.getMapY(), false);
			}
			
			this.changeCycleMode(ItemAutoActionMode.CURSORSHOW);
		}
		
		return EnterResult.OK;
	}

	moveAutoAction() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === ItemAutoActionMode.CURSORSHOW) {
			result = this._moveCurosrShow();
		}
		else if (mode === ItemAutoActionMode.ITEMUSE) {
			result = this._moveItemUse();
		}
		
		return result;
	}

	drawAutoAction() {
		var mode = this.getCycleMode();
		
		if (mode === ItemAutoActionMode.CURSORSHOW) {
			this._drawCurosrShow();
		}
		else if (mode === ItemAutoActionMode.ITEMUSE) {
			this._drawItemUse();
		}
	}

	_moveCurosrShow() {
		if (this._autoActionCursor.moveAutoActionCursor() !== MoveResult.CONTINUE) {
			if (this._enterItemUse() === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
			
			this.changeCycleMode(ItemAutoActionMode.ITEMUSE);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveItemUse() {
		if (this._itemUse.moveUseCycle() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawCurosrShow() {
		this._autoActionCursor.drawAutoActionCursor();
	}

	_drawItemUse() {
		this._itemUse.drawUseCycle();
	}

	_enterItemUse() {
		var targetInfo = this._createItemTargetInfo();
		
		return this._itemUse.enterUseCycle(targetInfo);
	}

	_createItemTargetInfo() {
		var itemTargetInfo = StructureBuilder.buildItemTargetInfo();
		
		itemTargetInfo.unit = this._unit;
		itemTargetInfo.item = this._item;
		itemTargetInfo.targetUnit = this._targetUnit;
		itemTargetInfo.targetItem = this._targetItem;
		itemTargetInfo.targetPos = this._targetPos;
		
		return itemTargetInfo;
	}

	_isPosVisible() {
		if (this._targetPos === null) {
			// If revive the unit, isInvisible returns true.
			if (this._targetUnit === null || this._targetUnit.isInvisible()) {
				return false;
			}
			
			if (!MapView.isVisible(this._targetUnit.getMapX(), this._targetUnit.getMapY())) {
				// If it doesn't exist within a range of showing on the map, cannot see even if the position is displayed.
				return false;
			}
		}
		
		return true;
	}
}

class SkillAutoActionMode {

	static CURSORSHOW: any = 0;

	static SKILLUSE: any = 1;
}

class SkillAutoAction extends BaseAutoAction {
	// NOTE (JS->TS conversion): never assigned anywhere in the original codebase - only read.
	_isSkipMode: any = undefined;
	_dynamicEvent: any;
	_eventTrophy: any;


	_unit: any = null;

	_skill: any = null;

	_targetUnit: any = null;

	_targetItem: any = null;

	_targetPos: any = null;

	_targetMetamorphoze: any = null;

	_autoActionCursor: any = null;

	setAutoActionInfo(unit?, combination?) {
		this._unit = unit;
		this._skill = combination.skill;
		this._targetUnit = combination.targetUnit;
		this._targetItem = combination.targetItem;
		this._targetPos = combination.targetPos;
		this._targetMetamorphoze = combination.targetMetamorphoze;
		this._autoActionCursor = createObject(AutoActionCursor);
	}

	enterAutoAction() {
		if (this.isSkipMode()) {
			if (this._enterSkillUse() === EnterResult.NOTENTER) {
				return EnterResult.NOTENTER;
			}
			
			this.changeCycleMode(SkillAutoActionMode.SKILLUSE);
		}
		else {
			if (this._targetPos !== null) {
				this._autoActionCursor.setAutoActionPos(this._targetPos.x, this._targetPos.y, true);
			}
			else {
				this._autoActionCursor.setAutoActionPos(this._targetUnit.getMapX(), this._targetUnit.getMapY(), true);
			}
			
			this.changeCycleMode(SkillAutoActionMode.CURSORSHOW);
		}
		
		return EnterResult.OK;
	}

	moveAutoAction() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === SkillAutoActionMode.CURSORSHOW) {
			result = this._moveCurosrShow();
		}
		else if (mode === SkillAutoActionMode.SKILLUSE) {
			result = this._moveSkillUse();
		}
		
		return result;
	}

	drawAutoAction() {
		var mode = this.getCycleMode();
		
		if (mode === SkillAutoActionMode.CURSORSHOW) {
			this._drawCurosrShow();
		}
		else if (mode === SkillAutoActionMode.SKILLUSE) {
			this._drawSkillUse();
		}
	}

	_moveCurosrShow() {
		if (this._autoActionCursor.moveAutoActionCursor() !== MoveResult.CONTINUE) {
			if (this._enterSkillUse() === EnterResult.NOTENTER) {
				return MoveResult.END;
			}
			
			this.changeCycleMode(SkillAutoActionMode.SKILLUSE);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveSkillUse() {
		var result = MoveResult.CONTINUE;
		var skillType = this._skill.getSkillType();
		
		if (skillType === SkillType.STEAL) {
			result = this._dynamicEvent.moveDynamicEvent();
		}
		else if (skillType === SkillType.QUICK) {
			result = this._dynamicEvent.moveDynamicEvent();
		}
		else if (skillType === SkillType.PICKING) {
			result = this._eventTrophy.moveEventTrophyCycle();
		}
		else if (skillType === SkillType.METAMORPHOZE) {
			result = this._dynamicEvent.moveDynamicEvent();
		}
		
		return result;
	}

	_drawCurosrShow() {
		this._autoActionCursor.drawAutoActionCursor();
	}

	_drawSkillUse() {
		var skillType = this._skill.getSkillType();
		
		if (skillType === SkillType.PICKING) {
			this._eventTrophy.drawEventTrophyCycle();
		}
	}

	_enterSkillUse() {
		var result = EnterResult.NOTENTER;
		var skillType = this._skill.getSkillType();
		
		if (skillType === SkillType.STEAL) {
			result = this._enterSteal();
		}
		else if (skillType === SkillType.QUICK) {
			result = this._enterQuick();
		}
		else if (skillType === SkillType.PICKING) {
			result = this._enterPicking();
		}
		else if (skillType === SkillType.METAMORPHOZE) {
			result = this._enterMetamorphoze();
		}
		
		return result;
	}

	_enterSteal() {
		var generator;
		var pixelIndex = 3;
		var direction = PosChecker.getSideDirection(this._unit.getMapX(), this._unit.getMapY(), this._targetUnit.getMapX(), this._targetUnit.getMapY());
		var directionArray = [DirectionType.RIGHT, DirectionType.BOTTOM, DirectionType.LEFT, DirectionType.TOP];
		
		ItemControl.deleteItem(this._targetUnit, this._targetItem);
		UnitItemControl.pushItem(this._unit, this._targetItem);
		
		if (this._isSkipMode) {
			return EnterResult.NOTENTER;
		}
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		
		generator.unitSlide(this._unit, direction, pixelIndex, SlideType.START, this._isSkipMode);
		generator.soundPlay(this._getLostSoundHandle(), 1);
		generator.unitSlide(this._unit, directionArray[direction], pixelIndex, SlideType.START, this._isSkipMode);
		generator.unitSlide(this._unit, 0, 0, SlideType.END, this._isSkipMode);
		generator.messageTitle(this._targetItem.getName() + StringTable.ItemSteal, 0, 0, true);
		
		this._appendExperience(generator);
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_enterQuick() {
		var generator;
		var x = LayoutControl.getPixelX(this._targetUnit.getMapX());
		var y = LayoutControl.getPixelY(this._targetUnit.getMapY());
		var anime = root.queryAnime('quick');
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		
		generator.animationPlay(validateNull(anime), pos.x, pos.y, false, AnimePlayType.SYNC, 1);
		generator.unitStateChange(this._targetUnit, UnitStateChangeFlag.WAIT, 1);
		
		if (this._skill !== null && this._skill.getSkillValue() === QuickValue.SURROUNDINGS) {
			this._enterQuickInternal(generator, this._targetUnit);
		}
		
		this._appendExperience(generator);
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_enterQuickInternal(generator?, targetUnit?) {
		var i, x, y, sideUnit;
		var sx = targetUnit.getMapX();
		var sy = targetUnit.getMapY();
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			x = sx + XPoint[i];
			y = sy + YPoint[i];
		
			sideUnit = PosChecker.getUnitFromPos(x, y);
			if (sideUnit !== null && sideUnit.isWait()) {
				generator.unitStateChange(sideUnit, UnitStateChangeFlag.WAIT, 1);
			}
		}
	}

	_enterPicking() {
		var event = PosChecker.getKeyEvent(this._targetPos.x, this._targetPos.y, this._skill.getSkillValue());
		
		this._eventTrophy = createObject(EventTrophy);
		
		return this._eventTrophy.enterEventTrophyCycle(this._unit, event);
	}

	_enterMetamorphoze() {
		var generator;
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		
		generator.unitMetamorphoze(this._unit, this._targetMetamorphoze, MetamorphozeActionType.CHANGE, this._isSkipMode);
		
		this._appendExperience(generator);
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_appendExperience(generator?) {
		var exp;
		
		if (this._skill === null) {
			return;
		}
		
		// If the unit is a player, it can gain experience value even if it is in "Auto AI" state.
		exp = this._skill.getSkillSubValue();
		if (exp > 0 && this._unit.getUnitType() === UnitType.PLAYER) {
			generator.experiencePlus(this._unit, ExperienceCalculator.getBestExperience(this._unit, exp), false);
		}
	}

	_getLostSoundHandle() {
		return root.querySoundHandle('itemlost');
	}
}

class MoveAutoAction extends BaseAutoAction {

	_unit: any = null;

	_moveCource: any = null;

	_simulateMove: any = null;

	setAutoActionInfo(unit?, combination?) {
		this._unit = unit;
		this._moveCource = combination.cource;
		this._simulateMove = createObject(SimulateMove);
	}

	enterAutoAction() {
		var isSkipMode = this.isSkipMode();
		
		if (isSkipMode) {
			this._simulateMove.skipMove(this._unit, this._moveCource);
			return EnterResult.NOTENTER;
		}
		else {
			this._simulateMove.startMove(this._unit, this._moveCource);
		}
		
		return EnterResult.OK;
	}

	moveAutoAction() {
		// Check if it's in a skip state while moving.
		if (this.isSkipMode()) {
			// Skip move.
			this._simulateMove.skipMove(this._unit, this._moveCource);
			return MoveResult.END;
		}
		
		if (this._simulateMove.moveUnit() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawAutoAction() {
		this._simulateMove.drawUnit();
	}
}

class WaitAutoAction extends BaseAutoAction {

	_unit: any = null;

	_straightFlow: any = null;

	setAutoActionInfo(unit?, combination?) {
		this._unit = unit;
		this._straightFlow = createObject(StraightFlow);
	}

	enterAutoAction() {
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		if (!this.isSkipMode()) {
			MapLayer.getMarkingPanel().updateMarkingPanelFromUnit(this._unit);
		}
		
		return this._straightFlow.enterStraightFlow();
	}

	moveAutoAction() {
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawAutoAction() {
		this._straightFlow.drawStraightFlow();
	}

	
	// It's called by UnitWaitFlowEntry.
	getTurnTargetUnit() {
		return this._unit;
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(UnitWaitFlowEntry);
		straightFlow.pushFlowEntry(ReactionFlowEntry);
	}
}

class ScrollAutoAction extends BaseAutoAction {

	_unit: any = null;

	_moveCource: any = null;

	_mapLineScroll: any = null;

	_simulateMove: any = null;

	setAutoActionInfo(unit?, combination?) {
		this._unit = unit;
		this._moveCource = combination.cource;
		this._mapLineScroll = createObject(MapLineScroll);
		this._simulateMove = createObject(SimulateMove);
	}

	enterAutoAction() {
		this._mapLineScroll.startLineScroll(this._unit.getMapX(), this._unit.getMapY());
		
		return EnterResult.OK;
	}

	moveAutoAction() {
		if (this._mapLineScroll.moveLineScroll() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawAutoAction() {
	}
}

class AutoActionCursor extends BaseObject {

	_lockonCursor: any = null;

	setAutoActionPos(x?, y?, isScroll?) {
		this._lockonCursor = createObject(LockonCursor);
		this._lockonCursor.setPos(x, y);
		
		// When using the item, isScroll is false.
		if (isScroll) {
			if (!MapView.isVisible(x, y)) {
				// Scroll if the target position is out of screen.
				MapView.setScroll(x, y);
			}
		}
	}

	moveAutoActionCursor() {
		return this._lockonCursor.moveCursor();
	}

	drawAutoActionCursor() {
		this._lockonCursor.drawCursor();
	}

	endAutoActionCursor() {
		this._lockonCursor.endCursor();
	}
}
