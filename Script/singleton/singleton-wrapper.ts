
class SetupControl {

	static setup() {
		GraphicsFormat.CHARCHIP_WIDTH = root.getCharChipWidth();
		GraphicsFormat.CHARCHIP_HEIGHT = root.getCharChipHeight();
		GraphicsFormat.ICON_WIDTH = root.getIconWidth();
		GraphicsFormat.ICON_HEIGHT = root.getIconHeight();
		GraphicsFormat.MAPCHIP_WIDTH = root.getMapChipWidth();
		GraphicsFormat.MAPCHIP_HEIGHT = root.getMapChipHeight();
		
		UIFormat.MAPCURSOR_WIDTH = GraphicsFormat.MAPCHIP_WIDTH * 2;
		UIFormat.MAPCURSOR_HEIGHT = GraphicsFormat.MAPCHIP_HEIGHT;
		UIFormat.PANEL_WIDTH = GraphicsFormat.MAPCHIP_WIDTH * 2;
		UIFormat.PANEL_HEIGHT = GraphicsFormat.MAPCHIP_HEIGHT;
		
		EventCommandManager.initSingleton();
		ParamGroup.initSingleton();
		InputControl.initSingleton();
		MouseControl.initSingleton();
		DataConfig.initSingleton();
		CustomCharChipGroup.initSingleton();
		CacheControl.clearCache();
		MapLayer.prepareMapLayer();
		MapSymbolDecorator.setupDecoration();
		MapHpDecorator.setupDecoration();
		MapIconDecorator.setupDecoration();
	}

	static backup() {
	}
}

class LoadControl {

	static start(customObject?) {
	}
}

class RetryControl {

	// It's called when retrying a game.
	// The argument is the return value of _getCustomObject.
	static start(customObject?) {
	}

	static register() {
		var mapInfo;
		var session = root.getCurrentSession();
		
		if (session === null) {
			return;
		}
		
		mapInfo = session.getCurrentMapInfo();
		if (mapInfo === null) {
			return;
		}
		
		// Save the temporary save data inside.
		// If the temporary save data exists when there is a script error, it will be loaded and restart a game.
		// If "Reload" is disabled in game.ini, this function does nothing.
		root.getLoadSaveManager().setTemporaryInterruptionData(root.getBaseScene(), mapInfo.getId(), this._getCustomObject());
	}

	static _getCustomObject() {
		return {};
	}
}

class EnvironmentControl {

	static isBgmOn() {
		return root.getMetaSession().getDefaultEnvironmentValue(0) === 0;
	}

	static isSeOn() {
		return root.getMetaSession().getDefaultEnvironmentValue(1) === 0;
	}

	static getBattleType() {
		var battleType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(2);
		
		if (n === 0) {
			battleType = BattleType.REAL;
		}
		else if (n === 1) {
			battleType = BattleType.EASY;
		}
		else {
			battleType = BattleType.REAL;
		}
		
		return battleType;
	}

	static isAutoTurnEnd() {
		return root.getMetaSession().getDefaultEnvironmentValue(3) === 0;
	}

	static getAutoTurnSkipType() {
		return root.getMetaSession().getDefaultEnvironmentValue(4);
	}

	static isMapGrid() {
		return root.getMetaSession().getDefaultEnvironmentValue(5) === 0;
	}

	static getUnitSpeedType() {
		var speedType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(6);
		
		if (n === 0) {
			speedType = SpeedType.HIGH;
		}
		else if (n === 1) {
			speedType = SpeedType.NORMAL;
		}
		else {
			speedType = SpeedType.LOW;
		}
		
		return speedType;
	}

	static getMessageSpeedType() {
		var speedType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(7);
		
		if (n === 0) {
			speedType = SpeedType.HIGH;
		}
		else if (n === 1) {
			speedType = SpeedType.NORMAL;
		}
		else {
			speedType = SpeedType.LOW;
		}
		
		return speedType;
	}

	static isMapUnitWindowDetail() {
		return root.getMetaSession().getDefaultEnvironmentValue(8) === 0;
	}

	static isLoadCommand() {
		return root.getMetaSession().getDefaultEnvironmentValue(9) === 0;
	}

	static isAutoCursor() {
		return root.getMetaSession().getDefaultEnvironmentValue(10) === 0;
	}

	static isMouseOperation() {
		return root.getMetaSession().getDefaultEnvironmentValue(11) === 0;
	}

