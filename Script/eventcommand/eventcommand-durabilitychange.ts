
class DurabilityChangeEventCommand extends BaseEventCommand {
	_increaseType: any;


	_isStockChange: any = false;

	_targetUnit: any = null;

	_targetItem: any = null;

	_durability: any = 0;

	_durabilityChangeView: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._durabilityChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x = LayoutControl.getCenterX(-1, this._durabilityChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._durabilityChangeView.getNoticeViewHeight());
		
		this._durabilityChangeView.drawNoticeView(x, y);
	}

	mainEventCommand() {
		this._setDurability();
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._durabilityChangeView = createWindowObject(DurabilityChangeNoticeView, this);
		this._isStockChange = eventCommandData.isStockChange();
		this._targetUnit = eventCommandData.getTargetUnit();
		this._targetItem = this._getTargetItem(eventCommandData);
		this._durability = eventCommandData.getDurability();
		this._increaseType = eventCommandData.getIncreaseValue();
	}

	_checkEventCommand() {
		if (this._targetUnit === null || this._targetItem === null) {
			return false;
		}
		
		if (this._targetItem.isWeapon() && DataConfig.isWeaponInfinity()) {
			return false;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		this._durabilityChangeView.setDurabilityChangeData(this._targetItem, this._getDurability());
		
		return EnterResult.OK;
	}

	_getDurability() {
		var limit = this._targetItem.getLimit();
		var limitMax = this._targetItem.getLimitMax();
		var durability = this._durability;
		
		if (limit === WeaponLimitValue.BROKEN) {
			limit = 0;
		}
		
		if (this._increaseType === IncreaseType.INCREASE) {
			if (limit + durability > limitMax) {
				durability = limitMax - limit;
			}
		}
		else if (this._increaseType === IncreaseType.DECREASE) {
			if (limit - durability < 0) {
				durability = limit;
			}
			durability *= -1;
		}
		else {
			if (durability > limitMax) {
				durability = limitMax - limit;
			}
			else if (durability < 0) {
				durability = limitMax * -1;
			}
			else {
				durability -= limit;
			}
			
			limit = durability;
		}
		
		return durability;
	}

	_setDurability() {
		var limit = this._targetItem.getLimit();
		var limitMax = this._targetItem.getLimitMax();
		
		if (limit <= WeaponLimitValue.BROKEN) {
			limit = 0;
		}
		
		if (this._increaseType === IncreaseType.INCREASE) {
			limit += this._durability;
		}
		else if (this._increaseType === IncreaseType.DECREASE) {
			limit -= this._durability;
		}
		else {
			limit = this._durability;
		}
		
		if (limit >= limitMax) {
			this._targetItem.setLimit(limitMax);
		}
		else if (limit <= 0) {
			// Delete because the durability is less than 0.
			this._lostItem();
		}
		else {
			this._targetItem.setLimit(limit);
		}
	}

	_getTargetItem(eventCommandData?) {
		var item;
		
		if (this._isStockChange) {
			item = StockItemControl.getMatchItem(eventCommandData.getTargetItem());
		}
		else {
			item = UnitItemControl.getMatchItem(this._targetUnit, eventCommandData.getTargetItem());
		}
		
		return item;
	}

	_lostItem() {
		if (this._isStockChange) {
			ItemControl.lostItem(null, this._targetItem);
		}
		else {
			ItemControl.lostItem(this._targetUnit, this._targetItem);
		}
	}
}

class DurabilityNoticeMode {

	static WAIT: any = 0;

	static COUNT: any = 1;

	static INPUT: any = 2;
}

class DurabilityChangeNoticeView extends BaseNoticeView {

	_targetItem: any = null;

	_counter: any = null;

	_balancer: any = null;

	_titlePartsCount: any = 0;

	initialize() {
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(20);
		this._balancer = createObject(SimpleBalancer);
	}

	setDurabilityChangeData(targetItem?, n?) {
		var speed = 30;
		var limit = targetItem.getLimit();
		
		if (limit <= WeaponLimitValue.BROKEN) {
			limit = 0;
		}
		
		this._targetItem = targetItem;
		
		this._setTitlePartsCount();
		
		this._balancer.setBalancerInfo(limit, this._targetItem.getLimitMax());
		this._balancer.setBalancerSpeed(speed);
		this._balancer.startBalancerMove(n);
		
		this.changeCycleMode(DurabilityNoticeMode.WAIT);
	}

	moveNoticeView() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === DurabilityNoticeMode.WAIT) {
			result = this._moveWait();
		}
		else if (mode === DurabilityNoticeMode.COUNT) {
			result = this._moveCount();
		}
		else if (mode === DurabilityNoticeMode.INPUT) {
			result = this._moveInput();
		}
		
		return result;
	}

	drawNoticeViewContent(x?, y?) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var width = TextRenderer.getTextWidth(this._targetItem.getName(), font) + 30;
		
		ItemRenderer.drawItem(x, y, this._targetItem, color, font, false);
		
		x += width;
		this._drawLimit(x, y);
	}

	getTitlePartsCount() {
		return this._titlePartsCount;
	}

	_setTitlePartsCount() {
		var font = this.getTitleTextUI().getFont();
		var textWidth = TextRenderer.getTextWidth(this._targetItem.getName(), font) + this._getNoticeInterval() + (TitleRenderer.getTitlePartsWidth() * 2);
		
		this._titlePartsCount = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth());
	}

	_moveWait() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.changeCycleMode(DurabilityNoticeMode.COUNT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCount() {
		if (this._balancer.moveBalancer() !== MoveResult.CONTINUE) {
			this._playDurabilityChangeSound();
			this.changeCycleMode(DurabilityNoticeMode.INPUT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveInput() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawLimit(x?, y?) {
		var balancer = this._balancer;
		var textSlash = '/';
		var dx = this._getHorizontalSpaceArray();
		var dy = this._getNoticeOffsetY();
		
		NumberRenderer.drawNumberColor(x + dx[0], y + dy, balancer.getCurrentValue(), this._getDefaultColorIndex(), 255);
		TextRenderer.drawSignText(x + dx[1], y + dy, textSlash);
		NumberRenderer.drawNumber(x + dx[2], y + dy, balancer.getMaxValue());
	}

	_getHorizontalSpaceArray() {
		return [44, 60, 98];
	}

	_getDefaultColorIndex() {
		return 1;
	}

	_playDurabilityChangeSound() {
		MediaControl.soundDirect('gaugechange');
	}
}
