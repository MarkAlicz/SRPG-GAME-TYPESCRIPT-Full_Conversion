
class DiscardWindowResult {

	static DISCARD: any = 0;

	static CANCEL: any = 1;

	static NONE: any = 2;
}

class DiscardManager extends BaseWindowManager {

	_questionWindow: any = null;

	_infoWindow: any = null;

	_item: any = null;

	_isImportance: any = false;

	setDiscardItem(item?) {
		this._questionWindow = createWindowObject(QuestionWindow, this);
		this._questionWindow.setQuestionMessage(StringTable.StockItem_ItemDiscard);
		this._infoWindow = createWindowObject(InfoWindow, this);
		this._item = item;
		this._isImportance = this._checkImportance(item);
		
		if (this._isImportance) {
			this._playOperationBlockSound();
			this._infoWindow.setInfoMessage(StringTable.Discard_Warning);
		}
		
		this._questionWindow.setQuestionActive(true);
	}

	moveWindowManager() {
		var result = DiscardWindowResult.NONE;
		
		if (this._isImportance) {
			if (this._infoWindow.moveWindow() !== MoveResult.CONTINUE) {
				result = DiscardWindowResult.CANCEL;
			}
		}
		else {
			result = this._moveDiscard();
		}
		
		return result;
	}

	drawWindowManager() {
		var x = LayoutControl.getCenterX(-1, this._questionWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._questionWindow.getWindowHeight());
		
		if (this._isImportance) {
			this._infoWindow.drawWindow(x, y);
		}
		else {
			this._questionWindow.drawWindow(x, y);
		}
	}

	_moveDiscard() {
		var result = DiscardWindowResult.NONE;
		
		if (this._questionWindow.moveWindow() !== MoveResult.CONTINUE) {
			if (this._questionWindow.getQuestionAnswer() === QuestionAnswer.YES) {
				this._discardItem();
				result = DiscardWindowResult.DISCARD;
			}
			else {
				result = DiscardWindowResult.CANCEL;
			}
		}
		
		return result;
	}

	_checkImportance(item?) {
		return item.isImportance();
	}

	_playOperationBlockSound() {
		MediaControl.soundDirect('operationblock');
	}

	_discardItem() {
	}
}
