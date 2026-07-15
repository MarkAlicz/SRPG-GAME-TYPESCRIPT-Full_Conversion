
class UnusableItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_Unusable));
	}

	getInfoPartsCount() {
		return 1;
	}
}

class UnusableItemPotency extends BaseItemPotency {

}

class UnusableItemAvailability extends BaseItemAvailability {

	isItemAvailableCondition(unit?, item?) {
		return false;
	}
}

class UnusableItemAI extends BaseItemAI {

}