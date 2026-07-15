
class IndexArray {

	static createIndexArray(x?, y?, item?) {
		var i, obj, rangeValue, rangeType, arr;
		var startRange = 1;
		var endRange = 1;
		var count = 1;
		
		if (item === null) {
			startRange = 1;
			endRange = 1;
		}
		else if (item.isWeapon()) {
			startRange = item.getStartRange();
			endRange = item.getEndRange();
		}
		else {
			obj = ItemRangeControl.getRangeObject(item);
			rangeValue = obj.rangeValue;
			rangeType = obj.rangeType;
			
			if (rangeType === SelectionRangeType.SELFONLY) {
				return [];
			}
			else if (rangeType === SelectionRangeType.MULTI) {
				endRange = rangeValue;
			}
			else if (rangeType === SelectionRangeType.ALL) {
				count = CurrentMap.getSize();
				
				arr = [];
				arr.length = count;
				for (i = 0; i < count; i++) {
					arr[i] = i;
				}
				
				return arr;
			}
		}
		
		return this.getBestIndexArray(x, y, startRange, endRange);
	}

	static createRangeIndexArray(x?, y?, rangeMetrics?) {
		var i, count, arr;
		
		if (rangeMetrics.rangeType === SelectionRangeType.SELFONLY) {
			return [CurrentMap.getIndex(x, y)];
		}
		else if (rangeMetrics.rangeType === SelectionRangeType.ALL) {
			count = CurrentMap.getSize();
			
			arr = [];
			arr.length = count;
			for (i = 0; i < count; i++) {
				arr[i] = i;
			}
			
			return arr;
		}
		
		return this.getBestIndexArray(x, y, rangeMetrics.startRange, rangeMetrics.endRange);
	}

	static getBestIndexArray(x?, y?, startRange?, endRange?) {
		var simulator = root.getCurrentSession().createMapSimulator();
		
		// If the scene is SceneType.REST, return null.
		if (simulator === null) {
			return [];
		}
		
		simulator.startSimulationRange(x, y, startRange, endRange);
		
		return simulator.getSimulationIndexArray();
	}

	static findUnit(indexArray?, targetUnit?) {
		var i, index, x, y;
		var count = indexArray.length;
		
		if (count === CurrentMap.getSize()) {
			return true;
		}
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (PosChecker.getUnitFromPos(x, y) === targetUnit) {
				return true;
			}
		}
		
		return false;
	}

	static findPos(indexArray?, xTarget?, yTarget?) {
		var i, index, x, y;
		var count = indexArray.length;
		
		if (count === CurrentMap.getSize()) {
			return true;
		}
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (x === xTarget && y === yTarget) {
				return true;
			}
		}
		
		return false;
	}
}

class ItemRangeControl {

	static getRangeObject(item?) {
		var itemType = item.getItemType();
		var rangeValue = item.getRangeValue();
		var rangeType = item.getRangeType();
		
		if (itemType === ItemType.QUICK) {
			if (rangeType === SelectionRangeType.SELFONLY && item.getQuickInfo().getValue() === QuickValue.ONE) {
				// If "Item Effects" is set to "One Unit," change to allow selection of a unit, even if the scope is single.
				rangeValue = 1;
				rangeType = SelectionRangeType.MULTI;
			}
		}
		else if (itemType === ItemType.TELEPORTATION) {
			if (rangeType === SelectionRangeType.SELFONLY) {
				rangeValue = item.getTeleportationInfo().getRangeValue();
				rangeType = item.getTeleportationInfo().getRangeType();
			}
		}
		
		return {
			rangeValue: rangeValue,
			rangeType: rangeType
		};
	}
}

class Probability {

	static getProbability(percent?) {
		var n;
		
		if (percent >= this.getMaxPercent()) {
			// If it's greater than 100, return true without condition.
			return true;
		}
		
		if (percent <= 0) {
			return false;
		}
		
		// root.getRandomNumber() returns a number between 0 and 32767.
		// When divided by 32768, this value can be normalized to a floating-point number greater than or equal to 0 and less than 1.
		// In other words, we can get an "even" distribution of random values between 0 and 1.
		// this.getRandomNumber() can internally be customized.
		// For compatibility purposes the code below is not used, but if you decide you want to use root.getRandomNumber(),
		// it would be best to use the code below.
		// n = Math.floor((this.getRandomNumber() / 32768) * 100);
		
		// This is another way to get a value between 0 and 99.
		// However, when using root.getRandomNumber() the chances of getting a number from 0 to 67 (68 possibilities) is
		// slightly greater than that of getting a number from 68 to 99 (32 possibilities).
		// Dividing 32767 by 100 gives us 328 possibilities for a remainder of 0 to 67,
		// whereas a remainder of 68 to 99 only happens 327 times. As such, it is not an exactly even distribution.
		n = this.getRandomNumber() % 100;
		
		// Assuming percent is 50, true is returned for values of n between 0 and 49,
		// which is 50 unique values. There are also 50 unique values for the numbers between 50 and 99.
		// In order to maintain an equal ratio, percent >= n; cannot be used.
		// If done so, the ratio would actually become 51:49.
		return percent > n;
	}

	static getInvocationPercent(unit?, type?, value?) {
		var n, hp, percent, maxMhp;
		
		if (type === InvocationType.HPDOWN) {
			maxMhp = ParamBonus.getMhp(unit);
			// If "HP Drop Rate" is 0, the skill will be activated if HP is full.
			if (value === 0 && unit.getHp() === maxMhp) {
				percent = 100;
			}
			else {
				n = value / 100;
				hp = maxMhp * n;
				percent = unit.getHp() <= hp ? 100 : 0;
			}
		}
		else if (type === InvocationType.ABSOLUTE) {
			percent = value;
		}
		else if (type === InvocationType.LV) {
			percent = unit.getLv() * value;
		}
		else {
			if (DataConfig.isSkillInvocationBonusEnabled()) {
				percent = ParamBonus.getBonus(unit, type) * value;
			}
			else {
				percent = unit.getParamValue(type) * value;
			}
		}
		
		return percent;
	}

	static getInvocationProbability(unit?, type?, value?) {
		var percent = this.getInvocationPercent(unit, type, value);
		
		return this.getProbability(percent);
	}

	static getInvocationProbabilityFromSkill(unit?, skill?) {
		return this.getInvocationProbability(unit, skill.getInvocationType(), skill.getInvocationValue());
	}

	static getRandomNumber() {
		return root.getRandomNumber();
	}

	static getMaxPercent() {
		return 100;
	}
}

class GameOverChecker {

	static isGameOver() {
		var i, count, unit;
		var list = PlayerList.getSortieList();
		var isGameOver = false;
		
		// The concept of a game over only exists in SceneType.FREE.
		// RestSession does not have isMapState implemented, so it is considered a countermeasure for when GameOver is called in the base.
		if (root.getBaseScene() !== SceneType.FREE) {
			return false;
		}
		
		// If the player doesn't exist, game over.
		if (list.getCount() === 0 && root.getCurrentSession().isMapState(MapStateType.PLAYERZEROGAMEOVER)) {
			isGameOver = true;
		}
		else {
			list = PlayerList.getDeathList();
			count = list.getCount();	
			for (i = 0; i < count; i++) {
				unit = list.getData(i);
				if (this.isGameOverUnit(unit)) {
					// If the leader is included in the dead list, game over.
					isGameOver = true;
					break;
				}
			}
		}
		
		return isGameOver;
	}

