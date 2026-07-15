
// Store rgb in order from left
class ColorValue {

	static DEFAULT: any = 0xffffff;

	static KEYWORD: any = 0xf9f09d;

	static INFO: any = 0x40bfff;

	static DISABLE: any = 0x808080;

	static LIGHT: any = 0x00ffff;
}

class TextFormat {

	static LEFT: any = 0;

	static CENTER: any = 1;

	static RIGHT: any = 2;
}

class TextRenderer {

	static drawSingleCharacter(x?, y?, c?, color?, font?) {
		root.getGraphicsManager().drawText(x, y, c, -1, color, 255, validateFont(font));
	}

	static drawCharText(x?, y?, text?, count?, color?, font?) {
		root.getGraphicsManager().drawCharText(x, y, text, count, color, 255, validateFont(font));
	}

	static drawText(x?, y?, text?, length?, color?, font?) {
		root.getGraphicsManager().drawText(x, y, text, length, color, 255, validateFont(font));
	}

	static drawRangeText(range?, format?, text?, length?, color?, font?) {
		root.getGraphicsManager().drawTextRange(range.x, range.y, range.width, range.height, format, text, length, color, 255, validateFont(font));
	}

	static drawAlphaText(x?, y?, text?, length?, color?, alpha?, font?) {
		root.getGraphicsManager().drawText(x, y, text, length, color, alpha, font);
	}

	static drawRangeAlphaText(range?, format?, text?, length?, color?, alpha?, font?) {
		root.getGraphicsManager().drawTextRange(range.x, range.y, range.width, range.height, format, text, length, color, alpha, validateFont(font));
	}

	
	// If the number is drawn next to the character, call this method, not the drawText.
	static drawKeywordText(x?, y?, text?, length?, color?, font?) {
		// Lower 5 to fit the text to the number.
		this.drawText(x, y + ContentLayout.KEYWORD_HEIGHT, text, length, color, font);
	}

	static drawSignText(x?, y?, text?) {
		var font = this.getDefaultFont();
		
		this.drawKeywordText(x, y, text, -1, ColorValue.INFO, font);
	}

	
	// Draw the title according to the text length.
	static drawTitleText(x?, y?, text?, color?, font?, format?, pic?) {
		var count = TitleRenderer.getTitlePartsCount(text, font);
		
		this.drawFixedTitleText(x, y, text, color, font, format, pic, count);
	}

	
	// Draw the title with a default length.
	static drawFixedTitleText(x?, y?, text?, color?, font?, format?, pic?, count?) {
		var range;
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		
		if (pic !== null) {
			TitleRenderer.drawTitle(pic, x, y, width, height, count);
		}
		
		range = createRangeObject(x + width, y, width * count, height);
		this.drawRangeText(range, format, text, -1, color, font);
	}

	static drawFixedTitleAlphaText(x?, y?, text?, color?, font?, format?, pic?, alpha?, count?) {
		var range;
		var width = TitleRenderer.getTitlePartsWidth();
		var height = TitleRenderer.getTitlePartsHeight();
		
		if (pic !== null) {
			TitleRenderer.drawTitle(pic, x, y, width, height, count);
		}
		
		range = createRangeObject(x + width, y, (width * count), height);
		this.drawRangeAlphaText(range, format, text, -1, color, alpha, font);
	}

	static drawScreenTopText(text?, textui?) {
		var range;
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var y = 0;
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		if (pic !== null) {	
			pic.draw(x, y);
			
			range = createRangeObject(x + 105, y, UIFormat.SCREENFRAME_WIDTH, 45);
			TextRenderer.drawRangeText(range, TextFormat.LEFT, text, -1, color, font);
		}
	}

	static drawScreenTopTextCenter(text?, textui?) {
		var range;
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var y = 0;
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		if (pic !== null) {	
			pic.draw(x, y);
			
			range = createRangeObject(x, y, UIFormat.SCREENFRAME_WIDTH, 50);
			TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
		}
	}

	static drawScreenBottomText(text?, textui?) {
		var range;
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		if (pic !== null) {
			pic.draw(x, root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT);
			
			range = createRangeObject(x + 65, root.getGameAreaHeight() - 58, UIFormat.SCREENFRAME_WIDTH - (65 * 2), 40);
			TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
		}
	}

	static drawScreenBottomTextCenter(text?, textui?) {
		var range;
		var x = LayoutControl.getCenterX(-1, UIFormat.SCREENFRAME_WIDTH);
		var y = root.getGameAreaHeight() - UIFormat.SCREENFRAME_HEIGHT;
		var color = textui.getColor();
		var font = textui.getFont();
		var pic = textui.getUIImage();
		
		if (pic !== null) {
			pic.draw(x, y);
			
			range = createRangeObject(x, y, UIFormat.SCREENFRAME_WIDTH, 110);
			TextRenderer.drawRangeText(range, TextFormat.CENTER, text, -1, color, font);
		}
	}

	static getTextWidth(text?, font?) {
		return root.getGraphicsManager().getTextWidth(text, validateFont(font));
	}

	static getTextHeight(text?, font?) {
		return root.getGraphicsManager().getTextHeight(text, validateFont(font));
	}

	static getDefaultFont() {
		return root.getBaseData().getFontList().getData(0);
	}
}

class UnitRenderer {

	// It's called to draw the unit in the window etc.
	static drawDefaultUnit(unit?, x?, y?, unitRenderParam?) {
		if (unitRenderParam === null) {
			unitRenderParam = StructureBuilder.buildUnitRenderParam();
		}
		
		this._setDefaultParam(unit, unitRenderParam);
		
		// If the default display is always needed on the window,
		// this._drawCharChip(x, y, unitRenderParam); can be described, too.
		this._drawMenuCustomCharChip(unit, x, y, unitRenderParam);
	}

	
	// It's called to draw the unit on the map.
	static drawScrollUnit(unit?, x?, y?, unitRenderParam?) {
		var session = root.getCurrentSession();
		var dx = 0;
		var dy = 0;
		
		if (unitRenderParam === null) {
			unitRenderParam = StructureBuilder.buildUnitRenderParam();
		}
		
		this._setDefaultParam(unit, unitRenderParam);
		
		if (unitRenderParam.isScroll) {
			dx = session.getScrollPixelX();
			dy = session.getScrollPixelY();
		}
		
		this._drawCustomCharChip(unit, x - dx, y - dy, unitRenderParam);
	}

