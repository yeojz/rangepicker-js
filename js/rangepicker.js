/**
 *	jQuery Datepicker Range Extension
 *
 *	@author Gerald Yeo
 *	@copyright Gerald Yeo 2013
 *	@license MIT
 */

(function($){





$.extend($.ui, {
	Rangepicker: { version: "0.0.1" } 
});





/**
 *	Rangepicker Singleton
 *	Used to manage gobal settings across all Rangepicker instances
 */
function Rangepicker(){

	this._defaults = {
		monthNames: [	// default month name displays. Used for converting from 0-11 to months
	   				"Jan",
	   				"Feb",
	   				"Mar",
	   				"Apr",
	   				"May",
	   				"Jun",
	   				"Jul",
	   				"Aug",
	   				"Sep",
	   				"Oct",
	   				"Nov",
	   				"Dec"
	   			],

		datepicker: {	// contins all datepicker configuration		
			dayNamesMin: [ "S", "M", "T", "W", "T", "F", "S" ],
			numberOfMonths: [1,2],
			inline: true,
			showOtherMonths: true,
	    	selectOtherMonths: true,
	    	selectMultiple: true,	
	    },


    	numberOfPeriods: 2,		// number of periods (corresponds to number of range input)
    	periodLabels: ["Current Date Range", "Compare To <em>(Optional)</em>"],	// labels for range inputs
    	periodToggle: [false, true],	// array of whether toggle is enabled
    	

    	mainToggleCustom: false,	// state if there is a custom main toggle for popup
    	mainToggleElem: "",		// the replacement $elem 
		mainToggleSave: false,	// Set if mainToggle will trigger a save of selected values


    	saveControlLabels: ["Apply", "Cancel"],		// text for save and cancel

    	rangeCollection: {},	// persistent "database" for all saved range values [id] : { period: [value1, value2] }
    	tempRangeCollection: {},	// temp "database" for all changes and interaction

    	plugin: function(inst){}	// defines custom modification to rangepicker display and behaviour

	};




	this._classNames = {	// Stores the default classnames.
		rootName: 'rp',	// Root class
		mainToggleBtnName : 'rp-display',	// main Toggle for popup
		wrapperName : 'rp-popup',	// popup element wrapper
		calendarName : 'rp-calendar',	// datepicker wrapper
		dateControlName : 'rp-datecontrol',	// date input area
		saveControlName : 'rp-savecontrol',	// save button area
	}


}





/**
 *	Extends rangepicker providing the functionality
 */
$.extend(Rangepicker.prototype, {


/*
	Creation of instance
*/

	/**
	 *	Initialisation
	 *	@param {DOM object} target object for rangepicker
	 *	@param	{Array}	dictionary object containing all settings 
	 */
	_init: function(target, settings){

		// if no id for target, generate one and add it in.
		if (!target.id) {
			this.uuid += 1;
			target.id = "rp" + this.uuid;
		}

		inst = this._newInstance($(target));
		inst.settings = $.extend({}, settings || {});

		// add elemeents to the dom
		this._generateElements(inst);

		// add the calendar
		this._renderCalendar(inst);

		// add in behaviour
		this._addInteractions(inst);

		// run custom user defined methods
		this._addonsWrapper(inst);

	},





/*
	SETTERS and GETTERS
*/


	/**
	 *	Gets a setting by name
	 *	If it's not within instance, retrieve from the defaults
	 *	@param {Array} the instance object
	 * 	@param {String} the name of the setting
	 *	@returns {Variable} setting value
	 */
	getSetting: function(inst, name){
		if (name == "all"){
			return inst.settings;
		}
		return (inst.settings[name] !== undefined) ?
			inst.settings[name] : this._defaults[name];
	},




	/**
	 *	Gets a default setting
	 * 	@param {String} the name of the setting
	 *	@returns {Variable} setting value
	 */
	getGlobal: function(name){
		return (typeof this._defaults[name] == 'undefined') ? null : this._defaults[name];
	},




	/**
	 *	Gets a class name from settings
	 * 	@param {String} the class association
	 *	@returns {String} Class name
	 */	
	getClassName: function(name){
		return (typeof this._classNames[name] == 'undefined') ? null : this._classNames[name];
	},




	/**
	 *	Gets the persistent Database of ranges
	 * 	@param {String} the id of the element with rangepicker initialized.
	 *	@returns {Array} Periods within the element
	 */	
	getCollection: function(id){
		return $.rangepicker._defaults.rangeCollection[id]
	},




	/**
	 *	Gets the temp Database of ranges
	 *	Used when user is still interacting with the rangepicker
	 * 	@param {String} the id of the element with rangepicker initialized.
	 *	@returns {Array} Periods within the element
	 */	
	getTempCollection: function(id){
		return $.rangepicker._defaults.tempRangeCollection[id]
	},




	/**
	 *	Set the Database of ranges
	 * 	@param {String} the id of the element with rangepicker initialized.
	 *	@param {Array} the full coleection at an id
	 */	
	_setCollection: function(id, value){
		$.rangepicker._defaults.rangeCollection[id] = value;
	},




	/**
	 *	Set the date at a particular period in a range within the database
	 * 	@param {String} the id of the element with rangepicker initialized.
	 *	@param {String} the period
	 *	@param {Array} [start, end]
	 */	
	_setCollectionValue: function(id, name, value){
		$.rangepicker._defaults.rangeCollection[id][name] = value;
	},




	/**
	 *	Set the Temp Database of ranges
	 * 	@param {String} the id of the element with rangepicker initialized.
	 *	@param {Array} the full coleection at an id
	 */	
	_setTempCollection: function(id, value){
		$.rangepicker._defaults.tempRangeCollection[id] = value;
	},




	/**
	 *	Set the date at a particular period in a range within the temp database
	 * 	@param {String} the id of the element with rangepicker initialized.
	 *	@param {String} the period
	 *	@param {Array} [start, end]
	 */		
	_setTempCollectionValue: function(id, name, value){
		$.rangepicker._defaults.tempRangeCollection[id][name] = value;
	},




	/**
	 *	Update the input value
	 * 	@param {String} the instance object
	 *	@param {String} the period
	 *	@param {Array} using temp database or main database
	 *	@param {Boolean} define if want to trigger a change event on the input element
	 */		
	_setPeriodInputValue: function(inst, name, temp, trigger){

		temp = temp || false;
		trigger = trigger || false;

		var monthNames = this.getSetting(inst, "monthNames");
		var period = (temp) ? this.getTempCollection(inst.id)[name] : this.getCollection(inst.id)[name];

		var dateFrom = monthNames[period[0].substring(4, 6)-1] + " " + period[0].substring(6,8);
		var dateTo	= monthNames[period[1].substring(4, 6)-1] + " " + period[1].substring(6,8) + ", " + period[1].substring(0, 4);

		elem = inst.dateControlElem.find("."+name);
		elem.val(dateFrom + " - " + dateTo)

		if (trigger){
			elem.trigger("change");
		}
	},





	/**
	 *	Update the input value
	 * 	@param {String} the instance object
	 */		
	 _setMainToggleBtn: function(inst){
		var period = this.getCollection(inst.id)["period1"];

		var monthNames = this.getSetting(inst, "monthNames");
		var dateFrom = monthNames[period[0].substring(4, 6)-1] + " " + period[0].substring(6,8);
		var dateTo	= monthNames[period[1].substring(4, 6)-1] + " " + period[1].substring(6,8) + ", " + period[1].substring(0, 4);

		inst.mainToggleBtnElem.html(dateFrom + " - " + dateTo);
	},








/*
	HELPERS
*/


	/**
	 *	Converts string to date object
	 * 	@param {String} YYYYMMDD string
	 *	@returns {Date} 
	 */	
	_dateStringToObj: function(dateString){
        var d = new Date()
        d.setFullYear(dateString.substring(0, 4), dateString.substring(4, 6)-1, dateString.substring(6,8));

        return d;
	},




	/**
	 *	Renders the datepicker calendar with rangepicker settings
	 * 	@param {String} the instance object
	 */	
	_renderCalendar: function(inst){
		
		//Merges custom option, global option and user defined option in order
		var options = $.extend(true, {
				onSelect: this.rp_onSelect,
				beforeShowDay: this.rp_beforeShowDay,
				rp_inst: inst,
				rp_monthNames: this.getSetting(inst, "monthNames")
			},
			this.getGlobal("datepicker"),
			this.getSetting(inst, "datepicker")
		)

		inst.calendarElem.datepicker(options);
	},




	/**
	 *	Refreshes the datepicker calendar
	 *	Sets the date in focus to the range saved
	 * 	@param {String} the instance object
	 */	
	_reloadCalendar: function(inst){
		defaultDate = this.getCollection(inst.id)["period1"][0];
		defaultDate = (defaultDate) ? this._dateStringToObj(defaultDate) : null;
		inst.calendarElem.datepicker("option", "defaultDate", defaultDate);		
		inst.calendarElem.datepicker("refresh");
	},





	/**
	 *	Datepicker onselect override function
	 * 	@param {String} the current selected date
	 * 	@param {String} the instance object
	 */	
	rp_onSelect: function(dateText, dp_inst) {

		var inst = dp_inst.settings.rp_inst; // get the rangepicker instance

		var periodId = inst.dateControlElem.find(".period-inputs.focus").attr("data-rangeid");
		var period = $.rangepicker.getTempCollection(inst.id)["period"+periodId];

   		var currentDay = $.datepicker.formatDate('yymmdd', new Date(dp_inst.selectedYear, dp_inst.selectedMonth, dp_inst.selectedDay));
   	
   		var d1 = period[0],
   			d2 = period[1];


		if ( !d1 ){	// if no dates set
			d1 = currentDay;
			d2 = currentDay;
			

		} else if (d1 == d2){	// if 1st day, set 2nd day
			if (currentDay < d1){
				d1 = currentDay;	
			}	
			d2 = currentDay;	

		} else if (d1 != d2){	//if it's already a range, reset
			d1 = currentDay;
			d2 = currentDay;	

		}

		// Set the temp database
		$.rangepicker._setTempCollectionValue(inst.id, "period"+periodId, [d1, d2]);

		// Update the input value
		$.rangepicker._setPeriodInputValue(inst, "period"+periodId, true, true);
	},




	/**
	 *	Datepicker beforeShowDay override function
	 * 	@param {String} the date
	 *	@returns {Array} [Boolean enabled, String class]
	 */	
	rp_beforeShowDay: function(date){
    	var infocus = $.datepicker.formatDate('yymmdd', date);

    	var popup = $.rangepicker.getClassName("wrapperName");

    	var rootId = $(this).parents("."+popup).parent().attr("id");
    	var collection = $.rangepicker.getTempCollection(rootId);

    	var state = true;
    	var resultantSet= [];
    	var resultantClass = "";

    	$.each(collection, function(key, value){
	    	if (infocus == value[0] || infocus == value[1]){
    			resultantSet.push(key+"-day");
		    	resultantClass += key+"-mark ";	// special mark for start and end.
		    	
		    } else if (infocus > value[0]  && infocus < value[1] ){
		    	resultantSet.push(key+"-day");
		    }

    	});

    	// if there is any mark at all
    	if (resultantSet.length > 0){
    		resultantClass += "withinRange "
    	};

    	// if it's within more than one range.
    	if (resultantSet.length > 1){
    		resultantClass += "overlap-day ";
    	};

    	// stringify the result
    	resultantClass += resultantSet.join(" ");

    	// return
		return [true, resultantClass];
	},




	/**
	 *	Resets all input to persistent database values
	 * 	@param {String} the instance object
	 */	
	rp_resetInputs: function(inst){
		var self = this;

		var db = this.getCollection(inst.id);

		var numberOfPeriods = this.getSetting(inst, "numberOfPeriods");

		for (var i = 1; i <= numberOfPeriods; i++){

			var period = db["period"+i];

			// reset toggle if no value found
			if (period[0] == "" && period[1] == ""){
				inst.dateControlElem.find(".period"+i).val("");
				inst.dateControlElem.find(".period"+i+"-toggle").removeAttr("checked");

				continue;
			}

			// set it from the main database!
			self._setPeriodInputValue(inst, "period"+i, false, true);
		};
	},





	/**
	 *	Clean Up temp collection values, 
	 *	Look through toggles and disabling
	 * 	@param {String} the instance object
	 */	
	_cleanupTempCollection: function(inst){
		var tempCollection = this.getTempCollection(inst.id);
		var numberOfPeriods = this.getSetting(inst, "numberOfPeriods");

		$.each(this.getSetting(inst, "periodToggle"), function(idx, value){
			if (value){
				num = idx+1;
				if(!inst.rootElem.find(".period"+num+"-toggle").is(":checked")){
					tempCollection["period"+num] = ["", ""];
				};
			};
		});
	},





	/**
	 *	Save the corrent state to persistent database
	 * 	@param {String} the instance object
	 */	
	saveState: function(inst){

		this._cleanupTempCollection(inst);

		// Move all objects to the peristent storage
		$.rangepicker._setCollection(
			inst.id, 
			$.extend(true, {}, this.getTempCollection(inst.id))
			);

		this._setMainToggleBtn(inst);
		this._reloadCalendar(inst);
	},





	/**
	 *	Discard the current state and mirror temp to persistent database
	 * 	@param {String} the instance object
	 */	
	discardState: function(inst){
		
		$.rangepicker._setTempCollection(
			inst.id,
			$.extend(true, {}, this.getCollection(inst.id))
			);

		this.rp_resetInputs(inst);
		this._reloadCalendar(inst);
	},









/*
	GENERATORS and SETUP
*/

	/**
	 *	Creates a new instance with some required fields.
	 *	@param {DOM object} target object for rangepicker
	 *	@returns {Array} $elem declaration
	 */
	_newInstance: function(target){
		var id = target[0].id.replace(/([^A-Za-z0-9_\-])/g, "\\\\$1");

		return {
			id : id,

			rootElem: target,
			mainToggleBtnElem: null,

			wrapperElem: null,
			calendarElem: null,
			dateControlElem: null,
			saveControlElem: null,
		}
	},



	/**
	 *	Generates the elements of the popup
	 * 	@param {String} the instance object
	 */	
	_generateElements: function(inst){
		var self = this;


		// Array of elements in parent: elementType format
		var generateArray = {
			root : ["mainToggleBtn", "wrapper"],
			wrapper : ["dateControl", "calendar", "saveControl"]
		};
		
		//	Check for if user defined any custom toggle.
		if (this.getSetting(inst, "mainToggleCustom")){
			generateArray.root.splice(0, 1);
			inst["mainToggleBtnElem"] = this.getSetting(inst, "mainToggleElem");
			inst["mainToggleBtnElem"].addClass(this.getClassName("mainToggleBtnName"));
		}

		// DRY generation!
		$.each(generateArray, function(key, list){
			$parent = inst[key+"Elem"];

			$.each(list, function(i, elem){

				var name = self.getClassName(elem+"Name");

				$parent.append('<div class="'+name+'"></div>'); 
					inst[elem+"Elem"] = $parent.find("."+name);
			})
		});


		// Generate Date Control elements
		var dateControlContent  = "";
		var numberOfPeriods = self.getSetting(inst, "numberOfPeriods");
		var periodToggle = self.getSetting(inst, "periodToggle");

		var periodValues = {};



		// Geenrate the toggles and inputs
		for (var i = 0; i < numberOfPeriods; i++){

			var num = i+1;

			toggleInput = (periodToggle[i]) ? '<input type="checkbox" class="period-toggle period'+num+'-toggle" />' : '';
			disableInput = (periodToggle[i]) ? 'disabled="disabled"' : '';
			

			dateControlContent 	+= '<div class="period-inputs-wrapper period'+num+'-inputs-wrapper">'
								+ '<div class="period-inputs-title">'
								+ toggleInput
				   				+ '<label>'
				   				+ self.getSetting(inst, "periodLabels")[i]
				   				+'</label>'
				   				+ '</div>'
				   				+ '<input type="text" class="period-inputs period'+num+'" data-rangeid="'+num+'" '+disableInput+' />'
				   				+ '</div>';

			periodValues["period"+num] = ["", ""];

		};

		dateControlContent += '<div class="rp-clear"></div>'
		inst.dateControlElem.append(dateControlContent);										




		// Initialize both temp and persistent Database
		this._setCollection(
			inst.id, 
			$.extend(true, {}, periodValues)
			);
		this._setTempCollection(
			inst.id, 
			$.extend(true, {}, periodValues)
			);
	



		// Generate save cancel buttons
		saveControlContent	= '<button class="btn-apply">'
							+ self.getSetting(inst, "saveControlLabels")[0]
							+ '</button>'
							+ '<button class="btn-cancel">'
							+ self.getSetting(inst, "saveControlLabels")[1]
							+ '</button>';	

		inst.saveControlElem.append(saveControlContent);
		


		// Add some defaults to elements
		inst.mainToggleBtnElem.html("Select Date Range");	// main toggle's text
		inst.rootElem.addClass(this.getClassName("rootName"));	// add scope class

		//add grid style
		var numberOfMonths = this.getSetting(inst, "datepicker").numberOfMonths;
		if ( $.isArray(numberOfMonths) ){
			inst.rootElem.attr("data-rpgrid", numberOfMonths[0]+"-"+numberOfMonths[1]);
		} else {
			inst.rootElem.attr("data-rpgrid", numberOfMonths);
		}

	},




	/**
	 *	Add user interaction behaviour to the generated elements
	 * 	@param {String} the instance object
	 */	
	_addInteractions: function(inst){
		
		var self = this;



		// Force root element to be relative for child
		inst.rootElem.css({
	    	"position": "relative",
	    });



		// Set default offsets for popup element
	    inst.wrapperElem.css({
	    	top: inst.mainToggleBtnElem.height() + inst.mainToggleBtnElem[0].offsetTop + 10+ "px",
	    	left: inst.mainToggleBtnElem[0].offsetLeft + "px",
	    });



	    // Behaviour for the period disable / enable checkbox
	    inst.dateControlElem.find(".period-toggle").on("change", function(){

	    	var currentInput = $(this).parents(".period-inputs-wrapper").find(".period-inputs");

	    	if ($(this).is(':checked')){
	    		currentInput.removeAttr("disabled").click();

	    	} else {
	    		currentInput.attr("disabled", "disabled");
	    		inst.dateControlElem.find(".period-inputs")[0].click();

	    		currentInput.val("");

	    		//reset temp database
	    		var tempCollection = self.getTempCollection(inst.id);
	    		tempCollection["period"+currentInput.attr("data-rangeid")] = ["", ""];

	    		self._reloadCalendar(inst);
	    		
	    	}
	    });



	    // Click behaviour hack for labels
	    // Didn't want to use IDs ad it may not be unique.
	    inst.dateControlElem.find(".period-inputs-title label").on("click", function(){
	    	chckbox = $(this).siblings("input");
	    	chckbox.prop("checked", !chckbox.prop("checked"));
	    	inst.dateControlElem.find(".period-toggle").trigger("change");
	    })



	    // input for periods
	    inst.dateControlElem.find(".period-inputs").on("click", function(){
	    	inst.dateControlElem.find(".period-inputs").removeClass("focus");
	    	$(this).addClass("focus");
	    });



	    // Save button behaviour
	    inst.saveControlElem.find(".btn-apply").on("click", function(){
	    	self.saveState(inst);
	    	inst.wrapperElem.fadeOut();

	    });



	    // Cancel button behaviour
	    inst.saveControlElem.find(".btn-cancel").on("click", function(){
	    	self.discardState(inst);
	    	inst.wrapperElem.fadeOut();

	    });



	    // mainToggle Behaviour
	    inst.mainToggleBtnElem.on("click", function(){

	    	if(self.getSetting(inst, "mainToggleSave")){
	    		self.saveState(inst);
	    	} else {
	    		self.discardState(inst);
	    	}

	    	//Auto focus on first element
	    	inst.dateControlElem.find(".period-inputs")[0].click();
	    	self._renderCalendar(inst);

	    	inst.wrapperElem.fadeToggle();

	    });

	},





	/**
	 *	Wrapper to execute the user addon function
	 * 	@param {String} the instance object
	 */	
	_addonsWrapper: function(inst){
		this.getSetting(inst, "plugin")(inst);
	},



});





/**
 *	Hook on to jquery chain callable
 */
$.fn.rangepicker = function(options){
	var otherArgs = Array.prototype.slice.call(arguments, 1);	
	
	return this.each(function() {
		typeof options === "string" ?
			$.rangepicker["rangepicker_" + options].
				apply($.rangepicker, [this].concat(otherArgs)) :
			$.rangepicker._init(this, options);
	});
}





// Singleton instance
$.rangepicker = new Rangepicker();

// Set starting UUID
$.rangepicker.uuid = new Date().getTime();

// Define the version
$.rangepicker.version = $.ui.Rangepicker.version;





})(jQuery);
