
class DictionaryScrollbar extends BaseScrollbar {

	_funcCondition: any = null;

	_titleCount: any = 0;

	setDictionaryScrollbarParam(dictionaryScrollbarParam?) {
		this._funcCondition = dictionaryScrollbarParam.funcCondition;
	}

	setDictionaryFormation() {
		var data = this._getCountData();
		
		this._titleCount = data.titleCount;
		this.setScrollFormation(data.colCount, LayoutControl.getObjectVisibleCount(this.getObjectHeight(), 8));
	}

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var text, format;
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		var handle = null;
		
		if (this.isNameDisplayable(object, 0)) {
			text = object.getName();
			if (typeof object.getIconResourceHandle !== 'undefined') {
				handle = object.getIconResourceHandle();
			}
			format = TextFormat.LEFT;
		}
		else {
			text = StringTable.HideData_Question;
			format = TextFormat.CENTER;
		}
		
		if (handle !== null) {
			GraphicsRenderer.drawImage(x - 10, y + 10, handle, GraphicsType.ICON);
		}
		
		TextRenderer.drawFixedTitleText(x, y, text, color, font, format, pic, this._titleCount);
	}

	drawDescriptionLine(x?, y?) {
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = this.isNameDisplayable(object, 0);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	getObjectWidth() {
		return (this._titleCount + 2) * TitleRenderer.getTitlePartsWidth();
	}

	getObjectHeight() {
		return TitleRenderer.getTitlePartsHeight();
	}

	getTextUI() {
		return root.queryTextUI('extraexplanation_title');
	}

	isNameDisplayable(object?, index?) {
		return root.getStoryPreference().isTestPlayPublic() || this._funcCondition(object, index);
	}

	_getCountData() {
		var colCount = 3;
		var titleCount = 4;
		var width = root.getGameAreaWidth();
		
		if (width >= 1000) {
			colCount++;
			titleCount++;
		}
		else if (width >= 800) {
			titleCount++;
		}
		
		return {
			colCount: colCount,
			titleCount: titleCount
		};
	}
}

class ThumbnailScrollbar extends BaseScrollbar {

	_isRecollectionMode: any = false;

	_funcCondition: any = null;

	setDictionaryScrollbarParam(dictionaryScrollbarParam?) {
		this._isRecollectionMode = dictionaryScrollbarParam.isRecollectionMode;
		this._funcCondition = dictionaryScrollbarParam.funcCondition;
	}

	setDictionaryFormation() {
		this.setScrollFormation(4, LayoutControl.getObjectVisibleCount(this.getObjectHeight(), 4));
	}

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var handle;
		
		if (this.isNameDisplayable(object, 0)) {
			if (this._isRecollectionMode) {
				handle = object.getRecollectionEventInfo().getThumbnailResourceHandle();
			}
			else {
				handle = object.getThumbnailResourceHandle();
			}
		}
		else {
			handle = root.queryGraphicsHandle('colsereollection');	
		}
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.THUMBNAIL);
	}

	drawDescriptionLine(x?, y?) {
	}

	playSelectSound() {
		var object = this.getObject();
		var isSelect = this.isNameDisplayable(object, 0);
		
		if (isSelect) {
			MediaControl.soundDirect('commandselect');
		}
		else {
			MediaControl.soundDirect('operationblock');
		}
	}

	getObjectWidth() {
		return GraphicsFormat.THUMBNAIL_WIDTH;
	}

	getObjectHeight() {
		return GraphicsFormat.THUMBNAIL_HEIGHT;
	}

	getSpaceX() {
		return 40;
	}

	getSpaceY() {
		return 30;
	}

	isNameDisplayable(object?, index?) {
		return root.getStoryPreference().isTestPlayPublic() || this._funcCondition(object, index);
	}

	_getCountData() {
		var colCount = 3;
		var titleCount = 4;
		var width = root.getGameAreaWidth();
		
		if (width >= 1000) {
			colCount++;
			titleCount++;
		}
		else if (width >= 800) {
			titleCount++;
		}
		
		return {
			colCount: colCount,
			titleCount: titleCount
		};
	}
}