	static drawCharChip(x?, y?, unitRenderParam?) {
		var dx, dy, dxSrc, dySrc;
		var directionArray = [4, 1, 2, 3, 0];
		var handle = unitRenderParam.handle;
		var width = GraphicsFormat.CHARCHIP_WIDTH;
		var height = GraphicsFormat.CHARCHIP_HEIGHT;
		var xSrc = handle.getSrcX() * (width * 3);
		var ySrc = handle.getSrcY() * (height * 5);
		var pic = this._getGraphics(handle, unitRenderParam.colorIndex);
		var tileSize = this._getTileSize(unitRenderParam);
		
		if (pic === null) {
			return;
		}
		
		dx = Math.floor((width - tileSize.width) / 2);
		dy = Math.floor((height - tileSize.height) / 2);
		dxSrc = unitRenderParam.animationIndex;
		dySrc = directionArray[unitRenderParam.direction];
		
		pic.setAlpha(unitRenderParam.alpha);
		pic.setDegree(unitRenderParam.degree);
		pic.setReverse(unitRenderParam.isReverse);
		
		try {
			pic.drawStretchParts(x - dx, y - dy, width, height, xSrc + (dxSrc * width), ySrc + (dySrc * height), width, height);
		}
		catch (e) {
			// If x and y are invalid values, an exception will be thrown.
			// For log output, it is preferable to use root.log(''); rather than root.msg('').
		}
	}

	static _drawCustomCharChip(unit?, x?, y?, unitRenderParam?) {
		var handle;
		var flag = CustomCharChipGroup.getFlag();
		var renderer = flag & CustomCharChipFlag.UNIT ? unit.getCustomRenderer() : null;
		
		if (renderer === null) {
			renderer = flag & CustomCharChipFlag.GLOBAL ? root.getGlobalCustomRenderer() : null;
		}
		
		if (renderer !== null) {
			CustomCharChipGroup.drawMenuUnit(renderer, unit, x, y, unitRenderParam);
			return;
		}
		
		handle = unit.getCustomCharChipHandle();
		if (handle !== null) {
			unitRenderParam.handle = handle;
		}
		
		this.drawCharChip(x, y, unitRenderParam);
	}

	static _drawMenuCustomCharChip(unit?, x?, y?, unitRenderParam?) {
		var handle;
		var flag = CustomCharChipGroup.getFlag();
		var renderer = flag & CustomCharChipFlag.UNIT ? unit.getCustomRenderer() : null;
		
		if (renderer === null) {
			renderer = flag & CustomCharChipFlag.GLOBAL ? root.getGlobalCustomRenderer() : null;
		}
		
		if (renderer !== null) {
			if (!renderer.isDefaultMenuUnit()) {
				CustomCharChipGroup.drawMenuUnit(renderer, unit, x, y, unitRenderParam);
				return;
			}
		}
		
		handle = unit.getCustomCharChipHandle();
		if (handle !== null) {
			unitRenderParam.handle = handle;
		}
		
		this.drawCharChip(x, y, unitRenderParam);
	}

	static _getTileSize(unitRenderParam?) {
		var size = {
			width: 32,
			height: 32
		};
		
		if (unitRenderParam.isScroll || AttackControl.isAttack()) {
			if (size.width !== GraphicsFormat.MAPCHIP_WIDTH) {
				size.width = GraphicsFormat.MAPCHIP_WIDTH;
			}
			if (size.height !== GraphicsFormat.MAPCHIP_HEIGHT) {
				size.height = GraphicsFormat.MAPCHIP_HEIGHT;
			}
		}
		
		return size;
	}

	static _setDefaultParam(unit?, unitRenderParam?) {
		if (unitRenderParam.colorIndex === -1) {
			unitRenderParam.colorIndex = unit.getUnitType();
		}
		
		if (unitRenderParam.handle === null) {
			unitRenderParam.handle = unit.getCharChipResourceHandle();
		}
	}

	
	// This method is different from GraphicsRenderer.getGraphics in that the color is explicity specified in this method.
	static _getGraphics(handle?, colorIndex?) {
		var isRuntime, list;
		var handleType = handle.getHandleType();
		
		if (handleType === ResourceHandleType.ORIGINAL) {
			isRuntime = false;
		}
		else if (handleType === ResourceHandleType.RUNTIME) {
			isRuntime = true;
		}
		else {
			return null;
		}
		
		list = root.getBaseData().getGraphicsResourceList(GraphicsType.CHARCHIP, isRuntime);
		
		return list.getCollectionDataFromId(handle.getResourceId(), colorIndex);
	}
}

class UnitSimpleRenderer {

	static drawContent(x?, y?, unit?, textui?) {
		this.drawContentEx(x, y, unit, textui, ParamBonus.getMhp(unit));
	}

	static drawContentEx(x?, y?, unit?, textui?, mhp?) {
		this._drawFace(x, y, unit, textui);
		this._drawName(x, y, unit, textui);
		this._drawInfo(x, y, unit, textui);
		this._drawSubInfo(x, y, unit, textui, mhp);
	}

	static _drawFace(x?, y?, unit?, textui?) {
		ContentRenderer.drawUnitFace(x, y, unit, false, 255);
	}

