
class ItemPackageControl {

	static getItemSelectionObject(item?) {
		var obj;
		var type = item.getItemType();
		var arr = [
			null, RecoveryItemSelection, EntireRecoveryItemSelection, DamageItemSelection, DopingItemSelection, 
			ClassChangeItemSelection, SkillChangeItemSelection, KeyItemSelection, QuickItemSelection,
			TeleportationItemSelection, RescueItemSelection, ResurrectionItemSelection, DurabilityChangeItemSelection,
			StealItemSelection, StateItemSelection, StateRecoveryItemSelection, SwitchItemSelection,
			FusionItemSelection, MetamorphozeItemSelection
		];
		
		if (type === ItemType.CUSTOM) {
			obj = this.getCustomItemSelectionObject(item, item.getCustomKeyword());
		}
		else if (type === ItemType.UNUSABLE) {
			return null;
		}
		else {
			obj = arr[type];
		}
		
		return createObject(obj);
	}

	static getItemUseParent(item?) {
		var obj, parent;
		var type = item.getItemType();
		var arr = [
			null, RecoveryItemUse, EntireRecoveryItemUse, DamageItemUse, DopingItemUse,
			ClassChangeItemUse, SkillChangeItemUse, KeyItemUse, QuickItemUse,
			TeleportationItemUse, RescueItemUse, ResurrectionItemUse, DurabilityChangeItemUse,
			StealItemUse, StateItemUse, StateRecoveryItemUse, SwitchItemUse,
			FusionItemUse, MetamorphozeItemUse
		];
	
		if (type === ItemType.CUSTOM) {
			obj = this.getCustomItemUseObject(item, item.getCustomKeyword());
		}
		else if (type === ItemType.UNUSABLE) {
			return null;
		}
		else {
			obj = arr[type];
		}
		
		// Differs from getItemSelectionObject or getItemInfoObject, no return RecoveryItemUse etc.,
		// but return object which includes object.
		parent = createObject(ItemUseParent);
		parent._itemUseObject = createObject(obj);
		
		return parent;
	}

	static getItemInfoObject(item?) {
		var obj;
		var type = item.getItemType();
		var arr = [
			UnusableItemInfo, RecoveryItemInfo, EntireRecoveryItemInfo, DamageItemInfo, DopingItemInfo,
			ClassChangeItemInfo, SkillChangeItemInfo, KeyItemInfo, QuickItemInfo,
			TeleportationItemInfo, RescueItemInfo, ResurrectionItemInfo, DurabilityItemInfo,
			StealItemInfo, StateItemInfo, StateRecoveryItemInfo, SwitchItemInfo,
			FusionItemInfo, MetamorphozeItemInfo
		];
		
		if (type === ItemType.CUSTOM) {
			obj = this.getCustomItemInfoObject(item, item.getCustomKeyword());
		}
		else {
			obj = arr[type];
		}
		
		return createObject(obj);
	}

	static getItemPotencyObject(item?) {
		var obj;
		var type = item.getItemType();
		var arr = [
			UnusableItemPotency, RecoveryItemPotency, EntireRecoveryItemPotency, DamageItemPotency, DopingItemPotency,
			ClassChangeItemPotency, SkillChangeItemPotency, KeyItemPotency, QuickItemPotency,
			TeleportationItemPotency, RescueItemPotency, ResurrectionItemPotency, DurabilityChangeItemPotency,
			StealItemPotency, StateItemPotency, StateRecoveryItemPotency, SwitchItemPotency,
			FusionItemPotency, MetamorphozeItemPotency
		];
		
		if (type === ItemType.CUSTOM) {
			obj = this.getCustomItemPotencyObject(item, item.getCustomKeyword());
		}
		else {
			obj = arr[type];
		}
		
		return createObject(obj);
	}

	static getItemAvailabilityObject(item?) {
		var obj;
		var type = item.getItemType();
		var arr = [
			UnusableItemAvailability, RecoveryItemAvailability, EntireRecoveryItemAvailability, DamageItemAvailability, DopingItemAvailability,
			ClassChangeItemAvailability, SkillChangeItemAvailability, KeyItemAvailability, QuickItemAvailability,
			TeleportationItemAvailability, RescueItemAvailability, ResurrectionItemAvailability, DurabilityChangeItemAvailability,
			StealItemAvailability, StateItemAvailability, StateRecoveryItemAvailability, SwitchItemAvailability,
			FusionItemAvailability, MetamorphozeItemAvailability
		];
		
		if (type === ItemType.CUSTOM) {
			obj = this.getCustomItemAvailabilityObject(item, item.getCustomKeyword());
		}
		else {
			obj = arr[type];
		}
		
		return createObject(obj);
	}

