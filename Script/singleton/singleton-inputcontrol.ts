
class InputType {

	static NONE: any = -1;

	static MOUSE: any = -2;

	static LEFT: any = 0;

	static UP: any = 1;

	static RIGHT: any = 2;

	static DOWN: any = 3;

	static BTN1: any = 4;

	static BTN2: any = 5;

	static BTN3: any = 6;

	static BTN4: any = 7;

	static BTN5: any = 8;

	static BTN6: any = 9;

	static BTN7: any = 10;

	static BTN8: any = 11;
}

class InputControl {

	static _counter: any = null;

	static _counterHigh: any = null;

	static _blanckCounter: any = null;

	static _prevInputType: any = -1;

	static _isWait: any = false;

	static initSingleton() {
		this._counterHigh = createObject(CycleCounter);
		this._counterHigh.setCounterInfo(0);
		
		this._counter = createObject(CycleCounter);
		this._counter.setCounterInfo(4);
		this._counter.disableGameAcceleration();
		
		this._blanckCounter = createObject(CycleCounter);
		this._blanckCounter.setCounterInfo(2);
		this._counter.disableGameAcceleration();
	}

	static isSelectState() {
		return root.isInputState(InputType.BTN1);
	}

	static isSelectAction() {
		return root.isInputAction(InputType.BTN1) || root.isMouseAction(MouseType.LEFT);
	}

	static isCancelState() {
		return root.isInputState(InputType.BTN2) || root.isMouseAction(MouseType.DOWNWHEEL);
	}

	static isCancelAction() {
		return root.isInputAction(InputType.BTN2) || root.isMouseAction(MouseType.RIGHT);
	}

	static isOptionAction() {
		return root.isInputAction(InputType.BTN3);
	}

	static isOptionAction2() {
		return root.isInputAction(InputType.BTN4);
	}

	static isLeftPadAction() {
		return root.isInputAction(InputType.BTN5) || root.isMouseAction(MouseType.UPWHEEL);
	}

	static isRightPadAction() {
		return root.isInputAction(InputType.BTN6) || root.isMouseAction(MouseType.DOWNWHEEL);
	}

	static isSystemState() {
		return root.isInputState(InputType.BTN7);
	}

	static isStartAction() {
		var type = EnvironmentControl.getSkipControlType();
		
		if (type === 0 || !root.isSystemSettings(SystemSettingsType.SKIP)) {
			return false;
		}
		
		if (root.isInputAction(InputType.BTN8)) {
			if (type === 1 && root.isMouseAction(MouseType.RIGHT)) {
				return false;
			}
			
			return true;
		}
		
		return false;
	}

	static isInputState(type?) {
		return root.isInputState(type);
	}

	static isInputAction(type?) {
		return root.isInputAction(type);
	}

	static getDirectionState() {
		var inputType;
		var result = InputType.NONE;
		
		inputType = this.getInputType();
		
		// Check if the current state is no input.
		if (inputType === InputType.NONE) {
			this._prevInputType = inputType;
			this._isWait = false;
			return inputType;
		}
		
		// Check if the previous state is no input, or the current input differs from the previous one.
		if (inputType !== this._prevInputType || this._prevInputType === InputType.NONE) { 
			this._prevInputType = inputType;
			this._isWait = true;
			this._counter.resetCounterValue();
			this._blanckCounter.resetCounterValue();
			return inputType;
		}
		
		// Current input and previous input are identical.
		// It means that the key is continuously pressed.
		
		if (this._isWait) {
			if (this._blanckCounter.moveCycleCounter() !== MoveResult.CONTINUE) {
				this._isWait = false;
			}
		}
		else {
			if (this._counter.moveCycleCounter() !== MoveResult.CONTINUE) {
				// Allow to input.
				result = inputType;
			}
		}
		
		return result;
	}

	static getDirectionStateHigh() {
		var inputType = InputType.NONE;
		
		if (DataConfig.isHighPerformance()) {
			if (this._counterHigh.moveCycleCounter() !== MoveResult.CONTINUE) {
				inputType = this.getInputType();
			}
		}
		else {
			inputType = this.getInputType();
		}
		
		return inputType;
	}

	static getInputType() {
		var inputType = InputType.NONE;
		
		if (root.isInputState(InputType.LEFT)) {
			inputType = InputType.LEFT;
		}
		else if (root.isInputState(InputType.UP)) {
			inputType = InputType.UP;
		}
		else if (root.isInputState(InputType.RIGHT)) {
			inputType = InputType.RIGHT;
		}
		else if (root.isInputState(InputType.DOWN)) {
			inputType = InputType.DOWN;
		}
			
		return inputType;
	}
}