	static _drawName(x?, y?, unit?, textui?) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		x += GraphicsFormat.FACE_WIDTH + this._getInterval();
		y += this._getVerticalPositionArray()[0];
		TextRenderer.drawText(x, y, unit.getName(), length, color, font);
	}

	static _drawInfo(x?, y?, unit?, textui?) {
		var length = this._getTextLength();
		var color = textui.getColor();
		var font = textui.getFont();
		
		x += GraphicsFormat.FACE_WIDTH + this._getInterval();
		y += this._getVerticalPositionArray()[1];
		TextRenderer.drawText(x, y, unit.getClass().getName(), length, color, font);
	}

	static _drawSubInfo(x?, y?, unit?, textui?, mhp?) {
		var pic = root.queryUI('unit_gauge');
		
		x += GraphicsFormat.FACE_WIDTH + this._getInterval();
		y += this._getVerticalPositionArray()[2];
		ContentRenderer.drawUnitHpZoneEx(x, y, unit, pic, mhp);
	}

	static _getTextLength() {
		return ItemRenderer.getItemWindowWidth() - (GraphicsFormat.FACE_WIDTH + this._getInterval() + DefineControl.getWindowXPadding());
	}

	static _getInterval() {
		return 10;
	}

	static _getVerticalPositionArray() {
		return [10, 40, 60];
	}
}

// Get a handle to be specified with an GraphicsRenderer method with queryGraphicsHandle.
// Func returns a handle,
// not image itself, because drawing image needs the source information of drawing.
// For instance, if it's only icon image, cannot know which part of icon needs to be drawn.
// So return a handle which can include this kind of information.
// But for images such as background having no concept of a source of drawing, GraphicsRenderer is not used sometimes.
// UI has no concept of a source of drawing at all types, so queryUI returns image itself.
// Because of this, GraphicsRenderer is not used for UI drawing.
class GraphicsRenderer {

	static drawImage(xDest?, yDest?, handle?, graphicsType?) {
		this.drawImageParam(xDest, yDest, handle, graphicsType, null);
	}

	static drawImageParam(xDest?, yDest?, handle?, graphicsType?, graphicsRenderParam?) {
		var pic = this.getGraphics(handle, graphicsType);
		var xSrc = handle.getSrcX();
		var ySrc = handle.getSrcY();
		var size = this.getGraphicsSize(graphicsType, pic);
		var width = size.width;
		var height = size.height;
		
		if (pic !== null) {
			if (graphicsRenderParam !== null) {
				this._setRenderParam(pic, graphicsRenderParam);
			}
			
			pic.drawStretchParts(xDest, yDest, width, height, xSrc * width, ySrc * height, width, height);
		}
	}

	static getGraphics(handle?, graphicsType?) {
		var isRuntime, list;
		var handleType = handle.getHandleType();
		
		if (handleType === ResourceHandleType.ORIGINAL) {
			isRuntime = false;
		}
		else if (handleType === ResourceHandleType.RUNTIME) {
			isRuntime = true;
		}
		else {
			return null;
		}
		
		list = root.getBaseData().getGraphicsResourceList(graphicsType, isRuntime);
		
		return list.getCollectionDataFromId(handle.getResourceId(), handle.getColorIndex());
	}

	static getGraphicsSize(graphicsType?, pic?) {
		var width, height;
		
		if (graphicsType === GraphicsType.MAPCHIP) {
			width = GraphicsFormat.MAPCHIP_WIDTH;
			height = GraphicsFormat.MAPCHIP_HEIGHT;
		}
		else if (graphicsType === GraphicsType.CHARCHIP) {
			width = GraphicsFormat.CHARCHIP_WIDTH;
			height = GraphicsFormat.CHARCHIP_HEIGHT;
		}
		else if (graphicsType === GraphicsType.FACE) {
			width = GraphicsFormat.FACE_WIDTH;
			height = GraphicsFormat.FACE_HEIGHT;
		}
		else if (graphicsType === GraphicsType.ICON) {
			width = GraphicsFormat.ICON_WIDTH;
			height = GraphicsFormat.ICON_HEIGHT;
		}
		else if (graphicsType === GraphicsType.MOTION) {
			width = GraphicsFormat.MOTION_WIDTH;
			height = GraphicsFormat.MOTION_HEIGHT;
		}
		else if (graphicsType === GraphicsType.EFFECT) {
			width = GraphicsFormat.EFFECT_WIDTH;
			height = GraphicsFormat.EFFECT_HEIGHT;
		}
		else if (graphicsType === GraphicsType.WEAPON) {
			width = GraphicsFormat.WEAPON_WIDTH;
			height = GraphicsFormat.WEAPON_HEIGHT;
		}
		else if (graphicsType === GraphicsType.BOW) {
			width = GraphicsFormat.BOW_WIDTH;
			height = GraphicsFormat.BOW_HEIGHT;
		}
		else if (graphicsType === GraphicsType.THUMBNAIL) {
			width = GraphicsFormat.THUMBNAIL_WIDTH;
			height = GraphicsFormat.THUMBNAIL_HEIGHT;
		}
		else if (graphicsType === GraphicsType.BATTLEBACK) {
			width = GraphicsFormat.BATTLEBACK_WIDTH;
			height = GraphicsFormat.BATTLEBACK_HEIGHT;
		}
		else if (graphicsType === GraphicsType.EVENTBACK) {
			width = GraphicsFormat.EVENTBACK_WIDTH;
			height = GraphicsFormat.EVENTBACK_HEIGHT;
		}
		else if (graphicsType === GraphicsType.SCREENBACK) {
			width = GraphicsFormat.SCREENBACK_WIDTH;
			height = GraphicsFormat.SCREENBACK_HEIGHT;
		}
		else if (graphicsType === GraphicsType.WORLDMAP) {
			width = GraphicsFormat.WORLDMAP_WIDTH;
			height = GraphicsFormat.WORLDMAP_HEIGHT;
		}
		else if (graphicsType === GraphicsType.EVENTSTILL) {
			width = GraphicsFormat.EVENTSTILL_WIDTH;
			height = GraphicsFormat.EVENTSTILL_HEIGHT;
		}
		else if (graphicsType === GraphicsType.CHARILLUST) {
			width = GraphicsFormat.CHARILLUST_WIDTH;
			height = GraphicsFormat.CHARILLUST_HEIGHT;
		}
		else if (graphicsType === GraphicsType.PICTURE) {
			width = GraphicsFormat.PICTURE_WIDTH;
			height = GraphicsFormat.PICTURE_HEIGHT;
		}
		else {
			width = 0;
			height = 0;
		}
		
		if (pic !== null) {
			if (graphicsType === GraphicsType.BATTLEBACK || graphicsType === GraphicsType.EVENTBACK || graphicsType === GraphicsType.SCREENBACK ||
				graphicsType === GraphicsType.WORLDMAP || graphicsType === GraphicsType.EVENTSTILL || graphicsType === GraphicsType.CHARILLUST ||
				graphicsType === GraphicsType.PICTURE) {
				width = pic.getWidth();
				height = pic.getHeight();
			}
		}
		
		return {
			width: width,
			height: height
		};
	}

