
class PosMenuType {

	static Attack: any = 0;

	static Item: any = 1;

	static Default: any = 2;
}

class PosMenu extends BaseWindowManager {

	_unit: any = null;

	_item: any = null;

	_posWindowLeft: any = null;

	_posWindowRight: any = null;

	_currentTarget: any = null;

	createPosMenuWindow(unit?, item?, type?) {
		var obj = this._getObjectFromType(type);
		
		this._posWindowLeft = createWindowObject(obj, this);
		this._posWindowRight = createWindowObject(obj, this);
		
		this._unit = unit;
		this._item = item;
	}

	moveWindowManager() {
		var resultLeft = this._posWindowLeft.moveWindow();
		var resultRight = this._posWindowRight.moveWindow();
		
		return resultLeft && resultRight;
	}

	drawWindowManager() {
		var x, y;
		
		if (this._currentTarget === null) {
			return;
		}
		
		x = this.getPositionWindowX();
		y = this.getPositionWindowY();
		
		this._posWindowLeft.drawWindow(x, y);
		this._posWindowRight.drawWindow(x + this._posWindowLeft.getWindowWidth() + this._getWindowInterval(), y);
	}

	getTotalWindowWidth() {
		return this._posWindowLeft.getWindowWidth() + this._posWindowRight.getWindowWidth();
	}

	getTotalWindowHeight() {
		return this._posWindowLeft.getWindowHeight();
	}

	getPositionWindowX() {
		return LayoutControl.getCenterX(-1, this.getTotalWindowWidth());
	}

	getPositionWindowY() {
		return Miscellaneous.getDyamicWindowY(this._unit, this._currentTarget, this._posWindowLeft.getWindowHeight());
	}

	startPosAnimation(leftValue?, rightValue?) {
		this._posWindowLeft.startPosAnimation(leftValue);
		this._posWindowRight.startPosAnimation(rightValue);
	}

	changePosTarget(targetUnit?) {
		var targetItem, isLeft;
		
		if (this._unit === null || !this._isTargetAllowed(targetUnit)) {
			this._currentTarget = null;
			return;
		}
		
		this._currentTarget = targetUnit;
		targetItem = ItemControl.getEquippedWeapon(targetUnit);
		
		// Always display the src at the left side.
		isLeft = Miscellaneous.isUnitSrcPriority(this._unit, targetUnit);
		
		// Prioritize to display the player on the left side (decide that it's easy to see on the left side).
		// So if the player launches an attack, the player is naturally displayed on the left side.
		// However, even if the player has received an attacked, the player is also displayed on the left side.
		// If both are players, those who launched the attack is displayed on the left side.
		if (isLeft) {
			// The player launched an attack, so specify the _unit as the _posWindowLeft.
			this._posWindowLeft.setPosTarget(this._unit, this._item, targetUnit, targetItem, true);
			this._posWindowRight.setPosTarget(targetUnit, targetItem, this._unit, this._item, false);
		}
		else {
			// The player hasn't launched an attack.
			// So the data is the player and the targetUnit is specified as the _posWindowLeft.
			this._posWindowLeft.setPosTarget(targetUnit, targetItem, this._unit, this._item, true);
			this._posWindowRight.setPosTarget(this._unit, this._item, targetUnit, targetItem, false);
		}
	}

	_getObjectFromType(type?) {
		var obj = PosDefaultWindow;
		
		if (type === PosMenuType.Attack) {
			obj = PosAttackWindow;
		}
		else if (type === PosMenuType.Item) {
			obj = PosItemWindow;
		}
		else if (type === PosMenuType.Default) {
			obj = PosDefaultWindow;
		}
		
		return obj;
	}

	_isTargetAllowed(targetUnit?) {
		if (targetUnit === null) {
			return false;
		}
		
		return true;
	}

	_getWindowInterval() {
		return 0;
	}
}

class PosBaseWindow extends BaseWindow {

	_unit: any = null;

	_item: any = null;

	_gaugeBar: any = null;

	_isAnimation: any = false;

	initialize() {
		this._gaugeBar = createObject(GaugeBar);
	}

