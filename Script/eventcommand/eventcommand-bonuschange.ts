
class BonusChangeEventCommand extends BaseEventCommand {

	_bonusChangeView: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._bonusChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x = LayoutControl.getCenterX(-1, this._bonusChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._bonusChangeView.getNoticeViewHeight());
		
		this._bonusChangeView.drawNoticeView(x, y);
	}

	mainEventCommand() {
		var bonus;
		var max = DataConfig.getMaxBonus();
		
		bonus = root.getMetaSession().getBonus();
		bonus += root.getEventCommandObject().getBonus();

		if (bonus < 0) {
			bonus = 0;
		}
		else if (bonus > max) {
			bonus = max;
		}
		
		root.getMetaSession().setBonus(bonus);
	}

	_prepareEventCommandMemberData() {
		this._bonusChangeView = createWindowObject(BonusChangeNoticeView, this);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._bonusChangeView.setBonusChangeData(eventCommandData.getBonus());
		
		return EnterResult.OK;
	}
}

class BonusNoticeMode {

	static WAIT: any = 0;

	static COUNT: any = 1;

	static INPUT: any = 2;
}

class BonusChangeNoticeView extends BaseNoticeView {

	_bonus: any = 0;

	_counter: any = null;

	_balancer: any = null;

	setBonusChangeData(n?) {
		var speed = 30;
		
		this._bonus = n;
		if (n < 0) {
			n *= -1;
		}
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(4);
		
		this._balancer = createObject(SimpleBalancer);
		this._balancer.setBalancerInfo(0, n);
		this._balancer.setBalancerSpeed(speed);
		this._balancer.startBalancerMove(n);
		
		this.changeCycleMode(BonusNoticeMode.WAIT);
	}

	moveNoticeView() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === BonusNoticeMode.WAIT) {
			result = this._moveWait();
		}
		else if (mode === BonusNoticeMode.COUNT) {
			result = this._moveCount();
		}
		else if (mode === BonusNoticeMode.INPUT) {
			result = this._moveInput();
		}
		
		return result;
	}

	drawNoticeViewContent(x?, y?) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._bonus > 0 ? StringTable.GetTitle_BonusChange : StringTable.LostTitle_BonusChange;
		var infoColor = this._bonus > 0 ? ColorValue.KEYWORD : ColorValue.INFO;
		var n = this._balancer.getCurrentValue();
		var width = TextRenderer.getTextWidth(text, font) + 5;
		var dy = this._getNoticeOffsetY();
		
		TextRenderer.drawKeywordText(x, y + dy, text, -1, infoColor, font);
		TextRenderer.drawKeywordText(x + width, y + dy, this._bonus > 0 ? '+' : '-', -1, color, font);
		NumberRenderer.drawRightNumber(x + width + this._getBonusInterval(), y + dy, n);
	}

	_moveWait() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.changeCycleMode(BonusNoticeMode.COUNT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCount() {
		if (this._balancer.moveBalancer() !== MoveResult.CONTINUE) {
			this._playBonusChangeSound();
			this.changeCycleMode(BonusNoticeMode.INPUT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveInput() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_getBonusInterval() {
		return 10;
	}

	_playBonusChangeSound() {
		MediaControl.soundDirect('itemsale');
	}
}

