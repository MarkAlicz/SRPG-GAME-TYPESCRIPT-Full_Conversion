
// NOTE (JS->TS conversion): captured here, at file scope, before the ItemSentence namespace below
// declares its own WeaponOption_NSMember class. ItemSentence.WeaponOption (the namespaced class) and
// the global WeaponOption (enum, constants/constants-enumeratedtype.ts) share a name; TS namespace
// merging means an alias declared *anywhere* inside a `namespace ItemSentence {}` block is visible
// throughout every block of that namespace, so there's no way to alias it back in from inside. This
// capture is what ItemSentence.WeaponOption_NSMember's own methods use instead of the bare (shadowed)
// name to reach the real enum. External code still refers to the class as ItemSentence.WeaponOption_NSMember.
const _GlobalWeaponOption = WeaponOption;

class ItemInfoWindow extends BaseWindow {

	_item: any = null;

	_groupArray: any = null;

	_windowHeight: any = 0;

	
	// Replace a property of the BaseWindow.
	_isWindowEnabled: any = false;

	moveWindowContent() {
		var i, count;
		
		if (this._item === null) {
			return MoveResult.CONTINUE;
		}
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].moveItemSentence();
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var i, count;
		
		if (this._item === null) {
			return;
		}
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].drawItemSentence(x, y, this._item);
			y += this._groupArray[i].getItemSentenceCount(this._item) * ItemInfoRenderer.getSpaceY();
		}
	}

	getWindowWidth() {
		return ItemRenderer.getItemWindowWidth();
	}

	getWindowHeight() {
		return this._windowHeight;
	}

	setInfoItem(item?) {
		var i, count;
		var partsCount = 0;
		
		this._item = item;
		this._groupArray = [];
		this._windowHeight = 0;
		
		if (typeof this._item === 'undefined') {
			this._item = null;
		}
		
		if (this._item === null) {
			// Don't allow to draw the window frame etc.
			this.enableWindow(false);
			return;
		}
		
		if (this._item.isWeapon()) {
			this._configureWeapon(this._groupArray);
		}
		else {
			this._configureItem(this._groupArray);
		}
		
		count = this._groupArray.length;
		for (i = 0; i < count; i++) {
			this._groupArray[i].setParentWindow(this);
			partsCount += this._groupArray[i].getItemSentenceCount(this._item);
		}
		
		this._windowHeight = (partsCount + 1) * ItemInfoRenderer.getSpaceY();
		
		this.enableWindow(true);
	}

	getInfoItem() {
		return this._item;
	}

	_configureWeapon(groupArray?) {
		groupArray.appendObject(ItemSentence.AttackAndHit);
		groupArray.appendObject(ItemSentence.CriticalAndRange);
		groupArray.appendObject(ItemSentence.WeaponLevelAndWeight);
		groupArray.appendObject(ItemSentence.AdditionState);
		groupArray.appendObject(ItemSentence.WeaponOption_NSMember);
		groupArray.appendObject(ItemSentence.Effective);
		groupArray.appendObject(ItemSentence.ReverseWeapon);
		groupArray.appendObject(ItemSentence.Skill);
		groupArray.appendObject(ItemSentence.Only);
		groupArray.appendObject(ItemSentence.Bonus);
	}

	_configureItem(groupArray?) {
		groupArray.appendObject(ItemSentence.WeaponLevelAndWeight);
		groupArray.appendObject(ItemSentence.Info);
		groupArray.appendObject(ItemSentence.ResistState);
		groupArray.appendObject(ItemSentence.Skill);
		groupArray.appendObject(ItemSentence.Target);
		groupArray.appendObject(ItemSentence.Only);
		groupArray.appendObject(ItemSentence.Bonus);
	}
}

class BaseItemSentence extends BaseObject {

	_itemInfoWindow: any = null;

	setParentWindow(itemInfoWindow?) {
		this._itemInfoWindow = itemInfoWindow;
	}

	moveItemSentence() {
		return MoveResult.CONTINUE;
	}

	drawItemSentence(x?, y?, item?) {
	}

	getItemSentenceCount(item?) {
		return 0;
	}

	_getMiddleSpace() {
		return 42;
	}
}

namespace ItemSentence {
export class AttackAndHit extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var text;
		
