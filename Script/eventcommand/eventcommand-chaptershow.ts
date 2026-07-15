
class ChapterShowMode {

	static FADEOUT: any = 0;

	static TITLE: any = 1;

	static FADEIN: any = 2;

	static BLACKIN: any = 3;
}

class ChapterShowEventCommand extends BaseEventCommand {

	_chapterName: any = null;

	_mapName: any = null;

	_transition: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		if (mode === ChapterShowMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === ChapterShowMode.TITLE) {
			result = this._moveTitle();
		}
		else if (mode === ChapterShowMode.FADEIN) {
			result = this._moveFadein();
		}
		else if (mode === ChapterShowMode.BLACKIN) {
			result = this._moveBlackin();
		}
		
		return result;
	}

	drawEventCommandCycle() {
		var mode = this.getCycleMode();
		
		if (mode === ChapterShowMode.FADEOUT || mode === ChapterShowMode.TITLE || mode === ChapterShowMode.FADEIN || mode === ChapterShowMode.BLACKIN) {
			this._transition.drawTransition();
		}
		
		if (mode === ChapterShowMode.TITLE) {
			this._drawFrame();
		}
	}

	mainEventCommand() {
		if (this._transition !== null) {
			// If it's skipped etc., don't leave the fadeout/fadein.
			this._transition.resetTransition();
		}
	}

	_prepareEventCommandMemberData() {
		this._setString();
		this._transition = createObject(SystemTransition);
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		// Prevent all screen in dark by specifying EffectRangeType.MAPANDCHAR.
		this._transition.setEffectRangeType(EffectRangeType.MAPANDCHAR);
		this._transition.setFadeSpeed(5);
		
		// If the screen has already been painted, only return is fine.
		if (SceneManager.isScreenFilled()) {
			this._changeBlackin();
		}
		else {
			this._changeFadeout();
		}
		
		return EnterResult.OK;
	}

	_setString() {
		var mapInfo;
		var eventCommandData = root.getEventCommandObject();
		
		if (eventCommandData.isMapInfoRef()) {
			mapInfo = root.getCurrentSession().getCurrentMapInfo();
			this._chapterName = mapInfo.getName();
			this._mapName = mapInfo.getMapName();
		}
		else {
			this._chapterName = eventCommandData.getChapterName();
			this._mapName = eventCommandData.getMapName();
		}
	}

	_moveFadeout() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ChapterShowMode.TITLE);
		}
		
		return MoveResult.CONTINUE;
	}

	_moveFadein() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_moveTitle() {
		if (InputControl.isSelectAction() || InputControl.isCancelState()) {
			this._changeFadein();
		}
		
		return MoveResult.CONTINUE;
	}

	_moveBlackin() {
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(ChapterShowMode.TITLE);
		}
		
		return MoveResult.CONTINUE;
	}

	_drawFrame() {
		var textui = this._getTextUI();
		var pic = textui.getUIImage();
		var pos = this._getBasePos();
		
		if (pic !== null) {
			pic.draw(pos.x, pos.y);
		}
		
		this._drawFirst();
		this._drawSecond();
		this._drawThird();
	}

	_drawFirst() {
		var x, width;
		var mapInfo = root.getCurrentSession().getCurrentMapInfo();
		var title = ChapterRenderer.getChapterText(mapInfo);
		var pos = this._getBasePos();
		var textui = this._getSubTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		width = TextRenderer.getTextWidth(title, font);
		x = LayoutControl.getCenterX(-1, width);
		
		TextRenderer.drawText(x, pos.y + this._getVerticalPositionArray()[0], title, -1, color, font);
	}

	_drawSecond() {
		var x, width;
		var pos = this._getBasePos();
		var textui = this._getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		width = TextRenderer.getTextWidth(this._chapterName, font);
		x = LayoutControl.getCenterX(-1, width);
		TextRenderer.drawText(x, pos.y + this._getVerticalPositionArray()[1], this._chapterName, -1, color, font);
	}

	_drawThird() {
		var x, width, title;
		var pos = this._getBasePos();
		var textui = this._getSubTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		
		if (this._mapName === '') {
			return;
		}
		
		title = '(' + this._mapName + ')';
		
		width = TextRenderer.getTextWidth(title, font);
		x = LayoutControl.getCenterX(-1, width);
		
		TextRenderer.drawText(x, pos.y + this._getVerticalPositionArray()[2], title, -1, color, font);
	}

	_getVerticalPositionArray() {
		return [10, 38, 70];
	}

	_getTextUI() {
		return root.queryTextUI('chapter_frame');
	}

	_getSubTextUI() {
		return root.queryTextUI('default_window');
	}

	_getBasePos() {
		var pic;
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var y = LayoutControl.getCenterY(-1, UIFormat.SCREENFRAME_HEIGHT);
		var textui = this._getTextUI();

		if (textui !== null) {
			pic = textui.getUIImage();
			if (pic !== null) {
				x = LayoutControl.getCenterX(-1, pic.getWidth());
				y = LayoutControl.getCenterY(-1, pic.getHeight());
			}
		}

		return createPos(x, y);
	}

	_changeFadeout() {
		this._playChapterSound();
		this._transition.setHalfOut();
		this.changeCycleMode(ChapterShowMode.FADEOUT);
	}

	_changeFadein() {
		this._transition.setHalfIn();
		this.changeCycleMode(ChapterShowMode.FADEIN);
	}

	_changeBlackin() {
		this._playChapterSound();
		this._transition.setVolume(255, 128, 255, false);
		this.changeCycleMode(ChapterShowMode.BLACKIN);
	}

	_playChapterSound() {
		MediaControl.soundDirect('chaptershow');
	}
}
