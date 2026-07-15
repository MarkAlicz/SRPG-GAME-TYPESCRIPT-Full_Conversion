
class ParamGroup {

	static _objectArray: any = null;

	static initSingleton() {
		this._objectArray = [];
		this._configureUnitParameters(this._objectArray);
	}

	
	// Get the parameter such as the unit HP or power etc.
	static getUnitValue(unit?, i?) {
		return this._objectArray[i].getUnitValue(unit);
	}

	static setUnitValue(unit?, i?, value?) {
		this._objectArray[i].setUnitValue(unit, value);
	}

	
	// Get the parameter including class bonus.
	static getClassUnitValue(unit?, i?) {
		var value = this._objectArray[i].getUnitValue(unit) + this._objectArray[i].getParameterBonus(unit.getClass());
		
		return this.getValidValue(unit, value, i);
	}

	
	// Get the parameter bonus such as items etc.
	static getParameterBonus(obj?, i?) {
		return this._objectArray[i].getParameterBonus(obj);
	}

	
	// Get the growth value bonus of items etc.
	static getGrowthBonus(obj?, i?) {
		return this._objectArray[i].getGrowthBonus(obj);
	}

	
	// Get the doping value of the doping item.
	static getDopingParameter(obj?, i?) {
		return this._objectArray[i].getDopingParameter(obj);
	}

	static getAssistValue(obj?, i?) {
		return this._objectArray[i].getAssistValue(obj);
	}

	static getValidValue(unit?, value?, i?) {
		var max = this.getMaxValue(unit, i);
		var min = this.getMinValue(unit, i);
		
		if (value > max) {
			// If it's greater than the parameter's maximum value, include in the maximum value.
			value = max;
		}
		else if (value < min) {
			// If it's less than the parameter's minimum value, include in the minimum value.
			value = min;
		}
		
		return value;
	}

	
	// Get the maximum value of parameter.
	static getMaxValue(unit?, i?) {
		return this._objectArray[i].getMaxValue(unit);
	}

	
	// Get the minimum value of parameter.
	static getMinValue(unit?, i?) {
		return this._objectArray[i].getMinValue(unit);
	}

	
	// Get the parameter name.
	static getParameterName(i?) {
		return this._objectArray[i].getParameterName();
	}

	static getParameterType(i?) {
		return this._objectArray[i].getParameterType();
	}

	static isParameterDisplayable(unitStatusType?, i?) {
		return this._objectArray[i].isParameterDisplayable(unitStatusType);
	}

	static isParameterRenderable(i?) {
		return this._objectArray[i].isParameterRenderable();
	}

	static drawUnitParameter(x?, y?, statusEntry?, isSelect?, i?) {
		return this._objectArray[i].drawUnitParameter(x, y, statusEntry, isSelect);
	}

	
	// Get the total amount of parameter.
	static getParameterCount(i?) {
		return this._objectArray.length;
	}

	
	// Get the parameter bonus of weapon or possession item.
	static getUnitTotalParamBonus(unit?, i?, weapon?) {
		return this._objectArray[i].getUnitTotalParamBonus(unit, weapon);
	}

	
	// Get the growth value bonus of weapon or possession item.
	static getUnitTotalGrowthBonus(unit?, i?, weapon?) {
		return this._objectArray[i].getUnitTotalGrowthBonus(unit, weapon);
	}

	static getParameterIndexFromType(type?) {
		var i;
		var count = this.getParameterCount();
		
		for (i = 0; i < count; i++) {
			if (this.getParameterType(i) === type) {
				return i;
			}
		}
		
		return -1;
	}

	
	// This method cannot call getValidValue, so the return value can exceed "Parameter Limit".
	static getLastValue(unit?, index?, weapon?) {
		var n = this.getClassUnitValue(unit, index) + this.getUnitTotalParamBonus(unit, index, weapon) + StateControl.getStateParameter(unit, index);
		
		n = FusionControl.getLastValue(unit, index, n);
		
		n = MetamorphozeControl.getLastValue(unit, index, n);
		
		return n;
	}

	static _configureUnitParameters(groupArray?) {
		groupArray.appendObject(UnitParameter.MHP);
		groupArray.appendObject(UnitParameter.POW);
		groupArray.appendObject(UnitParameter.MAG);
		groupArray.appendObject(UnitParameter.SKI);
		groupArray.appendObject(UnitParameter.SPD);
		groupArray.appendObject(UnitParameter.LUK);
		groupArray.appendObject(UnitParameter.DEF);
		groupArray.appendObject(UnitParameter.MDF);
		groupArray.appendObject(UnitParameter.MOV);
		groupArray.appendObject(UnitParameter.WLV);
		groupArray.appendObject(UnitParameter.BLD);
	}
}

class BaseUnitParameter extends BaseObject {

