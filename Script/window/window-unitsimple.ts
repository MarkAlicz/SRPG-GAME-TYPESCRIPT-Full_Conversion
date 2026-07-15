
class UnitSimpleWindow extends BaseWindow {

	_unit: any = null;

	_mhp: any = 0;

	setFaceUnitData(unit?) {
		this._unit = unit;
		this._mhp = ParamBonus.getMhp(unit);
	}

	moveWindowContent() {
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		UnitSimpleRenderer.drawContentEx(x, y, this._unit, this.getWindowTextUI(), this._mhp);
	}

	getWindowWidth() {
		return ItemRenderer.getItemWindowWidth();
	}

	getWindowHeight() {
		return DefineControl.getFaceWindowHeight();
	}

	getWindowXPadding() {
		return DefineControl.getFaceXPadding();
	}

	getWindowYPadding() {
		return DefineControl.getFaceYPadding();
	}

	getWindowTextUI() {
		return root.queryTextUI('face_window');
	}

	getWindowUI() {
		return root.queryTextUI('face_window').getUIImage();
	}
}

class UnitSimpleNameWindow extends BaseWindow {

	_unit: any = null;

	setFaceUnitData(unit?) {
		this._unit = unit;
	}

	moveWindowContent() {
		return MoveResult.CONTINUE;
	}

	drawWindowContent(x?, y?) {
		var textui = this.getWindowTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var infoColor = ColorValue.KEYWORD;
		var width = TextRenderer.getTextWidth(StringTable.UnitSimple_Target, font) + 5;
		
		TextRenderer.drawKeywordText(x, y, StringTable.UnitSimple_Target, -1, infoColor, font);
		TextRenderer.drawKeywordText(x + width, y, this._unit.getName(), this._getLength(), color, font);
	}

	getWindowWidth() {
		return ItemRenderer.getItemWindowWidth();
	}

	getWindowHeight() {
		return 56;
	}

	_getLength() {
		return 175;
	}
}
