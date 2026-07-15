
class BaseScreenMode {

	static SRC_OUT: any = 0;

	static DEST_IN: any = 1;

	static CONTENT: any = 2;

	static DEST_OUT: any = 3;

	static SRC_IN: any = 4;
}

// When switching the screen, background display, music play, and fadeout/fadein etc. are needed.
// Common processing is controlled by ScreenController so as to exclude these codes on all screens.
class ScreenController {

	static _scrollBackground: any = null;

	static enterScreenControllerCycle(screenContainer?) {
		var obj;
		var mode = -1;
		
		if (this._scrollBackground === null) {
			this._scrollBackground = createObject(ScrollBackground);
		}
		
		screenContainer.mode = 0;
		screenContainer.transition = null;
		screenContainer.isMusicPlay = false;
		
		if (SceneManager.isScreenFilled()) {
			screenContainer.transition = createObject(SystemTransition);
			mode = BaseScreenMode.DEST_IN;
		}
		else {
			obj = this._getTransitionObject(screenContainer);
			if (obj !== null) {
				screenContainer.transition = createObject(obj);
				mode = BaseScreenMode.SRC_OUT;
			}
		}
		
		if (mode !== -1) {
			screenContainer.transition.setFadeSpeed(this._getFadeSpeed());
			this._changeBaseMode(mode, screenContainer);
		}
		else {
			this._playScreenMusic(screenContainer);
			this._setScrollBackground(screenContainer);
			this._changeBaseMode(BaseScreenMode.CONTENT, screenContainer);
		}
		
		screenContainer.screen.setScreenData(screenContainer.param);
	}

	static moveScreenControllerCycle(screenContainer?) {
		var parentScreenContainer;
		var mode = screenContainer.mode;
		var transition = screenContainer.transition;
		
		if (mode === BaseScreenMode.SRC_OUT) {
			if (transition.moveTransition() !== MoveResult.CONTINUE) {
				this._changeBaseMode(BaseScreenMode.DEST_IN, screenContainer);
			}
		}
		else if (mode === BaseScreenMode.DEST_IN) {
			if (transition.moveTransition() !== MoveResult.CONTINUE) {
				this._changeBaseMode(BaseScreenMode.CONTENT, screenContainer);
			}
		}
		else if (mode === BaseScreenMode.CONTENT) {
			if (screenContainer.screen.moveScreenCycle() !== MoveResult.CONTINUE) {
				// Executing the following code means that a screen is closed.
				if (transition === null) {
					this._stopScreenMusic(screenContainer);
					this._resetScrollBackground(screenContainer);
					
					parentScreenContainer = SceneManager.getParentScreenContainer(screenContainer);
					if (parentScreenContainer !== null) {
						parentScreenContainer.screen.notifyChildScreenClosed();
					}
					
					return MoveResult.END;
				}
				else {
					this._changeBaseMode(BaseScreenMode.DEST_OUT, screenContainer);
				}
			}
		}
		else if (mode === BaseScreenMode.DEST_OUT) {
			if (transition.moveTransition() !== MoveResult.CONTINUE) {
				this._changeBaseMode(BaseScreenMode.SRC_IN, screenContainer);
			}
		}
		else if (mode === BaseScreenMode.SRC_IN) {
			if (transition.moveTransition() !== MoveResult.CONTINUE) {
				return MoveResult.END;
			}
		}
		
		this._moveCommonAnimation();
		
		return MoveResult.CONTINUE;
	}

	static moveScreenControllerBackCycle(screenContainer?) {
		this._moveCommonAnimation();
		return screenContainer.screen.moveBackScreenCycle();
	}

	static drawScreenControllerCycle(screenContainer?) {
		var mode = screenContainer.mode;
		
		if (mode === BaseScreenMode.DEST_IN || mode === BaseScreenMode.CONTENT || mode === BaseScreenMode.DEST_OUT) {
			this._drawScreenMain(screenContainer);
		}
		
		if (mode !== BaseScreenMode.CONTENT) {
			screenContainer.transition.drawTransition();
		}
	}

