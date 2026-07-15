
class ConfigScreen extends BaseScreen {

	_configWindow: any = null;

	setScreenData(screenParam?) {
		this._prepareScreenMemberData(screenParam);
		this._completeScreenMemberData(screenParam);
	}

	moveScreenCycle() {
		return this._configWindow.moveWindow();
	}

	drawScreenCycle() {
		var x = LayoutControl.getCenterX(-1, this._configWindow.getWindowWidth());
		var y = LayoutControl.getCenterY(-1, this._configWindow.getWindowHeight());
		
		this._configWindow.drawWindow(x, y);
	}

	drawScreenBottomText(textui?) {
		var object = this._configWindow.getCurrentConfigItem();
		var text = object.getConfigItemDescription();
		
		if (object === null) {
			return;
		}
		
		TextRenderer.drawScreenBottomText(text, textui);
	}

	getScreenInteropData() {
		return root.queryScreen('Config');
	}

	_prepareScreenMemberData(screenParam?) {
		this._configWindow = createWindowObject(ConfigWindow, this);
	}

	_completeScreenMemberData(screenParam?) {
		this._configWindow.setConfigData();
	}
}

class ConfigWindow extends BaseWindow {

	_commandArray: any = null;

	_scrollbar: any = null;

	setConfigData() {
		var object;
		
		this._prepareConfigItem();
		this._createScrollbar();
		
		object = this._scrollbar.getObject();
		object.getSubScrollbar().setActive(true);
	}

	moveWindowContent() {
		var object;
		var result = MoveResult.CONTINUE;
		
		if (InputControl.isCancelAction()) {
			this._playCancelSound();
			result = MoveResult.END;
		}
		else if (InputControl.isInputState(InputType.UP) || MouseControl.isInputAction(MouseType.UPWHEEL)) {
			this._moveUpDown();
		}
		else if (InputControl.isInputState(InputType.DOWN) || MouseControl.isInputAction(MouseType.DOWNWHEEL)) {
			this._moveUpDown();
		}
		else {
			this._checkTracingScrollbar();
			
			object = this._scrollbar.getObject();
			object.moveConfigItem();
		}
		
		this._scrollbar.getEdgeCursor().moveCursor();
		MouseControl.checkScrollbarEdgeAction(this._scrollbar);
		
		return result;
	}

	drawWindowContent(x?, y?) {
		this._scrollbar.drawScrollbar(x, y);
	}

	getWindowWidth() {
		return this._scrollbar.getScrollbarWidth() + (this.getWindowXPadding() * 2);
	}

	getWindowHeight() {
		return this._scrollbar.getScrollbarHeight() + (this.getWindowYPadding() * 2);
	}

	getCurrentConfigItem() {
		return this._scrollbar.getObject();
	}

	_prepareConfigItem() {
		var i, count;
		
		this._commandArray = [];
		this._configureConfigItem(this._commandArray);
		
		count = this._commandArray.length;
		for (i = 0; i < count; i++) {
			this._commandArray[i].setupConfigItem();
		}
	}

	_createScrollbar() {
		var count = LayoutControl.getObjectVisibleCount(38, 10);
		
		this._scrollbar = createScrollbarObject(ConfigScrollbar, this);
		this._scrollbar.setScrollFormation(1, count);
		this._scrollbar.setObjectArray(this._commandArray);
		this._scrollbar.setActiveSingle(true);
	}

	_moveUpDown() {
		var object = this._scrollbar.getObject();
		
		object.getSubScrollbar().setActiveSingle(false);
		this._scrollbar.moveScrollbarCursor();
		
		object = this._scrollbar.getObject();
		object.getSubScrollbar().setActiveSingle(true);
	}

	_checkTracingScrollbar() {
		var object;
		var objectPrev = this._scrollbar.getObject();
		
		if (MouseControl.moveScrollbarMouse(this._scrollbar)) {
			objectPrev.getSubScrollbar().setActiveSingle(false);
			object = this._scrollbar.getObject();
			object.getSubScrollbar().setActiveSingle(true);
			
			MouseControl.moveScrollbarMouse(object.getSubScrollbar());
		}
	}

	_playCancelSound() {
		MediaControl.soundDirect('commandcancel');
	}

	_isVisible(commandLayoutType?, commandActionType?) {
		var i, commandLayout;
		var list = root.getBaseData().getCommandLayoutList(commandLayoutType);
		var count = list.getCount();
		var result = false;
		
		for (i = 0; i < count; i++) {
			commandLayout = list.getData(i);
			if (commandLayout.getCommandActionType() === commandActionType) {
				if (commandLayout.getCommandVisibleType() !== CommandVisibleType.HIDE) {
					result = true;
				}
				break;
			}
		}
		
		return result;
	}

