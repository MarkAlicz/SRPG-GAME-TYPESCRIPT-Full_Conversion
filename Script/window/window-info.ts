
class InfoWindow extends BaseWindow {

	_message: any = null;

	_infoType: any = -1;

	_infoWidth: any = 0;

	_infoHeight: any = 0;

	_messagePager: any = null;

	setInfoMessage(message?, infoType?) {
		var messagePagerParam = this._createMessagePagerParam();
		
		this._messagePager = createObject(MessagePager);
		this._messagePager.setMessagePagerText(message, messagePagerParam);
		
		this._calculateWindowSize(this._messagePager.getTextContainerArray(), messagePagerParam.font);
		this._messagePager.setSize(this._infoWidth, this._infoHeight);
	}

	setInfoMessageAndType(message?, infoType?) {
		this._infoType = infoType;
		this.setInfoMessage(message, infoType);
	}

	moveWindowContent() {
		this._messagePager.moveMessagePager();
		
		if (InputControl.isSelectAction() || InputControl.isCancelAction()) {
			this._playCancelSound();
			return MoveResult.END;
		}
	
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		this._messagePager.drawMessagePager(x, y);
	}

	getWindowWidth() {
		return this._infoWidth + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._infoHeight + (this.getWindowYPadding() * 2);
	}

	getWindowTextUI() {
		var text = this._infoType === -1 ? 'default_window' : 'info_window';
		
		return root.queryTextUI(text);
	}

	getWindowTitleTextUI() {
		return root.queryTextUI('infowindow_title');
	}

	getWindowTitleText() {
		var text = '';
		
		if (this._infoType === InfoWindowType.INFORMATION) {
			text = StringTable.InfoWindow_Information;
		}
		else if (this._infoType === InfoWindowType.WARNING) {
			text = StringTable.InfoWindow_Warning;
		}
		
		return text;
	}

	_calculateWindowSize(containerArray?, font?) {
		var i, j, count, count2, textLine, textLineArray, width;
		var rowCount = 1;
		var maxWidth = 0;
		
		if (this._isMultiPageCheck()) {
			count = containerArray.length;
		}
		else {
			count = 1;
		}
		
		for (i = 0; i < count; i++) {
			textLineArray = containerArray[i];
			count2 = textLineArray.length;
			if (i === 0) {
				rowCount = count2;
			}
			for (j = 0; j < count2; j++) {
				textLine = textLineArray[j];
				width = root.getGraphicsManager().getTextWidth(textLine.text, font);
				if (width > maxWidth) {
					maxWidth = width;
				}
			}
		}
		
		if (rowCount > this._getMaxRowCount()) {
			rowCount = this._getMaxRowCount();
		}
		
		this._infoWidth = maxWidth;
		this._infoHeight = (font.getSize() + this._getSpaceInterval()) * rowCount;
	}

	_isMultiPageCheck() {
		return true;
	}

	_getMaxRowCount() {
		return DataConfig.isHighResolution() ? 17 : 15;
	}

	_getSpaceInterval() {
		return 10;
	}

	_createMessagePagerParam() {
		var messagePagerParam = StructureBuilder.buildMessagePagerParam();
		var textui = this.getWindowTextUI();
		
		messagePagerParam.color = textui.getColor();
		messagePagerParam.font = textui.getFont();
		messagePagerParam.rowCount = this._getMaxRowCount();
		
		return messagePagerParam;
	}

	_playCancelSound() {
	}
}