	// NOTE (JS->TS conversion): called polymorphically (this.getSignal()) but only declared on
	// subclasses in the original - same template-method pattern as isMarshalScreenCloesed.
	getSignal(): any { return undefined; }

	getUnitValue(unit?) {
		return unit.getParamValue(this.getParameterType());
	}

	setUnitValue(unit?, value?) {
		unit.setParamValue(this.getParameterType(), value);
	}

	
	// Obj is the unit, class, or weapon etc.
	getParameterBonus(obj?) {
		return this._getAssistValue(obj.getParameterBonus());
	}

	
	// Obj is the unit, class, or weapon etc.
	getGrowthBonus(obj?) {
		return this._getAssistValue(obj.getGrowthBonus());
	}

	
	// Obj is CommandParameterChange, Item, State, or TurnState.
	getDopingParameter(obj?) {
		return this._getAssistValue(obj.getDopingParameter());
	}

	getMaxValue(unit?) {
		if (DataConfig.isClassLimitEnabled()) {
			// Return "Parameter Limit" of the class.
			return unit.getClass().getMaxParameter(this.getParameterType());
		}
		else {
			// Return "Parameter Limit" of the config.
			return DataConfig.getMaxParameter(this.getParameterType());
		}
	}

	getMinValue(unit?) {
		return 0;
	}

	getParameterName() {
		return root.queryCommand(this.getSignal() + '_param');
	}

	getParameterType() {
		return -1;
	}

	isParameterDisplayable(unitStatusType?) {
		return true;
	}

	isParameterRenderable() {
		return false;
	}

	drawUnitParameter(x?, y?, statusEntry?, isSelect?) {
	}

	getUnitTotalParamBonus(unit?, weapon?) {
		var d = 0;
		
		// Weapon parameter bonus
		if (weapon !== null) {
			d += this.getParameterBonus(weapon);
		}
		
		// Item parameter bonus
		d += this._getItemBonus(unit, true);
		
		// Check the skill of parameter bonus.
		d += this._getSkillBonus(unit, weapon);
		
		return d;
	}

	getUnitTotalGrowthBonus(unit?, weapon?) {
		var d = this.getGrowthBonus(unit.getClass());
		
		if (weapon !== null) {
			d += this.getGrowthBonus(weapon);
		}
		
		return d + this._getItemBonus(unit, false);
	}

	_getAssistValue(parameterObject?) {
		return parameterObject.getAssistValue(this.getParameterType());
	}

	_getItemBonus(unit?, isParameter?) {
		var i, item, n;
		var d = 0;
		var checkerArray = [];
		var count = UnitItemControl.getPossessionItemCount(unit);
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (!ItemIdentityChecker.isItemReused(checkerArray, item)) {
				continue;
			}
			
			if (isParameter) {
				n = this.getParameterBonus(item);
			}
			else {
				n = this.getGrowthBonus(item);
			}
			
			// Correction is not added for the unit who cannot use the item.
			if (n !== 0 && ItemControl.isItemUsable(unit, item)) {
				d += n;
			}
		}
		
		return d;
	}

	_getSkillBonus(unit?, weapon?) {
		var i, skill;
		var d = 0;
		var arr = SkillControl.getSkillObjectArray(unit, weapon, SkillType.PARAMBONUS, '', this._getParamBonusObjectFlag());
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			skill = arr[i].skill;
			if (this._isSkillAllowed(unit, skill)) {
				d += this.getParameterBonus(skill);
			}
		}
		
		return d;
	}

	_isSkillAllowed(unit?, skill?) {
		return true;
	}

	_getParamBonusObjectFlag() {
		// The weapon and the item set the direct parameter bonus,
		// not the parameter bonus skill.
		return ObjectFlag.UNIT | ObjectFlag.CLASS | ObjectFlag.STATE | ObjectFlag.TERRAIN;
	}
}

namespace UnitParameter {
export class MHP extends BaseUnitParameter {

	getParameterType() {
		return ParamType.MHP;
	}

	getSignal() {
		return 'hp';
	}

	getMinValue(unit?) {
		// The minimum value of the maximum HP is 1.
		// The unit doesn't die with a change of the parameter.
		return 1;
	}

	isParameterDisplayable(unitStatusType?) {
		// Display if it's not the unit menu.
		return unitStatusType !== UnitStatusType.UNITMENU;
	}
}

export class POW extends BaseUnitParameter {

	getParameterType() {
		return ParamType.POW;
	}

	getSignal() {
		return 'pow';
	}
}

export class MAG extends BaseUnitParameter {

	getParameterType() {
		return ParamType.MAG;
	}

	getSignal() {
		return 'mag';
	}
}

export class SKI extends BaseUnitParameter {

	getParameterType() {
		return ParamType.SKI;
	}

	getSignal() {
		return 'ski';
	}
}

export class SPD extends BaseUnitParameter {