	_configureConfigItem(groupArray?) {
		groupArray.appendObject(ConfigItem.MusicPlay);
		groupArray.appendObject(ConfigItem.SoundEffect);
		if (DataConfig.getVoiceCategoryName() !== '') {
			groupArray.appendObject(ConfigItem.Voice);
		}
		if (DataConfig.isMotionGraphicsEnabled()) {
			groupArray.appendObject(ConfigItem.RealBattle);
			if (DataConfig.isHighResolution()) {
				groupArray.appendObject(ConfigItem.RealBattleScaling);
			}
		}
		groupArray.appendObject(ConfigItem.AutoCursor);
		groupArray.appendObject(ConfigItem.AutoTurnEnd);
		groupArray.appendObject(ConfigItem.AutoTurnSkip);
		groupArray.appendObject(ConfigItem.EnemyMarking);
		groupArray.appendObject(ConfigItem.MapGrid);
		groupArray.appendObject(ConfigItem.UnitSpeed);
		groupArray.appendObject(ConfigItem.MessageSpeed);
		groupArray.appendObject(ConfigItem.ScrollSpeed);
		groupArray.appendObject(ConfigItem.UnitMenuStatus);
		groupArray.appendObject(ConfigItem.MapUnitHpVisible);
		groupArray.appendObject(ConfigItem.MapUnitSymbol);
		groupArray.appendObject(ConfigItem.DamagePopup);
		if (this._isVisible(CommandLayoutType.MAPCOMMAND, CommandActionType.LOAD)) {
			groupArray.appendObject(ConfigItem.LoadCommand);
		}
		groupArray.appendObject(ConfigItem.SkipControl);
		groupArray.appendObject(ConfigItem.MouseOperation);
		groupArray.appendObject(ConfigItem.MouseCursorTracking);
	}
}

class ConfigScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		object.drawConfigItem(x, y, index === this.getIndex());
	}

	drawCursor(x?, y?, isActive?) {
		// Override the method to disable a normal cursor draw.
	}

	getObjectWidth() {
		return 500 + HorizontalLayout.OBJECT_WIDTH;
	}

	getObjectHeight() {
		return 38;
	}
}

class ConfigTextScrollbar extends BaseScrollbar {

	drawScrollContent(x?, y?, object?, isSelect?, index?) {
		var length = -1;
		var textui = root.queryTextUI('default_window');
		var color = this._getTextColor(index);
		var font = textui.getFont();
		var range = createRangeObject(x, y, this.getObjectWidth(), this.getObjectHeight());
		
		TextRenderer.drawRangeText(range, TextFormat.CENTER, object, length, color, font);
	}

	drawDescriptionLine(x?, y?) {
	}

	getObjectWidth() {
		return 52 + HorizontalLayout.OBJECT_SPACE;
	}

	getObjectHeight() {
		return 38;
	}

	_getTextColor(index?) {
		var color = ColorValue.DISABLE;
		
		if (this.getParentInstance().getFlagValue() === index) {
			color = ColorValue.KEYWORD;
		}
		
		return color;
	}
}

class BaseConfigtItem extends BaseObject {

	_scrollbar: any = null;

	setupConfigItem() {
		this._scrollbar = createScrollbarObject(ConfigTextScrollbar, this);
		this._scrollbar.setScrollFormation(this.getFlagCount(), 1);
		this._scrollbar.setObjectArray(this.getObjectArray());
	}

	moveConfigItem() {
		var input = this._scrollbar.moveInput();
		
		if (input === ScrollbarInput.SELECT) {
			this.selectFlag(this._scrollbar.getIndex());
		}
		else if (input === ScrollbarInput.CANCEL) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawConfigItem(x?, y?, isActive?) {
		this.drawLeft(x, y, isActive);
		this.drawRight(x, y, isActive);	
	}

	selectFlag(index?) {
	}

	getFlagCount() {
		return 2;
	}

	getFlagValue() {
		return 0;
	}

	getConfigItemTitle() {
		return '';
	}

	getConfigItemDescription() {
		return '';
	}

	drawLeft(x?, y?, isActive?) {
		var textui = this.getTextUI();
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		y -= 7;
		TextRenderer.drawFixedTitleText(x, y, this.getConfigItemTitle(), color, font, TextFormat.LEFT, pic, this.getTitlePartsCount());
	}

	drawRight(x?, y?, isActive?) {
		this._scrollbar.drawScrollbar(x + this.getLeftWidth() - 16, y);
	}

	getTextUI() {
		return root.queryTextUI('configitem_title');
	}

	getLeftWidth() {
		return (this.getTitlePartsCount() + 2) * TitleRenderer.getTitlePartsWidth() + 28;
	}

	getTitlePartsCount() {
		return 6;
	}

	getObjectArray() {
		return [StringTable.Select_On, StringTable.Select_Off];
	}

	getSubScrollbar() {
		return this._scrollbar;
	}
}

namespace ConfigItem {
export class MusicPlay extends BaseConfigtItem {

