
class GameOverMode {

	static FADEOUT: any = 0;

	static MAIN: any = 1;
}

class GameOverScene extends BaseScene {

	_transition: any = null;

	_scrollBackground: any = null;

	_isBackDraw: any = false;

	setSceneData() {
		this._prepareSceneMemberData();
		this._completeSceneMemberData();
	}

	moveSceneCycle() {
		var mode = this.getCycleMode();
		var result = MoveResult.CONTINUE;
		
		this._moveCommonAnimation();
		
		if (mode === GameOverMode.FADEOUT) {
			result = this._moveFadeout();
		}
		else if (mode === GameOverMode.MAIN) {
			result = this._moveMain();
		}
		
		return result;
	}

	drawSceneCycle() {
		var mode = this.getCycleMode();
		
		MapLayer.drawUnitLayer();
		
		this._transition.drawTransition();
		
		if (this._isBackDraw || mode === GameOverMode.MAIN) {
			this._drawMain();
		}
	}

	_prepareSceneMemberData() {
		this._transition = createObject(SystemTransition);
		this._scrollBackground = createObject(ScrollBackground);
		this._isBackDraw = false;
	}

	_completeSceneMemberData() {
		this._transition.enableDoubleFade();
		this._transition.setFadeSpeed(3);
		this._transition.setDestOut();
		
		this._setBackgroundData();
		
		MediaControl.musicPlayNew(root.querySoundHandle('gameovermusic'));
		
		this.changeCycleMode(GameOverMode.FADEOUT);
	}

	_setBackgroundData() {
		var pic = root.getSceneController().getSceneBackgroundImage(SceneType.GAMEOVER);
		
		this._scrollBackground.startScrollBackground(pic);
	}

	_moveCommonAnimation() {
		MapLayer.moveMapLayer();
		this._scrollBackground.moveScrollBackground();
		
		return MoveResult.CONTINUE;
	}

	_moveFadeout() {
		if (this._isResetAction()) {
			this._doResetAction();
			return MoveResult.END;
		}
		
		if (this._transition.moveTransition() !== MoveResult.CONTINUE) {
			this.changeCycleMode(GameOverMode.MAIN);
		}
		else {
			if (!this._isBackDraw && this._transition.isOneFadeLast()) {
				this._isBackDraw = true;
				root.resetVisualEventObject();
			}
		}
		
		return MoveResult.CONTINUE;
	}

	_moveMain() {
		if (this._isResetAction()) {
			this._doResetAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	_drawMain() {
		this._scrollBackground.drawScrollBackground();
	}

	_isResetAction() {
		return InputControl.isSelectAction();
	}

	_doResetAction() {
		root.resetGame();
	}
}