	static getItemAIObject(item?) {
		var obj;
		var type = item.getItemType();
		var arr = [
			UnusableItemAI, RecoveryItemAI, EntireRecoveryItemAI, DamageItemAI, DopingItemAI,
			ClassChangeItemAI, SkillChangeItemAI, KeyItemAI, QuickItemAI,
			TeleportationItemAI, RescueItemAI, ResurrectionItemAI, DurabilityChangeItemAI,
			StealItemAI, StateItemAI, StateRecoveryItemAI, SwitchItemAI,
			FusionItemAI, MetamorphozeItemAI
		];
		
		if (type === ItemType.CUSTOM) {
			obj = this.getCustomItemAIObject(item, item.getCustomKeyword());
		}
		else {
			obj = arr[type];
		}
		
		return createObject(obj);
	}

	static getCustomItemSelectionObject(item?, keyword?) {
		return null;
	}

	static getCustomItemUseObject(item?, keyword?) {
		return null;
	}

	static getCustomItemInfoObject(item?, keyword?) {
		return null;
	}

	static getCustomItemPotencyObject(item?, keyword?) {
		return null;
	}

	static getCustomItemAvailabilityObject(item?, keyword?) {
		return null;
	}

	static getCustomItemAIObject(item?, keyword?) {
		return null;
	}
}

class BaseItemSelection extends BaseObject {

	_unit: any = null;

	_item: any = null;

	_targetUnit: any = null;

	_targetPos: any = null;

	_targetClass: any = null;

	_targetItem: any = null;

	_targetMetamorphoze: any = null;

	_isSelection: any = false;

	_posSelector: any = null;

	enterItemSelectionCycle(unit?, item?) {
		this._unit = unit;
		this._item = item;
		this._targetUnit = this._unit;
		this._targetPos = createPos(this._unit.getMapX(), this._unit.getMapY());
		this._targetClass = null;
		this._targetItem = null;
		this._isSelection = false;
		this._posSelector = createObject(PosSelector);
		
		return this.setInitialSelection();
	}

	moveItemSelectionCycle() {
		var targetUnit;
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this.isPosSelectable()) {
				targetUnit = this._posSelector.getSelectorTarget(false);
				if (targetUnit !== null) {
					this._targetUnit = targetUnit;
				}
				this._isSelection = true;
				this._posSelector.endPosSelector();
				return MoveResult.END;
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._isSelection = false;
			this._posSelector.endPosSelector();
			return MoveResult.END;
		}

		return MoveResult.CONTINUE;
	}

	drawItemSelectionCycle() {
		this._posSelector.drawPosSelector();
	}

	setUnitSelection() {
		var filter = this.getUnitFilter();
		var indexArray = IndexArray.createIndexArray(this._unit.getMapX(), this._unit.getMapY(), this._item);
		
		indexArray = this._getUnitOnlyIndexArray(this._unit, indexArray);
		this._posSelector.setUnitOnly(this._unit, this._item, indexArray, PosMenuType.Item, filter);
		
		this.setFirstPos();
	}

	
	// It's called if the item is used at the specific position.
	setPosSelection() {
		var indexArray = IndexArray.createIndexArray(this._unit.getMapX(), this._unit.getMapY(), this._item);
		
		this._posSelector.setPosOnly(this._unit, this._item, indexArray, PosMenuType.Item);
		
		this.setFirstPos();
	}

	setFirstPos() {
		this._posSelector.setFirstPos();
	}

	isPosSelectable() {
		return this._posSelector.getSelectorTarget(true) !== null;
	}

	getUnitFilter() {
		return FilterControl.getBestFilter(this._unit.getUnitType(), this._item.getFilterFlag());
	}

	setInitialSelection() {
		var rangeType = this._item.getRangeType();
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			this._isSelection = true;
			return EnterResult.NOTENTER;
		}
		else {
			// The item can be used for the unit at the default.
			this.setUnitSelection();
		}
		
		return EnterResult.OK;
	}

	isSelection() {
		return this._isSelection;
	}

	getResultItemTargetInfo() {
		var itemTargetInfo = StructureBuilder.buildItemTargetInfo();
		
		// The caller sets the unit and the item.
		itemTargetInfo.targetUnit = this._targetUnit;
		itemTargetInfo.targetPos = this._targetPos;
		itemTargetInfo.targetClass = this._targetClass;
		itemTargetInfo.targetItem = this._targetItem;
		itemTargetInfo.targetMetamorphoze = this._targetMetamorphoze;
		
		return itemTargetInfo;
	}

	_getUnitOnlyIndexArray(unit?, indexArray?) {
		var i, index, x, y;
		var indexArrayNew = [];
		var count = indexArray.length;
		var obj = ItemPackageControl.getItemAvailabilityObject(this._item);
		
		if (obj === null) {
			return indexArrayNew;
		}
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (obj.isPosEnabled(unit, this._item, x, y)) {
				indexArrayNew.push(index);
			}
		}
		
		return indexArrayNew;
	}
}