	static startGameOver() {
		var generator = root.getEventGenerator();
		
		generator.sceneChange(SceneChangeType.GAMEOVER);
		generator.execute();
		
		return true;
	}

	static isGameOverUnit(unit?) {
		return unit.getImportance() === ImportanceType.LEADER && DataConfig.isLeaderGameOver();
	}
}

class DamageControl {

	static setDeathState(unit?) {
		// If the unit is not the one to cause the game over, and is the injurable unit, set in an injured state.
		if (!GameOverChecker.isGameOverUnit(unit) && Miscellaneous.isInjuryAllowed(unit)) {
			unit.setAliveState(AliveType.INJURY);
		}
		else {
			// Set in a dead state.
			// It has a possibility to revive, so doesn't become a non-sortie.
			unit.setAliveState(AliveType.DEATH);
		}
		
		// Set in no display state.
		unit.setInvisible(true);
	}

	static setCatchState(unit?, isHpChange?) {
		unit.setSyncope(true);
		if (isHpChange) {
			unit.setHp(1);
		}
	}

	static setReleaseState(unit?) {
		unit.setAliveState(AliveType.ERASE);
		
		unit.setInvisible(true);
		unit.setSyncope(false);
		
		StateControl.arrangeState(unit, null, IncreaseType.ALLRELEASE);
	}

	static reduceHp(unit?, damage?) {
		var mhp;
		var hp = unit.getHp();
		
		if (damage > 0) {
			hp -= damage;
			if (hp <= 0) {
				hp = 0;
			}
		}
		else {
			mhp = ParamBonus.getMhp(unit);
			hp -= damage;
			if (hp > mhp) {
				hp = mhp;
			}
		}
		
		unit.setHp(hp);
	}

	static checkHp(active?, passive?) {
		var hp = passive.getHp();
		
		if (hp > 0) {
			return;
		}
		
		if (FusionControl.getFusionAttackData(active) !== null) {
			// For isLosted which will be called later, hp doesn't become 1 at this moment.
			this.setCatchState(passive, false);
		}
		else {
			this.setDeathState(passive);
		}
	}

	
	// Check if it's a catch state by "Fusion Attack".
	static isSyncope(unit?) {
		return unit.isSyncope();
	}

	static isLosted(unit?) {
		return unit.getHp() <= 0;
	}
}

class WeaponEffectControl {

	static playDamageSound(unit?, isCritical?, isFinish?) {
		if (isCritical) {
			if (isFinish) {
				this.playSound(unit, WeaponEffectSound.CRITICALFINISH);
			}
			else {
				this.playSound(unit, WeaponEffectSound.CRITICAL);
			}
		}
		else {
			if (isFinish) {
				this.playSound(unit, WeaponEffectSound.DAMAGEFINISH);
			}
			else {
				this.playSound(unit, WeaponEffectSound.DAMAGE);
			}
		}
	}

	static getDamageAnime(unit?, isCritical?, isReal?) {
		var anime;
		
		if (isCritical) {
			if (isReal) {
				anime = this.getAnime(unit, WeaponEffectAnime.REALCRITICAL);
			}
			else {
				anime = this.getAnime(unit, WeaponEffectAnime.EASYCRITICAL);
			}
		}
		else {
			if (isReal) {
				anime = this.getAnime(unit, WeaponEffectAnime.REALDAMAGE);
			}
			else {
				anime = this.getAnime(unit, WeaponEffectAnime.EASYDAMAGE);
			}
		}
		
		return anime;
	}

	static getAnime(unit?, type?) {
		var weaponEffect;
		var anime = null;
		var weapon = BattlerChecker.getRealBattleWeapon(unit);
		var arr = ['realdamage', 'easydamage', 'realcritical', 'easycritical', 'magicinvocation'];
		
		if (weapon !== null) {
			weaponEffect = weapon.getWeaponEffect();
			anime = weaponEffect.getAnime(type, arr[type]);
		}
		
		return anime;
	}

	static playSound(unit?, type?) {
		var weaponEffect;
		var soundHandle = null;
		var weapon = BattlerChecker.getRealBattleWeapon(unit);
		var arr = ['damage', 'damagefinish', 'critical', 'criticalfinish', 'weaponwave', 'weaponthrow', 'shootarrow'];
		
		if (weapon !== null) {
			weaponEffect = weapon.getWeaponEffect();
			soundHandle = weaponEffect.getSoundHandle(type, arr[type]);
		}
		
		if (soundHandle !== null) {
			MediaControl.soundPlay(soundHandle);
		}
	}
}

class PosChecker {

	static getUnitFromPos(x?, y?) {
		var session = root.getCurrentSession();
		
		if (session === null) {
			return null;
		}
		
		return session.getUnitFromPos(x, y);
	}

	static getMovePointFromUnit(x?, y?, unit?) {
		var terrain, movePoint;

		if (!CurrentMap.isMapInside(x, y)) {
			return 0;
		}
		
		// Get "terrain" associated with a specified position.
		terrain = this.getTerrainFromPos(x, y);
		if (terrain === null) {
			return 0;
		}
		
		// Get "Consume Mov" which is needed to move to terrain.
		movePoint = terrain.getMovePoint(unit);
	
		return movePoint;
	}

	static getTerrainFromPos(x?, y?) {
		var session = root.getCurrentSession();
		
		if (session === null) {
			return null;
		}
		
		return session.getTerrainFromPos(x, y, true);
	}

	static getTerrainFromPosEx(x?, y?) {
		var session = root.getCurrentSession();
		
		if (session === null) {
			return null;
		}
		
		return session.getTerrainFromPos(x, y, false);
	}

	static getPlaceEventFromUnit(placeType?, unit?) {
		var i, event, placeInfo;
		var list = root.getCurrentSession().getPlaceEventList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			placeInfo = event.getPlaceEventInfo();
			if (placeInfo.getPlaceEventType() === placeType) {
				if (placeInfo.getX() === unit.getMapX() && placeInfo.getY() === unit.getMapY()) {
					return event;
				}
			}
		}
		
