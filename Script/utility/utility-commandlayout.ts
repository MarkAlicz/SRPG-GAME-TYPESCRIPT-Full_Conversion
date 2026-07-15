
class CommandMixer extends BaseObject {

	_arr: any = null;

	initialize() {
		this._arr = [];
	}

	pushCommand(command?, type?) {
		var obj: any = {};
		
		obj.command = command;
		obj.type = type;
		this._arr.push(obj);
	}

	mixCommand(index?, groupArray?, baseObject?) {
		var i, commandLayout, isShared, obj;
		var screenLauncher = null;
		var list = root.getBaseData().getCommandLayoutList(index);
		var count = list.getCount();
		
		for (i = 0; i < count; i++) {
			commandLayout = list.getData(i);
			if (!this._isVisible(commandLayout)) {
				continue;
			}
			
			isShared = false;
			
			obj = this._getObjectFromActionType(commandLayout.getCommandActionType());
			if (obj === null) {
				obj = this._inheritBaseObject(baseObject);
				isShared = true;
			}
			
			if (obj === null) {
				continue;
			}
			
			if (isShared) {
				screenLauncher = this._getScreenLauncher(commandLayout);
				if (screenLauncher === null) {
					continue;
				}
			}
			
			if (commandLayout.getCommandActionType() === CommandActionType.SHOPLIST) {
				this._pushShop(groupArray, commandLayout, obj, true);
			}
			else if (commandLayout.getCommandActionType() === CommandActionType.SHOP) {
				this._pushShop(groupArray, commandLayout, obj, false);
			}
			else if (commandLayout.getCommandActionType() === CommandActionType.BONUS) {
				this._pushBonus(groupArray, commandLayout, obj);
			}
			else {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				if (isShared) {
					groupArray[groupArray.length - 1].setScreenLauncher(screenLauncher);
				}
			}
			
		}
	}

	_pushShop(groupArray?, commandLayout?, obj?, isList?) {
		var i, count, list, shopData;
		
		if (isList && root.getRestPreference().isShopListView()) {
			if (root.getBaseData().getRestShopList().getCount() > 1) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(ShopListScreenLauncher);
				return;
			}
		}
		
		if (isList) {
			list = root.getBaseData().getRestShopList();
		}
		else {
			list = root.getCurrentSession().getCurrentMapInfo().getShopDataList();
		}
		