class BaseItemUse extends BaseObject {

	enterMainUseCycle(itemUseParent?) {
		return EnterResult.NOTENTER;
	}

	moveMainUseCycle() {
		return MoveResult.END;
	}

	drawMainUseCycle() {
	}

	mainAction() {
	}

	
	// This method is called before calling enterMainUseCycle.
	getItemAnimePos(itemUseParent?, animeData?) {
		return null;
	}

	getUnitBasePos(itemUseParent?, animeData?) {
		var x, y, size, pos;
		var targetUnit = itemUseParent.getItemTargetInfo().targetUnit;
		
		if (Miscellaneous.isPrepareScene()) {
			size = Miscellaneous.getFirstKeySpriteSize(animeData, 0);
			x = LayoutControl.getCenterX(-1, size.width);
			y = LayoutControl.getCenterY(-1, size.height);
			pos = createPos(x, y);
		}
		else {
			if (targetUnit === null) {
				return null;
			}
			
			x = LayoutControl.getPixelX(targetUnit.getMapX());
			y = LayoutControl.getPixelY(targetUnit.getMapY());
			pos = LayoutControl.getMapAnimationPos(x, y, animeData);
		}
		
		return pos;
	}

	
	// 登場していないターゲットにアイテムは使用できない。
	// イベントコマンドの「アイテムの使用」を使用する際に、未登場ターゲットを指定した場合の対策を行う。
	validateItem(itemTargetInfo?) {
		if (itemTargetInfo.item !== null && itemTargetInfo.item.getItemType() === ItemType.CUSTOM) {
			// カスタムアイテムがターゲットを必要とするかは分からないため、無条件に使用可能とみなす
			return true;
		}
		
		// この時点で事前チェックすることで、多くのアイテムのenterMainUseCycleでターゲット検証が不要になる
		return itemTargetInfo.targetUnit !== null;
	}
}

// Pay attention that there's no limitation that BaseItemSelection is used before ItemUseParent is used.
// If the event command "Use Item" is executed or the enemy uses items,
// BaseItemUse is used without the selection mode.
class ItemUseParent extends BaseObject {

	_itemUseObject: any = null;

	_itemTargetInfo: any = null;

	_isItemDecrementDisabled: any = false;

	_isItemSkipMode: any = false;

	_straightFlow: any = null;

	_saveItemExp: any = -1;

	enterUseCycle(itemTargetInfo?) {
		this._prepareMemberData(itemTargetInfo);
		return this._completeMemberData(itemTargetInfo);
	}