		return null;
	}

	static getPlaceEventFromPos(type?, x?, y?) {
		var i, event, placeInfo;
		var list = root.getCurrentSession().getPlaceEventList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			placeInfo = event.getPlaceEventInfo();
			if (placeInfo.getPlaceEventType() === type) {
				if (placeInfo.getX() === x && placeInfo.getY() === y) {
					if (event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
						return event;
					}
				}
			}
		}
		
		return null;
	}

	static getSideDirection(x1?, y1?, x2?, y2?) {
		var i;
		
		for (i = 0; i < DirectionType.COUNT; i++) {
			if (x1 + XPoint[i] === x2 && y1 + YPoint[i] === y2) {
				return i;
			}
		}

		return DirectionType.NULL;
	}

	static getNearbyPos(unit?, targetUnit?) {
		if (unit === null) {
			return createPos(-1, -1);
		}
		
		return this.getNearbyPosFromSpecificPos(unit.getMapX(), unit.getMapY(), targetUnit, null);
	}

	static getNearbyPosEx(unit?, targetUnit?, parentIndexArray?) {
		// If parentIndexArray is specified, the position which is out of the range cannot be returned.
		return this.getNearbyPosFromSpecificPos(unit.getMapX(), unit.getMapY(), targetUnit, parentIndexArray);
	}

	static getNearbyPosFromSpecificPos(xStart?, yStart?, targetUnit?, parentIndexArray?) {
		var i, count, index, x, y, value, indexArray, simulator, movePoint;
		var curValue = AIValue.MAX_MOVE;
		var curIndex = -1;
		
		// Don't call IndexArray.getBestIndexArray so as to continuously use simulator.
		simulator = root.getCurrentSession().createMapSimulator();
		simulator.startSimulationRange(xStart, yStart, 1, 7);
		indexArray = simulator.getSimulationIndexArray();
		
		count = indexArray.length;
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			
			if (parentIndexArray !== null && !IndexArray.findPos(parentIndexArray, x, y)) {
				continue;
			}
			
			movePoint = PosChecker.getMovePointFromUnit(x, y, targetUnit);
			if (movePoint === 0) {
				// A place where cannot move to, cannot be a move target.
				continue;
			}
			
			if (PosChecker.getUnitFromPos(x, y) === null) {
				value = simulator.getSimulationMovePoint(index);
				if (value < curValue) {
					curValue = value;
					curIndex = index;
				}
			}
		}
		
		if (curIndex !== -1) {
			x = CurrentMap.getX(curIndex);
			y = CurrentMap.getY(curIndex);
			return createPos(x, y);
		}
		
		return null;
	}

	static getKeyEvent(x?, y?, keyFlag?) {
		var event;
		
		if (keyFlag & KeyFlag.TREASURE) {
			event = PosChecker.getPlaceEventFromPos(PlaceEventType.TREASURE, x, y);
			if (event !== null) {
				return event;
			}
		}
		
		if (keyFlag & KeyFlag.GATE) {
			event = PosChecker.getPlaceEventFromPos(PlaceEventType.GATE, x, y);
			if (event !== null) {
				return event;
			}
		}
		
		return null;
	}
}

class KeyEventChecker {

	static getIndexArrayFromKeyType(unit?, keyData?) {
		var indexArray = [];
		var rangeType = keyData.rangeType;
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			indexArray = this._getSelfIndexArray(unit, keyData);
		}
		else if (rangeType === SelectionRangeType.MULTI) {
			indexArray = this._getMultiIndexArray(unit, keyData);
		}
		else {
			indexArray = this._getAllIndexArray(unit, keyData);
		}
		
		return indexArray;
	}

	static getKeyEvent(x?, y?, keyData?) {
		var event;
		var isTreasure = this._isTreasure(keyData);
		var isGate = this._isGate(keyData);
		
		// If the target of a key is a treasure, check if the place event is the treasure.
		if (isTreasure) {
			event = PosChecker.getPlaceEventFromPos(PlaceEventType.TREASURE, x, y);
			if (event !== null) {
				return event;
			}
		}
		
		// If the target of a key is a gate, check if the place event is the gate.
		if (isGate) {
			event = PosChecker.getPlaceEventFromPos(PlaceEventType.GATE, x, y);
			if (event !== null) {
				return event;
			}
		}
		
		return null;
	}

	static buildKeyDataDefault() {
		var keyData: any = {};
		
		keyData.flag = KeyFlag.TREASURE;
		keyData.requireFlag = KeyFlag.TREASURE;
		keyData.rangeValue = 0;
		keyData.rangeType = SelectionRangeType.SELFONLY;
		keyData.item = null;
		keyData.skill = null;
		
		return keyData;
	}

	static buildKeyDataSkill(skill?, requireFlag?) {
		var keyData: any = {};
		var keyFlag = skill.getSkillValue();
		
		if (!(keyFlag & requireFlag)) {
			return null;
		}
		
		keyData.flag = keyFlag;
		keyData.requireFlag = requireFlag;
		keyData.rangeValue = skill.getRangeValue();
		keyData.rangeType = skill.getRangeType();
		keyData.item = null;
		keyData.skill = skill;
		
		if (this.isPairKey(skill)) {
			keyData.rangeValue = 1;
			if (keyData.requireFlag === KeyFlag.TREASURE) {
				keyData.rangeType = SelectionRangeType.SELFONLY;
			}
			else {
				keyData.rangeType = SelectionRangeType.MULTI;
			}
		}
		
		return keyData;
	}

	static buildKeyDataItem(item?, requireFlag?) {
		var keyData: any = {};
		var keyFlag = item.getKeyInfo().getKeyFlag();
		
		if (!(keyFlag & requireFlag)) {
			return null;
		}
		
		keyData.flag = keyFlag;
		keyData.requireFlag = requireFlag;
		keyData.rangeValue = item.getRangeValue();
		keyData.rangeType = item.getRangeType();
		keyData.item = item;
		keyData.skill = null;
		
		if (this.isPairKey(item)) {
			keyData.rangeValue = 1;
			if (keyData.requireFlag === KeyFlag.TREASURE) {
				keyData.rangeType = SelectionRangeType.SELFONLY;
			}
			else {
				keyData.rangeType = SelectionRangeType.MULTI;
			}
		}
		
		return keyData;
	}

	static isPairKey(obj?) {
		var keyFlag;
		
		if (obj === null) {
			return false;
		}
		
		if (typeof obj.getItemType === 'undefined') {
			keyFlag = obj.getSkillValue();
		}
		else {
			keyFlag = obj.getKeyInfo().getKeyFlag();
		}
		
		if ((keyFlag & KeyFlag.GATE) && (keyFlag & KeyFlag.TREASURE)) {
			if (obj.getRangeType() === SelectionRangeType.SELFONLY) {
				// If a gate and a treasure are targets, moreover, the scope is single, treat the gate as scope 1.
				return true;
			}
		}
		
		return false;
	}

	static _getSelfIndexArray(unit?, keyData?) {
		var indexArray = [];
		var event = this.getKeyEvent(unit.getMapX(), unit.getMapY(), keyData);
		
		if (event !== null) {
			indexArray.push(CurrentMap.getIndex(unit.getMapX(), unit.getMapY()));
		}
		
		return indexArray;
	}

	static _getMultiIndexArray(unit?, keyData?) {
		var i, index, x, y, event;
		var indexArrayNew = [];
		var indexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, keyData.rangeValue);
		var count = indexArray.length;
		var isTreasure = this._isTreasure(keyData);
		var isGate = this._isGate(keyData);
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			
			if (isTreasure) {
				event = PosChecker.getPlaceEventFromPos(PlaceEventType.TREASURE, x, y);
				if (event !== null) {
					indexArrayNew.push(index);
				}
			}
			
			if (isGate) {
				event = PosChecker.getPlaceEventFromPos(PlaceEventType.GATE, x, y);
				if (event !== null) {
					indexArrayNew.push(index);
				}
			}
		}
		
		return indexArrayNew;
	}

	static _getAllIndexArray(unit?, keyData?) {
		var i, event, placeInfo;
		var indexArrayNew = [];
		var list = root.getCurrentSession().getPlaceEventList();
		var count = list.getCount();
		var isTreasure = this._isTreasure(keyData);
		var isGate = this._isGate(keyData);
		
		for (i = 0; i < count; i++) {
			event = list.getData(i);
			placeInfo = event.getPlaceEventInfo();
			
			if (isTreasure && placeInfo.getPlaceEventType() === PlaceEventType.TREASURE) {
				if (event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
					indexArrayNew.push(CurrentMap.getIndex(placeInfo.getX(), placeInfo.getY()));
				}
			}
			
			if (isGate && placeInfo.getPlaceEventType() === PlaceEventType.GATE) {
				if (event.getExecutedMark() === EventExecutedType.FREE && event.isEvent()) {
					indexArrayNew.push(CurrentMap.getIndex(placeInfo.getX(), placeInfo.getY()));
				}
			}
		}
		
		return indexArrayNew;
	}

	static _isTreasure(keyData?) {
		var isTreasure = keyData.requireFlag & KeyFlag.TREASURE;
		
		if (!isTreasure) {
			return false;
		}
		
		return keyData.flag & KeyFlag.TREASURE;
	}

	static _isGate(keyData?) {
		var isGate = keyData.requireFlag & KeyFlag.GATE;
		
		if (!isGate) {
			return false;
		}
		
		return keyData.flag & KeyFlag.GATE;
	}
}

