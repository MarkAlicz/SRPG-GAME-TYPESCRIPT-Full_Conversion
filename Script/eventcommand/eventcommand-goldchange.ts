
class GoldChangeEventCommand extends BaseEventCommand {

	_goldChangeView: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._goldChangeView.moveNoticeView() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x = LayoutControl.getCenterX(-1, this._goldChangeView.getNoticeViewWidth());
		var y = LayoutControl.getCenterY(-1, this._goldChangeView.getNoticeViewHeight());
		
		this._goldChangeView.drawNoticeView(x, y);
	}

	mainEventCommand() {
		var gold;
		var max = DataConfig.getMaxGold();
		
		gold = root.getMetaSession().getGold();
		gold += root.getEventCommandObject().getGold();

		if (gold < 0) {
			gold = 0;
		}
		else if (gold > max) {
			gold = max;
		}

		root.getMetaSession().setGold(gold);
	}

	_prepareEventCommandMemberData() {
		this._goldChangeView = createWindowObject(GoldChangeNoticeView, this);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._goldChangeView.setGoldChangeData(eventCommandData.getGold());
		
		return EnterResult.OK;
	}
}

class GoldNoticeMode {

	static WAIT: any = 0;

	static COUNT: any = 1;

	static INPUT: any = 2;
}

class GoldChangeNoticeView extends BaseNoticeView {

	_gold: any = 0;

	_counter: any = null;

	_balancer: any = null;

	setGoldChangeData(n?) {
		var speed = 30;
		
		this._gold = n;
		if (n < 0) {
			n *= -1;
		}
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(4);
		
		this._balancer = createObject(SimpleBalancer);
		this._balancer.setBalancerInfo(0, n);
		this._balancer.setBalancerSpeed(speed);
		this._balancer.startBalancerMove(n);
		
		this.changeCycleMode(GoldNoticeMode.WAIT);
	}

	moveNoticeView() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === GoldNoticeMode.WAIT) {
			result = this._moveWait();
		}
		else if (mode === GoldNoticeMode.COUNT) {
			result = this._moveCount();
		}
		else if (mode === GoldNoticeMode.INPUT) {
			result = this._moveInput();
		}
		
		return result;
	}

	drawNoticeViewContent(x?, y?) {
		var textui = this.getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var text = this._gold > 0 ? StringTable.GetTitle_GoldChange : StringTable.LostTitle_GoldChange;
		var infoColor = this._gold > 0 ? ColorValue.KEYWORD : ColorValue.INFO;
		var n = this._balancer.getCurrentValue();
		var width = TextRenderer.getTextWidth(text, font) + 5;
		var dy = this._getNoticeOffsetY();
		
		TextRenderer.drawKeywordText(x, y + dy, text, -1, infoColor, font);
		TextRenderer.drawKeywordText(x + width, y + dy, this._gold > 0 ? '+' : '-', -1, color, font);
		NumberRenderer.drawRightNumber(x + width + this._getGoldInterval(), y + dy, n);
	}

	_moveWait() {
		if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
			this.changeCycleMode(GoldNoticeMode.COUNT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveCount() {
		if (this._balancer.moveBalancer() !== MoveResult.CONTINUE) {
			this._playGoldChangeSound();
			this.changeCycleMode(GoldNoticeMode.INPUT);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveInput() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_getGoldInterval() {
		return 10;
	}

	_playGoldChangeSound() {
		MediaControl.soundDirect('itemsale');
	}
}

