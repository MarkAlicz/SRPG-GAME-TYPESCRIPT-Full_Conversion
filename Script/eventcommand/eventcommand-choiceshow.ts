
class ChoiceShowEventCommand extends BaseEventCommand {
	_isTwoLines: any;


	_scrollbar: any = null;

	_messageArray: any = null;

	_switchArray: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this._selectItem(this._scrollbar.getIndex());
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		var x = LayoutControl.getCenterX(-1, this._scrollbar.getScrollbarWidth());
		var y = LayoutControl.getCenterY(-1, this._scrollbar.getScrollbarHeight());
		
		this._scrollbar.drawScrollbar(x, y);
	}

	isEventCommandSkipAllowed() {
		// Don't allow the skip by pressing the Start.
		return false;
	}

	isTwoLines() {
		return this._isTwoLines;
	}

	_prepareEventCommandMemberData() {
		var eventCommandData = root.getEventCommandObject();
		
		this._scrollbar = createScrollbarObject(SelectScrollbar, this);
		this._messageArray = [];
		this._switchArray = [];
		this._isTwoLines = eventCommandData.isTwoLines();
		
		this._resetPreviousSelfSwitches(eventCommandData);
		
		this._setScrollbarData(eventCommandData);
		
		// Choices are needed to display even if it's a skip mode, so force skip to be suspended.
		this.stopEventSkip();
	}

	_resetPreviousSelfSwitches(eventCommandData?) {
		eventCommandData.resetSelfSwitches();
	}

	_setScrollbarData(eventCommandData?) {
		var i, text, obj;
		var replacer = createObject(VariableReplacer);
		var maxMessageCount = this._getMaxMessageCount();
		
		for (i = 0; i < maxMessageCount; i++) {
			if (!eventCommandData.isChoiceDisplayable(i)) {
				continue;
			}
			
			text = replacer.startReplace(eventCommandData.getMessage(i));
			if (text.length !== 0) {
				obj = {};
				obj.text = text;
				obj.handle = eventCommandData.getIconResourceHandle(i);
			
				this._messageArray.push(obj);
				this._switchArray.push(eventCommandData.getSelfSwitchId(i));
			}
		}
	}

	_checkEventCommand() {
		if (this._messageArray.length === 0) {
			return false;
		}
		
		return true;
	}

	_completeEventCommandMemberData() {
		var max;
		var count = 5;
		
		if (this._isTwoLines) {
			max = Math.ceil(this._messageArray.length / 2);
		}
		else {
			max = this._messageArray.length;
		}
		
		if (count > max) {
			count = max;
		}
		
		if (this._isTwoLines) {
			this._scrollbar.setScrollFormation(2, count);
		}
		else {
			this._scrollbar.setScrollFormation(1, count);
		}
		
		this._scrollbar.setObjectArray(this._messageArray);
		this._scrollbar.setActive(true);
	
		return EnterResult.OK;
	}

	_selectItem(index?) {
		var id = this._switchArray[index];
		
		root.setSelfSwitch(id, true);
	}

	_getMaxMessageCount() {
		return root.getEventCommandObject().getChoiceCount();
	}
}

class SelectScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var dx, dy;
		var textui = this.getScrollTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var count = this._getCount();
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		var textWidth = TextRenderer.getTextWidth(object.text, font);
		var textHeight = TextRenderer.getTextHeight(object.text, font);
		
		if (isSelect) {
			TitleRenderer.drawhHiglightTitle(pic, x, y, width, height, count, this._getHighlightColor(), this._getHighlightAlpha());
		}
		else {
			TitleRenderer.drawTitle(pic, x, y, width, height, count);
		}
		
		if (!object.handle.isNullHandle()) {
			dx = Math.floor((this.getObjectWidth() - (textWidth + GraphicsFormat.ICON_WIDTH + 4)) / 2);
			dy = Math.floor((height - GraphicsFormat.ICON_HEIGHT) / 2);
			GraphicsRenderer.drawImage(x + dx, y + dy, object.handle, GraphicsType.ICON);
			
			dx += GraphicsFormat.ICON_WIDTH + 4;
		}
		else {
			dx = Math.floor((this.getObjectWidth() - textWidth) / 2);
		}
		
		dy = Math.floor((height - textHeight) / 2);
		TextRenderer.drawText(x + dx, y + dy, object.text, -1, color, font);	
	}

	drawDescriptionLine(x?, y?) {
	}

	playCancelSound() {
	}

	getObjectWidth() {
		var count = this._getCount() + 2;
		
		return count * TitleRenderer.getTitlePartsWidth();
	}

	getObjectHeight() {
		return TitleRenderer.getTitlePartsHeight();
	}

	getScrollTextUI() {
		return root.queryTextUI('select_title');
	}

	getSpaceX() {
		return 20;
	}

	getSpaceY() {
		return 20;
	}

	_getCount() {
		return this.getParentInstance().isTwoLines() ? 6 : 12;
	}

	_getHighlightColor() {
		return 0xffffff;
	}

	_getHighlightAlpha() {
		return 64;
	}
}
