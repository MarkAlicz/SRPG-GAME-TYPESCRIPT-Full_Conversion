
class StateRecoveryItemSelection extends BaseItemSelection {

	isPosSelectable() {
		var targetUnit = this._posSelector.getSelectorTarget(true);
		
		if (targetUnit === null) {
			return false;
		}
		
		return StateControl.isStateRecoverable(targetUnit, this._item.getStateRecoveryInfo().getStateGroup());
	}
}

class StateRecoveryItemUse extends BaseItemUse {

	_itemUseParent: any = null;

	enterMainUseCycle(itemUseParent?) {
		this._itemUseParent = itemUseParent;
		
		this.mainAction();
		
		return EnterResult.NOTENTER;
	}

	mainAction() {
		var i, count, list, state, arr;
		var itemTargetInfo = this._itemUseParent.getItemTargetInfo();
		var info = itemTargetInfo.item.getStateRecoveryInfo();
		var unit = itemTargetInfo.targetUnit;
		var stateGroup = info.getStateGroup();
		
		if (stateGroup.isAllBadState()) {
			arr = [];
			list = unit.getTurnStateList();
			count = list.getCount();
			for (i = 0; i < count; i++) {
				state = list.getData(i).getState();
				if (state.isBadState()) {
					arr.push(state);	
				}
			}
			
			count = arr.length;
			for (i = 0; i < count; i++) {
				StateControl.arrangeState(unit, arr[i], IncreaseType.DECREASE);
			}
		}
		else {
			list = stateGroup.getStateReferenceList();
			count = list.getTypeCount();
			for (i = 0; i < count; i++) {
				state = list.getTypeData(i);
				StateControl.arrangeState(unit, state, IncreaseType.DECREASE);
			}
		}
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}

class StateRecoveryItemInfo extends BaseItemInfo {

	_stateCount: any = 0;

	setInfoItem(item?) {
		this._stateCount = ItemInfoRenderer.getStateCount(item.getStateRecoveryInfo().getStateGroup());
		super.setInfoItem(item);
	}

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_StateRecovery));
		y += ItemInfoRenderer.getSpaceY();
		
		ItemInfoRenderer.drawState(x, y, this._item.getStateRecoveryInfo().getStateGroup(), true);
		
		y += ItemInfoRenderer.getSpaceY() * this._stateCount;
		this.drawRange(x, y, this._item.getRangeValue(), this._item.getRangeType());
	}

	getInfoPartsCount() {
		return 2 + this._stateCount;
	}
}

class StateRecoveryItemPotency extends BaseItemPotency {

}

class StateRecoveryItemAvailability extends BaseItemAvailability {

	isItemAllowed(unit?, targetUnit?, item?) {
		// Prevent to use an antidote to poison even though it is not the poison state.
		return StateControl.isStateRecoverable(targetUnit, item.getStateRecoveryInfo().getStateGroup());
	}
}

class StateRecoveryItemAI extends BaseItemAI {

	getItemScore(unit?, combination?) {
		if (!StateControl.isStateRecoverable(combination.targetUnit, combination.item.getStateRecoveryInfo().getStateGroup())) {
			return AIValue.MIN_SCORE;
		}
		
		return 20 + combination.targetUnit.getLv();
	}
}