		text = root.queryCommand('attack_capacity');
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		NumberRenderer.drawRightNumber(x, y, item.getPow());
		
		x += this._getMiddleSpace();
		
		text = root.queryCommand('hit_capacity');
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		NumberRenderer.drawRightNumber(x, y, item.getHit());
	}

	getItemSentenceCount(item?) {
		return 1;
	}
}

export class CriticalAndRange extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var text;
		
		text = root.queryCommand('critical_capacity');
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		NumberRenderer.drawRightNumber(x, y, item.getCritical());
		
		x += this._getMiddleSpace();
		
		text = root.queryCommand('range_capacity');
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		this._drawRange(x, y, item);
	}

	getItemSentenceCount(item?) {
		return 1;
	}

	_drawRange(x?, y?, item?) {
		var startRange = item.getStartRange();
		var endRange = item.getEndRange();
		var textui = root.queryTextUI('default_window');
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (startRange === endRange) {
			NumberRenderer.drawRightNumber(x, y, startRange);
		}
		else {
			NumberRenderer.drawRightNumber(x, y, startRange);
			TextRenderer.drawKeywordText(x + 17, y, StringTable.SignWord_WaveDash, -1, color, font);
			NumberRenderer.drawRightNumber(x + 40, y, endRange);
		}
	}
}

export class WeaponLevelAndWeight extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var text;
		var dx = 0;
		
		if (this._isWeaponLevelDisplayable(item)) {
			text = root.queryCommand('wlv_param');
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, item.getWeaponLevel());
			
			x += this._getMiddleSpace();
		}
		
		if (this._isWeightDisplayable(item)) {
			text = root.queryCommand('weight_capacity');
			ItemInfoRenderer.drawKeyword(x, y, text);
			x += ItemInfoRenderer.getSpaceX();
			NumberRenderer.drawRightNumber(x, y, item.getWeight());
		}
	}

	getItemSentenceCount(item?) {
		var isWeaponLevel = this._isWeaponLevelDisplayable(item);
		var isWeight = this._isWeightDisplayable(item);
		
		return (isWeaponLevel || isWeight) ? 1 : 0;
	}

	_isWeaponLevelDisplayable(item?) {
		if (!item.isWeapon()) {
			return false;
		}
		
		return DataConfig.isWeaponLevelDisplayable();
	}

	_isWeightDisplayable(item?) {
		// Don't display at the time when the item weighs 0.
		if (!item.isWeapon() && item.getWeight() === 0) {
			return false;
		}
		
		return DataConfig.isItemWeightDisplayable();
	}
}

export class AdditionState extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var text, stateInvocation;
		var textui = root.queryTextUI('default_window');
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (!this._isState(item)) {
			return;
		}
		
		stateInvocation = item.getStateInvocation();
		
		text = StringTable.State_Addition;
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		
		text = InvocationRenderer.getInvocationText(stateInvocation.getInvocationValue(), stateInvocation.getInvocationType());
		TextRenderer.drawKeywordText(x, y, stateInvocation.getState().getName() + ' ' + text, -1, color, font);
	}

	getItemSentenceCount(item?) {
		return this._isState(item) ? 1 : 0;
	}

	_isState(item?) {
		return item.getStateInvocation().getState() !== null;
	}
}

export class WeaponOption_NSMember extends BaseItemSentence {
	drawItemSentence(x?, y?, item?) {
		var text;
		var attackCount = item.getAttackCount();
		
		if (attackCount > 1) {
			ItemInfoRenderer.drawKeyword(x, y, attackCount + StringTable.ItemWord_MultiAttack);
			x += 100;
		}
		
		text = this._getWeaponOptionText(item);
		if (text !== '') {
			ItemInfoRenderer.drawKeyword(x, y, text);
		}
	}

	getItemSentenceCount(item?) {
		return (item.getAttackCount() > 1 || item.getWeaponOption() !== _GlobalWeaponOption.NONE) ? 1 : 0;
	}