		count = list.getCount();
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(this._getScreenLauncher(commandLayout));
				groupArray[groupArray.length - 1].getScreenLauncher().setShopData(shopData);
			}
		}
	}

	_pushBonus(groupArray?, commandLayout?, obj?) {
		var i, count, list, shopData;
		
		if (root.getRestPreference().isBonusListView()) {
			if (root.getBaseData().getRestBonusList().getCount() > 1) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(BonusListScreenLauncher);
				return;
			}
		}
		
		list = root.getBaseData().getRestBonusList();
		count = list.getCount();
		for (i = 0; i < count; i++) {
			shopData = list.getData(i);
			if (shopData.isShopDisplayable() && shopData.getShopItemArray().length > 0) {
				groupArray.appendObject(obj);
				groupArray[groupArray.length - 1].setCommandLayout(commandLayout);
				groupArray[groupArray.length - 1].setScreenLauncher(this._getScreenLauncher(commandLayout));
				groupArray[groupArray.length - 1].getScreenLauncher().setShopData(shopData);
			}
		}
	}

	_getObjectFromActionType(commandActionType?) {
		var i;
		var obj = null;
		var count = this._arr.length;
		
		for (i = 0; i < count; i++) {
			if (this._arr[i].type === commandActionType) {
				obj = this._arr[i].command;
				break;
			}
		}
		
		return obj;
	}

	_isVisible(commandLayout?) {
		var commandVisibleType = commandLayout.getCommandVisibleType();
		
		if (commandVisibleType === CommandVisibleType.SHOW) {
			return true;
		}
		else if (commandVisibleType === CommandVisibleType.SWITCH && commandLayout.isGlobalSwitchOn()) {
			return true;
		}
		else if (commandVisibleType === CommandVisibleType.TESTPLAY && root.isTestPlay()) {
			return true;
		}
		
		return false;
	}

	_getScreenLauncher(commandLayout?) {
		var screenLauncher = null;
		var commandActionType = commandLayout.getCommandActionType();
		
		if (commandActionType === CommandActionType.CONFIG) {
			screenLauncher = ConfigScreenLauncher;
		}
		else if (commandActionType === CommandActionType.EXTRA) {
			screenLauncher = ExtraScreenLauncher;
		}
		else if (commandActionType === CommandActionType.RECOLLECTION) {
			screenLauncher = RecollectionScreenLauncher;
		}
		else if (commandActionType === CommandActionType.CHARACTER) {
			screenLauncher = CharacterScreenLauncher;
		}
		else if (commandActionType === CommandActionType.WORD) {
			screenLauncher = WordScreenLauncher;
		}
		else if (commandActionType === CommandActionType.GALLERY) {
			screenLauncher = GalleryScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SOUNDROOM) {
			screenLauncher = SoundRoomScreenLauncher;
		}
		
		else if (commandActionType === CommandActionType.SHOP) {
			screenLauncher = ShopScreenLauncher;
		}
		else if (commandActionType === CommandActionType.BONUS) {
			screenLauncher = BonusScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SWITCH) {
			screenLauncher = SwitchScreenLauncher;
		}
		else if (commandActionType === CommandActionType.VARIABLE) {
			screenLauncher = VariableScreenLauncher;
		}
		else if (commandActionType === CommandActionType.LOAD) {
			screenLauncher = LoadScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SAVE) {
			screenLauncher = SaveScreenLauncher;
		}
		else if (commandActionType === CommandActionType.COMMUNICATION) {
			screenLauncher = CommunicationScreenLauncher;
		}
		else if (commandActionType === CommandActionType.OBJECTIVE) {
			screenLauncher = ObjectiveScreenLauncher;
		}
		else if (commandActionType === CommandActionType.TALKCHECK) {
			screenLauncher = TalkCheckScreenLauncher;
		}
		else if (commandActionType === CommandActionType.UNITSUMMARY) {
			screenLauncher = UnitSummaryScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SKILL) {
			screenLauncher = SkillScreenLauncher;
		}
		else if (commandActionType === CommandActionType.UNITMARSHAL) {
			screenLauncher = UnitMarshalScreenLauncher;
		}
		else if (commandActionType === CommandActionType.SHOPLIST) {
			// It's not a ShopListScreenLauncher.
			screenLauncher = ShopScreenLauncher;
		}
		else if (commandActionType === CommandActionType.EXPERIENCEDISTRIBUTION) {
			screenLauncher = ExperienceDistributionScreenLauncher;
		}
		
		if (screenLauncher === null) {
			return null;
		}
		
		return screenLauncher.isLaunchable() ? screenLauncher : null;
	}

	_inheritBaseObject(baseObject?) {
		var definition = {
			_screenLauncher: null,
			
			openCommand: function() {
				this._screenLauncher.openScreenLauncher();
			},
			
			moveCommand: function() {
				var result = this._screenLauncher.moveScreenLauncher();
				
				if (result !== MoveResult.CONTINUE) {
					if (this._screenLauncher.isRebuild()) {
						this._listCommandManager.rebuildCommandEx();
					}
				}
				
				return result;
			},
			
			setScreenLauncher: function(screenLauncher) {
				this._screenLauncher = createObject(screenLauncher);
			},
			
			getScreenLauncher: function() {
				return this._screenLauncher;
			},
			
			getCommandName: function() {
				var name = this._screenLauncher.getCommandName();
				
				// If ScreenLauncher doesn't define a name,
				// use the name which was set with Command Layout.
				if (name === '') {
					return BaseCommand.prototype.getCommandName.call(this);
				}
				
				return name;
			}
		};
		
		return defineObject(baseObject, definition);
	}
}

class BaseScreenLauncher extends BaseObject {

	_screen: any = null;

	openScreenLauncher() {
		var screenParam = this._createScreenParam();
		
		this._screen = createObject(this._getScreenObject());
		SceneManager.addScreen(this._screen, screenParam);
	}

	moveScreenLauncher() {
		if (SceneManager.isScreenClosed(this._screen)) {
			this._doEndAction();
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	isLaunchable() {
		return true;
	}

	isRebuild() {
		return false;
	}

	getCommandName() {
		return '';
	}

	_createScreenParam() {
		return {};
	}

	_getScreenObject() {
		return null;
	}

	_doEndAction() {
	}
}

class ConfigScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return ConfigScreen;
	}

	_doEndAction() {
		var playerTurnObject;
		
		if (typeof SceneManager.getActiveScene().getTurnObject !== 'undefined') {
			playerTurnObject = SceneManager.getActiveScene().getTurnObject();
			// If MapParts doesn't define a name, use the name which was set with Command Layout.
			playerTurnObject.getMapEdit().rebuildMapPartsCollection();
			
			if (!EnvironmentControl.isEnemyMarking()) {
				MapLayer.getMarkingPanel().resetMarkingPanel();
			}
		}
		else if (root.getBaseScene() === SceneType.BATTLESETUP) {
			SceneManager.getActiveScene()._setupEdit._mapEdit.rebuildMapPartsCollection();
		}
	}
}

class ExtraScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return ExtraControl.isExtraDisplayable();
	}

	_getScreenObject() {
		return ExtraScreen;
	}
}

class RecollectionScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return ExtraControl.isRecollectionDisplayable();
	}

	_getScreenObject() {
		return DataConfig.isSupportListView() ? SupportScreen : RecollectionScreen;
	}
}

class CharacterScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return ExtraControl.isCharacterDictionaryDisplayable();
	}

	_getScreenObject() {
		return CharacterScreen;
	}
}

class WordScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return ExtraControl.isWordDictionaryDisplayable();
	}

	_getScreenObject() {
		return WordScreen;
	}
}

class GalleryScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return ExtraControl.isGalleryDictionaryDisplayable();
	}

	_getScreenObject() {
		return GalleryScreen;
	}
}

class SoundRoomScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return ExtraControl.isMediaDictionaryDisplayable();
	}

	_getScreenObject() {
		return SoundRoomScreen;
	}
}

class SwitchScreenLauncher extends BaseScreenLauncher {

	isRebuild() {
		return true;
	}

	_getScreenObject() {
		return SwitchScreen;
	}
}

class ShopListScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return root.getBaseData().getRestShopList().getCount() > 0;
	}

	_getScreenObject() {
		return ShopListScreen;
	}
}

class BonusListScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return root.getBaseData().getRestBonusList().getCount() > 0;
	}

	_getScreenObject() {
		return BonusListScreen;
	}
}

class ShopScreenLauncher extends BaseScreenLauncher {

	_shopData: any = null;

	openScreenLauncher() {
		var screenParam = this._createScreenParam();
		
		this._screen = createObject(ShopLayoutScreen);
		this._screen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._screen, screenParam);
	}

	getCommandName() {
		return this._shopData.getName();
	}

	setShopData(shopData?) {
		this._shopData = shopData;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._shopData;
		
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		
		return screenParam;
	}
}

class BonusScreenLauncher extends BaseScreenLauncher {

	_shopData: any = null;

	openScreenLauncher() {
		var screenParam = this._createScreenParam();
		
		this._screen = createObject(BonusLayoutScreen);
		this._screen.setScreenInteropData(screenParam.shopLayout.getShopInteropData());
		SceneManager.addScreen(this._screen, screenParam);
	}

	getCommandName() {
		return this._shopData.getName();
	}

	setShopData(shopData?) {
		this._shopData = shopData;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildShopLayout();
		var shopData = this._shopData;
		
		screenParam.shopLayout = shopData.getShopLayout();
		screenParam.itemArray = shopData.getShopItemArray();
		screenParam.inventoryArray = shopData.getInventoryNumberArray();
		screenParam.bonusArray = shopData.getBonusNumberArray();
		
		return screenParam;
	}
}

class VariableScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return VariableScreen;
	}
}

class LoadScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		if (root.getCurrentScene() === SceneType.FREE) {
			return EnvironmentControl.isLoadCommand();
		}
		
		return true;
	}

	_getScreenObject() {
		return LoadSaveControl.getLoadScreenObject();
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = true;
		
		return screenParam;
	}
}

class SaveScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		if (root.getCurrentScene() === SceneType.FREE) {
			return !SceneManager.getActiveScene().getTurnObject().isPlayerActioned();
		}
		
		return true;
	}

	_getScreenObject() {
		return LoadSaveControl.getSaveScreenObject();
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildLoadSave();
		
		screenParam.isLoad = false;
		screenParam.scene = root.getBaseScene();
		screenParam.mapId = this._getMapId(screenParam.scene);
		
		return screenParam;
	}

	_getMapId(sceneType?) {
		var mapId;
		
		if (sceneType === SceneType.REST) {
			mapId = root.getSceneController().getNextMapId();
		}
		else {
			mapId = root.getCurrentSession().getCurrentMapInfo().getId();
		}
		
		return mapId;
	}
}

class CommunicationScreenLauncher extends BaseScreenLauncher {

	isRebuild() {
		return true;
	}

	_getScreenObject() {
		return CommunicationScreen;
	}
}

class ObjectiveScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return ObjectiveScreen;
	}
}

class TalkCheckScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return TalkCheckScreen;
	}
}

class UnitSummaryScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return UnitSummaryScreen;
	}

	_createScreenParam() {
		var screenParam = ScreenBuilder.buildUnitSummary();
		
		screenParam.isMapCall = root.getBaseScene() !== SceneType.REST;
		
		return screenParam;
	}
}

class SkillScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return SkillScreen;
	}
}

class UnitMarshalScreenLauncher extends BaseScreenLauncher {

	isLaunchable() {
		return PlayerList.getMainList().getCount() > 0;
	}

	_getScreenObject() {
		return MarshalScreen;
	}
}

class ExperienceDistributionScreenLauncher extends BaseScreenLauncher {

	_getScreenObject() {
		return ExperienceDistributionScreen;
	}
}