	selectFlag(index?) {
		var arr = this.getVolumeArray();
		
		root.getMetaSession().setDefaultEnvironmentValue(0, index);
		
		root.getMediaManager().setMusicVolume(arr[index]);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(0);
	}

	getFlagCount() {
		return 5;
	}

	getConfigItemTitle() {
		return StringTable.Config_MusicPlay;
	}

	getConfigItemDescription() {
		return StringTable.Config_MusicPlayDescription;
	}

	getObjectArray() {
		return ['100%', '75%', '50%', '25%', '0%'];
	}

	getVolumeArray() {
		return [100, 75, 50, 25, 0];
	}
}

export class SoundEffect extends BaseConfigtItem {

	selectFlag(index?) {
		var arr = this.getVolumeArray();
		
		root.getMetaSession().setDefaultEnvironmentValue(1, index);
		
		root.getMediaManager().setSoundVolume(arr[index]);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(1);
	}

	getFlagCount() {
		return 5;
	}

	getConfigItemTitle() {
		return StringTable.Config_SoundEffect;
	}

	getConfigItemDescription() {
		return StringTable.Config_SoundEffectDescription;
	}

	getObjectArray() {
		return ['100%', '75%', '50%', '25%', '0%'];
	}

	getVolumeArray() {
		return [100, 75, 50, 25, 0];
	}
}

export class RealBattle_NSMember extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(2, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(2);
	}

	getConfigItemTitle() {
		return StringTable.Config_RealBattle;
	}

	getConfigItemDescription() {
		return StringTable.Config_RealBattleDescription;
	}
}
export const RealBattle = RealBattle_NSMember;

export class AutoTurnEnd extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(3, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(3);
	}

	getConfigItemTitle() {
		return StringTable.Config_AutoTurnEnd;
	}

	getConfigItemDescription() {
		return StringTable.Config_AutoTurnEndDescription;
	}
}

export class AutoTurnSkip extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(4, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(4);
	}

	getFlagCount() {
		return 3;
	}

	getConfigItemTitle() {
		return StringTable.Config_AutoTurnSkip;
	}

	getConfigItemDescription() {
		return StringTable.Config_AutoTurnSkipDescription;
	}

	getObjectArray() {
		return [StringTable.AutoTurnSkip_Direct, StringTable.AutoTurnSkip_Quick, StringTable.AutoTurnSkip_None];
	}
}

export class MapGrid extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(5, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(5);
	}

	getConfigItemTitle() {
		return StringTable.Config_MapGrid;
	}

	getConfigItemDescription() {
		return StringTable.Config_MapGridDescription;
	}
}

export class UnitSpeed extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(6, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(6);
	}

	getFlagCount() {
		return 3;
	}

	getConfigItemTitle() {
		return StringTable.Config_UnitSpeed;
	}

	getConfigItemDescription() {
		return StringTable.Config_UnitSpeedDescription;
	}

	getObjectArray() {
		return [StringTable.Speed_High, StringTable.Speed_Normal, StringTable.Speed_Low];
	}
}

export class MessageSpeed extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(7, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(7);
	}

	getFlagCount() {
		return 3;
	}

	getConfigItemTitle() {
		return StringTable.Config_MessageSpeed;
	}

	getConfigItemDescription() {
		return StringTable.Config_MessageSpeedDescription;
	}

	getObjectArray() {
		return [StringTable.Speed_High, StringTable.Speed_Normal, StringTable.Speed_Low];
	}
}

export class UnitMenuStatus extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(8, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(8);
	}

	getConfigItemTitle() {
		return StringTable.Config_MapUnitWindow;
	}

	getConfigItemDescription() {
		return StringTable.Config_MapUnitWindowDescription;
	}
}

export class LoadCommand extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(9, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(9);
	}

	getConfigItemTitle() {
		return StringTable.Config_LoadCommand;
	}

	getConfigItemDescription() {
		return StringTable.Config_LoadCommandDescription;
	}
}

export class AutoCursor extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(10, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(10);
	}

	getConfigItemTitle() {
		return StringTable.Config_AutoCursor;
	}

	getConfigItemDescription() {
		return StringTable.Config_AutoCursorDescription;
	}
}

export class MouseOperation extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(11, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(11);
	}

	getConfigItemTitle() {
		return StringTable.Config_MouseOperation;
	}

	getConfigItemDescription() {
		return StringTable.Config_MouseOperationDescription;
	}
}

export class MouseCursorTracking extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(12, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(12);
	}

	getConfigItemTitle() {
		return StringTable.Config_MouseCursorTracking;
	}

	getConfigItemDescription() {
		return StringTable.Config_MouseCursorTrackingDescription;
	}
}

