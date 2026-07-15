
class ListCommandManagerMode {

	static TITLE: any = 0;

	static OPEN: any = 1;
}

class BaseListCommandManager extends BaseObject {

	_groupArray: any = null;

	_commandScrollbar: any = null;

	_currentTarget: any = null;

	openListCommandManager() {
		this._commandScrollbar = this._createListCommandScrollbar();
		this._commandScrollbar.setActive(true);
		this.rebuildCommand();
		this._playCommandOpenSound();
		this.changeCycleMode(ListCommandManagerMode.TITLE);
	}

	moveListCommandManager() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ListCommandManagerMode.TITLE) {
			result = this._moveTitle();
		}
		else if (mode === ListCommandManagerMode.OPEN) {
			result = this._moveOpen();
		}
		
		return result;
	}

	drawListCommandManager() {
		var mode = this.getCycleMode();
		
		if (mode === ListCommandManagerMode.TITLE) {
			this._drawTitle();
		}
		else if (mode === ListCommandManagerMode.OPEN) {
			this._drawOpen();
		}
	}

	rebuildCommand() {
		var i, count, arr;
		
		this._groupArray = [];
		this.configureCommands(this._groupArray);
		
		count = this._groupArray.length;
		arr = [];
		for (i = 0; i < count; i++) {
			this._groupArray[i]._listCommandManager = this;
			if (this._groupArray[i].isCommandDisplayable()) {
				arr.push(this._groupArray[i]);
			}
		}
		
		this._commandScrollbar.setScrollFormation(1, arr.length);
		this._commandScrollbar.setObjectArray(arr);
		
		this._groupArray = [];
	}

	rebuildCommandEx() {
		var prevIndex = this._commandScrollbar.getIndex();
		
		this.rebuildCommand();
		
		if (prevIndex >= this._commandScrollbar.getObjectCount()) {
			prevIndex = 0;
		}
		
		this._commandScrollbar.setIndex(prevIndex);
	}

	setListCommandUnit(unit?) {
		this._currentTarget = unit;
	}

	getListCommandUnit() {
		return this._currentTarget;
	}

	getPositionX() {
		return 0;
	}

	getPositionY() {
		return 0;
	}

	getCommandTextUI() {
		return root.queryTextUI('mapcommand_title');
	}

	configureCommands(groupArray?) {
	}

	getCommandScrollbar() {
		return this._commandScrollbar;
	}

	_createListCommandScrollbar() {
		return createScrollbarObject(ListCommandScrollbar, this);
	}

	_moveTitle() {
		var object;
		var result = MoveResult.CONTINUE;
		
		if (InputControl.isSelectAction()) {
			object = this._commandScrollbar.getObject();
			if (object === null) {
				return result;
			}
			
			object.openCommand();
			
			this._playCommandSelectSound();
			this.changeCycleMode(ListCommandManagerMode.OPEN);
		}
		else if (InputControl.isCancelAction()) {
			this._playCommandCancelSound();
			this._checkTracingScroll();
			result = MoveResult.END;
		}
		else {
			this._commandScrollbar.moveScrollbarCursor();
		}
		
		return result;
	}

	_moveOpen() {
		var object = this._commandScrollbar.getObject();
		var result = MoveResult.CONTINUE;
		
		if (object.moveCommand() !== MoveResult.CONTINUE) {
			this._commandScrollbar.setActive(true);
			this.changeCycleMode(ListCommandManagerMode.TITLE);
		}
		
		return result;
	}

	_drawTitle() {
		var x = this.getPositionX();
		var y = this.getPositionY();
		
		this._commandScrollbar.drawScrollbar(x, y);
	}

	_drawOpen() {
		var object = this._commandScrollbar.getObject();
		
		object.drawCommand();
	}

	_checkTracingScroll() {
		var session = root.getCurrentSession();
		var x = session.getMapCursorX();
		var y = session.getMapCursorY();
		
		MouseControl.changeCursorFromMap(x, y);
	}

	_playCommandOpenSound() {
		MediaControl.soundDirect('commandopen');
	}

	_playCommandSelectSound() {
		MediaControl.soundDirect('commandselect');
	}

	_playCommandCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}
}

class BaseCommand extends BaseObject {

	_commandlayout: any = null;

	setCommandLayout(commandlayout?) {
		this._commandlayout = commandlayout;
	}

	getCommandLayout() {
		return this._commandlayout;
	}

	getCommandName() {
		if (this._commandlayout === null) {
			return '';
		}
		
		return this._commandlayout.getName();
	}
}

class BaseListCommand extends BaseCommand {

	_listCommandManager: any = null;

	initialize() {
	}

	openCommand() {
	}

	moveCommand() {
		return MoveResult.END;
	}

	drawCommand() {
	}

	isCommandDisplayable() {
		return true;
	}
}

class ListCommandScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var textui = this.getParentInstance().getCommandTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		TextRenderer.drawFixedTitleText(x, y - 10, object.getCommandName(), color, font, TextFormat.CENTER, pic, this._getPartsCount());
	}

	drawDescriptionLine(x?, y?) {
	}

	getObjectWidth() {
		return (4 + 2) * 30;
	}

	getObjectHeight() {
		return 32;
	}

	_getPartsCount() {
		return 4;
	}
}