	static isMouseCursorTracking() {
		return root.getMetaSession().getDefaultEnvironmentValue(12) === 0;
	}

	static isRealBattleScaling() {
		return root.getMetaSession().getDefaultEnvironmentValue(14) === 0;
	}

	static getScrollSpeedType() {
		var speedType;
		var n = root.getMetaSession().getDefaultEnvironmentValue(15);
		
		if (n === 0) {
			speedType = SpeedType.HIGH;
		}
		else if (n === 1) {
			speedType = SpeedType.NORMAL;
		}
		else {
			speedType = SpeedType.LOW;
		}
		
		return speedType;
	}

	static isEnemyMarking() {
		return root.getMetaSession().getDefaultEnvironmentValue(16) === 0;
	}

	static getMapUnitHpType() {
		return root.getMetaSession().getDefaultEnvironmentValue(17);
	}

	static isMapUnitSymbol() {
		return root.getMetaSession().getDefaultEnvironmentValue(18) === 0;
	}

	static isDamagePopup() {
		return root.getMetaSession().getDefaultEnvironmentValue(19) === 0;
	}

	static getSkipControlType() {
		return root.getMetaSession().getDefaultEnvironmentValue(20);
	}
}

class DataConfig {

	static _gameOptionArray: any = null;

	static _userOptionArray: any = null;

	static _maxValueArray: any = null;

	static _maxParameterArray: any = null;

	static _battleValueArray: any = null;

	static _criticalFactor: any = 0;

	static _effectiveFactor: any = 0;

	static _lowExperienceFactor: any = 0;

	static _highExperienceFactor: any = 0;

	static _supportRange: any = 0;

	static _demoMapId: any = 0;

	static _isDemoMapSoundEnabled: any = false;

	static _voiceCategoryName: any = null;

	static _voiceExtIndex: any = 0;

	static initSingleton() {
		var i;
		
		this._gameOptionArray = [];
		for (i = 0; i < 8; i++) {
			this._gameOptionArray[i] = root.getConfigInfo().isGameOptionOn(i);
		}
		
		this._userOptionArray = [];
		for (i = 0; i < 27; i++) {
			this._userOptionArray[i] = root.getUserExtension().isUserOptionOn(i);
		}
		
		this._maxValueArray = [];
		for (i = 0; i < 7; i++) {
			this._maxValueArray[i] = root.getConfigInfo().getMaxValue(i);
		}
		
		this._maxParameterArray = [];
		for (i = 0; i < 11; i++) {
			this._maxParameterArray[i] = root.getConfigInfo().getMaxParameter(i);
		}
		
		this._battleValueArray = [];
		for (i = 0; i < 4; i++) {
			this._battleValueArray[i] = root.getConfigInfo().getBattleValue(i);
		}
		
		this._criticalFactor = root.getUserExtension().getCriticalFactor();
		this._effectiveFactor = root.getUserExtension().getEffectiveFactor();
		this._lowExperienceFactor = root.getUserExtension().getLowExperienceFactor();
		this._highExperienceFactor = root.getUserExtension().getHighExperienceFactor();
		this._supportRange = root.getUserExtension().getSupportRange();
		this._demoMapId = root.getUserExtension().getDemoMapId();
		this._isDemoMapSoundEnabled = root.getUserExtension().isDemoMapSoundEnabled();
		this._voiceCategoryName = root.getUserExtension().getVoiceCategoryName();
		this._voiceExtIndex = root.getUserExtension().getVoiceExtIndex();
	}

	static isHighPerformance() {
		return root.isHighPerfMode();
	}

	static isMapEdgePassable() {
		return this._gameOptionArray[0];
	}

	static isBattleSetupItemUseAllowed() {
		return this._gameOptionArray[1];
	}

	static isBattleSetupClassChangeAllowed() {
		return this._gameOptionArray[2];
	}

	static isStockTradeWeaponTypeAllowed() {
		return this._gameOptionArray[3];
	}

	static isMapVictoryDisplayable() {
		return this._gameOptionArray[4];
	}

	static isItemWeightDisplayable() {
		return this._gameOptionArray[5];
	}

	static isTreasureKeyEnabled() {
		return this._gameOptionArray[6];
	}

	static isRuntimeDepended() {
		return this._gameOptionArray[7];
	}

	
	// --------------------------
	
	static isMotionGraphicsEnabled() {
		return this._userOptionArray[0];
	}

	static isWeaponInfinity() {
		return this._userOptionArray[1];
	}