	moveUseCycle() {
		if (InputControl.isStartAction()) {
			this.setItemSkipMode(true);
		}
		
		if (this._straightFlow.moveStraightFlow() !== MoveResult.CONTINUE) {
			if (this._itemTargetInfo.isPlayerSideCall) {
				// Skip is unconditionally disabled here by commands through items or wands on the player side,
				// so that skip also doesn't affect the subsequent operation (such as attack).
				this.setItemSkipMode(false);
			}
			this.decreaseItem();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawUseCycle() {
		this._straightFlow.drawStraightFlow();
	}

	disableItemDecrement() {
		this._isItemDecrementDisabled = true;
	}

	isItemSkipMode() {
		return CurrentMap.isCompleteSkipMode();
	}

	setItemSkipMode(isSkipMode?) {
		CurrentMap.setTurnSkipMode(isSkipMode);
		MapLayer.setEffectMotion(null);
	}

	decreaseItem() {
		if (!this._isItemDecrementDisabled) {
			// When an item's durability decreases, it may become a "Broken Item".
			// To prevent referencing the "Exp Gain" of broken items, save the current item's "Exp Gain" separately.
			this._saveItemExp = this._itemTargetInfo.item.getExp();
			
			// Reduce the item durability.
			ItemControl.decreaseItem(this._itemTargetInfo.unit, this._itemTargetInfo.item);
		}
	}

	getItemUseObject() {
		return this._itemUseObject;
	}

	getItemTargetInfo() {
		return this._itemTargetInfo;
	}

	_prepareMemberData(itemTargetInfo?) {
		this._itemTargetInfo = itemTargetInfo;
		this._isItemDecrementDisabled = false;
		this._isItemSkipMode = false;
		this._straightFlow = createObject(StraightFlow);
		this._saveItemExp = -1;
	}

	_completeMemberData(itemTargetInfo?) {
		var result;
		
		this._straightFlow.setStraightFlowData(this);
		this._pushFlowEntries(this._straightFlow);
		
		result = this._straightFlow.enterStraightFlow();
		if (result === EnterResult.NOTENTER) {
			// This code will be executed immediately if no experience or animation is set on the item.
			this.decreaseItem();
		}
		
		return result;
	}

	_pushFlowEntries(straightFlow?) {
		straightFlow.pushFlowEntry(ItemTitleFlowEntry);
		straightFlow.pushFlowEntry(ItemStartScrollFlowEntry);
		straightFlow.pushFlowEntry(ItemMainFlowEntry);
		straightFlow.pushFlowEntry(ItemExpFlowEntry);
	}
}

class ItemTitleFlowEntry extends BaseFlowEntry {

	_itemUseParent: any = null;

	_counter: any = null;

	enterFlowEntry(itemUseParent?) {
		this._prepareMemberData(itemUseParent);
		return this._completeMemberData(itemUseParent);
	}

	moveFlowEntry() {
		if (this._itemUseParent.isItemSkipMode()) {
			return MoveResult.END;
		}
		
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawFlowEntry() {
		var x, y;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var textui = root.queryTextUI('itemuse_title');
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var text = itemTargetInfo.item.getName();
		var width = (TitleRenderer.getTitlePartsCount(text, font) + 2) * TitleRenderer.getTitlePartsWidth();
		
		x = LayoutControl.getUnitCenterX(itemTargetInfo.unit, width, 0);
		y = LayoutControl.getUnitBaseY(itemTargetInfo.unit, TitleRenderer.getTitlePartsHeight()) - 20;
		
		TextRenderer.drawTitleText(x, y, text, color, font, TextFormat.CENTER, pic);
	}

	_prepareMemberData(itemUseParent?) {
		this._itemUseParent = itemUseParent;
		this._counter = createObject(CycleCounter);
	}

	_completeMemberData(itemUseParent?) {
		if (Miscellaneous.isPrepareScene()) {
			return EnterResult.NOTENTER;
		}
		
		if (this._itemUseParent.isItemSkipMode()) {
			return EnterResult.NOTENTER;
		}
		
		this._counter.setCounterInfo(36);
		
		this._playItemUseSound();
		
		return EnterResult.OK;
	}

	_playItemUseSound() {
		MediaControl.soundDirect('itemuse');
	}
}

// If the enemy uses items, scroll towards a target.
// display after the title, it's not included in AutoActionCursor. 
class ItemStartScrollFlowEntry extends BaseFlowEntry {

	_itemUseParent: any = null;

	_mapLineScroll: any = null;

	enterFlowEntry(itemUseParent?) {
		this._prepareMemberData(itemUseParent);
		return this._completeMemberData(itemUseParent);
	}

	moveFlowEntry() {
		return this._mapLineScroll.moveLineScroll();
	}

	drawFlowEntry() {
	}

	_prepareMemberData(itemUseParent?) {
		this._itemUseParent = itemUseParent;
		this._mapLineScroll = createObject(MapLineScroll);
	}

	_completeMemberData(itemUseParent?) {
		var x, y;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var unit = itemTargetInfo.unit;
		
		if (itemUseParent.isItemSkipMode()) {
			return EnterResult.NOTENTER;
		}
		
		if (itemTargetInfo.targetUnit !== null) {
			x = itemTargetInfo.targetUnit.getMapX();
			y = itemTargetInfo.targetUnit.getMapY();
		}
		else if (itemTargetInfo.targetPos !== null) {
			x = itemTargetInfo.targetPos.x;
			y = itemTargetInfo.targetPos.y;
		}
		else {
			return EnterResult.NOTENTER;
		}
		
		if (unit.getUnitType() === UnitType.PLAYER || MapView.isVisible(x, y)) {
			return EnterResult.NOTENTER;
		}
		
		this._mapLineScroll.startLineScroll(x, y);
		
		return EnterResult.OK;
	}
}

class ItemMainMode {

	static ANIME: any = 0;

	static USE: any = 1;
}

// Process according to the item specification.
// For example, if it is HP recovery item, it implements the recovery processing.
class ItemMainFlowEntry extends BaseFlowEntry {

	_itemUseParent: any = null;

	_dynamicAnime: any = null;

	enterFlowEntry(itemUseParent?) {
		this._prepareMemberData(itemUseParent);
		return this._completeMemberData(itemUseParent);
	}

	moveFlowEntry() {
		var result = MoveResult.CONTINUE;
		var mode = this.getCycleMode();
		
		if (mode === ItemMainMode.ANIME) {
			result = this._moveAnime();
		}
		else if (mode === ItemMainMode.USE) {
			result = this._moveUse();
		}
		
		return result;
	}

	drawFlowEntry() {
		var mode = this.getCycleMode();
		
		if (mode === ItemMainMode.ANIME) {
			this._drawAnime();
		}
		else if (mode === ItemMainMode.USE) {
			this._drawUse();
		}
	}

	_prepareMemberData(itemUseParent?) {
		this._itemUseParent = itemUseParent;
		this._dynamicAnime = createObject(DynamicAnime);
	}

	_completeMemberData(itemUseParent?) {
		var animeData = itemUseParent.getItemTargetInfo().item.getItemAnime();
		var pos = itemUseParent.getItemUseObject().getItemAnimePos(itemUseParent, animeData);
		
		if (!itemUseParent.getItemUseObject().validateItem(itemUseParent.getItemTargetInfo())) {
			return EnterResult.NOTENTER;
		}
		
		if (pos === null || itemUseParent.isItemSkipMode()) {
			return this._changeMainUse() ? EnterResult.OK : EnterResult.NOTENTER;
		}
		
		if (animeData !== null) {
			this._dynamicAnime.startDynamicAnime(animeData, pos.x, pos.y);
			this.changeCycleMode(ItemMainMode.ANIME);
			return EnterResult.OK;
		}
		
		return this._changeMainUse();
	}

	_moveAnime() {
		var result = this._dynamicAnime.moveDynamicAnime();
		
		if (result !== MoveResult.CONTINUE) {
			if (this._changeMainUse()) {
				result = MoveResult.CONTINUE;
			}
		}
		
		return result;
	}

	_moveUse() {
		return this._itemUseParent.getItemUseObject().moveMainUseCycle();
	}

	_drawAnime() {
		this._dynamicAnime.drawDynamicAnime();
	}

	_drawUse() {
		this._itemUseParent.getItemUseObject().drawMainUseCycle();
	}

	_changeMainUse() {
		var result = this._itemUseParent.getItemUseObject().enterMainUseCycle(this._itemUseParent, this._itemUseParent.isItemSkipMode()) === EnterResult.OK;
		
		if (result) {
			this.changeCycleMode(ItemMainMode.USE);
		}
		
		return result;
	}
}

// Obtain the exp which is set up at the item.
class ItemExpFlowEntry extends BaseFlowEntry {

	_itemUseParent: any = null;

	_dynamicEvent: any = null;

	enterFlowEntry(itemUseParent?) {
		this._prepareMemberData(itemUseParent);
		return this._completeMemberData(itemUseParent);
	}

	moveFlowEntry() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	drawFlowEntry() {
	}

	_prepareMemberData(itemUseParent?) {
		this._itemUseParent = itemUseParent;
		this._dynamicEvent = createObject(DynamicEvent);
	}

	_completeMemberData(itemUseParent?) {
		var generator;
		var exp = this._getItemExperience(itemUseParent);
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var unit = itemTargetInfo.unit;
		var type = unit.getUnitType();
		
		if (exp === 0 || type !== UnitType.PLAYER) {
			return EnterResult.NOTENTER;
		}
		
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.experiencePlus(unit, exp, itemUseParent.isItemSkipMode());
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	_getItemExperience(itemUseParent?) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var unit = itemTargetInfo.unit;
		var exp = itemTargetInfo.item.getExp();
		
		if (itemUseParent._saveItemExp !== -1) {
			return itemUseParent._saveItemExp;
		}
		
		return ExperienceCalculator.getBestExperience(unit, exp);
	}
}

// Draw item information to display on the menu etc.
class BaseItemInfo extends BaseObject {

	_item: any = null;

	setInfoItem(item?) {
		this._item = item;
	}

	moveItemInfoCycle() {
		return MoveResult.CONTINUE;
	}

	drawItemInfoCycle(x?, y?) {	
	}

	drawRange(x?, y?, rangeValue?, rangeType?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		ItemInfoRenderer.drawKeyword(x, y, root.queryCommand('range_capacity'));
		x += ItemInfoRenderer.getSpaceX();
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			TextRenderer.drawKeywordText(x, y, StringTable.Range_Self, -1, color, font);
		}
		else if (rangeType === SelectionRangeType.MULTI) {
			NumberRenderer.drawRightNumber(x, y, rangeValue);
		}
		else if (rangeType === SelectionRangeType.ALL) {
			TextRenderer.drawKeywordText(x, y, StringTable.Range_All, -1, color, font);
		}
	}

	getInfoPartsCount() {
		return 0;
	}

	getItemTypeName(name?) {
		var text;
		
		if (this._item.isWand()) {
			text = StringTable.ItemWord_SuffixWand;
		}
		else {
			text = StringTable.ItemWord_SuffixItem;
		}
		
		return name + text;
	}

	getWindowTextUI() {
		return ItemInfoRenderer.getTextUI();
	}
}

class BaseItemPotency extends BaseObject {

	_value: any = 0;

	setPosMenuData(unit?, item?, targetUnit?) {
	}

	drawPosMenuData(xBase?, yBase?, textui?) {
	}

	getKeywordValue() {
		return this._value;
	}

	getKeywordName() {
		return '';
	}
}

// ItemControl.isItemUsable checks if the unit can basically use the item.
// BaseItemAvailability checks if the unit can currently use the item.
// For instance, BaseItemAvailability checks if the target is within the range etc.
// BaseItemAvailability is referred to if the player uses the item.
// BaseItemAI which controls AI processing is referred to if the enemy uses the item.
class BaseItemAvailability extends BaseObject {

	isItemAvailableCondition(unit?, item?) {
		var rangeType = item.getRangeType();
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			return this._checkSelfOnly(unit, item);
		}
		else if (rangeType === SelectionRangeType.MULTI) {
			return this._checkMulti(unit, item);
		}
		else if (rangeType === SelectionRangeType.ALL) {
			return this._checkAll(unit, item);	
		}
		
		return false;
	}

	isPosEnabled(unit?, item?, x?, y?) {
		var targetUnit;
		
		targetUnit = PosChecker.getUnitFromPos(x, y);
		if (targetUnit !== null && targetUnit !== unit) {
			if (FilterControl.isBestUnitTypeAllowed(unit.getUnitType(), targetUnit.getUnitType(), item.getFilterFlag())) {
				return this._isCondition(unit, targetUnit, item) && this.isItemAllowed(unit, targetUnit, item);
			}
		}
		
		return false;
	}

	isItemAllowed(unit?, targetUnit?, item?) {
		return true;
	}

	_checkSelfOnly(unit?, item?) {
		return this._isCondition(unit, unit, item) && this.isItemAllowed(unit, unit, item);
	}

	_checkMulti(unit?, item?) {
		var i, index, x, y;
		var indexArray = IndexArray.createIndexArray(unit.getMapX(), unit.getMapY(), item);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (this.isPosEnabled(unit, item, x, y)) {
				return true;
			}
		}
		
		return false;
	}

	_checkAll(unit?, item?) {
		var i, j, count, list, targetUnit;
		var filter = FilterControl.getBestFilter(unit.getUnitType(), item.getFilterFlag());
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				targetUnit = list.getData(j);
				if (unit !== targetUnit && this._isCondition(unit, targetUnit, item) && this.isItemAllowed(unit, targetUnit, item)) {
					return true;
				}
			}
		}
		
		return false;
	}

	_isCondition(unit?, targetUnit?, item?) {
		return item.getTargetAggregation().isCondition(targetUnit);
	}
}

class BaseItemAI extends BaseObject {

	getItemScore(unit?, combination?) {
		return AIValue.MIN_SCORE;
	}

	getUnitFilter(unit?, item?) {
		return FilterControl.getBestFilter(unit.getUnitType(), item.getFilterFlag());
	}

	getActionTargetType(unit?, item?) {
		if (!item.isWeapon() && item.getRangeType() === SelectionRangeType.SELFONLY) {
			return ActionTargetType.SINGLE;
		}
		
		return ActionTargetType.UNIT;
	}
}