	static drawScreenControllerBackCycle(screenContainer?) {
		var mode, childScreenContainer;
		
		// If no child screen exists, don't continue.
		childScreenContainer = SceneManager.getChildScreenContainer(screenContainer);
		if (childScreenContainer === null) {
			return;
		}
		
		mode = childScreenContainer.mode;
		
		// To display the child screen, during fadeout/fadein,
		// the parent screen should be displayed, so the _drawScreenMain is called.
		if (mode === BaseScreenMode.SRC_OUT || mode === BaseScreenMode.SRC_IN) {
			this._drawScreenMain(screenContainer);
		}
	}

	static _moveCommonAnimation() {
		this._scrollBackground.moveScrollBackground();
	}

	static _drawScreenMain(screenContainer?) {
		var interopData, textui;
		var screen = screenContainer.screen;
		
		this._drawBackground(screenContainer);
		
		interopData = screen.getScreenInteropData();
		if (interopData !== null) {
			textui = interopData.getTopFrameTextUI();
		}
		else {
			textui = null;
		}
		
		// Draw the top frame.
		screen.drawScreenTopText(textui);
		
		if (interopData !== null) {
			textui = interopData.getBottomFrameTextUI();
		}
		else {
			textui = null;
		}
		
		// Draw the bottom frame.
		screen.drawScreenBottomText(textui);
		
		// Draw details on the screen.
		screen.drawScreenCycle();
	}

	static _drawBackground(screenContainer?) {
		this._scrollBackground.drawScrollBackground();
	}

	static _playScreenMusic(screenContainer?) {
		var handle = screenContainer.screen.getScreenMusicHandle();
		var handleActive = root.getMediaManager().getActiveMusicHandle();
		
		// If no music is set on the screen, no need to play.
		if (handle.isNullHandle()) {	
			return;
		}
		
		// Music is set on the screen, but it's the same as the music currently playing, so no need to play.
		if (handle.isEqualHandle(handleActive)) {
			return;
		}
		
		MediaControl.musicPlayNew(handle);
		screenContainer.isMusicPlay = true;
	}

	static _stopScreenMusic(screenContainer?) {
		// Go back if the music on the screen is played.
		if (screenContainer.isMusicPlay) {
			MediaControl.musicStop(MusicStopType.BACK);
		}
	}

	static _setScrollBackground(screenContainer?) {
		this._scrollBackground.startScrollBackground(screenContainer.screen.getScreenBackgroundImage());
	}

	static _resetScrollBackground(screenContainer?) {
		var parentScreenContainer = SceneManager.getParentScreenContainer(screenContainer);
		
		if (parentScreenContainer === null) {
			this._scrollBackground.startScrollBackground(null);
			return;
		}
		
		this._scrollBackground.startScrollBackground(parentScreenContainer.screen.getScreenBackgroundImage());
	}

	static _getTransitionObject(screenContainer?) {
		var obj, picScreen, parentScreenContainer;
		var picScreenParent = null;
		
		// No fadeout/fadein if there is no background set at the screen which will be switched.
		picScreen = screenContainer.screen.getScreenBackgroundImage();
		if (picScreen === null) {
			return null;
		}
		
		parentScreenContainer = SceneManager.getParentScreenContainer(screenContainer);
		if (parentScreenContainer !== null) {
			picScreenParent = parentScreenContainer.screen.getScreenBackgroundImage();
		}
		
		// No fadeout/fadein if the background which is a target of switching screen differs from the current screen background.
		if (picScreen !== picScreenParent) {
			obj = SystemTransition;
		}
		else {
			obj = null;
		}
		
		return obj;
	}

	static _getFadeSpeed() {
		return 14;
	}

	static _changeBaseMode(mode?, screenContainer?) {
		var transition = screenContainer.transition;
		
		if (mode === BaseScreenMode.SRC_OUT) {
			transition.setDestOut();
		}
		else if (mode === BaseScreenMode.DEST_IN) {
			this._playScreenMusic(screenContainer);
			this._setScrollBackground(screenContainer);
			transition.setDestIn();
		}
		else if (mode === BaseScreenMode.DEST_OUT) {
			transition.setDestOut();
		}
		else if (mode === BaseScreenMode.SRC_IN) {
			this._stopScreenMusic(screenContainer);
			this._resetScrollBackground(screenContainer);
			transition.setDestIn();
		}
		
		screenContainer.mode = mode;
	}
}