	static _setRenderParam(pic?, graphicsRenderParam?) {
		if (graphicsRenderParam.alpha !== 255) {
			pic.setAlpha(graphicsRenderParam.alpha);
		}
		
		if (graphicsRenderParam.isReverse) {
			pic.setReverse(graphicsRenderParam.isReverse);
		}
		
		if (graphicsRenderParam.degree !== 0) {
			pic.setDegree(graphicsRenderParam.degree);
		}
	}
}

class ItemRenderer {

	static drawItem(x?, y?, item?, color?, font?, isDrawLimit?) {
		this.drawItemAlpha(x, y, item, color, font, isDrawLimit, 255);
	}

	static drawItemAlpha(x?, y?, item?, color?, font?, isDrawLimit?, alpha?) {
		var interval = this._getItemNumberInterval();
		var iconWidth = GraphicsFormat.ICON_WIDTH + 5;
		var length = this._getTextLength();
		var handle = item.getIconResourceHandle();
		var graphicsRenderParam = StructureBuilder.buildGraphicsRenderParam();
		
		graphicsRenderParam.alpha = alpha;
		GraphicsRenderer.drawImageParam(x, y, handle, GraphicsType.ICON, graphicsRenderParam);
		
		TextRenderer.drawAlphaText(x + iconWidth, y + ContentLayout.KEYWORD_HEIGHT, item.getName(), length, color, alpha, font);
		
		if (isDrawLimit) {
			this.drawItemLimit(x + iconWidth + interval, y, item, alpha);
		}
	}

	static drawItemLimit(x?, y?, item?, alpha?) {
		if (this._isInfinity(item)) {
			return;
		}
		
		if (item.getLimit() > 0) {
			NumberRenderer.drawNumberColor(x, y, item.getLimit(), 0, alpha);
		}
		else {
			TextRenderer.drawSignText(x - 5, y, StringTable.SignWord_Limitless);
		}
	}

	static drawItemGold(x?, y?, item?, color?, font?, gold?) {
		var interval = this._getItemNumberInterval();
		var iconWidth = GraphicsFormat.ICON_WIDTH + 5;
		
		this.drawItem(x, y, item, color, font, true);
		
		x = x + iconWidth + interval + 65;
		NumberRenderer.drawNumber(x, y, gold);
	}

	static drawAmount(x?, y?, item?, color?, font?, amount?) {
		InventoryRenderer.drawAmount(x, y, item, color, font, amount);
	}

	static drawShopItem(x?, y?, item?, color?, font?, gold?, amount?) {
		var dx = this._getHorizontalSpaceArray();
		
		ItemRenderer.drawItem(x + dx[0], y, item, color, font, false);
		this.drawAmount(x + dx[1], y, item, color, font, amount);
		ItemRenderer.drawItemLimit(x + dx[2], y, item, 255);
		NumberRenderer.drawNumber(x + dx[3], y, gold);
	}

	static getItemWidth() {
		return 220;
	}

	static getItemWindowWidth() {
		return this.getItemWidth() + (DefineControl.getWindowXPadding() * 2);
	}

	static getItemGoldWidth() {
		return 275;
	}

	static getShopItemWidth() {
		return 305;
	}

	static getItemHeight() {
		return 30;
	}

	static _getItemNumberInterval() {
		return this.getItemWidth() - 55;
	}

	static _getTextLength() {
		return this.getItemWidth() - 15;
	}

	static _getHorizontalSpaceArray() {
		return [0, 140, 225, 285];
	}

	static _isInfinity(item?) {
		return item.isWeapon() && DataConfig.isWeaponInfinity();
	}
}

class InventoryRenderer {

	static drawAmount(x?, y?, item?, color?, font?, amount?) {
		var width, height;
		var dx = 0;
		var arr = this._getVerticalSpaceArray();
		var textui = this._getTextUI();
		var pic = textui.getUIImage();
		
		if (amount === 0) {
			return;
		}
		
		if (pic === null) {
			dx = 36;
			TextRenderer.drawSignText(x + dx, y, StringTable.SignWord_Multiple);
			NumberRenderer.drawRightNumberColor(x + dx + 16, y, amount, 1, 255);
		}
		else {
			width = TitleRenderer.getTitlePartsWidth();
			height = TitleRenderer.getTitlePartsHeight();
			
			TitleRenderer.drawTitle(pic, x + dx, y + arr[0], width, height, 1);
			NumberRenderer.drawRightNumberColor(x + dx + this._getAmountStartX(amount), y + arr[1], amount, this._getDefaultColorIndex(), 255);
		}
	}

	static _getVerticalSpaceArray() {
		return [-20, -2];
	}

	static _getAmountStartX(amount?) {
		return amount >= 10 ? 42 : 46;
	}

	static _getDefaultColorIndex() {
		return 4;
	}

	static _getTextUI() {
		return root.queryTextUI('inventory_title');
	}
}

class TitleRenderer {

	static drawTitle(pic?, x?, y?, width?, height?, count?) {
		var picCache, graphicsManager;
		
		if (pic === null) {
			return;
		}
		
		picCache = CacheControl.getCacheGraphics(width * (count + 2), height, pic);
		if (picCache !== null) {
			if (picCache.isCacheAvailable()) {
				// If the content of Cache is enabled, draw Cache.
				picCache.draw(x, y);
				return;
			}
		}
		else {
			picCache = CacheControl.createCacheGraphics(width * (count + 2), height, pic);
		}
		
		graphicsManager = root.getGraphicsManager();
		
		// Change a drawing target to Cache, not an image. 
		graphicsManager.setRenderCache(picCache);
		
		// Title is drawn in Cache.
		this._drawTitleInternal(pic, 0, 0, width, height, count);
		
		// Disable to draw in Cache.
		graphicsManager.resetRenderCache();
		
		// Draw the content of Cache on the screen.
		picCache.draw(x, y);
	}

