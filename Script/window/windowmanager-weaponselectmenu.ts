
class WeaponSelectMenu extends BaseWindowManager {

	_unit: any = null;

	_itemListWindow: any = null;

	_itemInfoWindow: any = null;

	setMenuTarget(unit?) {
		this._unit = unit;
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this); 
		
		this._setWeaponFormation();
		this._setWeaponbar(unit);
		this._itemListWindow.setActive(true);
	}

	moveWindowManager() {
		var result = this._itemListWindow.moveWindow();
		
		if (this._itemListWindow.isIndexChanged()) {
			this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
		}
		
		this._itemInfoWindow.moveWindow();
		
		return result;
	}

	drawWindowManager() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	}

	getTotalWindowWidth() {
		return this._itemInfoWindow.getWindowWidth();
	}

	getTotalWindowHeight() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	}

	getPositionWindowX() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	}

	getPositionWindowY() {
		return LayoutControl.getCenterY(-1, 340);
	}

	getWeaponCount() {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var weaponCount = 0;
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(this._unit, i);
			if (this._isWeaponAllowed(this._unit, item)) {
				weaponCount++;
			}
		}
		
		return weaponCount;
	}

	getSelectWeapon() {
		return this._itemListWindow.getCurrentItem();
	}

	_getWindowInterval() {
		return 10;
	}

	_setWeaponFormation() {
		var count = this.getWeaponCount();
		var visibleCount = 8;
		
		if (count > visibleCount) {
			count = visibleCount;
		}
		
		this._itemListWindow.setItemFormation(count);
	}

	_setWeaponbar(unit?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var scrollbar = this._itemListWindow.getItemScrollbar();
		
		scrollbar.resetScrollData();
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (this._isWeaponAllowed(unit, item)) {
				scrollbar.objectSet(item);
			}
		}
		
		scrollbar.objectSetEnd();
	}

	_isWeaponAllowed(unit?, item?) {
		var indexArray;
		
		if (!ItemControl.isWeaponAvailable(unit, item)) {
			return false;
		}
	
		indexArray = AttackChecker.getAttackIndexArray(unit, item, true);
		
		return indexArray.length !== 0;
	}
}

class FusionWeaponSelectMenu extends WeaponSelectMenu {

	_isWeaponAllowed(unit?, item?) {
		var indexArray;
		var fusionData = FusionControl.getFusionAttackData(unit);
		
		if (!ItemControl.isWeaponAvailable(unit, item)) {
			return false;
		}
	
		indexArray = AttackChecker.getFusionAttackIndexArray(unit, item, fusionData);
		
		return indexArray.length !== 0;
	}
}

class WandSelectMenu extends BaseWindowManager {

	_unit: any = null;

	_itemListWindow: any = null;

	_itemInfoWindow: any = null;

	setMenuTarget(unit?) {
		this._unit = unit;
		this._itemListWindow = createWindowObject(ItemListWindow, this);
		this._itemInfoWindow = createWindowObject(ItemInfoWindow, this); 
		
		this._setWandFormation();
		this._setWandbar(unit);
		this._itemListWindow.setActive(true);
	}

	moveWindowManager() {
		var result = this._itemListWindow.moveWindow();
		
		if (this._itemListWindow.isIndexChanged()) {
			this._itemInfoWindow.setInfoItem(this._itemListWindow.getCurrentItem());
		}
		
		this._itemInfoWindow.moveWindow();
		
		return result;
	}

	drawWindowManager() {
		var x = this.getPositionWindowX();
		var y = this.getPositionWindowY();
		var height = this._itemListWindow.getWindowHeight();
		
		this._itemListWindow.drawWindow(x, y);
		this._itemInfoWindow.drawWindow(x, y + height + this._getWindowInterval());
	}

	getTotalWindowWidth() {
		return this._itemInfoWindow.getWindowWidth();
	}

	getTotalWindowHeight() {
		return this._itemListWindow.getWindowHeight() + this._getWindowInterval() + this._itemInfoWindow.getWindowHeight();
	}

	getPositionWindowX() {
		var width = this.getTotalWindowWidth();
		return LayoutControl.getUnitBaseX(this._unit, width);
	}

	getPositionWindowY() {
		return LayoutControl.getCenterY(-1, 340);
	}

	getWandCount() {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(this._unit);
		var wandCount = 0;
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(this._unit, i);
			if (this._isWandAllowed(this._unit, item)) {
				wandCount++;
			}
		}
		
		return wandCount;
	}

	getSelectWand() {
		return this._itemListWindow.getCurrentItem();
	}

	_getWindowInterval() {
		return 10;
	}

	_setWandFormation() {
		var count = this.getWandCount();
		var visibleCount = 8;
		
		if (count > visibleCount) {
			count = visibleCount;
		}
		
		this._itemListWindow.setItemFormation(count);
	}

	_setWandbar(unit?) {
		var i, item;
		var count = UnitItemControl.getPossessionItemCount(unit);
		var scrollbar = this._itemListWindow.getItemScrollbar();
		
		scrollbar.resetScrollData();
		
		for (i = 0; i < count; i++) {
			item = UnitItemControl.getItem(unit, i);
			if (this._isWandAllowed(unit, item)) {
				scrollbar.objectSet(item);
			}
		}
		
		scrollbar.objectSetEnd();
	}

	_isWandAllowed(unit?, item?) {
		return WandChecker.isWandUsableInternal(unit, item);
	}
}
