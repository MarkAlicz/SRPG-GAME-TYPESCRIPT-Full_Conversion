
class WavePanel extends BaseObject {

	_imageScroller: any = null;

	initialize() {
		this._imageScroller = createObject(ImageScroller);
		this._imageScroller.setImageSizeAndDispaySize(UIFormat.PANEL_WIDTH, UIFormat.PANEL_HEIGHT,
			Math.floor(UIFormat.PANEL_WIDTH / 2), UIFormat.PANEL_HEIGHT);
			
		this._imageScroller.setSpace(1);
		this._imageScroller.startScroll(ImageScrollerType.HORZ);
	}

	moveWavePanel() {
		this._imageScroller.moveImageScroller();
		
		return MoveResult.CONTINUE;
	}

	drawWavePanel(x?, y?, pic?) {
		this._imageScroller.drawImageScroller(x, y, pic);
	}

	getScrollCount() {
		return this._imageScroller.getScrollCount();
	}
}

class FadePanel extends BaseObject {

	_counter: any = null;

	initialize() {
		this._counter = createObject(VolumeCounter);
		this._counter.disableGameAcceleration();
	}

	moveFadePanel() {
		this._counter.moveVolumeCounter();
		return MoveResult.CONTINUE;
	}

	drawFadePanel(x?, y?, color?, alpha?) {
		root.getGraphicsManager().fillRange(x, y, GraphicsFormat.MAPCHIP_WIDTH, GraphicsFormat.MAPCHIP_HEIGHT, color, alpha);
	}

	getBright() {
		return this._counter.getVolume();
	}
}

class MapLightType {

	static NORMAL: any = 0;

	static MOVE: any = 1;

	static RANGE: any = 2;
}

class MapChipLight extends BaseObject {

	_indexArray: any = null;

	_fadePanel: any = null;

	_wavePanel: any = null;

	_type: any = 0;

	initialize() {
		this.endLight();
		this._fadePanel = createObject(FadePanel);
		this._wavePanel = createObject(WavePanel);
	}

	setLightType(type?) {
		this._type = type;
	}

	setIndexArray(indexArray?) {
		this._indexArray = indexArray;
	}

	moveLight() {
		if (this._type === MapLightType.NORMAL) {
			this._fadePanel.moveFadePanel();
		}
		else {
			this._wavePanel.moveWavePanel();
		}
		
		return MoveResult.CONTINUE;
	}

	drawLight() {
		if (this._type === MapLightType.NORMAL) {
			root.drawFadeLight(this._indexArray, this._getColor(), this._getAlpha());
		}
		else if (this._type === MapLightType.MOVE) {
			root.drawWavePanel(this._indexArray, this._getMoveImage(), this._wavePanel.getScrollCount());
		}
		else if (this._type === MapLightType.RANGE) {
			root.drawWavePanel(this._indexArray, this._getRangeImage(), this._wavePanel.getScrollCount());
		}
	}

	drawLightClassic() {
		var i, x, y, index;
		var count = this._indexArray.length;
		var chipWidth = GraphicsFormat.MAPCHIP_WIDTH;
		var chipHeight = GraphicsFormat.MAPCHIP_HEIGHT;
		var xScroll = root.getCurrentSession().getScrollPixelX();
		var yScroll = root.getCurrentSession().getScrollPixelY();
		var maxWidth = root.getGameAreaWidth();
		var maxHeight = root.getGameAreaHeight();
		var picMove = this._getMoveImage();
		var picRange = this._getRangeImage();
		
		for (i = 0; i < count; i++) {
			index = this._indexArray[i];
			x = (CurrentMap.getX(index) * chipWidth) - xScroll;
			y = (CurrentMap.getY(index) * chipHeight) - yScroll;
			
			if ((x >= -chipWidth && y >= -chipHeight) && x < maxWidth && y < maxHeight) {
				if (this._type === MapLightType.NORMAL) {
					this._fadePanel.drawFadePanel(x, y, this._getColor(), this._getAlpha());
				}
				else if (this._type === MapLightType.MOVE) {
					this._wavePanel.drawWavePanel(x, y, picMove);
				}
				else if (this._type === MapLightType.RANGE) {
					this._wavePanel.drawWavePanel(x, y, picRange);
				}
			}
		}
	}