	static drawhHiglightTitle(pic?, x?, y?, width?, height?, count?, highlightColor?, highlightAlpha?) {
		var picCache, graphicsManager;
		
		if (pic === null) {
			return;
		}
		
		picCache = CacheControl.getCacheGraphics(width * (count + 2), height, pic);
		if (picCache !== null) {
			if (picCache.isCacheAvailable()) {
				picCache.setColor(highlightColor, highlightAlpha);
				
				// If the content of Cache is enabled, draw Cache.
				picCache.draw(x, y);
				return;
			}
		}
		else {
			picCache = CacheControl.createCacheGraphics(width * (count + 2), height, pic);
		}
		
		graphicsManager = root.getGraphicsManager();
		
		// Change a drawing target to Cache, not an image. 
		graphicsManager.setRenderCache(picCache);
		
		// Title is drawn in Cache.
		this._drawTitleInternal(pic, 0, 0, width, height, count);
		
		// Disable to draw in Cache.
		graphicsManager.resetRenderCache();
		
		// Draw the content of Cache on the screen.
		picCache.draw(x, y);
	}

	static drawTitleNoCache(pic?, x?, y?, width?, height?, count?) {
		this._drawTitleInternal(pic, x, y, width, height, count);
	}

	static drawLine(x?, y?, width?, pic?) {
		var w = UIFormat.LINE_WIDTH / 3;
		var h = UIFormat.LINE_HEIGHT / 4;
		
		this._drawLineInternal(pic, x, y, w, h, width / 8);
	}

	static getTitlePartsCount(text?, font?) {
		var textWidth = TextRenderer.getTextWidth(text, font);
		var count = Math.floor(textWidth / TitleRenderer.getTitlePartsWidth()) + 1;
		
		return count;
	}

	static getTitlePartsWidth() {
		return UIFormat.TITLE_WIDTH / 3;
	}

	static getTitlePartsHeight() {
		return UIFormat.TITLE_HEIGHT;
	}

	static _drawTitleInternal(pic?, x?, y?, width?, height?, count?) {
		var i;
		
		if (pic === null) {
			return;
		}
		
		// Draw the left edge.
		pic.drawParts(x, y, 0, 0, width, height);
		x += width;
		
		for (i = 0; i < count; i++) {
			pic.drawParts(x, y, width, 0, width, height);
			x += width;
		}
		
		// Draw the right edge.
		pic.drawParts(x, y, width * 2, 0, width, height);
	}

	static _drawLineInternal(pic?, x?, y?, width?, height?, count?) {
		var i;
		var ySrc = 8 * 1;
		
		if (pic === null) {
			return;
		}
		
		// Draw the left edge.
		pic.drawParts(x, y, 0, ySrc, width, height);
		x += width;
		
		for (i = 0; i < count; i++) {
			pic.drawParts(x, y, width, ySrc, width, height);
			x += width;
		}
		
		// Draw the right edge.
		pic.drawParts(x, y, width * 2, ySrc, width, height);
	}
}

// Control drawing such as HP etc.
class ContentRenderer {

	static drawLevelInfo(x?, y?, unit?) {
		var textLv = StringTable.Status_Level;
		var textExp = StringTable.Status_Experience;
		var dx = this._getHorizontalSpaceArray();
		var exp = unit.getExp();
		
		// If the unit is the enemy, check if "Get optional exp of class when enemy is killed" is set at the game option.
		if (unit.getUnitType() === UnitType.ENEMY && DataConfig.isFixedExperience()) {
			exp = unit.getClass().getBonusExp();
			if (exp < 0) {
				exp = 0;
			}
		}
		
		TextRenderer.drawSignText(x + dx[0], y, textLv);
		NumberRenderer.drawNumber(x + dx[1], y, unit.getLv());
		TextRenderer.drawSignText(x + dx[2], y, textExp);
		NumberRenderer.drawNumber(x + dx[3], y, exp);
	}

	static drawHp(x?, y?, hp?, maxHp?) {
		var textHp = this._getHpText();
		var textSlash = '/';
		var dx = this._getHorizontalSpaceArray();
		
		TextRenderer.drawSignText(x + dx[0], y, textHp);
		NumberRenderer.drawNumber(x + dx[1], y, hp);
		TextRenderer.drawSignText(x + dx[2], y, textSlash);
		NumberRenderer.drawNumber(x + dx[3], y, maxHp);
	}

	static drawUnitHpZone(x?, y?, unit?, pic?) {
		this.drawUnitHpZoneEx(x, y, unit, pic, ParamBonus.getMhp(unit));
	}

	static drawUnitHpZoneEx(x?, y?, unit?, pic?, mhp?) {
		var hp = unit.getHp();
		var obj = this._getGaugePositionAndWidth();
		
		this.drawHp(x, y, hp, mhp);
		
		this.drawGauge(x, y + obj.y, hp, mhp, 1, obj.width, pic);
	}

	static drawPlayTime(x?, y?, time?) {
		var i;
		var arr = [,,];
		var count = arr.length;
		var dx = 8;
		var font = TextRenderer.getDefaultFont();
		
		arr[0] = Math.floor(time / 3600);
		arr[1] = Math.floor((time / 60) % 60);
		arr[2] = time % 60;
		
		for (i = 0; i < count; i++) {
			NumberRenderer.drawNumber(x, y, arr[i] / 10);
			NumberRenderer.drawNumber(x + dx, y, arr[i] % 10);
			
			x += 16;
			
			if (i < count - 1) {
				TextRenderer.drawText(x, y + 5, ':', -1, ColorValue.DEFAULT, font);
				x += dx;
			}
		}
	}