	_getWeaponOptionText(item?) {
		var text;
		var option = item.getWeaponOption();
		
		if (option === _GlobalWeaponOption.HPABSORB) {
			text = StringTable.WeaponOption_HpAbsorb;
		}
		else if (option === _GlobalWeaponOption.NOGUARD) {
			text = StringTable.WeaponOption_NoGuard;
		}
		else if (option === _GlobalWeaponOption.HPMINIMUM) {
			text = StringTable.WeaponOption_HpMinimum;
		}
		else if (option === _GlobalWeaponOption.HALVEATTACK) {
			text = StringTable.WeaponOption_HalveAttack;
		}
		else if (option === _GlobalWeaponOption.HALVEATTACKBREAK) {
			text = StringTable.WeaponOption_HalveAttackBreak;
		}
		else if (option === _GlobalWeaponOption.SEALATTACK) {
			text = StringTable.WeaponOption_SealAttack;
		}
		else if (option === _GlobalWeaponOption.SEALATTACKBREAK) {
			text = StringTable.WeaponOption_SealAttackBreak;
		}
		else {
			text = '';
		}
		
		return text;
	}
}

export class Effective extends BaseItemSentence {

	_aggregationViewer: any = null;

	setParentWindow(itemInfoWindow?) {
		var item = itemInfoWindow.getInfoItem();
		var aggregation = this._getAggregation(item);
		
		super.setParentWindow(itemInfoWindow);
		
		this._aggregationViewer = createObject(AggregationViewer);
		this._aggregationViewer.setAggregationViewer(aggregation);
	}

	moveAggregationViewer() {
		return MoveResult.CONTINUE;
	}

	drawItemSentence(x?, y?, item?) {
		this._aggregationViewer.drawAggregationViewer(x, y, this._getName());
	}

	getItemSentenceCount(item?) {
		return this._aggregationViewer.getAggregationViewerCount();
	}

	_getName() {
		return root.queryCommand('effective_capacity');
	}

	_getAggregation(item?) {
		return item.getEffectiveAggregation();
	}
}

export class ReverseWeapon extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var text;
		
		if (this.getItemSentenceCount(item) === 1) {
			text = Miscellaneous.isPhysicsBattle(item) ? StringTable.ReverseWeapon_Physics : StringTable.ReverseWeapon_Magic;
			ItemInfoRenderer.drawKeyword(x, y, text);
		}
	}

	getItemSentenceCount(item?) {
		return (item.isWeapon() && item.isReverseWeapon()) ? 1 : 0;
	}
}

export class ResistState extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		ItemInfoRenderer.drawState(x, y, item.getStateGroup(), false);
	}

	getItemSentenceCount(item?) {
		return ItemInfoRenderer.getStateCount(item.getStateGroup());
	}
}

export class Info extends BaseItemSentence {

	_itemInfo: any = null;

	setParentWindow(itemInfoWindow?) {
		var item = itemInfoWindow.getInfoItem();
		
		super.setParentWindow(itemInfoWindow);
		
		this._itemInfo = ItemPackageControl.getItemInfoObject(item);
		if (this._itemInfo === null) {
			return;
		}
		
		this._itemInfo.setInfoItem(item);
	}

	moveItemSentence() {
		if (this._itemInfo === null) {
			return MoveResult.CONTINUE;
		}
		
		return this._itemInfo.moveItemInfoCycle();
	}

	drawItemSentence(x?, y?, item?) {
		if (this._itemInfo === null) {
			return;
		}
		
		this._itemInfo.drawItemInfoCycle(x, y);
	}

	getItemSentenceCount(item?) {
		if (this._itemInfo === null) {
			return 0;
		}
		
		return this._itemInfo.getInfoPartsCount();
	}
}

export class Skill extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var refList = item.getSkillReferenceList();
		
		if (this.getItemSentenceCount(item) === 0) {
			return 0;
		}
		
		ItemInfoRenderer.drawKeyword(x, y, root.queryCommand('skill_object'));
		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer.drawList(x, y, refList);
	}

	getItemSentenceCount(item?) {
		var refList = item.getSkillReferenceList();
		
		return refList.getTypeCount() - refList.getHiddenCount();
	}
}

export class Target extends BaseItemSentence {

	_aggregationViewer: any = null;

	_matchtype: any = 0;

	setParentWindow(itemInfoWindow?) {
		var item = itemInfoWindow.getInfoItem();
		var aggregation = this._getAggregation(item);
		
		super.setParentWindow(itemInfoWindow);
		
		this._aggregationViewer = createObject(AggregationViewer);
		this._aggregationViewer.setEnabled(DataConfig.isAggregationVisible());
		this._aggregationViewer.setAggregationViewer(aggregation);
		
		this._matchtype = aggregation.getMatchType();
	}