	static isGuestTradeEnabled() {
		return this._userOptionArray[2];
	}

	static isFullItemTransportable() {
		return this._userOptionArray[3];
	}

	static isFixedExperience() {
		return this._userOptionArray[4];
	}

	static isClassLimitEnabled() {
		return this._userOptionArray[5];
	}

	static isSkillInvocationBonusEnabled() {
		return this._userOptionArray[6];
	}

	static isWeaponSelectSkippable() {
		return this._userOptionArray[7];
	}

	static isLeaderGameOver() {
		return this._userOptionArray[8];
	}

	static isWeaponLostDisplayable() {
		return this._userOptionArray[9];
	}

	static isDropTrophyLinked() {
		return this._userOptionArray[10];
	}

	static isAggregationVisible() {
		return this._userOptionArray[11];
	}

	static isSkillAnimeEnabled() {
		return this._userOptionArray[12];
	}

	static isEnemyTurnOptimized() {
		return this._userOptionArray[13];
	}

	static isAllyBattleFixed() {
		return this._userOptionArray[14];
	}

	static isFullDopingEnabled() {
		return this._userOptionArray[15];
	}

	static isWeaponLevelDisplayable() {
		return this._userOptionArray[16];
	}

	static isBuildDisplayable() {
		return this._userOptionArray[17];
	}

	static isAIDamageZeroAllowed() {
		return this._userOptionArray[18];
	}

	static isAIHitZeroAllowed() {
		return this._userOptionArray[19];
	}

	static isTurnDamageFinishAllowed() {
		return this._userOptionArray[20];
	}

	static isFullBackground() {
		return this._userOptionArray[21];
	}

	static isBattleSetupRecoverable() {
		return this._userOptionArray[22];
	}

	static isWaitMoveVisible() {
		return this._userOptionArray[23];
	}

	static isSupportListView() {
		return this._userOptionArray[24];
	}

	static isSaveScreenExtended() {
		return this._userOptionArray[25];
	}

	static isAISupportStatusAllowed() {
		return this._userOptionArray[26];
	}

	
	// --------------------------
	
	static isUnitCommandMovable(id?) {
		// It's not an index base, so don't use the array.
		return root.getUserExtension().isUnitCommandMovable(id);
	}

	
	// --------------------------
	
	static getCriticalFactor() {
		return this._criticalFactor;
	}

	static getEffectiveFactor() {
		return this._effectiveFactor;
	}

	static getLowExperienceFactor() {
		return this._lowExperienceFactor;
	}

	static getHighExperienceFactor() {
		return this._highExperienceFactor;
	}

	static getSupportRange() {
		return this._supportRange;
	}

	static getDemoMapId() {
		return this._demoMapId;
	}

	static isDemoMapSoundEnabled() {
		return this._isDemoMapSoundEnabled;
	}

	static getVoiceCategoryName() {
		return this._voiceCategoryName;
	}

	static getVoiceExtIndex() {
		return this._voiceExtIndex;
	}

	static getMaxGold() {
		return this._maxValueArray[0];
	}

	static getMaxBonus() {
		return this._maxValueArray[1];
	}

	static getMaxSkillCount() {
		return this._maxValueArray[2];
	}

	static getMaxUnitItemCount() {
		return this._maxValueArray[3];
	}

	static getMaxStockItemCount() {
		return this._maxValueArray[4];
	}

	static getMaxAppearUnitCount() {
		return this._maxValueArray[5];
	}

	static getMaxStateCount() {
		return 6;
	}

	static getMaxLv() {
		return this._maxValueArray[6];
	}

	static getMaxParameter(index?) {
		return this._maxParameterArray[index];
	}

	static getRoundDifference() {
		return this._battleValueArray[0];
	}

	static getMinimumExperience() {
		return this._battleValueArray[1];
	}

	static getLeaderExperience() {
		return this._battleValueArray[2];
	}

	static getSubLeaderExperience() {
		return this._battleValueArray[3];
	}

	static isHighResolution() {
		return root.getConfigInfo().getResolutionIndex() > 0;
	}
}

class ExtraControl {

	static isExtraDisplayable() {
		if (this.isCharacterDictionaryDisplayable()) {
			return true;
		}
		
		if (this.isWordDictionaryDisplayable()) {
			return true;
		}
		
		if (this.isGalleryDictionaryDisplayable()) {
			return true;
		}
		
		if (this.isMediaDictionaryDisplayable()) {
			return true;
		}
		
		return false;
	}

