
class ParameterChangeEventCommand extends BaseEventCommand {

	_parameterChangeWindow: any = null;

	_targetUnit: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._parameterChangeWindow.moveWindow() !== MoveResult.CONTINUE) {
			this.mainEventCommand();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x = LayoutControl.getCenterX(-1, this._parameterChangeWindow.getWindowWidth());
		var y = LayoutControl.getNotifyY();
		
		this._parameterChangeWindow.drawWindow(x, y);
	}

	mainEventCommand() {
		ParameterControl.addDoping(this._targetUnit, root.getEventCommandObject());
	}

	_prepareEventCommandMemberData() {
		this._parameterChangeWindow = createWindowObject(ParameterChangeWindow, this);
		this._targetUnit = root.getEventCommandObject().getTargetUnit();
	}

	_checkEventCommand() {
		// If the enemy becomes the player, the event command to refer to the enemy is null,
		// so it has already checked if it's null or not.
		// Even if the event unit hasn't appeared, set null.
		if (this._targetUnit === null) {
			return EnterResult.NOTENTER;
		}
		
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		this._parameterChangeWindow.setParameterChangeData(this._targetUnit, root.getEventCommandObject());
		
		return EnterResult.OK;
	}
}

class ParameterChangeWindow extends BaseWindow {

	_targetUnit: any = null;

	_scrollbar: any = null;

	setParameterChangeData(targetUnit?, parameterChangeCommand?) {
		this._scrollbar = createScrollbarObject(StatusScrollbar, this);
		this._scrollbar.enableStatusBonus(true);
		this._scrollbar.setStatusFromUnit(targetUnit);
		
		this._targetUnit = targetUnit;
		
		this._setBonusStatus(parameterChangeCommand);
		this._playParameterChangeSound();
	}

	moveWindowContent() {
		this._scrollbar.moveScrollbarCursor();
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		if (this._isTitleAllowed()) {
			this._drawTitleText(x, y);
		}
	
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	_setBonusStatus(parameterChangeCommand?) {
		var i;
		var count = ParamGroup.getParameterCount();
		var bonusArray = [];
		
		for (i = 0; i < count; i++) {
			bonusArray[i] = ParamGroup.getDopingParameter(parameterChangeCommand, i);
		}
		
		this._scrollbar.setStatusBonus(bonusArray);
	}

	_drawTitleText(x?, y?) {
		var text = this._targetUnit.getName();
		var textui = this._getTitleTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		x -= 15;
		y -= 62;
		TextRenderer.drawFixedTitleText(x, y, text, color, font, TextFormat.CENTER, pic, this._getTitlePartsCount());
	}

	_getTitleTextUI() {
		return root.queryTextUI('objective_title');
	}

	_isTitleAllowed() {
		return true;
	}

	_getTitlePartsCount() {
		return 5;
	}

	_playParameterChangeSound() {
		MediaControl.soundDirect('parameterchange');
	}
}