	moveAggregationViewer() {
		return MoveResult.CONTINUE;
	}

	drawItemSentence(x?, y?, item?) {
		this._aggregationViewer.drawAggregationViewer(x, y, this._getMatchName());
	}

	getItemSentenceCount(item?) {
		return this._aggregationViewer.getAggregationViewerCount();
	}

	_getMatchName() {
		var text;
		
		if (this._matchtype === MatchType.MATCH) {
			text = StringTable.Aggregation_Match;
		}
		else if (this._matchtype === MatchType.MISMATCH) {
			text = StringTable.Aggregation_Mismatch;
		}
		else if (this._matchtype === MatchType.MATCHALL) {
			text = StringTable.Aggregation_MatchAll;
		}
		else {
			text = StringTable.Aggregation_MismatchAll;
		}
		
		return text;
	}

	_getAggregation(item?) {
		return item.getTargetAggregation();
	}
}

export class Only extends BaseItemSentence {

	_aggregationViewer: any = null;

	setParentWindow(itemInfoWindow?) {
		var item = itemInfoWindow.getInfoItem();
		var aggregation = this._getAggregation(item);
		
		super.setParentWindow(itemInfoWindow);
		
		this._aggregationViewer = createObject(AggregationViewer);
		this._aggregationViewer.setAggregationViewer(aggregation);
	}

	moveAggregationViewer() {
		return MoveResult.CONTINUE;
	}

	drawItemSentence(x?, y?, item?) {
		this._aggregationViewer.drawAggregationViewer(x, y, this._getName());
	}

	getItemSentenceCount(item?) {
		return this._aggregationViewer.getAggregationViewerCount();
	}

	_getName() {
		return root.queryCommand('only_capacity');
	}

	_getAggregation(item?) {
		return item.getAvailableAggregation();
	}
}

export class Bonus extends BaseItemSentence {

	drawItemSentence(x?, y?, item?) {
		var i, n;
		var count = ParamGroup.getParameterCount();
		
		for (i = 0; i < count; i++) {
			n = ParamGroup.getParameterBonus(item, i);
			if (n !== 0) {
				break;
			}
		}
		
		if (i === count) {
			return 0;
		}
		
		ItemInfoRenderer.drawKeyword(x, y, root.queryCommand('support_capacity'));
		x += ItemInfoRenderer.getSpaceX();
		ItemInfoRenderer.drawDoping(x, y, item, true);
	}

	getItemSentenceCount(item?) {
		return ItemInfoRenderer.getDopingCount(item, true);
	}
}
}

class ItemInfoRenderer {

	static drawKeyword(x?, y?, text?) {
		var textui = this.getTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		
		TextRenderer.drawKeywordText(x, y, text, -1, color, font);
	}

	static drawList(x?, y?, refList?) {
		var i, data;
		var count = refList.getTypeCount();
		var objectType = refList.getObjectType();
		var isCheck = false;
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (objectType === ObjectType.SKILL || objectType === ObjectType.STATE) {
			isCheck = true;
		}
		
		// The length of the name is not the same, so it's difficult to do multiple drawings on the same line.
		// So the line increases according to the number of the name.
		for (i = 0 ; i < count; i++) {
			data = refList.getTypeData(i);
			if (!isCheck || !data.isHidden()) {
				TextRenderer.drawKeywordText(x, y, data.getName(), -1, color, font);
				y += this.getSpaceY();
			}
		}
	}

	static getSpaceX() {
		return ContentLayout.ITEM_SPACE;
	}

	static getSpaceY() {
		return 25;
	}

	static getTextUI() {
		return root.queryTextUI('default_window');
	}

	static getDopingCount(item?, isParameter?) {
		var i, n;
		var count = ParamGroup.getParameterCount();
		var count2 = 0;
		
		for (i = 0; i < count; i++) {
			if (isParameter) {
				n = ParamGroup.getParameterBonus(item, i);
			}
			else {
				n = ParamGroup.getDopingParameter(item, i);
			}
			
			if (n !== 0) {
				count2++;
			}
		}
		
		return count2;
	}