	getParameterType() {
		return ParamType.SPD;
	}

	getSignal() {
		return 'spd';
	}
}

export class LUK extends BaseUnitParameter {

	getParameterType() {
		return ParamType.LUK;
	}

	getSignal() {
		return 'luk';
	}
}

export class DEF extends BaseUnitParameter {

	getParameterType() {
		return ParamType.DEF;
	}

	getSignal() {
		return 'def';
	}
}

export class MDF extends BaseUnitParameter {

	getParameterType() {
		return ParamType.MDF;
	}

	getSignal() {
		return 'mdf';
	}
}

export class MOV extends BaseUnitParameter {

	getParameterType() {
		return ParamType.MOV;
	}

	getSignal() {
		return 'mov';
	}
}

export class WLV extends BaseUnitParameter {

	getParameterType() {
		return ParamType.WLV;
	}

	getSignal() {
		return 'wlv';
	}

	isParameterDisplayable(unitStatusType?) {
		return DataConfig.isWeaponLevelDisplayable();
	}
}

export class BLD extends BaseUnitParameter {

	getParameterType() {
		return ParamType.BLD;
	}

	getSignal() {
		return 'bld';
	}

	isParameterDisplayable(unitStatusType?) {
		return DataConfig.isBuildDisplayable();
	}
}
}

// Get the unit power etc. including bonus.
class ParamBonus {

	static getMhp(unit?) {
		var n = this.getBonus(unit, ParamType.MHP);
		
		// Cache so as not to refer to it every time when the map unit HP displays.
		unit.saveMhp(n);
		
		return n;
	}

	static getStr(unit?) {
		return this.getBonus(unit, ParamType.POW);
	}

	static getMag(unit?) {
		return this.getBonus(unit, ParamType.MAG);
	}

	static getSki(unit?) {
		return this.getBonus(unit, ParamType.SKI);
	}

	static getSpd(unit?) {
		return this.getBonus(unit, ParamType.SPD);
	}

	static getLuk(unit?) {
		return this.getBonus(unit, ParamType.LUK);
	}

	static getDef(unit?) {
		return this.getBonus(unit, ParamType.DEF);
	}

	static getMdf(unit?) {
		return this.getBonus(unit, ParamType.MDF);
	}

	static getMov(unit?) {
		return this.getBonus(unit, ParamType.MOV);
	}

	static getWlv(unit?) {
		return this.getBonus(unit, ParamType.WLV);
	}

	static getBld(unit?) {
		return this.getBonus(unit, ParamType.BLD);
	}

	static getBonus(unit?, type?) {
		var weapon = ItemControl.getEquippedWeapon(unit);
		
		return this.getBonusFromWeapon(unit, type, weapon);
	}

	static getBonusFromWeapon(unit?, type?, weapon?) {
		var i, typeTarget, n;
		var index = -1;
		var count = ParamGroup.getParameterCount();
		
		for (i = 0; i < count; i++) {
			typeTarget = ParamGroup.getParameterType(i);
			if (type === typeTarget) {
				index = i;
				break;
			}
		}
		
		if (index === -1) {
			return 0;
		}
		
		n = ParamGroup.getLastValue(unit, index, weapon);
		if (type === ParamType.MHP) {
			if (n < 1) {
				n = 1;
			}
		}
		else {
			if (n < 0) {
				n = 0;
			}
		}
		
		return n;
	}
}

class RealBonus {

	static getMhp(unit?) {
		return ParamBonus.getMhp(unit);
	}

	static getStr(unit?) {
		return ParamBonus.getStr(unit);
	}

	static getMag(unit?) {
		return ParamBonus.getMag(unit);
	}

	static getSki(unit?) {
		return ParamBonus.getSki(unit);
	}

	static getSpd(unit?) {
		return ParamBonus.getSpd(unit);
	}

	static getLuk(unit?) {
		return ParamBonus.getLuk(unit);
	}

	static getDef(unit?) {
		var terrain;
		var def = 0;
		
		if (unit.getClass().getClassType().isTerrainBonusEnabled()) {
			terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
			if (terrain !== null) {
				def = terrain.getDef();
			}
		}
		
		return ParamBonus.getDef(unit) + def;
	}

	static getMdf(unit?) {
		var terrain;
		var mdf = 0;
		
		if (unit.getClass().getClassType().isTerrainBonusEnabled()) {
			terrain = PosChecker.getTerrainFromPos(unit.getMapX(), unit.getMapY());
			if (terrain !== null) {
				mdf = terrain.getMdf();
			}
		}
		
		return ParamBonus.getMdf(unit) + mdf;
	}

	static getMov(unit?) {
		return ParamBonus.getMov(unit);
	}

	static getWlv(unit?) {
		return ParamBonus.getWlv(unit);
	}

	static getBld(unit?) {
		return ParamBonus.getBld(unit);
	}
}