	static drawGauge(x?, y?, curValue?, maxValue?, colorIndex?, totalWidth?, pic?) {
		var i, n, per, full;
		var width = UIFormat.GAUGE_WIDTH / 3;
		var height = UIFormat.GAUGE_HEIGHT / 4;
		var max = totalWidth / 10;
		
		if (pic === null) {
			return;
		}
		
		per = ((curValue / maxValue) * max);
		
		if (per > 0 && per < 1) {
			per = 0;
		}
		else {
			// per is greater than 1.
			// Subtract 1 so as to be 0 base.
			per -= 1;
		}
		
		for (i = 0; i < max; i++) {
			if (i === 0) {
				n = 0;
			}
			else if (i === max - 1) {
				n = 2;
			}
			else {
				n = 1;
			}
			
			if (per >= i) {
				full = colorIndex;
			}
			else {
				full = 0;
			}
		
			pic.drawParts(x + (i * width), y, n * width, full * height, width, height);
		}
	}

	
	// Call to draw a face image in a range of 96x96.
	// Face image display on the real battle or the unit menu should be drawn as 96x96 due to UI.
	// Ignore "Use Large Face" on a message layout.
	static drawUnitFace(x?, y?, unit?, isReverse?, alpha?) {
		var handle = unit.getFaceResourceHandle();
		var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		
		if (pic === null) {
			return;
		}
		
		this._setPicInfo(pic, unit, isReverse, alpha);
		
		this._drawShrinkFace(x, y, handle, pic);
	}

	static drawFaceFromResourceHandle(x?, y?, handle?) {
		var pic = GraphicsRenderer.getGraphics(handle, GraphicsType.FACE);
		
		if (pic === null) {
			return;
		}
		
		this._drawShrinkFace(x, y, handle, pic);
	}

	static _setPicInfo(pic?, unit?, isReverse?, alpha?) {
		pic.setReverse(isReverse);
		pic.setAlpha(alpha);
	}

	static _drawShrinkFace(xDest?, yDest?, handle?, pic?) {
		var xSrc, ySrc;
		var destWidth = GraphicsFormat.FACE_WIDTH;
		var destHeight = GraphicsFormat.FACE_HEIGHT;
		var srcWidth = destWidth;
		var srcHeight = destHeight;
		
		if (root.isLargeFaceUse() && pic.isLargeImage()) {
			srcWidth = root.getLargeFaceWidth();
			srcHeight = root.getLargeFaceHeight();
		}
		
		xSrc = handle.getSrcX() * srcWidth;
		ySrc = handle.getSrcY() * srcHeight;
		pic.drawStretchParts(xDest, yDest, destWidth, destHeight, xSrc, ySrc, srcWidth, srcHeight);
	}

	static _getHpText() {
		return root.queryCommand('hp_param');
	}

	static _getHorizontalSpaceArray() {
		return [0, 44, 60, 98];
	}

	static _getGaugePositionAndWidth() {
		return {y: 20, width: 110};
	}
}

class StatusRenderer {

	static drawAttackStatus(x?, y?, arr?, color?, font?, space?) {
		var i, text;
		var length = this._getTextLength();
		var numberSpace = this._getNumberSpace();
		var buf = ['attack_capacity', 'hit_capacity', 'critical_capacity'];
		
		for (i = 0; i < 3; i++) {
			text = root.queryCommand(buf[i]);
			TextRenderer.drawKeywordText(x, y, text, length, color, font);
			x += numberSpace;
			
			if (arr[i] >= 0) {
				NumberRenderer.drawNumber(x, y, arr[i]);
			}
			else {
				TextRenderer.drawSignText(x - 5, y, StringTable.SignWord_Limitless);
			}
			
			x += space;
		}
	}

	static _getNumberSpace() {
		return 28 + DefineControl.getNumberSpace();
	}

	static _getTextLength() {
		return 35;
	}
}

// Control to draw number.
// If minus number is drawn, the caller draws -, and number specifies the plus value.
class NumberRenderer {

	static drawNumber(x?, y?, number?) {
		this.drawNumberColor(x, y, number, 0, 255);
	}

	static drawNumberColor(x?, y?, number?, colorIndex?, alpha?) {
		var pic = root.queryUI('number');
		var width = UIFormat.NUMBER_WIDTH / 10;
		var height = UIFormat.NUMBER_HEIGHT / 5;
		var ySrc = height * colorIndex;
		
		this._drawNumberInternal(x, y, number, pic, ySrc, width, height, alpha);
	}

	static drawRightNumber(x?, y?, number?) {
		this.drawRightNumberColor(x, y, number, 0, 255);
	}

	static drawRightNumberColor(x?, y?, number?, colorIndex?, alpha?) {
		var pic = root.queryUI('number');
		var width = UIFormat.NUMBER_WIDTH / 10;
		var height = UIFormat.NUMBER_HEIGHT / 5;
		var ySrc = height * colorIndex;
		
		this._drawRightNumberInternal(x, y, number, pic, ySrc, width, height, alpha);
	}

	static drawAttackNumber(x?, y?, number?) {
		this.drawAttackNumberColor(x, y, number, 0, 255);
	}

	static drawAttackNumberColor(x?, y?, number?, colorIndex?, alpha?) {
		var pic = root.queryUI('bignumber');
		var width = UIFormat.BIGNUMBER_WIDTH / 10;
		var height = UIFormat.BIGNUMBER_HEIGHT / 5;
		var ySrc = height * colorIndex;
		
		this._drawAttackNumberInternal(x, y, number, pic, ySrc, width, height, alpha);
	}

	static drawAttackNumberCenter(x?, y?, number?) {
		var dx;
		
		if (number >= 10000) {
			dx = 38;
		}
		else if (number >= 1000) {
			dx = 32;
		}
		else if (number >= 100) {
			dx = 24;
		}
		else if (number >= 10) {
			dx = 16;
		}
		else {
			dx = 8;
		}
		
		this.drawAttackNumber(x - dx, y, number);
	}

