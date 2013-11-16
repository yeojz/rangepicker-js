/**
 *	jQuery Datepicker Range Extension
 *
 *	@author Gerald Yeo <contact@fusedthought.com>
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
 *
 *	@function Rangepicker
 *	
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
    	periodToggle: [false, true],	// Array of whether toggle is enabled
    	

    	mainToggleCustom: false,	// state if there is a custom main toggle for popup
    	mainToggleElem: "",		// the replacement $elem 
		mainToggleSave: false,	// Set if mainToggle will trigger a save of selected values


    	saveControlLabels: ["Apply", "Cancel"],		// text for save and cancel

    	rangeCollection: {},	// main "database" for all saved range values [id] : { period: [value1, value2] }
    	tempRangeCollection: {},	// temp "database" for all changes and interaction

    	addons: function(inst){}	// defines custom modification to rangepicker display and behaviour

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
	 *	Initializes values and creates elements for a new Rangepicker instance
	 *	
	 *	@function _init
	 *	
	 *	@param {Object} target element's Dictionary/Array format. Usually via document.getElementById or $elem
	 *	@param	{Object} settings Dictionary/Array format.
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
	 *	Gets a setting by name.
	 *	If it's not within instance, retrieve from the defaults
	 *
	 *	@function getSetting
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 * 	@param {String} name Name of the setting/parameter
	 *	@returns {Object} Stored parameter value
	 */
	getSetting: function(inst, name){
		if (name == "all"){
			return inst.settings;
		}
		return (inst.settings[name] !== undefined) ?
			inst.settings[name] : this._defaults[name];
	},




	/**
	 *	Gets a DEFAULT setting by name.
	 *
	 *	@function getGlobal
	 *
	 * 	@param {String} name Name of the setting/parameter
	 *	@returns {Object} Stored parameter value
	 */
	getGlobal: function(name){
		return (typeof this._defaults[name] == 'undefined') ? null : this._defaults[name];
	},




	/**
	 *	Gets a classname from the settings array
	 *
	 *	@function getClassName	
	 *
	 * 	@param {String} name The associated key
	 *	@returns {String} classname
	 */	
	getClassName: function(name){
		return (typeof this._classNames[name] == 'undefined') ? null : this._classNames[name];
	},




	/**
	 *	Gets the MAIN database of ranges
	 *
	 *	@function getCollection
	 *
	 * 	@param {String} id The key/id of the rangepicker instance
	 *	@returns {Object} List of periods/ranges associated in this rangepicker instance
	 */	
	getCollection: function(id){
		return $.rangepicker._defaults.rangeCollection[id]
	},




	/**
	 *	Gets the TEMP database of ranges
	 *
	 *	@function getTempCollection
	 *
	 * 	@param {String} id The key/id of the rangepicker instance
	 *	@returns {Object} List of ranges/periods associated in this rangepicker instance
	 */	
	getTempCollection: function(id){
		return $.rangepicker._defaults.tempRangeCollection[id]
	},




	/**
	 *	Replaces the specific Rangpicker instance 
	 *	with the new Range/Period values
	 *	in the MAIN database
	 *
	 *	@function setCollection
	 *
	 * 	@param {String} id The key/id of the rangepicker instance
	 *	@param {Object} value List of ranges/periods associated in this rangepicker instance
	 */	
	setCollection: function(id, value){
		$.rangepicker._defaults.rangeCollection[id] = value;
	},




	/**
	 *	Set the value of a specific period within a Rangepicker instance
	 *	in the MAIN database
	 *
	 *	@function setCollectionValue
	 *
	 * 	@param {String} id The key/id of the rangepicker instance
	 *	@param {String} name The name of the range/period
	 *	@param {Object} value Array of [start, end] values in a period
	 */	
	setCollectionValue: function(id, name, value){
		$.rangepicker._defaults.rangeCollection[id][name] = value;
	},




	/**
	 *	Replaces the specific Rangpicker instance 
	 *	with the new Range/Period values
	 *	in the TEMP database
	 *
	 *	@function setTempCollection
	 *
	 * 	@param {String} id The key/id of the rangepicker instance
	 *	@param {Object} value List of ranges/periods associated in this rangepicker instance
	 */	
	setTempCollection: function(id, value){
		$.rangepicker._defaults.tempRangeCollection[id] = value;
	},




	/**
	 *	Set the value of a specific period within a Rangepicker instance
	 *	in the TEMP database
	 *
	 *	@function setTempCollectionValue
	 *
	 * 	@param {String} id The key/id of the rangepicker instance
	 *	@param {String} name The name of the range/period
	 *	@param {Object} value Array of [start, end] values in a period
	 */		
	setTempCollectionValue: function(id, name, value){
		$.rangepicker._defaults.tempRangeCollection[id][name] = value;
	},




	/**
	 *	Update the input boxes of each of the periods
	 *
	 *	@function setPeriodInputValue
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 *	@param {String} name he name of the range/period
	 *	@param {Boolean} temp Define if the TEMP database should be use or the MAIN database. (default: false)
	 *	@param {Boolean} trigger Define if a "change" event should be trigged for the element. (default: false)
	 */		
	setPeriodInputValue: function(inst, name, temp, trigger){

		temp = temp || false;
		trigger = trigger || false;

		var monthNames = this.getSetting(inst, "monthNames");
		var period = (temp) ? this.getTempCollection(inst.id)[name] : this.getCollection(inst.id)[name];

		var dateFrom = monthNames[period[0].substring(4, 6)-1] + " " + period[0].substring(6,8);
		var dateTo	= monthNames[period[1].substring(4, 6)-1] + " " + period[1].substring(6,8) + ", " + period[1].substring(0, 4);

		var elem = inst.dateControlElem.find("."+name);
		elem.val(dateFrom + " - " + dateTo)

		if (trigger){
			elem.trigger("change");
		}
	},





	/**
	 *	Update the text of the main rangepicker dropdown toggle
	 *
	 *	@function setMainToggle
	 *	 
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 */		
	 setMainToggleBtn: function(inst){
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
	 *
	 *	@function _dateStringToObj
	 *	 	 
	 * 	@param {String} dateString A string representation of a date in YYYYMMDD format.
	 *	@returns {Date} A date object from the dateString
	 */	
	_dateStringToObj: function(dateString){
        var d = new Date()
        d.setFullYear(dateString.substring(0, 4), dateString.substring(4, 6)-1, dateString.substring(6,8));

        return d;
	},




	/**
	 *	Renders the Datepicker calendar with Rangepicker settings
	 *
	 *	@function _renderCalendar
	 *	 
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
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
	 *	Refreshes the Datepicker calendar within the Rangepicker instance
	 *	Sets the initial month to the date range selected in range/period 1.
	 *
	 *	@function _reloadCalendar
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 */	
	_reloadCalendar: function(inst){
		var defaultDate = this.getCollection(inst.id)["period1"][0];
		defaultDate = (defaultDate) ? this._dateStringToObj(defaultDate) : null;
		inst.calendarElem.datepicker("option", "defaultDate", defaultDate);		
		inst.calendarElem.datepicker("refresh");
	},





	/**
	 *	Datepicker onselect overriding function
	 *
	 *	@function rp_onSelect
	 *	 
	 * 	@param {String} dateText The string representation of the date
	 * 	@param {Object} dp_inst	The Datepicker instance
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
		$.rangepicker.setTempCollectionValue(inst.id, "period"+periodId, [d1, d2]);

		// Update the input value
		$.rangepicker.setPeriodInputValue(inst, "period"+periodId, true, true);
	},




	/**
	 *	Datepicker beforeShowDay overriding function
	 *
	 *	@function rp_beforeShowDay
	 *	 	 
	 * 	@param {Object} date A Date Object
	 *	@returns {Object.<boolean, string>} Whether date is enabled, Classes to add to this date element
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
	 *	Resets all input for ranges/periods to the values in the MAIN database
	 *
	 *	@function rp_resetInputs
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
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
			self.setPeriodInputValue(inst, "period"+i, false, true);
		};
	},





	/**
	 *	Cleans up the values in the TEMP database 
	 *	by iterating through any input toggles and input values
	 *
	 *	@function _cleanupTempCollection
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
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
	 *	Save the current state of selection into the MAIN database
	 *	and refresh the rangepicker 
	 *
	 *	@function saveState
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 */	
	saveState: function(inst){

		this._cleanupTempCollection(inst);

		// Move all objects to the peristent storage
		$.rangepicker.setCollection(
			inst.id, 
			$.extend(true, {}, this.getTempCollection(inst.id))
			);

		this.setMainToggleBtn(inst);
		this._reloadCalendar(inst);
	},





	/**
	 *	Discard the current state of selection
	 *	and reset all TEMP database values using the MAIN database
	 *
	 *	@function discardState
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 */	
	discardState: function(inst){
		
		$.rangepicker.setTempCollection(
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
	 *	Creates a new Rangepicker declaration
	 *
	 *	@function _newInstance
	 *
	 *	@param {Object} target element's Dictionary/Array format. Usually via document.getElementById or $elem	 
	 *	@returns {Object} Array of values for the new Rangepicker instance.
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
	 *	Generates and appends the required elements
	 *	in a new Rangepicker
	 *	to the element
	 *
	 *	@function _generateElements
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 */	
	_generateElements: function(inst){
		var self = this;


		// Object of elements in parent: elementType format
		var generateObject = {
			root : ["mainToggleBtn", "wrapper"],
			wrapper : ["dateControl", "calendar", "saveControl"]
		};
		
		//	Check for if user defined any custom toggle.
		if (this.getSetting(inst, "mainToggleCustom")){
			generateObject.root.splice(0, 1);
			inst["mainToggleBtnElem"] = this.getSetting(inst, "mainToggleElem");
			inst["mainToggleBtnElem"].addClass(this.getClassName("mainToggleBtnName"));
		}

		// DRY generation!
		$.each(generateObject, function(key, list){
			$parent = inst[key+"Elem"];

			$.each(list, function(i, elem){

				var name = self.getClassName(elem+"Name");

				$parent.append('<div class="'+name+'"></div>'); 
					inst[elem+"Elem"] = $parent.find("."+name);
			})
		});


		// Content to append
		var dateControlContent  = "";
		var saveControlContent = "";


		// Generate Date Control elements
		var numberOfPeriods = self.getSetting(inst, "numberOfPeriods");
		var periodToggle = self.getSetting(inst, "periodToggle");

		var periodValues = {};
		var toggleInput = "";
		var disableInput = "";


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
		this.setCollection(
			inst.id, 
			$.extend(true, {}, periodValues)
			);
		this.setTempCollection(
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

		// Add grid style as data attribute
		var numberOfMonths = this.getSetting(inst, "datepicker").numberOfMonths;
		if ( $.isArray(numberOfMonths) ){
			inst.rootElem.attr("data-rpgrid", numberOfMonths[0]+"-"+numberOfMonths[1]);
		} else {
			inst.rootElem.attr("data-rpgrid", numberOfMonths);
		}

	},




	/**
	 *	Add user interaction behaviour to the generated elements
	 *
	 *	@function _addInteractions
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
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

	    		// reset temp database
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

	    	// Auto focus on first element
	    	inst.dateControlElem.find(".period-inputs")[0].click();
	    	self._renderCalendar(inst);

	    	inst.wrapperElem.fadeToggle();

	    });

	},





	/**
	 *	Wrapper to execute the user addon function
	 *
	 *	@function _addonsWrapper
	 *
	 *	@param {Object} inst Details of an instance in Dictionary/Array format
	 */	
	_addonsWrapper: function(inst){
		this.getSetting(inst, "addons")(inst);
	},



});





/**
 *	Hook into jQuery to add this as a callable function for all $elem
 *
 *	@function rangepicker
 *
 *	@param {Object} optionList
 */
$.fn.rangepicker = function(options){
	var otherArgs = Array.prototype.slice.call(arguments, 1);	
	
	return this.each(function() {
		typeof options === "string" ?
			$.rangepicker["rangepicker_" + options].
				apply($.rangepicker, [this].concat(otherArgs)) :
			$.rangepicker._init(this, options);
	});
};





// Singleton instance
$.rangepicker = new Rangepicker();

// Set starting UUID
$.rangepicker.uuid = new Date().getTime();

// Define the version
$.rangepicker.version = $.ui.Rangepicker.version;





})(jQuery);
