
class ItemRescueSelectMode {

	static TARGETSELECT: any = 0;
}

class RescueItemSelection extends BaseItemSelection {

	setInitialSelection() {
		this.setUnitSelection();
		this.changeCycleMode(ItemTeleportationSelectMode.TARGETSELECT);
		return EnterResult.OK;
	}

	moveItemSelectionCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemTeleportationSelectMode.TARGETSELECT) {
			result = this._moveTargetSelect();
		}
		
		return result;
	}

	drawItemSelectionCycle() {
		this._posSelector.drawPosSelector();
	}

	isPosSelectable() {
		var mode = this.getCycleMode();
		
		if (mode === ItemRescueSelectMode.TARGETSELECT) {
			return this._posSelector.getSelectorTarget(true) !== null;
		}
		
		return true;
	}

	_moveTargetSelect() {
		var result = this._posSelector.movePosSelector();
		
		if (result === PosSelectorResult.SELECT) {
			if (this.isPosSelectable()) {
				this._targetUnit = this._posSelector.getSelectorTarget(false);
				this._targetPos = PosChecker.getNearbyPos(this._unit, this._targetUnit);
				if (this._targetPos === null) {
					this._isSelection = false;
				}
				else {
					this._isSelection = true;
				}
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
}

class ItemRescueUseMode {

	static SRC: any = 0;

	static FOCUS: any = 1;

	static DEST: any = 2;

	static END: any = 3;

	static SRCANIME: any = 4;

	static DESTANIME: any = 5;
}

class RescueItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	_targetUnit: any = null;

	_targetPos: any = null;

	_dynamicAnime: any = null;

	enterMainUseCycle(itemUseParent?) {
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		
		this._itemUseParent = itemUseParent;
		this._targetUnit = itemTargetInfo.targetUnit;
		this._targetPos = itemTargetInfo.targetPos;
		
		// For item use with AI, the position is not always initialized.
		if (this._targetPos === null) {
			this._targetPos = PosChecker.getNearbyPos(itemTargetInfo.unit, itemTargetInfo.targetUnit);
		}
		
		if (PosChecker.getUnitFromPos(this._targetPos.x, this._targetPos.y) !== null) {
			// Items are not reduced because the unit exists at the target position, so it cannot move.
			this._itemUseParent.disableItemDecrement();
			return EnterResult.NOTENTER;
		}
		
		if (itemUseParent.isItemSkipMode()) {
			this.mainAction();
			return EnterResult.NOTENTER;
		}
		
		this.changeCycleMode(ItemRescueUseMode.SRC);
		
		return EnterResult.OK;
	}

	moveMainUseCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ItemRescueUseMode.SRC) {
			result = this._moveSrc();
		}
		else if (mode === ItemRescueUseMode.SRCANIME) {
			result = this._moveSrcAnime();
		}
		else if (mode === ItemRescueUseMode.FOCUS) {
			result = this._moveFocus();
		}
		else if (mode === ItemRescueUseMode.DEST) {
			result = this._moveDest();
		}
		else if (mode === ItemRescueUseMode.DESTANIME) {
			result = this._moveDestAnime();
		}
		else if (mode === ItemRescueUseMode.END) {
			result = this._moveEnd();
		}
		
		return result;
	}

	drawMainUseCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ItemRescueUseMode.SRCANIME || mode === ItemRescueUseMode.DESTANIME) {
			this._dynamicAnime.drawDynamicAnime();
		}
	}

	mainAction() {
		this._targetUnit.setMapX(this._targetPos.x);
		this._targetUnit.setMapY(this._targetPos.y);
		this._targetUnit.setInvisible(false);
	}

	_moveSrc() {
		var unit = PosChecker.getUnitFromPos(this._targetPos.x, this._targetPos.y);
		
		// Cannot continue if there is the unit in the target position.
		if (unit !== null) {
			// The Item is not reduced because it could not move.
			this._itemUseParent.disableItemDecrement();
			return MoveResult.END;
		}
	
		this._showAnime(this._targetUnit.getMapX(), this._targetUnit.getMapY());
		this.changeCycleMode(ItemRescueUseMode.SRCANIME);
		
		return MoveResult.CONTINUE;
	}

	_moveSrcAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ItemRescueUseMode.FOCUS);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveFocus() {
		var generator; 
		
		this._targetUnit.setInvisible(true);
		
		generator = root.getEventGenerator();
		generator.locationFocus(this._targetPos.x, this._targetPos.y, true);
		generator.execute();
		
		this.changeCycleMode(ItemRescueUseMode.DEST);
		
		return MoveResult.CONTINUE;
	}

	_moveDest() {
		this._showAnime(this._targetPos.x, this._targetPos.y);
		this.changeCycleMode(ItemRescueUseMode.DESTANIME);
		
		return MoveResult.CONTINUE;
	}

	_moveDestAnime() {
		if (this._dynamicAnime.moveDynamicAnime() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ItemRescueUseMode.END);
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

class RescueItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Rescue));
		y += ItemInfoRenderer.getSpaceY();
		
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	}

	getInfoPartsCount() {
		return 2;
	}
}

class RescueItemPotency extends BaseItemPotency {

}

class RescueItemAvailability extends BaseItemAvailability {

}

class RescueItemAI extends BaseItemAI {

}