	static _drawNumberInternal(x?, y?, number?, pic?, ySrc?, width?, height?, alpha?) {
		var i, n;
		var count = 0;
		var digitArray = [];
		
		if (pic === null || number < 0) {
			return;
		}
		
		if (number === 0) {
			pic.setAlpha(alpha);
			pic.drawParts(x, y, 0, ySrc, width, height);
			return;
		}
		
		while (number > 0) {
			n = Math.floor(number % 10);
			number = Math.floor(number / 10);
			digitArray[count] = n;
			count++;
		}
		
		for (i = 0; i < count; i++) {
			pic.setAlpha(alpha);
			pic.drawParts(x, y, digitArray[i] * width, ySrc, width, height);
			x += this._getNumberGap();
		}
	}

	static _drawRightNumberInternal(x?, y?, number?, pic?, ySrc?, width?, height?, alpha?) {
		var i, n;
		var count = 0;
		var digitArray = [];
		
		if (pic === null || number < 0) {
			return;
		}
		
		if (number === 0) {
			pic.setAlpha(alpha);
			pic.drawParts(x, y, 0, ySrc, width, height);
			return;
		}
		
		while (number > 0) {
			n = Math.floor(number % 10);
			number = Math.floor(number / 10);
			digitArray[count] = n;
			count++;
		}
		
		for (i = count - 1; i >= 0; i--) {
			pic.setAlpha(alpha);
			pic.drawParts(x, y, digitArray[i] * width, ySrc, width, height);
			x += this._getRightNumberGap();
		}
	}

	static _drawAttackNumberInternal(x?, y?, number?, pic?, ySrc?, width?, height?, alpha?) {
		var i, n;
		var count = 0;
		var digitArray = [];
		
		if (pic === null || number < 0) {
			return;
		}
		
		if (number === 0) {
			pic.setAlpha(alpha);
			pic.drawParts(x, y, 0, ySrc, width, height);
			return;
		}
		
		while (number > 0) {
			n = Math.floor(number % 10);
			number = Math.floor(number / 10);
			digitArray[count] = n;
			count++;
		}
		
		for (i = count - 1; i >= 0; i--) {
			pic.setAlpha(alpha);
			pic.drawParts(x, y, digitArray[i] * width, ySrc, width, height);
			x += this._getAttackNumberGap();
		}
	}

	static _getNumberGap() {
		return -9;
	}

	static _getRightNumberGap() {
		return 9;
	}

	static _getAttackNumberGap() {
		return 15;
	}
}

class SkillRenderer {

	static drawSkill(x?, y?, skill?, color?, font?) {
		var handle = skill.getIconResourceHandle();
		var length = this._getTextLength();
		
		GraphicsRenderer.drawImage(x, y, handle, GraphicsType.ICON);
		x += GraphicsFormat.ICON_WIDTH + 6;
		
		TextRenderer.drawKeywordText(x, y, skill.getName(), length, color, font);
	}

	static drawTitle(x?, y?, color?, font?, pic?) {
		TextRenderer.drawTitleText(x, y, 'skill list', color, font, TextFormat.CENTER, pic);
	}

	static drawObjectSkillList(x?, y?, obj?) {
		var i, data, handle;
		var refList = obj.getSkillReferenceList();
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			data = refList.getTypeData(i);
			handle = data.getIconResourceHandle();
			GraphicsRenderer.drawImage(x + (i * 30), y, handle, GraphicsType.ICON);
		}
	}

	static _getTextLength() {
		return -1;
	}
}

class WeaponTypeRenderer {

	static drawTitle(x?, y?, color?, font?, pic?) {
		TextRenderer.drawTitleText(x, y, 'weapon list', color, font, TextFormat.CENTER, pic);
	}

	static drawClassWeaponList(x?, y?, cls?) {
		var i, data, handle;
		var refList = cls.getEquipmentWeaponTypeReferenceList();
		var count = refList.getTypeCount();
		
		for (i = 0; i < count; i++) {
			data = refList.getTypeData(i);
			handle = data.getIconResourceHandle();
			GraphicsRenderer.drawImage(x + (i * 30), y, handle, GraphicsType.ICON);
		}
		
		if (cls.getClassOption() & ClassOptionFlag.WAND) {
			handle = this._getWandIcon();
			GraphicsRenderer.drawImage(x + (i * 30), y, handle, GraphicsType.ICON);
		}
	}

	static _getWandIcon() {
		var list = root.getBaseData().getWeaponTypeList(3);
		
		return list.getDataFromId(0).getIconResourceHandle();
	}
}

// Control to draw the activation rate.
class InvocationRenderer {

	static getInvocationText(value?, type?) {
		var text = '';
		
		if (type === InvocationType.HPDOWN) {
			text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(ParamType.MHP)) + value + StringTable.SkillWord_Less;
		}
		else if (type === InvocationType.ABSOLUTE) {
			text = value + StringTable.SignWord_Percent;
		}
		else {
			if (type === InvocationType.LV) {
				text = StringTable.Status_Level;
			}
			else {
				text = ParamGroup.getParameterName(ParamGroup.getParameterIndexFromType(type));
			}
		
			text = '(' + text;
			if (value > 1) {
				text += ' ' + StringTable.SignWord_Multiple + '' + value;
			}
			text += ')' + StringTable.SignWord_Percent;
		}
		
		return text;
	}
}

class ChapterRenderer {

	static getChapterText(mapInfo?) {
		var text;
		var number = mapInfo.getChapterNumber();
		var mapType = mapInfo.getMapType();
		
		if (mapType === MapType.NORMAL || mapType === MapType.EXTRA) {
			if (number === 0) {
				text = StringTable.Chapter_First;
			}
			else if (number === -1) {
				text = StringTable.Chapter_Last;
			}
			else {
				text = StringTable.Chapter_Header + number + StringTable.Chapter_Footer;
			}
			
			if (mapType === MapType.EXTRA) {
				text += StringTable.Chapter_SideStory;
			}
		}
		else {
			text =  StringTable.Chapter_Quest + number;
		}
		
		return text;
	}