class UnitEventChecker {

	static _isCancelFlag: any = false;

	static getUnitEvent(unit?, eventType?) {
		return this._getEvent(unit, null, eventType);
	}

	static getUnitBattleEvent(unit?, targetUnit?) {
		var event = this._getEvent(unit, targetUnit, UnitEventType.BATTLE);
		
		if (event !== null) {
			return event;
		}
		
		event = this._getEvent(targetUnit, unit, UnitEventType.BATTLE);
		if (event !== null) {
			return event;
		}
		
		return null;
	}

	static getUnitBattleEventData(unit?, targetUnit?) {
		var event = this._getEvent(unit, targetUnit, UnitEventType.BATTLE);
		
		if (event !== null) {
			return {
				event: event,
				unit: targetUnit
			};
		}
		
		event = this._getEvent(targetUnit, unit, UnitEventType.BATTLE);
		if (event !== null) {
			return {
				event: event,
				unit: unit
			};
		}
		
		return null;
	}

	static getUnitLostEvent(passiveUnit?) {
		var event = null;
		
		// If the player was beaten, check if injured is allowed.
		if (passiveUnit.getUnitType() === UnitType.PLAYER && Miscellaneous.isInjuryAllowed(passiveUnit)) {
			// Get the unit event of "Died".
			event = this._getEvent(passiveUnit, null, UnitEventType.INJURY);
		}
		else {
			// Get the unit event of "Injured".
			event = this._getEvent(passiveUnit, null, UnitEventType.DEAD);
		}
		
		return event;
	}

	static startUnitBattleEvent(unit?, targetUnit?) {
		var event = this._getEvent(unit, targetUnit, UnitEventType.BATTLE);
		
		if (event !== null) {
			event.startBattleEvent(targetUnit);
			return event;
		}
		
		event = this._getEvent(targetUnit, unit, UnitEventType.BATTLE);
		if (event !== null) {
			event.startBattleEvent(unit);
			return event;
		}
		
		return null;
	}

	static setCancelFlag(flag?) {
		this._isCancelFlag = flag;
	}

	static isCancelFlag() {
		return this._isCancelFlag;
	}

	static _getEvent(unit?, targetUnit?, unitEventType?) {
		var i, event, info;
		var count = unit.getUnitEventCount();
		
		for (i = 0; i < count; i++) {
			event = unit.getUnitEvent(i);
			info = event.getUnitEventInfo();
			if (info.getUnitEventType() === unitEventType) {
				if (unitEventType === UnitEventType.BATTLE) {
					if (this._isBattleEvent(unit, targetUnit, event)) {
						return event;
					}
				}
				else {
					if (event.isEvent()) {
						return event;
					}
				}
			}
		}
		
		return null;
	}

	static _isBattleEvent(unit?, targetUnit?, event?) {
		// For enemy units that have a battle unit event with XX unit and Active unit,
		// if the conditions for XX unit are not met, nothing is shown (including the Active unit event).
		// To have it show the Active unit event in such a case, call event.isBattleEventEx(targetUnit);
		return event.isBattleEvent(targetUnit);
	}
}

class AttackChecker {

	static getNonStatus() {
		return [-1, -1, -1];
	}

	
	// Calling cost is very large.
	// After calling once, recommended to save the gotten array.
	static getAttackStatusInternal(unit?, weapon?, targetUnit?) {
		var activeTotalStatus, passiveTotalStatus;
		var arr = [,,,];
		
		if (weapon === null) {
			return this.getNonStatus();
		}
		
		activeTotalStatus = SupportCalculator.createTotalStatus(unit);
		passiveTotalStatus = SupportCalculator.createTotalStatus(targetUnit);
		
		arr[0] = DamageCalculator.calculateDamage(unit, targetUnit, weapon, false, activeTotalStatus, passiveTotalStatus, 0);
		arr[1] = HitCalculator.calculateHit(unit, targetUnit, weapon, activeTotalStatus, passiveTotalStatus);
		arr[2] = CriticalCalculator.calculateCritical(unit, targetUnit, weapon, activeTotalStatus, passiveTotalStatus);

		return arr;
	}

