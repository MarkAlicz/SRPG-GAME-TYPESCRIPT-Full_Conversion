
class ItemTeleportationSelectMode {

	static TARGETSELECT: any = 0;

	static POSSELECT: any = 1;
}

class TeleportationItemSelection extends BaseItemSelection {

	_isSingleMode: any = false;

	_posDoubleCursor: any = null;

	setInitialSelection() {
		this._changeTargetSelect();
		return EnterResult.OK;
	}

	moveItemSelectionCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemTeleportationSelectMode.TARGETSELECT) {
			result = this._moveTargetSelect();
		}
		else if (mode === ItemTeleportationSelectMode.POSSELECT) {
			result = this._movePosSelect();
		}
		
		if (this._posDoubleCursor !== null) {
			this._posDoubleCursor.moveCursor();
		}
		
		if (result === MoveResult.END) {
			this._posSelector.endPosSelector();
		}

		return result;
	}

	drawItemSelectionCycle() {
		var pos;
		var mode = this.getCycleMode();
		
		this._posSelector.drawPosSelector();
		
		if (mode === ItemTeleportationSelectMode.POSSELECT && this._targetUnit !== null) {
			pos = this._posSelector.getSelectorPos();
			if (this._posDoubleCursor !== null) {
				this._posDoubleCursor.drawCursor(this._targetUnit.getMapX(), this._targetUnit.getMapY(), pos.x, pos.y);
			}
		}
	}

	isPosSelectable() {
		var pos;
		var mode = this.getCycleMode();
		
		if (mode === ItemTeleportationSelectMode.TARGETSELECT) {
			return this._posSelector.getSelectorTarget(true) !== null;
		}
		else if (mode === ItemTeleportationSelectMode.POSSELECT) {
			pos = this._posSelector.getSelectorPos(true);
			if (pos === null) {
				return false;
			}
			
			return PosChecker.getUnitFromPos(pos.x, pos.y) === null;
		}
		
		return true;
	}

	setPosSelection() {
		var indexArray = [];
		var teleportationInfo = this._item.getTeleportationInfo();
		var rangeType = teleportationInfo.getRangeType();
		var rangeValue = teleportationInfo.getRangeValue();
		
		if (rangeType === SelectionRangeType.MULTI) {
			indexArray = this._getMultiTeleportationIndexArray(rangeValue);
		}
		else if (rangeType === SelectionRangeType.ALL) {
			indexArray = this._getAllTeleportationIndexArray();
		}
		
		// Specify PosSelectorType.FREE to select anywhere. 
		this._posSelector.setPosSelectorType(PosSelectorType.FREE);
		this._posSelector.setPosOnly(this._unit, this._item, indexArray, PosMenuType.Item);
		
		// Don't call setFirstPos so the cursor doesn't go far away instantly.
		// this._posSelector.setFirstPos();
	}

	_moveTargetSelect() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this.isPosSelectable()) {
				this._targetUnit = this._posSelector.getSelectorTarget(false);
				this._changePosSelect();
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			this._isSelection = false;
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_movePosSelect() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this.isPosSelectable()) {
				this._targetPos = this._posSelector.getSelectorPos(false);
				this._isSelection = true;
				return MoveResult.END;
			}
		}
		else if (result === PosSelectorResult.CANCEL) {
			if (this._isSingleMode) {
				return MoveResult.END;
			}
			else {
				this._changeTargetSelect();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_getMultiTeleportationIndexArray(rangeValue?) {
		var i, index, x, y;
		var indexArrayNew = [];
		var indexArray = IndexArray.getBestIndexArray(this._unit.getMapX(), this._unit.getMapY(), 1, rangeValue);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (this._isPosEnabled(x, y, this._targetUnit)) {
				indexArrayNew.push(index);
			}
		}
		
		return indexArrayNew;
	}

	_getAllTeleportationIndexArray() {
		var i, index, x, y;
		var indexArrayNew = [];
		var count = CurrentMap.getSize();
		
		for (i = 0; i < count; i++) {
			index = i;
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			if (this._isPosEnabled(x, y, this._targetUnit)) {
				indexArrayNew.push(index);
			}
		}
		
		return indexArrayNew;
	}

	_changeTargetSelect() {
		if (this._item.getRangeType() === SelectionRangeType.SELFONLY) {
			// If the user instantly moves, it immediately enters the position selection mode.
			this._targetUnit = this._unit;
			this._isSingleMode = true;
			
			this._changePosSelect();
		}
		else {
			this._posDoubleCursor = createObject(PosDoubleCursor);
		
			this.setUnitSelection();
			this.changeCycleMode(ItemTeleportationSelectMode.TARGETSELECT);
		}
	}

	_changePosSelect() {
		this.setPosSelection();
		this.changeCycleMode(ItemTeleportationSelectMode.POSSELECT);
	}

	_isPosEnabled(x?, y?, targetUnit?) {
		// Cannot instantly move to the position where the unit exists.
		if (PosChecker.getUnitFromPos(x, y) !== null) {
			return false;
		}
		
		// Cannot instantly move to the position where the unit cannot go through.
		if (PosChecker.getMovePointFromUnit(x, y, targetUnit) === 0) {
			return false;
		}
		
		return true;
	}
}