	endLight() {
		this._indexArray = [];
	}

	_getColor() {
		return 0xffffff;
	}

	_getAlpha() {
		return 128;
	}

	_getMoveImage() {
		return root.queryUI('move_panel');
	}

	_getRangeImage() {
		return root.queryUI('range_panel');
	}
}

class UnitRangePanel extends BaseObject {

	_x: any = 0;

	_y: any = 0;

	_unit: any = null;

	_mapChipLight: any = null;

	_mapChipLightWeapon: any = null;

	_simulator: any = null;

	initialize() {
		this._mapChipLight = createObject(MapChipLight);
		this._mapChipLightWeapon = createObject(MapChipLight);
		
		this._simulator = root.getCurrentSession().createMapSimulator();
		// Ignore "Passable Terrains" at the panel display on the map.
		this._simulator.disableRestrictedPass();
	}

	setUnit(unit?) {
		this._unit = unit;
		if (unit === null) {
			return;
		}
		
		this._x = unit.getMapX();
		this._y = unit.getMapY();
		
		this._setRangeData();
	}

	setRepeatUnit(unit?) {
		this._unit = unit;
		if (unit === null) {
			return;
		}
		
		this._x = unit.getMapX();
		this._y = unit.getMapY();
		
		this._setRepeatRangeData();
	}

	moveRangePanel() {
		if (this._unit === null) {
			return MoveResult.CONTINUE;
		}
		
		this._mapChipLight.moveLight();
		this._mapChipLightWeapon.moveLight();
		
		return MoveResult.CONTINUE;
	}

	drawRangePanel() {
		if (!this._isRangeDrawable()) {
			return;
		}
		
		this._mapChipLight.drawLight();
		this._mapChipLightWeapon.drawLight();
	}

	isMoveArea(x?, y?) {
		var index = CurrentMap.getIndex(x, y);
		
		if (index === -1) {
			return false;
		}
		
		return this._simulator.getSimulationMovePoint(index) !== AIValue.MAX_MOVE;
	}

	getSimulator() {
		return this._simulator;
	}

	getUnitAttackRange(unit?) {
		var i, item, count, rangeMetrics;
		var startRange = 99;
		var endRange = 0;
		var obj: any = {};
		
		if (unit.getUnitType() === UnitType.PLAYER) {
			// If it's the player, refer to the equipped weapon.
			item = ItemControl.getEquippedWeapon(unit);
			if (item !== null) {
				startRange = item.getStartRange();
				endRange = item.getEndRange();
			}
		}
		else {
			// If it's not the player, refer to the weapon which has the most range.
			count = UnitItemControl.getPossessionItemCount(unit);
			for (i = 0; i < count; i++) {
				item = UnitItemControl.getItem(unit, i);
				rangeMetrics = this._getRangeMetricsFromItem(unit, item);
				if (rangeMetrics !== null) {
					if (rangeMetrics.startRange < startRange) {
						startRange = rangeMetrics.startRange;
					}
					if (rangeMetrics.endRange > endRange) {
						endRange = rangeMetrics.endRange;
					}
				}
			}
		}
		
		obj.startRange = startRange;
		obj.endRange = endRange;
		obj.mov = this._getRangeMov(unit);
		
		return obj;
	}

	_isRangeDrawable() {
		if (this._unit === null) {
			return false;
		}
		
		if (PosChecker.getUnitFromPos(this._x, this._y) !== this._unit) {
			return false;
		}
		
		if (this._unit.isWait()) {
			return false;
		}
		
		return true;
	}

	_getRangeMov(unit?) {
		var mov;
		
		if (unit.isMovePanelVisible()) {
			mov = ParamBonus.getMov(unit);
		}
		else {
			mov = 0;
		}
		
		return mov;
	}

	_setRangeData() {
		var attackRange = this.getUnitAttackRange(this._unit);
		var isWeapon = attackRange.endRange !== 0;
		
		if (isWeapon) {
			this._simulator.startSimulationWeapon(this._unit, attackRange.mov, attackRange.startRange, attackRange.endRange);
		}
		else {
			this._simulator.startSimulation(this._unit, attackRange.mov);
		}
		
		this._setLight(isWeapon);
	}