	static isUnitAttackable(unit?) {
		var i, item, indexArray;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null && ItemControl.isWeaponAvailable(unit, item) && this._isWeaponEnabled(item)) {
				indexArray = this.getAttackIndexArray(unit, item, true);
				if (indexArray.length !== 0) {
					return true;
				}
			}
		}
		
		return false;
	}

	static getAttackIndexArray(unit?, weapon?, isSingleCheck?) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				if (FilterControl.isReverseUnitTypeAllowed(unit, targetUnit)) {
					indexArrayNew.push(index);
					if (isSingleCheck) {
						return indexArrayNew;
					}
				}
			}
		}
		
		return indexArrayNew;
	}

	static getFusionAttackIndexArray(unit?, weapon?, fusionData?) {
		var i, index, x, y, targetUnit;
		var indexArrayNew = [];
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), weapon);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			targetUnit = PosChecker.getUnitFromPos(x, y);
			if (targetUnit !== null && unit !== targetUnit) {
				if (FusionControl.isAttackable(unit, targetUnit, fusionData) && FusionControl.isRangeAllowed(unit, targetUnit, fusionData)) {
					indexArrayNew.push(index);
				}
			}
		}
		
		return indexArrayNew;
	}

	
	// Check if the targetUnit can counterattack the unit.
	static isCounterattack(unit?, targetUnit?) {
		var indexArray;
		var weapon = this._getCounterWeapon(unit, targetUnit);
		
		if (weapon === null) {
			return false;
		}
		
		indexArray = IndexArray.createIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), weapon);
		
		return IndexArray.findUnit(indexArray, unit);
	}

	static isCounterattackPos(unit?, targetUnit?, x?, y?) {
		var indexArray;
		var weapon = ItemControl.getEquippedWeapon(targetUnit);
		
		if (weapon === null) {
			return false;
		}
		
		indexArray = IndexArray.createIndexArray(targetUnit.getMapX(), targetUnit.getMapY(), weapon);
		
		return IndexArray.findPos(indexArray, x, y);
	}

	static _getCounterWeapon(unit?, targetUnit?) {
		var weapon;
		
		if (!Calculator.isCounterattackAllowed(unit, targetUnit)) {
			return null;
		}
		
		weapon = ItemControl.getEquippedWeapon(unit);
		if (weapon !== null && weapon.isOneSide()) {
			// If the attacker is equipped with "One Way" weapon, no counterattack occurs.
			return null;
		}
		
		// Get the equipped weapon of those who is attacked.
		weapon = ItemControl.getEquippedWeapon(targetUnit);
		
		// If no weapon is equipped, cannot counterattack.
		if (weapon === null) {
			return null;
		}
		
		// If "One Way" weapon is equipped, cannot counterattack.
		if (weapon.isOneSide()) {
			return null;
		}
		
		if (!this._isWeaponEnabled(weapon)) {
			return null;
		}
		
		return weapon;
	}

	static _isWeaponEnabled(weapon?) {
		// Checks whether the Attack command or counterattacks are allowed with the specified weapon.
		// Return false for cases where the weapon can be equipped but it's broken and you don't want it to be used in battle.
		return true;
	}
}

class WandChecker {

	static isWandUsable(unit?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (item !== null) {
				if (this.isWandUsableInternal(unit, item)) {
					return true;
				}
			}
		}
		
		return false;
	}

	static isWandUsableInternal(unit?, wand?) {
		var obj;
		
		if (!wand.isWand()) {
			return false;
		}
		
		if (!ItemControl.isItemUsable(unit, wand)) {
			return false;
		}
		
		obj = ItemPackageControl.getItemAvailabilityObject(wand);
		if (obj === null) {
			return false;
		}
		
		return obj.isItemAvailableCondition(unit, wand);
	}
}

class ClassChangeChecker {

	static getClassEntryArray(unit?, isMapCall?) {
		var classGroup;
		var classGroupId = this.getClassGroupId(unit, isMapCall);
		var classEntryArray = [];
		
		classGroup = this.getClassGroup(classGroupId);
		if (classGroup !== null) {
			classEntryArray = this.createClassEntryArray(unit, classGroup);
		}
		
		return classEntryArray;
	}

	static getClassGroupId(unit?, isMapCall?) {
		var classGroupId;
		
		if (unit.getClassUpCount() === 0) {
			// If class has never been changed even once, use class group 1.
			classGroupId = unit.getClassGroupId1();
		}
		else {
			// If class has been changed, use class group 2.
			classGroupId = unit.getClassGroupId2();
		}
		
		// If isMapCall is true, it means class has been changed with a class change item.
		// If isMapCall is false, it means that class change was done through a class change command on the Battle Setup Scene.
		if (isMapCall && DataConfig.isBattleSetupClassChangeAllowed()) {
			// If it's a class change by class change item, moreover,
			// class change is allowed at the Battle Setup Scene,
			// refer to the class group 2 without asking number of class change. 
			classGroupId = unit.getClassGroupId2();
		}
		
		return classGroupId;
	}

	static getClassGroup(classGroupId?) {
		var i, classGroup;
		var list = root.getBaseData().getClassGroupList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			classGroup = list.getData(i);
			if (classGroup.getId() === classGroupId) {
				return classGroup;
			}
		}
		
		return null;
	}

	static createClassEntryArray(unit?, classGroup?) {
		var i, classEntry;
		var classEntryArray = [];
		var count = classGroup.getClassGroupEntryCount();
		
		for (i = 0; i < count; i++) {
			classEntry = this._createClassEntry(unit, classGroup.getClassGroupEntryData(i));
			classEntryArray.push(classEntry);
		}
		
		return classEntryArray;
	}

	static isClassChange(unit?, groupEntry?) {
		return groupEntry.isGlobalSwitchOn() && this._checkUnitParameter(unit, groupEntry);
	}

	static _createClassEntry(unit?, groupEntry?) {
		var cls = groupEntry.getClass();
		var classEntry = StructureBuilder.buildMultiClassEntry();
		
		classEntry.cls = cls;
		classEntry.isChange = this.isClassChange(unit, groupEntry);
			
		if (classEntry.isChange) {
			classEntry.name = cls.getName();
		}
		else {
			classEntry.name = StringTable.HideData_Question;
		}
		
		return classEntry;
	}

	static _checkUnitParameter(unit?, groupEntry?) {
		var i, count, n, ou;
		
		// Parameter and level from HP until bld.
		count = ParamType.COUNT + 1;
		for (i = 0; i < count; i++) {
			n = groupEntry.getParameterValue(i);
			ou = groupEntry.getConditionValue(i);
			if (ou !== OverUnderType.NONE) {
				if (!this._checkOverUnder(this._getUnitValue(unit, i), n, ou)) {
					return false;
				}
			}
		}
		
		return true;
	}

	static _getUnitValue(unit?, index?) {
		if (index === 0) {
			return unit.getLv();
		}
		else { 
			return unit.getParamValue(index - 1);
		}
	}

	static _checkOverUnder(srcValue?, destValue?, ou?) {
		var result = false;
		
		if (ou === OverUnderType.EQUAL) {
			if (srcValue === destValue) {
				result = true;
			}
		}
		else if (ou === OverUnderType.OVER) {
			if (srcValue >= destValue) {
				result = true;
			}
		}
		else if (ou === OverUnderType.UNDER) {
			if (srcValue < destValue) {
				result = true;
			}
		}
		else if (ou === OverUnderType.NOTEQUALSTO) {
			if (srcValue !== destValue) {
				result = true;
			}
		}
		
		return result;
	}
}

class ItemIdentityChecker {

	static isItemReused(arr?, item?) {
		var obj;
		
		if (item === null || item.isWeapon()) {
			return false;
		}
		
		if (!this._checkIdAndType(arr, item)) {
			return false;
		}
		
		obj = {};
		obj.itemId = item.getId();
		obj.weaponType = item.getWeaponType();
		arr.push(obj);
		
		return true;
	}