class ItemTeleportationUseMode {

	static SRC: any = 0;

	static FOCUS: any = 1;

	static DEST: any = 2;

	static END: any = 3;

	static SRCANIME: any = 4;

	static DESTANIME: any = 5;
}

class TeleportationItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	_targetUnit: any = null;

	_targetPos: any = null;

	_dynamicAnime: any = null;

	enterMainUseCycle(itemUseParent?) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		this._targetPos = itemTargetInfo.targetPos;
		
		if (itemTargetInfo.item.getRangeType() === SelectionRangeType.SELFONLY) {
			this._targetUnit = itemTargetInfo.unit;
		}
		else {
			this._targetUnit = itemTargetInfo.targetUnit;
		}
		
		// For item use with AI, the position is not always initialized.
		if (this._targetPos === null) {
			this._targetPos = TeleportationControl.getTeleportationPos(itemTargetInfo.unit, this._targetUnit, itemTargetInfo.item);
			if (this._targetPos === null) {
				return EnterResult.NOTENTER;
			}
		}
		
		if (PosChecker.getUnitFromPos(this._targetPos.x, this._targetPos.y) !== null) {
			// Don't reduce items because the unit exists, so cannot move. 
			this._itemUseParent.disableItemDecrement();
			return EnterResult.NOTENTER;
		}
		
		if (itemUseParent.isItemSkipMode()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		this.changeCycleMode(ItemTeleportationUseMode.SRC);
		
		return EnterResult.OK;
	}

	moveMainUseCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
			
		if (mode === ItemTeleportationUseMode.SRC) {
			result = this._moveSrc();
		}
		else if (mode === ItemTeleportationUseMode.SRCANIME) {
			result = this._moveSrcAnime();
		}
		else if (mode === ItemTeleportationUseMode.FOCUS) {
			result = this._moveFocus();
		}
		else if (mode === ItemTeleportationUseMode.DEST) {
			result = this._moveDest();
		}
		else if (mode === ItemTeleportationUseMode.DESTANIME) {
			result = this._moveDestAnime();
		}
		else if (mode === ItemTeleportationUseMode.END) {
			result = this._moveEnd();
		}
		
		return result;
	}

	drawMainUseCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ItemTeleportationUseMode.SRCANIME || mode === ItemTeleportationUseMode.DESTANIME) {
			this._dynamicAnime.drawDynamicAnime();
		}
	}

	mainAction() {
		this._targetUnit.setMapX(this._targetPos.x);
		this._targetUnit.setMapY(this._targetPos.y);
		this._targetUnit.setInvisible(false);
	}

	_moveSrc() {
		this._showAnime(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		this.changeCycleMode(ItemTeleportationUseMode.SRCANIME);
		
		return MoveResult.CONTINUE;
	}

	_moveSrcAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ItemTeleportationUseMode.FOCUS);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveFocus() {
		var generator; 
		
		this._targetUnit.setInvisible(true);
		
		generator = root.getEventGenerator();
		generator.locationFocus(this._targetPos.x, this._targetPos.y, true);
		generator.execute();
		
		this.changeCycleMode(ItemTeleportationUseMode.DEST);
		
		return MoveResult.CONTINUE;
	}

	_moveDest() {
		this._showAnime(this._targetPos.x, this._targetPos.y);
		this.changeCycleMode(ItemTeleportationUseMode.DESTANIME);
		
		return MoveResult.CONTINUE;
	}

	_moveDestAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ItemTeleportationUseMode.END);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveEnd() {
		this.mainAction();
		return MoveResult.END;
	}

	_showAnime(xTarget?, yTarget?) {
		var x = LayoutControl.getPixelX(xTarget);
		var y = LayoutControl.getPixelY(yTarget);
		var anime = this._itemUseParent.getItemTargetInfo().item.getItemAnime();
		var pos = LayoutControl.getMapAnimationPos(x, y, anime);
		
		this._dynamicAnime = createObject(DynamicAnime);
		this._dynamicAnime.startDynamicAnime(anime, pos.x, pos.y);
	}
}

class TeleportationItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Teleportation));
		y += ItemInfoRenderer.getSpaceY();
		
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawValue(x, y);
	}

	getInfoPartsCount() {
		return 3;
	}

	_drawValue(x?, y?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var teleportationInfo = this._item.getTeleportationInfo();
		
		ItemInfoRenderer.drawKeyword(x, y, StringTable.Teleportation_Range);
		x += ItemInfoRenderer.getSpaceX();
		
		if (teleportationInfo.getRangeType() === SelectionRangeType.ALL) {
			TextRenderer.drawKeywordText(x, y, StringTable.Range_All, -1, color, font);
		}
		else {
			NumberRenderer.drawRightNumber(x, y, teleportationInfo.getRangeValue());	
		}
	}
}

class TeleportationItemPotency extends BaseItemPotency {

}

class TeleportationItemAvailability extends BaseItemAvailability {

}

// Check which unit will instantly move.
// The position for the instant move is decided by TeleportationControl.
// TeleportationItemAI and TeleportationControl don't refer to item.getFilterFlag.
class TeleportationItemAI extends BaseItemAI {

	getItemScore(unit?, combination?) {
		var n = 15;
		
		// Check if there is a position for combination.targetUnit to instantly move.
		// The criteria is if the different type of unit from myself exists within a range of an instant move.
		if (!this._isTeleportationEnabled(unit, combination)) {
			return AIValue.MIN_SCORE;
		}
		
		// Priority is higher if it makes the unit instantly move rather than self instantly moves.
		if (combination.item.getRangeType() !== SelectionRangeType.SELFONLY) {
			n += 10;
		}
		
		// combination.targetUnit is the unit to be instantly moved.
		// The higher the level is, the more it is prioritized.
		return combination.targetUnit.getLv() + n;
	}

	getUnitFilter(unit?, item?) {
		if (item.getRangeType() === SelectionRangeType.SELFONLY) {
			// Search the opponent because self instantly moves towards the opponent.
			return FilterControl.getReverseFilter(unit.getUnitType());
		}
		else {
			// Search the unit so as to make the unit instantly move.
			return FilterControl.getNormalFilter(unit.getUnitType());
		}
	}

	getActionTargetType(unit?, item?) {
		// Always return ActionTargetType.UNIT even though the item.getRangeType() is SelectionRangeType.SELFONLY.
		return ActionTargetType.UNIT;
	}

	_isTeleportationEnabled(unit?, combination?) {
		var targetUnit = combination.targetUnit;
		var teleportationInfo = combination.item.getTeleportationInfo();
		var rangeType = teleportationInfo.getRangeType();
		
		// If this condition is satisfied, it specifies that the opponent already exists.
		if (combination.item.getRangeType() === SelectionRangeType.SELFONLY) {	
			return true;
		}
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			return false;
		}
		else if (rangeType === SelectionRangeType.MULTI) {
			return this._isMultiRangeEnabled(unit, targetUnit, teleportationInfo);
		}
		else if (rangeType === SelectionRangeType.ALL) {
			return this._isAllRangeEnabled(unit, targetUnit);
		}
		