	_setRepeatRangeData() {
		var mov = ParamBonus.getMov(this._unit) - this._unit.getMostResentMov();
		
		this._simulator.startSimulation(this._unit, mov);
		this._setLight(false);
	}

	_setLight(isWeapon?) {
		this._mapChipLight.setLightType(MapLightType.MOVE);
		this._mapChipLight.setIndexArray(this._simulator.getSimulationIndexArray());
		if (isWeapon) {
			this._mapChipLightWeapon.setLightType(MapLightType.RANGE);
			this._mapChipLightWeapon.setIndexArray(this._simulator.getSimulationWeaponIndexArray());
		}
		else{
			this._mapChipLightWeapon.endLight();
		}
	}

	_getRangeMetricsFromItem(unit?, item?) {
		var rangeMetrics = null;
		
		if (item.isWeapon()) {
			if (ItemControl.isWeaponAvailable(unit, item)) {
				rangeMetrics = StructureBuilder.buildRangeMetrics();
				rangeMetrics.startRange = item.getStartRange();
				rangeMetrics.endRange = item.getEndRange();
			}
		}
		else {
			if (item.getRangeType() === SelectionRangeType.MULTI && (item.getFilterFlag() & UnitFilterFlag.ENEMY)) {
				rangeMetrics = StructureBuilder.buildRangeMetrics();
				rangeMetrics.endRange = item.getRangeValue();
			}
		}
		
		return rangeMetrics;
	}
}

class MarkingPanel extends BaseObject {

	_isVisible: any = false;

	_simulator: any = null;

	_indexArray: any = null;

	_indexArrayWeapon: any = null;

	startMarkingPanel() {
		if (!EnvironmentControl.isEnemyMarking()) {
			return;
		}
		
		this._isVisible = !this._isVisible;
		
		if (this._isVisible) {
			this.updateMarkingPanel();
		}
		else {
			this.resetMarkingPanel();
		}
		
		this._playVisibleSound();
	}

	moveMarkingPanel() {
		return MoveResult.CONTINUE;
	}

	drawMarkingPanel() {
		if (!this.isMarkingEnabled()) {
			return;
		}
		
		root.drawFadeLight(this._indexArray, this._getColor(), this._getAlpha());
		root.drawFadeLight(this._indexArrayWeapon, this._getColor(), this._getAlpha());
	}

	updateMarkingPanel() {
		if (!this.isMarkingEnabled()) {
			return;
		}
		
		this._simulator = root.getCurrentSession().createMapSimulator();
		this._simulator.startSimulationWeaponAll(UnitFilterFlag.ENEMY);
		
		this._indexArray = this._simulator.getSimulationIndexArray();
		this._indexArrayWeapon = this._simulator.getSimulationWeaponIndexArray();
	}

	updateMarkingPanelFromUnit(unit?) {
		if (!this.isMarkingEnabled()) {
			return;
		}
		
		// In the case all units' movement range has been marked by startSimulationWeaponAll,
		// it is costly to reconstruct the marking just because one unit's current location changed.
		// startSimulationWeaponPlus constructs the marking by adding to the marking
		// result of startSimulationWeaponAll,which is quicker to execute.
		// However, the marking may sometimes be miscalculated.
		this._simulator.startSimulationWeaponPlus(unit);
		
		this._indexArray = this._simulator.getSimulationIndexArray();
		this._indexArrayWeapon = this._simulator.getSimulationWeaponIndexArray();
	}

	resetMarkingPanel() {
		this._isVisible = false;
		this._simulator = null;
		this._indexArray = null;
		this._indexArrayWeapon = null;
	}

	isMarkingEnabled() {
		if (!this._isVisible) {
			return false;
		}
		
		if (!EnvironmentControl.isEnemyMarking()) {
			return false;
		}
		
		if (!root.isSystemSettings(SystemSettingsType.MARKING)) {
			return false;
		}
		
		return true;
	}

	_getColor() {
		return 0xffdc00;
	}

	_getAlpha() {
		return 128;
	}

	_playVisibleSound() {
		MediaControl.soundDirect('commandselect');
	}
}