	moveWindowContent() {
		if (this._isAnimation) {
			if (this._gaugeBar.moveGaugeBar() !== MoveResult.CONTINUE) {
				this._isAnimation = false;
				return MoveResult.END;
			}
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this.drawInfo(x, y);
		this.drawUnit(x + this.getInfoWidth(), y);
	}

	getWindowWidth() {
		return this.getInfoWidth() + this.getUnitWidth() + 20;
	}

	getWindowHeight() {
		return 145;
	}

	setPosTarget(unit?, item?, targetUnit?, targetItem?, isLeft?) {
	}

	setPosInfo(unit?, item?, isSrc?) {
		this._unit = unit;
		this._item = item;
		this._gaugeBar.setGaugeInfo(unit.getHp(), ParamBonus.getMhp(unit), 1);
	}

	startPosAnimation(value?) {
		this._gaugeBar.startMove(value);
		this._isAnimation = true;
	}

	getInfoWidth() {
		return 140;
	}

	getUnitWidth() {
		return 70;
	}

	drawInfo(xBase?, yBase?) {
		this.drawName(xBase, yBase);
		this.drawInfoTop(xBase, yBase);
		this.drawInfoCenter(xBase, yBase);
		this.drawInfoBottom(xBase, yBase);
	}

	drawName(xBase?, yBase?) {
		var x = xBase;
		var y = yBase;
		var length = this._getTextLength();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		TextRenderer.drawText(x, y, this._unit.getName(), length, color, font);
	}

	drawInfoTop(xBase?, yBase?) {
		var x = xBase;
		var y = yBase;
		var pic = root.queryUI('unit_gauge');
		var balancer = this._gaugeBar.getBalancer();
		
		if (this._unit !== null) {
			ContentRenderer.drawHp(x, y + this._getHpMarginY(), balancer.getCurrentValue(), balancer.getMaxValue());
			this._gaugeBar.drawGaugeBar(x, y + this._getGaugeMarginY(), pic);
		}
	}

	drawInfoCenter(xBase?, yBase?) {
		var x, y;
		var item = this._item;
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (item !== null) {
			x = xBase;
			y = yBase + this._getItemMarginY();
			ItemRenderer.drawItem(x, y, item, color, font, false);
		}
	}

	drawInfoBottom(xBase?, yBase?) {
	}

	drawUnit(x?, y?) {
		var unit = this._unit;
		
		if (unit !== null) {
			y += this._getUnitMarginY();
			UnitRenderer.drawDefaultUnit(unit, x, y, null);
		}
	}

	getWindowTextUI() {
		return Miscellaneous.getColorWindowTextUI(this._unit);
	}

	_getHpMarginY() {
		return 20;
	}

	_getGaugeMarginY() {
		return 40;
	}

	_getItemMarginY() {
		return 60;
	}

	_getUnitMarginY() {
		return 20;
	}

	_getTextLength() {
		return this.getInfoWidth() + 20;
	}
}

class PosItemWindow extends PosBaseWindow {

	_obj: any = null;

	setPosTarget(unit?, item?, targetUnit?, targetItem?, isSrc?) {
		if (item !== null && !item.isWeapon()) {
			this._obj = ItemPackageControl.getItemPotencyObject(item);
			this._obj.setPosMenuData(unit, item, targetUnit);
		}
		
		this.setPosInfo(unit, item, isSrc);
	}

	drawInfoBottom(xBase?, yBase?) {
		if (this._obj !== null) {
			this._obj.drawPosMenuData(xBase, yBase + 90, this.getWindowTextUI());
		}
	}
}

class PosDefaultWindow extends PosBaseWindow {

	setPosTarget(unit?, item?, targetUnit?, targetItem?, isSrc?) {
		// In this window, items are always null.
		this.setPosInfo(unit, null, isSrc);
	}
}

class PosAttackWindow extends PosBaseWindow {

	_statusArray: any = null;

	_roundAttackCount: any = 0;

	setPosTarget(unit?, item?, targetUnit?, targetItem?, isSrc?) {
		var isCalculation = false;
		
		if (item !== null && item.isWeapon()) {
			if (isSrc) {
				// If the player has launched an attack, the status can be obtained without conditions.
				this._statusArray = AttackChecker.getAttackStatusInternal(unit, item, targetUnit);
				isCalculation = true;
			}
			else {
				if (AttackChecker.isCounterattack(targetUnit, unit)) {
					this._statusArray = AttackChecker.getAttackStatusInternal(unit, item, targetUnit);
					isCalculation = true;
				}
				else {
					this._statusArray = AttackChecker.getNonStatus();	
				}
			}
		}
		else {
			this._statusArray = AttackChecker.getNonStatus();
		}
		
		if (isCalculation) {
			this._roundAttackCount = Calculator.calculateRoundCount(unit, targetUnit, item);
			this._roundAttackCount *= Calculator.calculateAttackCount(unit, targetUnit, item);
		}
		else {
			this._roundAttackCount = 0;
		}
		
		this.setPosInfo(unit, item, isSrc);		
	}

	drawInfo(xBase?, yBase?) {
		var textui, color, font, pic, x, y, text;
		
		super.drawInfo(xBase, yBase);
		
		if (this._roundAttackCount < 2) {
			return;
		}
		
		textui = root.queryTextUI('attacknumber_title');
		color = textui.getColor();
		font = textui.getFont();
		pic = textui.getUIImage();
		x = xBase + 10;
		y = yBase + this.getWindowHeight() - 40;
		text = StringTable.AttackMenu_AttackCount + StringTable.SignWord_Multiple + this._roundAttackCount;
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, this._getTitlePartsCount());
	}

	drawInfoBottom(xBase?, yBase?) {
		var x = xBase;
		var y = yBase + this._getStatusMarginY();
		var textui = this.getWindowTextUI();
		var color = ColorValue.KEYWORD;
		var font = textui.getFont();
		
		StatusRenderer.drawAttackStatus(x, y, this._statusArray, color, font, this._getStatusSpace());
	}

	_getStatusMarginY() {
		return 90;
	}

	_getStatusSpace() {
		return 20;
	}

	_getTitlePartsCount() {
		return 4;
	}
}
