
class QuestionAnswer {

	static YES: any = 0;

	static NO: any = 1;
}

class QuestionWindow extends BaseWindow {

	_message: any = '';

	_scrollbar: any = null;

	_ans: any = 0;

	_windowWidth: any = 0;

	setQuestionMessage(message?) {
		this._message = message;
		this._createScrollbar();
		this._calculateWindowSize();
		this.setQuestionIndex(0);
	}

	moveWindowContent() {
		var index;
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			index = this._scrollbar.getIndex();
			if (index === 0) {
				this._ans = QuestionAnswer.YES;
			}
			else {
				this._ans = QuestionAnswer.NO;
			}
			this.setQuestionIndex(0);
			return MoveResult.END;
		}
		else if (input === ScrollbarInput.CANCEL) {
			this._ans = QuestionAnswer.NO;
			this.setQuestionIndex(0);
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var length = this._getTextLength();
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		y += 10;
		TextRenderer.drawText(x, y, this._message, length, color, font);
		
		this._scrollbar.drawScrollbar(x, y);
	}

	drawDescriptionLine(x?, y?) {
	}

	setQuestionIndex(index?) {
		this._scrollbar.setIndex(index);
	}

	setQuestionActive(isActive?) {
		this._scrollbar.setActive(isActive);
	}

	getWindowWidth() {
		return this._windowWidth;
	}

	getWindowHeight() {
		return 120;
	}

	getQuestionAnswer() {
		return this._ans;
	}

	_createScrollbar() {
		var arr = [StringTable.QuestionWindow_DefaultCase1, StringTable.QuestionWindow_DefaultCase2];
		
		this._scrollbar = createScrollbarObject(QuestionScrollbar, this);
		this._scrollbar.setScrollFormation(2, 1);
		this._scrollbar.setObjectArray(arr);
	}

	_calculateWindowSize() {
		var textui = this.getWindowTextUI();
		
		this._windowWidth = TextRenderer.getTextWidth(this._message, textui.getFont()) + (DefineControl.getWindowXPadding() * 3);
		if (this._windowWidth < 250) {
			this._windowWidth = 250;
		}
		else if (this._windowWidth > 500) {
			this._windowWidth = 500;
		}
	}

	_getTextLength() {
		return this.getWindowWidth();
	}
}

class QuestionScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = this._getTextLength();
		var textui = this.getParentTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		// Shift position so as not to overlap the cursor.
		x += 3;
		y += 8;
		TextRenderer.drawText(x, y, object, length, color, font);
		
		this._drawLine(x, y, object, isSelect, index, font);	
	}

	drawDescriptionLine(x?, y?) {
	}

	getScrollXPadding() {
		return 60;
	}

	getScrollYPadding() {
		return 40;
	}

	getObjectWidth() {
		return 70;
	}

	getObjectHeight() {
		return 30;
	}

	_drawLine(x?, y?, object?, isSelect?, index?, font?) {
		var width = this._getLineWidth();
		var pic = root.queryUI('select_line');
		
		if (isSelect) {
			TitleRenderer.drawLine(x - 3, y + 14, width, pic);
		}
	}

	_getLineWidth(object?, font?) {
		return 20;
	}

	_getTextLength() {
		return this.getObjectWidth();
	}
}