	static _checkIdAndType(arr?, item?) {
		var i, availableCount, typeId;
		var count = arr.length;
		var availableArray = [];
		var itemId = item.getId();
		var weaponType = item.getWeaponType();
		
		for (i = 0; i < count; i++) {
			if (arr[i].itemId === itemId) {
				return false;
			}
			
			availableCount = arr[i].weaponType.getAvailableCount();
			if (availableCount > 0 && arr[i].weaponType === weaponType) {
				typeId = weaponType.getId();
				if (typeof availableArray[typeId] === 'undefined') {
					availableArray[typeId] = 1;
				}
				
				if (availableArray[typeId] === availableCount) {
					return false;
				}
				availableArray[typeId]++;
			}
		}
		
		return true;
	}
}

class LayoutControl {

	static getMapAnimationPos(x?, y?, animeData?) {
		var x2, y2, size;
		
		if (typeof animeData === 'undefined') {
			x2 = x - 80;
			y2 = y - 110;
		}
		else {
			size = Miscellaneous.getFirstKeySpriteSize(animeData, 0);
			x2 = x - (Math.floor(size.width / 2) - 16);
			y2 = y - (Math.floor(size.height / 2) - 16) - 30;
		}
		
		return createPos(x2, y2);
	}

	static getPixelX(x?) {
		return (x * GraphicsFormat.MAPCHIP_WIDTH) - root.getCurrentSession().getScrollPixelX();
	}

	static getPixelY(y?) {
		return (y * GraphicsFormat.MAPCHIP_HEIGHT) - root.getCurrentSession().getScrollPixelY();
	}

	static getCenterX(max?, width?) {
		var x;
	
		if (max === -1) {
			max = root.getGameAreaWidth();
		}
		
		if (max < width) {
			return 0;
		}
		
		x = max - width;
		x = Math.floor(x / 2);
		
		return x;
	}

	static getCenterY(max?, height?) {
		var y;
		
		if (max === -1) {
			max = root.getGameAreaHeight();
		}
		
		if (max < height) {
			return 0;
		}
		
		y = max - height;
		y = Math.floor(y / 2);
		
		return y;
	}

	static getRelativeX(div?) {
		return Math.floor(root.getGameAreaWidth() / div);
	}

	static getRelativeY(div?) {
		return Math.floor(root.getGameAreaHeight() / div);
	}

	static getObjectVisibleCount(div?, maxCount?) {
		var height = root.getGameAreaHeight() - 170;
		var count = Math.floor(height / div);
		
		if (maxCount !== -1) {
			if (count > maxCount) {
				count = maxCount;
			}
		}
		
		return count;
	}

	static getNotifyY() {
		return this.getRelativeY(5);
	}

	static getUnitBaseX(unit?, width?) {
		var x = LayoutControl.getPixelX(unit.getMapX()) + 32;
		
		return this._getNormalizeX(x, width, 0);
	}

	static getUnitBaseY(unit?, height?) {
		var  y = LayoutControl.getPixelY(unit.getMapY()) + 40;
		
		return this._getNormalizeY(y, height, 60);
	}

	static getUnitCenterX(unit?, width?, dx?) {
		var xCenter = LayoutControl.getPixelX(unit.getMapX()) + 16;
		var x = xCenter - Math.floor(width / 2);
		
		return this._getNormalizeX(x, width, dx);
	}

	static _getNormalizeX(x?, width?, dx?) {
		return this._getNormalizeValue(x, width, root.getGameAreaWidth(), dx);
	}

	static _getNormalizeY(y?, height?, dy?) {
		return this._getNormalizeValue(y, height, root.getGameAreaHeight(), dy);
	}

	static _getNormalizeValue(value?, plusValue?, maxValue?, adjustment?) {
		if (value + plusValue > maxValue) {
			value = maxValue -  plusValue - adjustment;
		}
		
		if (value < 0) {
			value = adjustment; 
		}
		
		return value;
	}
}

class UnitProvider {

	// It's called when the unit appears on the map.
	static setupFirstUnit(unit?) {
		MapHpControl.updateHp(unit);
	}

	static sortSortieUnit() {
		var i;
		var unit = null;
		var list = PlayerList.getMainList();
		var count = list.getCount();
		
		function exchangeUnit(index) {
			var j, targetUnit;
		
			for (j = index; j >= 0; j--) {
				targetUnit = list.getData(j);
				// Don't overtake the front unit who has sortied.
				if (targetUnit.getSortieState() === SortieType.SORTIE) {
					break;
				}
				list.exchangeUnit(unit, targetUnit);
			}
		}
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			if (unit.getSortieState() === SortieType.SORTIE) {
				exchangeUnit(i - 1);
			}
		}
	}

	static recoveryPlayerList() {
		var i, unit;
		var list = PlayerList.getMainList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			this.recoveryUnit(unit);
			// Execute after deactivating fusion.
			this._resetPos(unit);
		}
	}

	
	// If the "Heal player units upon entering the battle prep screen" is disabled, an injured unit is treated as incapacitated.
	static recoveryPlayerListWithoutHp() {
		var i, unit, oldHp;
		var list = PlayerList.getMainList();
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			unit = list.getData(i);
			oldHp = unit.getHp();
			this.recoveryUnit(unit);
			this._resetPos(unit);
			// In the recoveryUnit, AliveType.INJURY changes to AliveType.ALIVE, with the intention of enumerating units in getAliveList.
			// By deliberately keeping them in a alive state, units appear in lists such as the "Unit Marshal" screen.
			// However, since it is necessary to have an indication that the unit is injured, the HP is set based on what has been backed up in advance.
			// The HP when injured is 0, so the unit's HP becomes 0.(ChronicInjuryHp.ZERO)
			// This mechanism creates the concept of incapacitated unit(unable to sortie with 0 HP).
			unit.setHp(oldHp);
		}
	}

	static recoveryUnit(unit?) {
		this._resetHp(unit);
		this._resetInjury(unit);
		this._resetState(unit);
		this._resetSortieState(unit);
		this._resetUnitState(unit);
		this._resetUnitStyle(unit);
	}

	static recoveryPrepareUnit(unit?) {
		this._resetHp(unit);
		this._resetInjury(unit);
		this._resetState(unit);
		this._resetUnitState(unit);
		this._resetUnitStyle(unit);
	}

	static _resetHp(unit?) {
		// Fully recover HP.
		unit.setHp(ParamBonus.getMhp(unit));
	}

	static _resetInjury(unit?) {
		if (unit.getAliveState() === AliveType.INJURY) {
			// If it's in an injured state, return to the original state with this processing.
			unit.setAliveState(AliveType.ALIVE);
		}
		
		// Default the injured allow state.
		unit.setInjury(root.getMetaSession().getDifficulty().getDifficultyOption() & DifficultyFlag.INJURY);
	}

	static _resetState(unit?) {
		// Deactivate the unit state.
		StateControl.arrangeState(unit, null, IncreaseType.ALLRELEASE);
	}

	static _resetSortieState(unit?) {
		// Set non sortie state.
		unit.setSortieState(SortieType.UNSORTIE);
	}

	static _resetUnitState(unit?) {
		// Deactivate the wait state.
		unit.setWait(false);
		
		// Deactivate the immortal state.
		unit.setImmortal(false);
		
		// Deactivate non visible state.
		unit.setInvisible(false);
		
		// Deactivate the bad state guard.
		unit.setBadStateGuard(false);
	}

	static _resetUnitStyle(unit?) {
		FusionControl.clearFusion(unit);
		MetamorphozeControl.clearMetamorphoze(unit);
	}

	static _resetPos(unit?) {
		unit.setMapX(0);
		unit.setMapY(0);
	}
}