	static getChapterTextFromId(mapId?) {
		var list = root.getBaseData().getMapList();
		var mapInfo = list.getDataFromId(mapId);
		
		if (mapInfo === null) {
			return '';
		}
		
		return this.getChapterText(mapInfo);
	}

	static getChapterName(mapId?) {
		var list = root.getBaseData().getMapList();
		var mapInfo = list.getDataFromId(mapId);
		
		if (mapInfo === null) {
			return '';
		}
		
		return mapInfo.getName();
	}
}

class WindowRenderer {

	static drawStretchWindow(x?, y?, width?, height?, pic?) {
		var picCache = CacheControl.getCacheGraphics(width, height, pic);
		var graphicsManager = root.getGraphicsManager();
		
		if (picCache !== null) {
			if (picCache.isCacheAvailable()) {
				picCache.draw(x, y);
				return;
			}
		}
		else {
			picCache = CacheControl.createCacheGraphics(width, height, pic);
		}
		
		graphicsManager.setRenderCache(picCache);
		this.drawStretchWindowInternal(0, 0, width, height, pic);
		graphicsManager.resetRenderCache();
		
		picCache.draw(x, y);
	}

	static drawStretchWindowInternal(x?, y?, width?, height?, pic?) {
		var i;
		var skinWidth = UIFormat.MENUWINDOW_WIDTH / 2;
		var skinHeight = UIFormat.MENUWINDOW_HEIGHT;
		var d = this._getFrameMargin();
		var frameWidth = 16;
		var frameHeight = 16;
		var xSrc = skinWidth;
		var xDestPos = [0, width - frameWidth, 0, width - frameWidth];
		var yDestPos = [0, 0, height - frameHeight, height - frameHeight];
		var xSrcPos = [0, skinWidth - frameWidth, 0, skinWidth - frameWidth];
		var ySrcPos = [0, 0, skinHeight - frameHeight, skinHeight - frameHeight];
		
		if (pic === null) {
			return;
		}
		
		// Draw the src(0, 0, 64, 64) scaled to dest(x + d, y + d).
		// This drawing corresponds to the window's content(excluding the frame).
		// Since drawing the frame over the content isn't problematic, we'll draw from the content first.
		// The fact that we're using x + d means that even when x is 0, the content will be drawn slightly offset.
		// Window frame corners may sometimes have diagonal shapes.
		// In such cases, if we don't offset the content by +d, the content might be drawn protruding beyond the corner.
		// The margin(d) is only used for content drawing (this drawStretchParts) and not for frame drawing.
		pic.drawStretchParts(x + d, y + d, width - (d * 2), height - (d * 2), 0, 0, skinWidth, skinHeight);
	
		// Draw 4 corners of the frame.
		for (i = 0; i < 4; i++) {
			pic.drawStretchParts(x + xDestPos[i], y + yDestPos[i], frameWidth, frameHeight,
				xSrc + xSrcPos[i], 0 + ySrcPos[i], frameWidth, frameHeight);
		}
		
		function drawFrameTopAndBottom(x, y, xSrc, ySrc) {
			var dx;
			var lineWidth = 32;
			var lineHeight = 16;
			var isLast = false;
			
			for (dx = frameWidth; !isLast; dx += lineWidth) {
				// Check if a frame is drawn in a length of 32 and overlaps the corner.
				if (dx + lineWidth > width - frameWidth) {
					// Adjust the length not to reach, and end to draw this time.
					lineWidth = width - (dx + frameWidth);
					isLast = true;
				}
				pic.drawStretchParts(x + dx, y, lineWidth, lineHeight, xSrc + frameWidth, ySrc, lineWidth, lineHeight);
			}
		}
		
		function drawFrameLeftAndRight(x, y, xSrc, ySrc) {
			var dy;
			var lineWidth = 16;
			var lineHeight = 32;
			var isLast = false;
			
			for (dy = frameHeight; !isLast; dy += lineHeight) {
				if (dy + lineHeight > height - frameHeight) {
					lineHeight = height - (dy + frameHeight);
					isLast = true;
				}
				pic.drawStretchParts(x, y + dy, lineWidth, lineHeight, xSrc, ySrc + frameHeight, lineWidth, lineHeight);
			}
		}
		
		// Draw the top frame except for the corner.
		drawFrameTopAndBottom(x, y, xSrc, 0);
		
		// Draw the bottom frame except for the corner.
		drawFrameTopAndBottom(x, y + (height - frameHeight), xSrc, skinHeight - frameHeight);
		
		// Draw the left frame except for the corner.
		drawFrameLeftAndRight(x, y, xSrc, 0);
		
		// Draw the right frame except for the corner.
		drawFrameLeftAndRight(x + (width - frameWidth), y, xSrc + (skinWidth - frameWidth), 0);
	}

	static _getFrameMargin() {
		return 2;
	}
}

// Since it is costly to construct the window image every time,
// it gets saved in cache once created and reused afterward.
class CacheControl {

	static _cacheArray: any = null;

	static clearCache() {
		this._cacheArray = [];
	}

	static getCacheGraphics(width?, height?, pic?) {
		var i, cache;
		var count = this._cacheArray.length;
		
		// Search cache to match the required data.
		for (i = 0; i < count; i++) {
			cache = this._cacheArray[i];
			if (cache.width === width && cache.height === height && cache.pic === pic) {
				return cache.picCache;
			}
		}
		
		return null;
	}

	static createCacheGraphics(width?, height?, pic?) {
		var cache;
		var picCache = this.getCacheGraphics(width, height, pic);
		
		if (picCache !== null) {
			// If cache already exists, use the cache.
			return picCache;
		}
		
		cache = {};
		cache.width = width;
		cache.height = height;
		cache.pic = pic;
		// Images created in root.getGraphicsManager().createCacheGraphics and root.getMaterialManager().createImage will be
		// freed from memory once those images are no longer referenced.
		// Imported resources will be freed if they are no longer being referenced and after a fixed period of time. 
		cache.picCache = root.getGraphicsManager().createCacheGraphics(width, height);
		this._cacheArray.push(cache);
		
		return cache.picCache;
	}
}