	static drawDoping(x?, y?, item?, isParameter?) {
		var i, n, text;
		var count = ParamGroup.getParameterCount();
		var count2 = 0;
		var xBase = x;
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		for (i = 0; i < count; i++) {
			if (isParameter) {
				n = ParamGroup.getParameterBonus(item, i);
			}
			else {
				n = ParamGroup.getDopingParameter(item, i);
			}
			
			if (n !== 0) {
				text = ParamGroup.getParameterName(i);
				TextRenderer.drawKeywordText(x, y, text, -1, color, font);
				
				x += TextRenderer.getTextWidth(text, font) + 5;
				TextRenderer.drawSignText(x, y, n > 0 ? ' + ': ' - ');
				
				x += 10;
				x += DefineControl.getNumberSpace();
				
				if (n < 0) {
					n *= -1;
				}
				NumberRenderer.drawRightNumber(x, y, n);
				x += 20;
				
				y += this.getSpaceY();
				
				count2++;
				x = xBase;
			}
		}
		
		return count2;
	}

	static getStateCount(stateGroup?) {
		var count, refList;
		
		if (stateGroup.isAllBadState()) {
			count = 1;
		}
		else {
			refList = stateGroup.getStateReferenceList();
			count = refList.getTypeCount() - refList.getHiddenCount();
		}
		
		return count;
	}

	static drawState(x?, y?, stateGroup?, isRecovery?) {
		var text;
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this.getStateCount(stateGroup) === 0) {
			return;
		}
		
		if (isRecovery) {
			text = StringTable.State_Recovery;
		}
		else {
			text = StringTable.State_Regist;
		}
		
		ItemInfoRenderer.drawKeyword(x, y, text);
		x += ItemInfoRenderer.getSpaceX();
		
		if (stateGroup.isAllBadState()) {
			TextRenderer.drawKeywordText(x, y, StringTable.State_AllBadState, -1, color, font);
		}
		else {
			ItemInfoRenderer.drawList(x, y, stateGroup.getStateReferenceList());
		}
	}
}

class AggregationViewer extends BaseObject {

	_arr: any = null;

	_isEnabled: any = true;

	setEnabled(isEnabled?) {
		this._isEnabled = isEnabled;
	}

	setAggregationViewer(aggregation?) {
		var i, count, obj;
		
		this._arr = [];
		
		if (!this._isEnabled) {
			return;
		}
		
		count = aggregation.getObjectCount();
		for (i = 0; i < count; i++) {
			obj = {};
			obj.name = aggregation.getObjectData(i).getName();
			obj.objecttype = aggregation.getObjectType(i);
			
			if (this._isUsed(this._arr, obj.name)) {
				continue;
			}
			
			this._arr.push(obj);
		}
	}

	moveAggregationViewer() {
		return MoveResult.CONTINUE;
	}

	drawAggregationViewer(x?, y?, name?) {
		if (this._arr.length === 0) {
			return 0;
		}
		
		ItemInfoRenderer.drawKeyword(x, y, name);
		x += ItemInfoRenderer.getSpaceX();
		this._drawList(x, y);
	}

	getAggregationViewerCount() {
		return this._arr.length;
	}

	_drawList(x?, y?) {
		var i, obj, name, objecttype, suffix;
		var count = this._arr.length;
		var textui = ItemInfoRenderer.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		for (i = 0 ; i < count; i++) {
			obj = this._arr[i];
			name = obj.name;
			objecttype = obj.objecttype;
			
			if (objecttype === ObjectType.WEAPON) {
				suffix = StringTable.Aggregation_SuffixEquipment;
			}
			else if (objecttype === ObjectType.ITEM || objecttype === ObjectType.SKILL) {
				suffix = StringTable.Aggregation_SuffixPossession;
			}
			else if (objecttype === ObjectType.STATE) {
				suffix = StringTable.Aggregation_SuffixAddition;
			}
			else {
				suffix = '';
			}
			
			TextRenderer.drawKeywordText(x, y, name + suffix, -1, color, font);
			y += ItemInfoRenderer.getSpaceY();
		}
	}

	_isUsed(arr?, name?) {
		var i;
		var count = arr.length;
		
		for (i = 0; i < count; i++) {
			if (arr[i].name === name) {
				return true;
			}
		}
		
		return false;
	}
}