class Miscellaneous {

	static isCriticalAllowed(active?, passive?) {
		var option = root.getMetaSession().getDifficulty().getDifficultyOption();
		
		// If critical hit is not enabled at default,
		// moreover, the unit has no critical skill, don't activate. 
		if (!(option & DifficultyFlag.CRITICAL) && SkillControl.getBattleSkill(active, passive, SkillType.CRITICAL) === null) {
			return false;
		}
		
		return true;
	}

	static isInjuryAllowed(unit?) {
		// The guest unit doesn't allow to get injured.
		if (unit.isGuest()) {
			return false;
		}
		
		return unit.isInjury();
	}

	static isExperienceEnabled(unit?, exp?) {
		// If no obtained exp, don't continue.
		if (exp <= 0) {
			return false;
		}
		
		if (unit === null) {
			return false;
		}
		
		// If reached maximum level, don't continue.
		if (unit.getLv() === Miscellaneous.getMaxLv(unit)) { 
			return false;
		}
		
		return true;
	}

	static isStealEnabled(unit?, targetUnit?, value?) {
		if (value & StealFlag.SPEED) {
			// If "Calculate by Speed" is enabled, unless it's more than the opponent speed, cannot steal.
			return ParamBonus.getSpd(unit) >= ParamBonus.getSpd(targetUnit);
		}
		
		return true;
	}

	static isStealTradeDisabled(unit?, item?, value?) {
		if (!(value & StealFlag.WEAPON) && item.isWeapon()) {
			// Even if a weapon cannot be stolen, if the target is a weapon, cannot trade.
			return true;
		}
		
		if (value & StealFlag.WEIGHT) {
			if (ParamBonus.getStr(unit) < item.getWeight()) {
				// If "Calculate by Weight" is enabled and if the unit pow is less than the item weight, disable.
				return true;
			}
		}
		
		return this.isTradeDisabled(unit, item);
	}

	static isTradeDisabled(unit?, item?) {
		if (item === null) {
			return false;
		}
		
		return item.isTradeDisabled();
	}

	static isItemAccess(unit?) {
		if (!unit.isGuest()) {
			return true;
		}
		
		// If the unit is a guest, check if increase/decrease is allowed.
		return DataConfig.isGuestTradeEnabled();
	}

	static isDurabilityChangeAllowed(item?, targetItem?) {
		var type, itemType;
		
		if (item === null || targetItem === null) {
			return true;
		}
		
		if (!targetItem.isWeapon()) {
			// For "Repair" item, don't allow to execute of "Repair".
			itemType = targetItem.getItemType();
			if (itemType === ItemType.DURABILITY) {
				return false;
			}
		}
			
		// Get the type of durability of used item.
		type = item.getDurabilityInfo().getDurabilityChangeType();
		if (type === DurabilityChangeType.HALF || type === DurabilityChangeType.BREAK) {
			// For "Half" and "Broken", important item cannot be a target.
			if (targetItem.isImportance()) {
				return false;
			}
		}
		
		return true;
	}

	static isPlayerFreeAction(unit?) {
		return unit.getUnitType() === UnitType.PLAYER && root.getCurrentSession().isMapState(MapStateType.PLAYERFREEACTION);
	}

	static isPhysicsBattle(weapon?) {
		var weaponCategoryType = weapon.getWeaponCategoryType();
		var isPhysics;
		
		if (weaponCategoryType === WeaponCategoryType.PHYSICS || weaponCategoryType === WeaponCategoryType.SHOOT) {
			if (weapon.isReverseWeapon()) {
				isPhysics = false;
			}
			else {
				isPhysics = true;
			}
		}
		else {
			if (weapon.isReverseWeapon()) {
				isPhysics = true;
			}
			else {
				isPhysics = false;
			}
		}
		
		return isPhysics;
	}

	static isStockAccess(unit?) {
		var cls = unit.getClass();
		
		return cls.getClassOption() & ClassOptionFlag.STOCK;
	}

	static isGameAcceleration() {
		if (root.getBaseScene() === SceneType.FREE) {
			if (root.getCurrentSession().getTurnType() !== TurnType.PLAYER && EnvironmentControl.getAutoTurnSkipType() === 1 && CurrentMap.isEnemyAcceleration()) {
				return true;
			}
		}
	
		return InputControl.isSystemState();
	}

	static isSingleTextSpace(text?) {	
		var c = text.charCodeAt(0);
		
		return (c < 256 || (c >= 0xff61 && c <= 0xff9f));
	}

	static isUnitSrcPriority(unitSrc?, unitDest?) {
		var srcType = unitSrc.getUnitType();
		var destType = unitDest.getUnitType();
		
		// Decide to display the player at the right at the real battle, and the player at the left at the PosMenu.
		// By following the below rule, for the player, position display is prioritized.
		
		// The player > The enemy
		// The player > The ally
		// The ally > The enemy
		
		// For the player vs the enemy, there are cases. One is unitSrc is the player and unitDest is the enemy.
		// The other is unitDest is the player and unitSrc is the enemy.
		// To display unitSrc at the priority position, return true.
		// To display unitDest at the priority position, return false.
		
		if (srcType === UnitType.PLAYER) {
			// unitSrc is priority
			return true;
		}
		else if (srcType === UnitType.ALLY) {
			if (destType === UnitType.PLAYER) {
				// unitDest is priority
				return false;
			}
			else {
				return true;
			}
		}
		else if (srcType === UnitType.ENEMY) {
			if (destType === UnitType.PLAYER) {
				// unitDest is priority
				return false;
			}
			else if (destType === UnitType.ALLY) {
				// unitDest is priority
				return false;
			}
			else {
				return true;
			}
		}
		
		// This processing is not executed.
		return true;
	}