	static isRecollectionDisplayable() {
		return root.getBaseData().getRecollectionEventList().getCount() > 0;
	}

	static isCharacterDictionaryDisplayable() {
		return root.getBaseData().getCharacterDictionaryList().getCount() > 0;
	}

	static isWordDictionaryDisplayable() {
		return root.getBaseData().getWordDictionaryList().getCount() > 0;
	}

	static isGalleryDictionaryDisplayable() {
		return root.getBaseData().getGalleryDictionaryList().getCount() > 0;
	}

	static isMediaDictionaryDisplayable() {
		return root.getBaseData().getMediaDictionaryList().getCount() > 0;
	}
}

class DefineControl {

	static getMaxSaveFileCount() {
		// The maximum value is 99.
		return 50;
	}

	static getFaceXPadding() {
		return 14;
	}

	static getFaceYPadding() {
		return 4;
	}

	static getFaceWindowHeight() {
		return 104;
	}

	static getWindowXPadding() {
		return 16;
	}

	static getWindowYPadding() {
		return 16;
	}

	static getWindowInterval() {
		return 0;
	}

	static getMinDamage() {
		return 0;
	}

	static getMinHitPercent() {
		return 0;
	}

	static getMaxHitPercent() {
		return 100;
	}

	static getBaselineExperience() {
		return 100;
	}

	static getNumberSpace() {
		// Suppose 3 digits of number.
		return 20;
	}

	static getNumberSpaceEx() {
		// Suppose 4 digits of number.
		return 30;
	}

	static getTextPartsWidth() {
		return 135;
	}

	static getTextPartsHeight() {
		// It's identical with value which ItemRenderer.getItemHeight returns.
		return 30;
	}

	static getTextPartsLength() {
		return 9;
	}

	static getDataNameLength() {
		return 9;
	}

	static getScreenScrollbarWidthForSimpleText() {
		return 400;
	}

	static getVisibleUnitItemCount() {
		var count = Math.floor(root.getGameAreaHeight() / ItemRenderer.getItemHeight()) - 11;
		
		if (count > DataConfig.getMaxUnitItemCount()) {
			count = DataConfig.getMaxUnitItemCount();
		}
		
		return count;
	}

	static getUnitMenuBottomWindowHeight() {
		var height = (DefineControl.getVisibleUnitItemCount() * ItemRenderer.getItemHeight()) + 74;
		
		return height;
	}

	static getUnitMenuWindowWidth() {
		return 450;
	}

	static getCurrencyWindowHeight() {
		return 50;
	}
}

class MediaControl {

	static musicPlayNew(handle?) {
		root.getMediaManager().musicPlay(handle, MusicPlayType.PLAYSAVE);
	}

	static musicPlay(handle?) {
		root.getMediaManager().musicPlay(handle, MusicPlayType.PLAY);
	}

	static musicPlaySingle(handle?) {
		root.getMediaManager().musicPlay(handle, MusicPlayType.NOLOOP);
	}

	static musicStop(musicStopType?) {
		root.getMediaManager().musicStop(musicStopType, SpeedType.DIRECT);
	}

	static soundPlay(handle?) {
		root.getMediaManager().soundPlay(handle, 1);
	}

	static soundDirect(text?) {
		MediaControl.soundPlay(root.querySoundHandle(text));
	}

	static soundStop() {
		root.getMediaManager().soundStop(1, false);
	}

	static resetMusicList() {
		root.getMediaManager().resetMusicList();
	}

	static resetSoundList() {
		root.getMediaManager().soundStop(0, true);
	}

	static clearMusicCache() {
		// Call resetMusicList in advance to be silent.
		this.resetMusicList();
		
		// Release the background music data which exists in the memory.
		root.getMediaManager().clearMusicCache();
	}

	static getCurrentMusicTime() {
		var time = root.getMediaManager().getActiveMusicTime();
		
		// var minutes = Math.floor(time / 60000);
		// var seconds = Math.floor((time % 60000) / 1000);
		// var milliseconds = time % 1000;
		// root.resetConsole();
		// root.log(minutes + ' : ' + seconds + ' : ' + milliseconds);
		
		return time;
	}

	static setCurrentMusicTime(minutes?, seconds?, milliseconds?) {
		var time = 0;
		
		time += minutes * 60 * 1000;
		time += seconds * 1000;
		time += milliseconds;
		
		root.getMediaManager().setActiveMusicTime(time);
	}
}
