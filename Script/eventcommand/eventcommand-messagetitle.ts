
class MessageTitleEventCommand extends BaseEventCommand {

	_text: any = null;

	_partsCount: any = 0;

	_partsWidth: any = 0;

	_partsHeight: any = 0;

	_xStart: any = 0;

	_yStart: any = 0;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (InputControl.isSelectAction()) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x, y, pos;
		var textui = this._getTitleText();
		var pic = textui.getUIImage();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._xStart === -1 && this._xStart === -1) {
			pos = this._getTitleCenterPos();
			x = pos.x;
			y = pos.y;
		}
		else {
			x = this._xStart;
			y = this._yStart;
		}
		
		TextRenderer.drawFixedTitleText(x, y, this._text, color, font, TextFormat.CENTER, pic, this._partsCount);
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		var textui = this._getTitleText();
		var font = textui.getFont();
		
		this._text = eventCommandData.getText();
		this._partsCount = this._getTitlePartsCount(this._text, font);
		this._partsWidth = TitleRenderer.getTitlePartsWidth();
		this._partsHeight = TitleRenderer.getTitlePartsHeight();
		
		if (eventCommandData.isCenterShow()) {
			// The value of root.getGameAreaWidth changes depending on if it's specific background base or map base.
			// The center position is different, so don't call _getTitleCenterPos.
			this._xStart = -1;
			this._yStart = -1;
		}
		else {
			this._xStart = eventCommandData.getX();
			this._yStart = eventCommandData.getY();
		}
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		return EnterResult.OK;
	}

	_getTitleCenterPos() {
		var x, y;
		var maxWidth = this._partsWidth * (this._partsCount + 2);
		
		x = Math.floor(root.getGameAreaWidth() / 2);
		x -= Math.floor(maxWidth / 2);

		y = Math.floor(root.getGameAreaHeight() / 2);
		y -= Math.floor(this._partsHeight / 2);
		
		return createPos(x, y);
	}

	_getTitlePartsCount(text?, font?) {
		return TitleRenderer.getTitlePartsCount(text, font);
	}

	_getTitleText() {
		return root.queryTextUI('eventmessage_title');
	}
}
