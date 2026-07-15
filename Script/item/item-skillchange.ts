
class SkillChangeItemSelection extends BaseItemSelection {

}

class SkillChangeItemUse extends BaseItemUse {

	_dynamicEvent: any = null;

	enterMainUseCycle(itemUseParent?) {
		var generator;
		var itemTargetInfo = itemUseParent.getItemTargetInfo();
		var info = itemTargetInfo.item.getSkillChangeInfo();
		
		this._dynamicEvent = createObject(DynamicEvent);
		generator = this._dynamicEvent.acquireEventGenerator();
		generator.skillChange(itemTargetInfo.targetUnit, info.getSkill(), info.getSkillControlType(), itemUseParent.isItemSkipMode());
		
		return this._dynamicEvent.executeDynamicEvent();
	}

	moveMainUseCycle() {
		return this._dynamicEvent.moveDynamicEvent();
	}

	getItemAnimePos(itemUseParent?, animeData?) {
		return this.getUnitBasePos(itemUseParent, animeData);
	}
}

class SkillChangeItemInfo extends BaseItemInfo {

	drawItemInfoCycle(x?, y?) {
		ItemInfoRenderer.drawKeyword(x, y, this.getItemTypeName(StringTable.ItemInfo_SkillChange));
		y += ItemInfoRenderer.getSpaceY();
		
		this._drawValue(x, y);
	}

	getInfoPartsCount() {
		return 2;
	}

	_drawValue(x?, y?) {
		var info = this._item.getSkillChangeInfo();
		var skill = info.getSkill();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
			
		TextRenderer.drawKeywordText(x, y, skill.getName(), -1, color, font);
	}
}

class SkillChangeItemPotency extends BaseItemPotency {

}

class SkillChangeItemAvailability extends BaseItemAvailability {

}

class SkillChangeItemAI extends BaseItemAI {

}