		return false;
	}

	_isMultiRangeEnabled(unit?, targetUnit?, teleportationInfo?) {
		var i, index, x, y, focusUnit;
		var indexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, teleportationInfo.getRangeValue() + 1);
		var count = indexArray.length;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			focusUnit = PosChecker.getUnitFromPos(x, y);
			if (focusUnit === null) {
				continue;
			}
			
			if (!this._isUnitTypeAllowed(targetUnit, focusUnit)) {
				continue;
			}
			
			// Allow instant move because some unit (focusUnit) exists in a range of targetUnit as a criteria.
			return true;
		}
		
		return false;
	}

	_isAllRangeEnabled(unit?, targetUnit?) {
		var i, list;
		var count = 0;
		var filter = FilterControl.getReverseFilter(targetUnit.getUnitType());
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count += list.getCount();
		}
		
		return count > 0;
	}

	_isUnitTypeAllowed(unit?, targetUnit?) {
		// Confirm the different type of unit from myself.
		return FilterControl.isReverseUnitTypeAllowed(unit, targetUnit);
	}
}

// Check where to move instantly at the time of AI.
class TeleportationControl {

	static getTeleportationPos(unit?, targetUnit?, item?) {
		var teleportationInfo = item.getTeleportationInfo();
		var rangeType = teleportationInfo.getRangeType();
		var curUnit = null;
		var parentIndexArray = null;
		
		if (rangeType === SelectionRangeType.SELFONLY) {
			return null;
		}
		else if (rangeType === SelectionRangeType.MULTI) {
			curUnit = this._getMultiRangeUnit(unit, targetUnit, teleportationInfo);
			parentIndexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, teleportationInfo.getRangeValue());
		}
		else if (rangeType === SelectionRangeType.ALL) {
			curUnit = this._getAllRangeUnit(unit, targetUnit);
		}
		
		// Call a getNearbyPosEx, not the getNearbyPos in order not to return the position beyond the range.
		return PosChecker.getNearbyPosEx(curUnit, targetUnit, parentIndexArray);
	}

	
	// The adjacent unit within the limited range can be a target when adding 1 to getRangeValue.
	static _getMultiRangeUnit(unit?, targetUnit?, teleportationInfo?) {
		var i, index, x, y, focusUnit;
		var indexArray = IndexArray.getBestIndexArray(unit.getMapX(), unit.getMapY(), 1, teleportationInfo.getRangeValue() + 1);
		var count = indexArray.length;
		var curUnit = null;
		
		for (i = 0; i < count; i++) {
			index = indexArray[i];
			x = CurrentMap.getX(index);
			y = CurrentMap.getY(index);
			focusUnit = PosChecker.getUnitFromPos(x, y);
			if (focusUnit === null) {
				continue;
			}
			
			if (!this._isUnitTypeAllowed(targetUnit, focusUnit)) {
				continue;
			}
			
			curUnit = this._checkUnit(curUnit, focusUnit);
		}
		
		return curUnit;
	}

	static _getAllRangeUnit(unit?, targetUnit?) {
		var i, j, count, list, focusUnit;
		var curUnit = null;
		var filter = FilterControl.getReverseFilter(targetUnit.getUnitType());
		var listArray = FilterControl.getListArray(filter);
		var listCount = listArray.length;
		
		for (i = 0; i < listCount; i++) {
			list = listArray[i];
			count = list.getCount();
			for (j = 0; j < count; j++) {
				focusUnit = list.getData(j);
				curUnit = this._checkUnit(curUnit, focusUnit);
			}
		}
		
		return curUnit;
	}

	static _checkUnit(curUnit?, focusUnit?) {
		if (curUnit === null) {
			curUnit = focusUnit;
		}
		else {
			if (focusUnit.getLv() > curUnit.getLv()) {
				curUnit = focusUnit;
			}
		}
		
		return curUnit;
	}

	static _isUnitTypeAllowed(unit?, targetUnit?) {
		if (StateControl.isBadStateOption(unit, BadStateOption.BERSERK)) {
			return FilterControl.isUnitTypeAllowed(unit, targetUnit);
		}
		
		return FilterControl.isReverseUnitTypeAllowed(unit, targetUnit);
	}
}