export class Voice extends BaseConfigtItem {

	selectFlag(index?) {
		var arr = [100, 75, 50, 25, 0];
		
		root.getMetaSession().setDefaultEnvironmentValue(13, index);
		
		root.getMediaManager().setVoiceVolume(arr[index]);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(13);
	}

	getFlagCount() {
		return 5;
	}

	getConfigItemTitle() {
		return StringTable.Config_Voice;
	}

	getConfigItemDescription() {
		return StringTable.Config_VoiceDescription;
	}

	getObjectArray() {
		return ['100%', '75%', '50%', '25%', '0%'];
	}

	getVolumeArray() {
		return [100, 75, 50, 25, 0];
	}
}

export class RealBattleScaling extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(14, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(14);
	}

	getConfigItemTitle() {
		return StringTable.Config_RealBattleScaling;
	}

	getConfigItemDescription() {
		return StringTable.Config_RealBattleScalingDescription;
	}
}

export class ScrollSpeed extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(15, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(15);
	}

	getFlagCount() {
		return 3;
	}

	getConfigItemTitle() {
		return StringTable.Config_ScrollSpeed;
	}

	getConfigItemDescription() {
		return StringTable.Config_ScrollSpeedDescription;
	}

	getObjectArray() {
		return [StringTable.Speed_High, StringTable.Speed_Normal, StringTable.Speed_Low];
	}
}

export class EnemyMarking extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(16, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(16);
	}

	getConfigItemTitle() {
		return StringTable.Config_EnemyMarking;
	}

	getConfigItemDescription() {
		return StringTable.Config_EnemyMarkingDescription;
	}
}

export class MapUnitHpVisible extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(17, index);
		MapHpDecorator.setupDecoration();
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(17);
	}

	getFlagCount() {
		return 3;
	}

	getConfigItemTitle() {
		return StringTable.Config_MapUnitHpVisible;
	}

	getConfigItemDescription() {
		return StringTable.Config_MapUnitHpVisibleDescription;
	}

	getObjectArray() {
		return [StringTable.MapUnitHp_Number, StringTable.MapUnitHp_Gauge, StringTable.MapUnitHp_None];
	}
}

export class MapUnitSymbol extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(18, index);
		MapSymbolDecorator.setupDecoration();
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(18);
	}

	getConfigItemTitle() {
		return StringTable.Config_MapUnitSymbol;
	}

	getConfigItemDescription() {
		return StringTable.Config_MapUnitSymbolDescription;
	}
}

export class DamagePopup_NSMember extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(19, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(19);
	}

	getConfigItemTitle() {
		return StringTable.Config_DamagePopup;
	}

	getConfigItemDescription() {
		return StringTable.Config_DamagePopupDescription;
	}
}
export const DamagePopup = DamagePopup_NSMember;

export class SkipControl extends BaseConfigtItem {

	selectFlag(index?) {
		root.getMetaSession().setDefaultEnvironmentValue(20, index);
	}

	getFlagValue() {
		return root.getMetaSession().getDefaultEnvironmentValue(20);
	}

	getFlagCount() {
		return 3;
	}

	getConfigItemTitle() {
		return StringTable.Config_SkipControl;
	}

	getConfigItemDescription() {
		return StringTable.Config_SkipControlDescription;
	}

	getObjectArray() {
		return [StringTable.SkipControl_AllInput, StringTable.SkipControl_Mouse, StringTable.SkipControl_None];
	}
}
}

class ConfigVolumeControl {

	static setDefaultVolume() {
		var i, obj, volume, tilte;
		var groupArray = [];
		
		this._configureConfigItem(groupArray);
		
		for (i = 0; i < groupArray.length; i++) {
			obj = groupArray[i];
			volume = this._getVolume(obj);
			tilte = obj.getConfigItemTitle();
			
			if (tilte === StringTable.Config_MusicPlay) {
				root.getMediaManager().setMusicVolume(volume);
			}
			else if (tilte === StringTable.Config_SoundEffect) {
				root.getMediaManager().setSoundVolume(volume);
			}
			else if (tilte === StringTable.Config_Voice) {
				root.getMediaManager().setVoiceVolume(volume);
			}
		}
	}

	static _getVolume(obj?) {
		var arr = obj.getVolumeArray();
		var index = obj.getFlagValue();
		
		return arr[index];
	}

	static _configureConfigItem(groupArray?) {
		groupArray.appendObject(ConfigItem.MusicPlay);
		groupArray.appendObject(ConfigItem.SoundEffect);
		if (DataConfig.getVoiceCategoryName() !== '') {
			groupArray.appendObject(ConfigItem.Voice);
		}
	}
}
