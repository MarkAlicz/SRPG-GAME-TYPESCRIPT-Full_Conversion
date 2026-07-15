
var cur_map = null;

// One scene has a possibility in which several screens exist.
// These screens are controlled as _screenArray and currently displayed as the last element of array at the front screen.
// The specific screen processing is done through ScreenController.
class SceneManager {

	static _sceneType: any = 0;

	static _screenArray: any = null;

	static _activeAcene: any = null;

	static _isForceForeground: any = false;

	static enterSceneManagerCycle(sceneType?) {
		this._sceneType = sceneType;
		this._screenArray = [];
		
		CacheControl.clearCache();
		
		// This variable will be updated if "Call Save Screen" is used in the op event immediately after the game starts.
		// Initialize the variable before updating to "Call Save Screen".
		this._isForceForeground = false;
		
		this._activeAcene = this._createSceneObject(sceneType);
		this._activeAcene.setSceneData();
		
		return EnterResult.OK;
	}

	static moveSceneManagerCycle() {
		var i;
		var count = this._screenArray.length;
		var result = this._activeAcene.moveSceneCycle();
		
		for (i = 0; i < count; i++) {
			if (i + 1 === count) {
				// Call moveScreenControllerCycle because the this._screenArray[i] is currently displayed on the front screen.
				result = ScreenController.moveScreenControllerCycle(this._screenArray[i]);
				if (result !== MoveResult.CONTINUE) {
					// Go back to the previous screen because the this._screenArray[i] screen was closed.
					this._screenArray.pop();
				}
			}
			else {
				// call moveScreenControllerBackCycle because the this._screenArray[i] is currently displayed on the back screen.
				ScreenController.moveScreenControllerBackCycle(this._screenArray[i]);
			}
		}
		
		return result;
	}

	static drawSceneManagerCycle() {
		var i;
		var count = this._screenArray.length;
		
		this._activeAcene.drawSceneCycle();
		
		for (i = 0; i < count; i++) {
			if (i + 1 === count) {
				ScreenController.drawScreenControllerCycle(this._screenArray[i]);
			}
			else {
				ScreenController.drawScreenControllerBackCycle(this._screenArray[i]);
			}
		}
	}

	static backSceneManagerCycle() {
		var i;
		var count = this._screenArray.length;
		
		this._activeAcene.moveBackSceneCycle();
		
		for (i = 0; i < count; i++) {
			ScreenController.moveScreenControllerBackCycle(this._screenArray[i]);
		}
		
		return true;
	}

	static addScreen(screen?, param?) {
		var screenContainer: any = {};
		
		screenContainer.screen = screen;
		screenContainer.param = param;
		this._screenArray.push(screenContainer);
		
		ScreenController.enterScreenControllerCycle(screenContainer);
	}

	static getChildScreenContainer(screenContainer?) {
		var i;
		var count = this._screenArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._screenArray[i] === screenContainer) {
				if (i < count - 1) {
					// Return the next screen (child screen) of the current screen.
					return this._screenArray[i + 1];
				}
			}
		}
		
		return null;
	}

	static getParentScreenContainer(screenContainer?) {
		var i;
		var count = this._screenArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._screenArray[i] === screenContainer) {
				if (i - 1 >= 0) {
					// Return the previous screen (parent screen) of the current screen.
					return this._screenArray[i - 1];
				}
			}
		}
		
		return null;
	}

	static getActiveScene() {
		return this._activeAcene;
	}

	static getLastScreen() {
		if (this._screenArray.length === 0) {
			return null;
		}
		
		return this._screenArray[this._screenArray.length - 1].screen;
	}

	static setEffectAllRange(isFilled?) {
		var effect = root.getScreenEffect();
		
		if (isFilled) {
			effect.setAlpha(255);
		}
		else {
			effect.setAlpha(0);
		}
		
		effect.setRange(EffectRangeType.ALL);
	}

	
	// If this method returns true,
	// it means that entire screen is painted in one color depending on the color which obj shows.
	static isScreenFilled() {
		var effect = root.getScreenEffect();
		
		return effect.getAlpha() === 255;
	}

	static resetCurrentMap() {
		cur_map = root.getCurrentSession().getCurrentMapInfo();
		
		CurrentMap.prepareMap();
	}

	static isScreenClosed(screen?) {
		var i;
		var count = this._screenArray.length;
		
		for (i = 0; i < count; i++) {
			if (this._screenArray[i].screen === screen) {
				return false;
			}
		}
		
		return true;
	}

	static getScreenCount() {
		return this._screenArray.length;
	}

	static isForceForeground() {
		return this._isForceForeground;
	}

	static setForceForeground(isForceForeground?) {
		this._isForceForeground = isForceForeground;
	}

	static isCustomScene(sceneType?) {
		return sceneType >= SceneType.CUSTOM && sceneType <= SceneType.RESERVED;
	}

	static _createSceneObject(scene?) {
		var obj = null;
		
		if (scene === SceneType.TITLE) {
			obj = TitleScene;
		}
		else if (scene === SceneType.ENDING) {
			obj = EndingScene;
		}
		else if (scene === SceneType.GAMEOVER) {
			obj = GameOverScene;
		}
		else if (scene === SceneType.FREE) {
			obj = FreeAreaScene;
		}
		else if (scene === SceneType.BATTLESETUP) {
			obj = BattleSetupScene;
		}
		else if (scene === SceneType.BATTLERESULT) {
			obj = BattleResultScene;
		}
		else if (scene === SceneType.REST) {
			obj = RestScene;
		}
		else if (scene === SceneType.EVENTTEST) {
			obj = EventTestScene;
		}
		
		return createObject(obj);
	}
}