	static getDyamicWindowY(unit?, targetUnit?, baseHeight?) {
		var i, y, yLine, height, yCeneter;
		var d = LayoutControl.getRelativeY(6) - 40;
		var range = [,,,];
		var space = [,,,];
		
		if (unit === null || targetUnit === null) {
			return 0;
		}
		
		height = baseHeight;
		yCeneter = root.getGameAreaHeight() / 2;
		
		// It's a case which the window is allocated at the top.
		range[0] = 0;
		space[0] = d;
		
		// It's a case which the window is allocated at the bottom.
		range[1] = root.getGameAreaHeight() - height;
		space[1] = -d;
		
		// It's a case which the window is allocated at the center (It occurs if the characters have a distance between each other).
		range[2] = yCeneter - (height / 2);
		space[2] = 0;
		
		for (i = 0; i < 3; i++) {
			y = LayoutControl.getPixelY(unit.getMapY());
			
			// If the unit is within a range, overlaps window, so don't continue to process.
			if (range[i] <= y && range[i] + height + space[i] >= y) {
				continue;
			}
			
			y = LayoutControl.getPixelY(targetUnit.getMapY());
			
			if (range[i] <= y && range[i] + height + space[i] >= y) {
				continue;
			}
			
			break;
		}
		
		if (i == 3) {
			// Occurs when the map scroll cursor and the unit are in the same tile.
			i = 2;
		}
		
		yLine = range[i] + space[i];
		
		return yLine;
	}

	static getColorWindowTextUI(unit?) {
		var textui;
		var unitType = unit.getUnitType();
		
		if (unitType === UnitType.PLAYER) {
			textui = root.queryTextUI('player_window');
		}
		else if (unitType === UnitType.ENEMY) {
			textui = root.queryTextUI('enemy_window');
		}
		else {
			textui = root.queryTextUI('partner_window');
		}
		
		return textui;
	}

	static getMaxLv(unit?) {
		var lv = unit.getClass().getMaxLv();
		
		if (lv === -1) {
			lv = DataConfig.getMaxLv();
		}
		
		return lv;
	}

	static getMotionColorIndex(unit?) {
		var colorIndex;
		var motionColor = this.getOriginalMotionColor(unit);
		var unitType = unit.getUnitType();
		
		// 0 means default.
		if (motionColor === 0) {
			if (unitType === UnitType.PLAYER) {
				colorIndex = 0;
			}
			else if (unitType === UnitType.ENEMY) {
				// Refer to -a.
				colorIndex = 1;
			}
			else {
				// Refer to -b.
				colorIndex = 2;
			}
		}
		else {
			// Refer to after -c.
			colorIndex = motionColor + 2;
		}
		
		return colorIndex;
	}

	static getOriginalMotionColor(unit?) {
		return unit.getOriginalMotionColor();
	}

	static changeClass(unit?, newClass?) {
		unit.setClass(newClass);
	}

	static playFootstep(cls?) {
		MediaControl.soundPlay(cls.getClassType().getMoveSoundHandle());
	}

	static getRandomBackgroundHandle() {
		var isRuntime = false;
		var list, count, graphicsIndex, colorIndex, pic, graphicsId;
		
		// Check the original background at first.
		list = root.getBaseData().getGraphicsResourceList(GraphicsType.EVENTBACK, isRuntime);
		count = list.getCount();
		if (count === 0) {
			isRuntime = true;
			list = root.getBaseData().getGraphicsResourceList(GraphicsType.EVENTBACK, isRuntime);
			count = list.getCount();
		}
		
		graphicsIndex = root.getRandomNumber() % count;
		
		// Get the color of 0, 1, or 2 (Morning, Evening, Night).
		colorIndex = root.getRandomNumber() % 3;
		
		pic = list.getCollectionData(graphicsIndex, colorIndex);
		if (pic !== null) {
			graphicsId = pic.getId();
		}
		else {
			colorIndex = 0;
			pic = list.getCollectionData(graphicsIndex, colorIndex);
			if (pic !== null) {
				graphicsId = pic.getId();
			}
			else {
				graphicsId = list.getCollectionData(0, 0).getId();
			}
		}
		
		return root.createResourceHandle(isRuntime, graphicsId, colorIndex, 0, 0);
	}

	static convertSpeedType(speedType?) {
		var speed;
		
		if (speedType === SpeedType.DIRECT) {
			speed = 6;
		}
		else if (speedType === SpeedType.SUPERHIGH) {
			speed = 5;
		}
		else if (speedType === SpeedType.HIGH) {
			speed = 4;
		}
		else if (speedType === SpeedType.NORMAL) {
			speed = 3;
		}
		else if (speedType === SpeedType.LOW) {
			speed = 2;
		}
		else {
			speed = 1;
		}
		
		return speed;
	}

	
	// Size can express with GraphicsFormat.EFFECT_WIDTH etc.,
	// but sometimes, sprite is zoomed in/out, so get explicitly.
	// If the first frame is zoomed in/out, the following frame is supposed as the same size.
	static getFirstKeySpriteSize(effectAnimeData?, motionId?) {
		var realEffect;
		var frameIndex = 0;
		
		// Reference the current index of the animation frame if realEffect is designated in effectAnimeData.
		if (effectAnimeData !== null && typeof effectAnimeData._motion !== 'undefined') {
			realEffect = effectAnimeData;
			frameIndex = realEffect.getAnimeMotion().getFrameIndex();
			effectAnimeData = realEffect.getAnimeMotion().getAnimeData();
		}
		
		return this._getKeySpriteSizeInternal(effectAnimeData, motionId, frameIndex);
	}

	static _getKeySpriteSizeInternal(effectAnimeData?, motionId?, frameIndex?) {
		var spriteIndex;
		var effectWidth = GraphicsFormat.EFFECT_WIDTH;
		var effectHeight = GraphicsFormat.EFFECT_HEIGHT;
		
		if (effectAnimeData !== null) {
			spriteIndex = effectAnimeData.getSpriteIndexFromType(motionId, frameIndex, SpriteType.KEY);
			effectWidth = effectAnimeData.getSpriteWidth(motionId, frameIndex, spriteIndex);
			effectHeight = effectAnimeData.getSpriteHeight(motionId, frameIndex, spriteIndex);
		}
		
		return {
			width: effectWidth,
			height: effectHeight
		};
	}

	static convertAIValue(value?) {
		var limitHp = DataConfig.getMaxParameter(0);
		
		// For the hit rate is within a range of 0 to 100, the criteria of the weapon pow differs depending on the game.
		// To fit the same criteria as the hit rate, if checking the game limit HP, adjust the pow.
		if (limitHp < 100) {
			value *= 6;
		}
		else if (limitHp < 500) {
			value *= 1;
		}
		else if (limitHp < 1000) {
			value /= 2;
		}
		else {
			value /= 5;
		}
		
		return value;
	}

	static isPrepareScene() {
		var scene = root.getBaseScene();
		
		return scene === SceneType.BATTLESETUP || scene === SceneType.REST;
	}

	static changeHpBonus(unit?, mhpPrev?) {
		var mhpNew, curHp, value;
		
		mhpNew = ParamBonus.getMhp(unit);
		
		// Get the current HP, not the unit maximum HP. 
		curHp = unit.getHp();
		
		// Get the difference of the maximum HP which increased/decreased by class change.
		value = mhpNew - mhpPrev;
		if (value > 0) {
			// Increase the current HP according to increase/decrease.
			unit.setHp(curHp + value);
		}
		else if (curHp > mhpNew) {
			// The current HP exceeds the maximum HP, set the current HP as the maximum HP.
			unit.setHp(mhpNew);
		}
	}
}
