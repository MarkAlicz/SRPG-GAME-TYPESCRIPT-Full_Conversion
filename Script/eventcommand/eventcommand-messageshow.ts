
class MessageShowEventCommand extends BaseEventCommand {

	_messageView: any = null;

	enterEventCommandCycle() {
		this._prepareEventCommandMemberData();
		
		if (!this._checkEventCommand()) {
			return EnterResult.NOTENTER;
		}
		
		return this._completeEventCommandMemberData();
	}

	moveEventCommandCycle() {
		if (this._messageView.moveMessageView() !== MoveResult.CONTINUE) {
			return MoveResult.END;
		}
		
		return MoveResult.CONTINUE;
	}

	drawEventCommandCycle() {
		// It differs from the other drawEventCommandCycle, this method is always called while having event.
		if (this._messageView !== null) {
			this._messageView.drawMessageView();
		}
	}

	mainEventCommand() {
		if (this._messageView !== null) {
			this._messageView.endMessageView();
		}
	}

	eraseMessage(value?) {
		if (this._messageView !== null) {
			this._messageView.eraseMessage(value);
		}
	}

	_prepareEventCommandMemberData() {
		if (this._messageView === null) {
			this._messageView = createObject(FaceView);
		}
	}

	_checkEventCommand() {
		return this.isEventCommandContinue();
	}

	_completeEventCommandMemberData() {
		var messageViewParam;
		
		messageViewParam = this._createMessageViewParam();
		this._messageView.setupMessageView(messageViewParam);
		
		return EnterResult.OK;
	}

	_createMessageViewParam() {
		var eventCommandData = root.getEventCommandObject();
		var messageViewParam = StructureBuilder.buildMessageViewParam();
		
		messageViewParam.messageLayout = this._getMessageLayout();
		messageViewParam.text = eventCommandData.getText();
		messageViewParam.pos = eventCommandData.getTextPosValue();
		messageViewParam.speakerType = eventCommandData.getSpeakerType();
		messageViewParam.unit = eventCommandData.getUnit();
		messageViewParam.npc = eventCommandData.getNpc();
		messageViewParam.facialExpressionId = eventCommandData.getFacialExpressionId();
		
		return messageViewParam;
	}

	_getMessageLayout() {
		var messageLayout = null;
		var pos = root.getEventCommandObject().getTextPosValue();
		
		if (pos === MessagePos.TOP) {
			messageLayout = this._getLayoutTop();
		}
		else if (pos === MessagePos.CENTER) {
			messageLayout = this._getLayoutCenter();
		}
		else if (pos === MessagePos.BOTTOM) {
			messageLayout = this._getLayoutBottom();
		}
		
		return messageLayout;
	}

	_getLayoutTop() {
		return root.getDefaultMessageLayout(MessageLayout.TOP);
	}

	_getLayoutCenter() {
		return root.getDefaultMessageLayout(MessageLayout.CENTER);
	}

	_getLayoutBottom() {
		return root.getDefaultMessageLayout(MessageLayout.BOTTOM);
	}
}
